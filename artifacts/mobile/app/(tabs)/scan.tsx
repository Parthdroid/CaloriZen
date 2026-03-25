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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <View style={styles.headerSide} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Scanner</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.cameraArea}>
        <View style={[styles.viewfinder, { backgroundColor: colors.backgroundTertiary }]}>
          <View style={[styles.cornerTL, styles.corner, { borderColor: colors.textTertiary }]} />
          <View style={[styles.cornerTR, styles.corner, { borderColor: colors.textTertiary }]} />
          <View style={[styles.cornerBL, styles.corner, { borderColor: colors.textTertiary }]} />
          <View style={[styles.cornerBR, styles.corner, { borderColor: colors.textTertiary }]} />

          <View style={styles.vfCenter}>
            <Ionicons name="camera-outline" size={44} color={colors.textTertiary} />
            <Text style={[styles.vfHint, { color: colors.textTertiary }]}>Point camera at your meal</Text>
          </View>
        </View>
      </View>

      {showBarcode && (
        <View style={styles.barcodeOverlay}>
          <View style={[styles.barcodeCard, { backgroundColor: colors.card }]}>
            <View style={styles.barcodeHeader}>
              <Text style={[styles.barcodeTitle, { color: colors.text }]}>Enter Barcode</Text>
              <Pressable onPress={() => setShowBarcode(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </Pressable>
            </View>
            <View style={[styles.barcodeInputRow, { backgroundColor: colors.backgroundTertiary }]}>
              <TextInput
                value={barcodeInput}
                onChangeText={setBarcodeInput}
                placeholder="Barcode number..."
                placeholderTextColor={colors.textTertiary}
                style={[styles.barcodeInput, { color: colors.text }]}
                keyboardType="numeric"
                returnKeyType="search"
                onSubmitEditing={handleBarcodeLookup}
                autoFocus
              />
              {barcodeLoading ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <Pressable onPress={handleBarcodeLookup} style={[styles.barcodeSearchBtn, { backgroundColor: colors.tint }]}>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      )}

      <View style={[styles.bottomArea, { paddingBottom: Platform.OS === "web" ? 76 : insets.bottom + 56 }]}>
        <View style={[styles.toolbar, { backgroundColor: colors.card }]}>
          <View style={styles.toolbarLabel}>
            <Ionicons name="scan-outline" size={15} color={colors.text} />
            <Text style={[styles.toolbarLabelText, { color: colors.text }]}>Scan food</Text>
          </View>
          <View style={[styles.toolbarDivider, { backgroundColor: colors.border }]} />
          <Pressable
            onPress={() => { setShowBarcode(!showBarcode); Haptics.selectionAsync(); }}
            style={styles.toolbarIcon}
            accessibilityLabel="Barcode"
          >
            <Ionicons name="barcode-outline" size={20} color={showBarcode ? colors.text : colors.textTertiary} />
          </Pressable>
          <Pressable onPress={handleGallery} style={styles.toolbarIcon} accessibilityLabel="Gallery">
            <Ionicons name="images-outline" size={20} color={colors.textTertiary} />
          </Pressable>
          <Pressable onPress={() => router.push("/barcode")} style={styles.toolbarIcon} accessibilityLabel="Manual entry">
            <Ionicons name="create-outline" size={20} color={colors.textTertiary} />
          </Pressable>
        </View>

        <View style={styles.shutterRow}>
          <Pressable style={styles.flashBtn} accessibilityLabel="Flash">
            <Ionicons name="flash-outline" size={22} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            onPress={handleCamera}
            style={({ pressed }) => [
              styles.shutterBtn,
              { borderColor: colors.text, transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <View style={[styles.shutterInner, { backgroundColor: colors.text }]} />
          </Pressable>

          <View style={styles.flashBtn} />
        </View>
      </View>
    </View>
  );
}

const VF = SCREEN_W * 0.68;
const CORNER = 28;

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerSide: { width: 32 },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.2,
  },

  cameraArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  viewfinder: {
    width: VF,
    height: VF,
    position: "relative",
    borderRadius: 20,
  },
  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 14 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 14 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 14 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 14 },
  vfCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  vfHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },

  barcodeOverlay: {
    position: "absolute",
    bottom: 200,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  barcodeCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  barcodeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barcodeTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  barcodeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  barcodeInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  barcodeSearchBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomArea: {
    paddingHorizontal: 20,
    gap: 24,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  toolbarLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingRight: 4,
  },
  toolbarLabelText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  toolbarDivider: {
    width: 1,
    height: 16,
    marginHorizontal: 4,
  },
  toolbarIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  shutterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
  },
  flashBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },
  shutterInner: {
    flex: 1,
    width: "100%",
    borderRadius: 30,
  },

  loadingContainer: { flex: 1, position: "relative" },
  fullImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  scanOverlayFull: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  scanLine: { height: 3, width: "100%", borderRadius: 2, opacity: 0.8 },
  scanCornerTL: { position: "absolute", top: "20%", left: "12%", width: 32, height: 32, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  scanCornerTR: { position: "absolute", top: "20%", right: "12%", width: 32, height: 32, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  scanCornerBL: { position: "absolute", bottom: "30%", left: "12%", width: 32, height: 32, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  scanCornerBR: { position: "absolute", bottom: "30%", right: "12%", width: 32, height: 32, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  loadingBottom: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  loadingPill: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
  loadingTip: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#fff" },
});
