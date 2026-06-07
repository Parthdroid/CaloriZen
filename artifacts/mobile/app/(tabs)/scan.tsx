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
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { analyzePhoto } from "@workspace/api-client-react";

const { height: SH } = Dimensions.get("window");
const TIPS = ["Identifying foods...", "Estimating portions...", "Calculating macros...", "Almost done..."];

export default function ScanTab() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { setPendingAnalysis, setPendingImageBase64 } = useApp();
  const [loading, setLoading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
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
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") { Alert.alert("Camera access needed", "Go to Settings and allow CaloriZen to use your camera."); return; }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7, allowsEditing: false });
      if (!result.canceled && result.assets[0]) await handleImage(result.assets[0].uri);
    } catch {
      Alert.alert("Camera not available", "Your device camera couldn't be opened. Try using Gallery instead.");
    }
  }, [handleImage]);

  const handleGallery = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { Alert.alert("Photo access needed", "Go to Settings and allow CaloriZen to access your photos."); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
      if (!result.canceled && result.assets[0]) await handleImage(result.assets[0].uri);
    } catch {
      Alert.alert("Couldn't open photos", "Something went wrong opening your photo library. Please try again.");
    }
  }, [handleImage]);


  if (loading && previewUri) {
    const ty = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SH] });
    return (
      <View style={[st.loadWrap, { backgroundColor: "#000" }]}>
        <Image source={{ uri: previewUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.25)" }]} />
        <Animated.View style={[st.scanLine, { backgroundColor: colors.tint, transform: [{ translateY: ty }] }]} />
        <View style={[st.loadPill, { bottom: bottomPad + 20 }]}>
          <View style={st.loadPillInner}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={st.loadTip}>{TIPS[tipIndex]}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[st.root, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[st.header, { paddingTop: topPad + 12 }]}>
        <Text style={[st.headerTitle, { color: colors.text }]}>Scan Food</Text>
        <Text style={[st.headerSub, { color: colors.textTertiary }]}>AI-powered nutrition analysis</Text>
      </View>

      <View style={st.body}>
        <Pressable
          onPress={handleCamera}
          style={({ pressed }) => [
            st.cameraBox,
            {
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <View style={st.viewfinder}>
            <View style={[st.corner, st.cornerTL]} />
            <View style={[st.corner, st.cornerTR]} />
            <View style={[st.corner, st.cornerBL]} />
            <View style={[st.corner, st.cornerBR]} />
            <View style={st.cameraCenter}>
              <View style={st.cameraIconCircle}>
                <Ionicons name="camera" size={36} color="#FF6B35" />
              </View>
              <Text style={st.cameraTitle}>Take a Photo</Text>
              <Text style={st.cameraHint}>Point camera at any meal or food item</Text>
            </View>
          </View>
        </Pressable>

        <View style={st.optionRow}>
          <Pressable
            onPress={handleGallery}
            style={({ pressed }) => [st.optionBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <View style={[st.optionIconWrap, { backgroundColor: "#007AFF12" }]}>
              <Ionicons name="images" size={22} color="#007AFF" />
            </View>
            <Text style={st.optionLabel}>Gallery</Text>
            <Text style={st.optionHint}>Choose photo</Text>
          </Pressable>
          <Pressable
            onPress={() => { router.push("/barcode"); Haptics.selectionAsync(); }}
            style={({ pressed }) => [st.optionBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <View style={[st.optionIconWrap, { backgroundColor: "#34C75912" }]}>
              <Ionicons name="barcode" size={22} color="#34C759" />
            </View>
            <Text style={st.optionLabel}>Barcode</Text>
            <Text style={st.optionHint}>Scan package</Text>
          </Pressable>
          <Pressable
            onPress={() => { router.push("/manual"); Haptics.selectionAsync(); }}
            style={({ pressed }) => [st.optionBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <View style={[st.optionIconWrap, { backgroundColor: "#8B5CF612" }]}>
              <Ionicons name="create" size={22} color="#8B5CF6" />
            </View>
            <Text style={st.optionLabel}>Manual</Text>
            <Text style={st.optionHint}>Type it in</Text>
          </Pressable>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { alignItems: "center", paddingBottom: 8, gap: 4 },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular" },

  body: { flex: 1, paddingHorizontal: 20, justifyContent: "center", gap: 20, marginTop: -30 },

  cameraBox: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  viewfinder: {
    borderRadius: 24,
    backgroundColor: "#F8F8FA",
    paddingVertical: 52,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  corner: { position: "absolute", width: 28, height: 28, borderColor: "#FF6B35" },
  cornerTL: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  cameraCenter: { alignItems: "center", gap: 12 },
  cameraIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FF6B3510",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  cameraTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#000" },
  cameraHint: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#AEAEB2" },

  optionRow: { flexDirection: "row", gap: 10 },
  optionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderRadius: 22,
    gap: 6,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  optionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#000" },
  optionHint: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#AEAEB2" },

  loadWrap: { flex: 1 },
  scanLine: { height: 3, width: "100%", borderRadius: 2, opacity: 0.9 },
  loadPill: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  loadPillInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  loadTip: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#fff" },
});
