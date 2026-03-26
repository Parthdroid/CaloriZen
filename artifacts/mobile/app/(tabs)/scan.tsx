import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Animated,
  Easing,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { analyzePhoto, lookupBarcode } from "@workspace/api-client-react";

const { height: SH } = Dimensions.get("window");
const TIPS = ["Identifying foods...", "Estimating portions...", "Calculating macros...", "Almost done..."];

export default function ScanTab() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { setPendingAnalysis, setPendingImageBase64 } = useApp();
  const [loading, setLoading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [showBarcode, setShowBarcode] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const tipInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 90 : insets.bottom + 60;

  const startScan = useCallback(() => {
    setTipIndex(0);
    Animated.loop(Animated.sequence([
      Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
    tipInterval.current = setInterval(() => setTipIndex((p) => Math.min(p + 1, TIPS.length - 1)), 4000);
  }, [scanLineAnim]);

  const stopScan = useCallback(() => {
    scanLineAnim.stopAnimation();
    scanLineAnim.setValue(0);
    if (tipInterval.current) { clearInterval(tipInterval.current); tipInterval.current = null; }
  }, [scanLineAnim]);

  const handleImage = useCallback(async (uri: string) => {
    setPreviewUri(uri);
    setLoading(true);
    startScan();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const mimeType = blob.type || "image/jpeg";
      const analysis = await Promise.race([
        analyzePhoto({ imageBase64: base64, mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif" }),
        new Promise<never>((_, rej) => setTimeout(() => { const e = new Error("Timeout"); e.name = "AbortError"; rej(e); }, 90000)),
      ]);
      const items = analysis.items ?? [];
      const isNonFood = items.length === 0 || (items.length === 1 && (analysis.totalCalories ?? 0) === 0 && (items[0]?.name?.toLowerCase().includes("non-food") || items[0]?.name?.toLowerCase().includes("not food")));
      if (isNonFood) {
        stopScan(); setLoading(false);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert("No food detected", "Try a clearer picture of your meal.");
        return;
      }
      stopScan();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPendingAnalysis(analysis);
      setPendingImageBase64(base64);
      router.push("/review");
    } catch (err: unknown) {
      stopScan();
      const isAbort = err instanceof Error && err.name === "AbortError";
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(isAbort ? "Request timed out" : "Analysis Failed", isAbort ? "Please try again." : "Something went wrong.");
    } finally {
      setLoading(false);
      setPreviewUri(null);
    }
  }, [setPendingAnalysis, setPendingImageBase64, startScan, stopScan]);

  const handleCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("Camera Permission", "NutriSnap needs camera access to scan your meals."); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7, allowsEditing: false });
    if (!result.canceled && result.assets[0]) await handleImage(result.assets[0].uri);
  }, [handleImage]);

  const handleGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Photo Library", "NutriSnap needs photo access to analyze your meals."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!result.canceled && result.assets[0]) await handleImage(result.assets[0].uri);
  }, [handleImage]);

  const handleBarcode = useCallback(async () => {
    if (!barcodeInput.trim()) return;
    setBarcodeLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const product = await lookupBarcode(barcodeInput.trim());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPendingAnalysis(null); setPendingImageBase64(null);
      router.push({ pathname: "/barcode", params: { prefill: JSON.stringify(product) } });
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Not Found", "Couldn't find this barcode.");
    } finally { setBarcodeLoading(false); }
  }, [barcodeInput, setPendingAnalysis, setPendingImageBase64]);

  if (loading && previewUri) {
    const ty = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SH * 0.5] });
    return (
      <View style={[st.loadWrap, { backgroundColor: "#000" }]}>
        <Image source={{ uri: previewUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <View style={StyleSheet.absoluteFillObject} />
        <Animated.View style={[st.scanLine, { backgroundColor: colors.tint, transform: [{ translateY: ty }] }]} />
        <View style={[st.loadPill, { bottom: bottomPad + 20 }]}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={st.loadTip}>{TIPS[tipIndex]}</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[st.root, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[st.header, { paddingTop: topPad + 8 }]}>
        <Text style={[st.headerTitle, { color: colors.text }]}>Scan Food</Text>
      </View>

      <View style={st.body}>
        <Pressable onPress={handleCamera} style={({ pressed }) => [st.cameraBox, { backgroundColor: colors.backgroundSecondary, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
          <View style={[st.cameraIconWrap, { backgroundColor: colors.tint + "15" }]}>
            <Ionicons name="camera" size={32} color={colors.tint} />
          </View>
          <Text style={[st.cameraTitle, { color: colors.text }]}>Take a Photo</Text>
          <Text style={[st.cameraHint, { color: colors.textTertiary }]}>Point your camera at any meal</Text>
        </Pressable>

        <View style={st.optionRow}>
          <Pressable onPress={handleGallery} style={({ pressed }) => [st.optionBtn, { backgroundColor: colors.backgroundSecondary, opacity: pressed ? 0.8 : 1 }]}>
            <Ionicons name="images-outline" size={24} color={colors.text} />
            <Text style={[st.optionLabel, { color: colors.textSecondary }]}>Gallery</Text>
          </Pressable>
          <Pressable onPress={() => { setShowBarcode(!showBarcode); Haptics.selectionAsync(); }} style={({ pressed }) => [st.optionBtn, { backgroundColor: showBarcode ? colors.text : colors.backgroundSecondary, opacity: pressed ? 0.8 : 1 }]}>
            <Ionicons name="barcode-outline" size={24} color={showBarcode ? colors.background : colors.text} />
            <Text style={[st.optionLabel, { color: showBarcode ? colors.background : colors.textSecondary }]}>Barcode</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/barcode")} style={({ pressed }) => [st.optionBtn, { backgroundColor: colors.backgroundSecondary, opacity: pressed ? 0.8 : 1 }]}>
            <Ionicons name="create-outline" size={24} color={colors.text} />
            <Text style={[st.optionLabel, { color: colors.textSecondary }]}>Manual</Text>
          </Pressable>
        </View>

        {showBarcode && (
          <View style={[st.barcodeBox, { backgroundColor: colors.backgroundSecondary }]}>
            <TextInput
              value={barcodeInput}
              onChangeText={setBarcodeInput}
              placeholder="Enter barcode number"
              placeholderTextColor={colors.textTertiary}
              style={[st.barcodeInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
              keyboardType="numeric"
              returnKeyType="search"
              onSubmitEditing={handleBarcode}
            />
            <Pressable onPress={handleBarcode} style={[st.barcodeSend, { backgroundColor: colors.tint }]}>
              {barcodeLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="search" size={18} color="#fff" />}
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { alignItems: "center", paddingBottom: 4 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },

  body: { flex: 1, paddingHorizontal: 24, justifyContent: "center", gap: 16, marginTop: -40 },

  cameraBox: { borderRadius: 20, alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 12 },
  cameraIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  cameraTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  cameraHint: { fontSize: 14, fontFamily: "Inter_400Regular" },

  optionRow: { flexDirection: "row", gap: 10 },
  optionBtn: { flex: 1, alignItems: "center", paddingVertical: 18, borderRadius: 16, gap: 6 },
  optionLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },

  barcodeBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 6, borderRadius: 16 },
  barcodeInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  barcodeSend: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },

  loadWrap: { flex: 1 },
  scanLine: { height: 3, width: "100%", borderRadius: 2, opacity: 0.8 },
  loadPill: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  loadTip: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#fff", marginTop: 8 },
});
