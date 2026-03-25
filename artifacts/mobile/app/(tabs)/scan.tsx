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
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { analyzePhoto, lookupBarcode } from "@workspace/api-client-react";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type ScanMode = "photo" | "barcode";

const TIPS = [
  "Identifying foods...",
  "Estimating portions...",
  "Calculating macros...",
  "Almost done...",
];

export default function ScanTab() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { setPendingAnalysis, setPendingImageBase64 } = useApp();
  const [mode, setMode] = useState<ScanMode>("photo");
  const [loading, setLoading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const tipInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const topPad = Platform.OS === "web" ? 40 : insets.top;
  const bottomPad = Platform.OS === "web" ? 100 : insets.bottom + 70;

  const startScanAnimation = useCallback(() => {
    setTipIndex(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    tipInterval.current = setInterval(() => {
      setTipIndex((prev) => Math.min(prev + 1, TIPS.length - 1));
    }, 4000);
  }, [scanLineAnim]);

  const stopScanAnimation = useCallback(() => {
    scanLineAnim.stopAnimation();
    scanLineAnim.setValue(0);
    if (tipInterval.current) {
      clearInterval(tipInterval.current);
      tipInterval.current = null;
    }
  }, [scanLineAnim]);

  const handleImage = useCallback(
    async (uri: string) => {
      setPreviewUri(uri);
      setLoading(true);
      startScanAnimation();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const mimeType = blob.type || "image/jpeg";
        const analysis = await Promise.race([
          analyzePhoto({ imageBase64: base64, mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif" }),
          new Promise<never>((_, reject) => {
            setTimeout(() => {
              const err = new Error("Request timed out");
              err.name = "AbortError";
              reject(err);
            }, 90000);
          }),
        ]);

        const items = analysis.items ?? [];
        const isNonFood = items.length === 0 ||
          (items.length === 1 && (analysis.totalCalories ?? 0) === 0 &&
            (items[0]?.name?.toLowerCase().includes("non-food") || items[0]?.name?.toLowerCase().includes("not food")));

        if (isNonFood) {
          stopScanAnimation();
          setLoading(false);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert("No food detected", "Try taking a clearer picture of your meal.", [{ text: "OK" }]);
          return;
        }

        stopScanAnimation();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPendingAnalysis(analysis);
        setPendingImageBase64(base64);
        router.push("/review");
      } catch (err: unknown) {
        stopScanAnimation();
        const isAbort = err instanceof Error && err.name === "AbortError";
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          isAbort ? "Request timed out" : "Analysis Failed",
          isAbort ? "Please try again with a clearer photo." : "Something went wrong. Please try again.",
          [{ text: "OK" }]
        );
      } finally {
        setLoading(false);
        setPreviewUri(null);
      }
    },
    [setPendingAnalysis, setPendingImageBase64, startScanAnimation, stopScanAnimation]
  );

  const handleCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera Permission", "Please allow camera access to take meal photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      await handleImage(result.assets[0].uri);
    }
  }, [handleImage]);

  const handleGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Gallery Permission", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      await handleImage(result.assets[0].uri);
    }
  }, [handleImage]);

  const handleBarcodeLookup = useCallback(async () => {
    if (!barcodeInput.trim()) return;
    setBarcodeLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const product = await lookupBarcode(barcodeInput.trim());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPendingAnalysis(null);
      setPendingImageBase64(null);
      router.push({
        pathname: "/barcode",
        params: { prefill: JSON.stringify(product) },
      });
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Not Found", "We couldn't find this barcode. Try a different number or scan a photo instead.");
    } finally {
      setBarcodeLoading(false);
    }
  }, [barcodeInput, setPendingAnalysis, setPendingImageBase64]);

  if (loading && previewUri) {
    const translateY = scanLineAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, SCREEN_H * 0.5],
    });

    return (
      <View style={[styles.loadingContainer, { backgroundColor: "#000" }]}>
        <Image source={{ uri: previewUri }} style={styles.fullImage} resizeMode="cover" />
        <View style={styles.scanOverlayFull}>
          <Animated.View style={[styles.scanLine, { backgroundColor: colors.tint, transform: [{ translateY }] }]} />
        </View>
        <View style={[styles.scanCornerTL, { borderColor: "#fff" }]} />
        <View style={[styles.scanCornerTR, { borderColor: "#fff" }]} />
        <View style={[styles.scanCornerBL, { borderColor: "#fff" }]} />
        <View style={[styles.scanCornerBR, { borderColor: "#fff" }]} />
        <View style={[styles.loadingBottom, { bottom: bottomPad + 20 }]}>
          <View style={styles.loadingPill}>
            <ActivityIndicator size="small" color={colors.tint} />
            <Text style={styles.loadingTip}>{TIPS[tipIndex]}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#0A0A0A" }]}>
      <View style={[styles.headerRow, { paddingTop: topPad + 8 }]}>
        <Text style={styles.headerTitle}>Scanner</Text>
      </View>

      <View style={styles.viewfinderArea}>
        <View style={styles.viewfinderPlaceholder}>
          <View style={[styles.vfCornerTL, { borderColor: "rgba(255,255,255,0.5)" }]} />
          <View style={[styles.vfCornerTR, { borderColor: "rgba(255,255,255,0.5)" }]} />
          <View style={[styles.vfCornerBL, { borderColor: "rgba(255,255,255,0.5)" }]} />
          <View style={[styles.vfCornerBR, { borderColor: "rgba(255,255,255,0.5)" }]} />
          <View style={styles.vfCenter}>
            <Ionicons name={mode === "photo" ? "restaurant-outline" : "barcode-outline"} size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.vfHint}>
              {mode === "photo" ? "Point at your food" : "Position barcode in frame"}
            </Text>
          </View>
        </View>
      </View>

      {mode === "barcode" && (
        <View style={styles.barcodeInputArea}>
          <View style={styles.barcodeInputRow}>
            <Ionicons name="barcode-outline" size={20} color="rgba(255,255,255,0.5)" />
            <TextInput
              value={barcodeInput}
              onChangeText={setBarcodeInput}
              placeholder="Enter barcode number..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.barcodeTextInput}
              keyboardType="numeric"
              returnKeyType="search"
              onSubmitEditing={handleBarcodeLookup}
              autoFocus
            />
            {barcodeLoading ? (
              <ActivityIndicator size="small" color={colors.tint} />
            ) : barcodeInput.length > 0 ? (
              <Pressable onPress={handleBarcodeLookup}>
                <View style={[styles.barcodeLookupBtn, { backgroundColor: colors.tint }]}>
                  <Ionicons name="search" size={16} color="#fff" />
                </View>
              </Pressable>
            ) : null}
          </View>
        </View>
      )}

      <View style={[styles.bottomToolbar, { paddingBottom: Platform.OS === "web" ? 80 : insets.bottom + 60 }]}>
        <View style={styles.modeToggle}>
          <Pressable
            onPress={() => { setMode("photo"); Haptics.selectionAsync(); }}
            style={[styles.modeBtn, mode === "photo" && styles.modeBtnActive, mode === "photo" && { backgroundColor: "rgba(255,255,255,0.15)" }]}
          >
            <Ionicons name="scan-outline" size={16} color={mode === "photo" ? "#fff" : "rgba(255,255,255,0.5)"} />
            <Text style={[styles.modeBtnText, mode === "photo" && styles.modeBtnTextActive]}>Scan food</Text>
          </Pressable>
          <Pressable
            onPress={() => { setMode("barcode"); Haptics.selectionAsync(); }}
            style={[styles.modeBtn, mode === "barcode" && styles.modeBtnActive, mode === "barcode" && { backgroundColor: "rgba(255,255,255,0.15)" }]}
          >
            <Ionicons name="barcode-outline" size={16} color={mode === "barcode" ? "#fff" : "rgba(255,255,255,0.5)"} />
            <Text style={[styles.modeBtnText, mode === "barcode" && styles.modeBtnTextActive]}>Barcode</Text>
          </Pressable>
        </View>

        <View style={styles.captureRow}>
          <Pressable onPress={handleGallery} style={styles.sideBtn}>
            <Ionicons name="images-outline" size={24} color="#fff" />
          </Pressable>

          <Pressable
            onPress={mode === "photo" ? handleCamera : handleBarcodeLookup}
            style={({ pressed }) => [
              styles.captureBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <View style={styles.captureBtnInner}>
              <Ionicons name={mode === "photo" ? "camera" : "search"} size={28} color="#0A0A0A" />
            </View>
          </Pressable>

          <Pressable onPress={() => router.push("/barcode")} style={styles.sideBtn}>
            <Ionicons name="create-outline" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const VF_SIZE = SCREEN_W * 0.72;

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    alignItems: "center",
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  viewfinderArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  viewfinderPlaceholder: {
    width: VF_SIZE,
    height: VF_SIZE,
    position: "relative",
  },
  vfCornerTL: { position: "absolute", top: 0, left: 0, width: 32, height: 32, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 16 },
  vfCornerTR: { position: "absolute", top: 0, right: 0, width: 32, height: 32, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 16 },
  vfCornerBL: { position: "absolute", bottom: 0, left: 0, width: 32, height: 32, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 16 },
  vfCornerBR: { position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 16 },
  vfCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  vfHint: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.35)",
  },
  barcodeInputArea: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  barcodeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  barcodeTextInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#fff",
  },
  barcodeLookupBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomToolbar: {
    paddingHorizontal: 24,
    gap: 20,
  },
  modeToggle: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 3,
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modeBtnActive: {},
  modeBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.5)",
  },
  modeBtnTextActive: {
    color: "#fff",
  },
  captureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  sideBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  captureBtnInner: {
    flex: 1,
    width: "100%",
    borderRadius: 32,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    position: "relative",
  },
  fullImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  scanOverlayFull: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  scanLine: {
    height: 3,
    width: "100%",
    borderRadius: 2,
    opacity: 0.8,
  },
  scanCornerTL: { position: "absolute", top: "20%", left: "12%", width: 32, height: 32, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  scanCornerTR: { position: "absolute", top: "20%", right: "12%", width: 32, height: 32, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  scanCornerBL: { position: "absolute", bottom: "30%", left: "12%", width: 32, height: 32, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  scanCornerBR: { position: "absolute", bottom: "30%", right: "12%", width: 32, height: 32, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  loadingBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  loadingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  loadingTip: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "#fff",
  },
});
