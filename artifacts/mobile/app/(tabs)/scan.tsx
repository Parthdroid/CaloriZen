import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { analyzePhoto } from "@workspace/api-client-react";

const { width: SCREEN_W } = Dimensions.get("window");

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
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const tipInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

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
          Alert.alert(
            "No food detected",
            "We couldn't find any food in this photo. Try taking a clearer picture of your meal.",
            [{ text: "OK" }]
          );
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
          isAbort
            ? "The analysis is taking too long. Please try again with a clearer photo."
            : "Something went wrong. Please try again.",
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

  if (loading && previewUri) {
    const translateY = scanLineAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, SCREEN_W * 0.65],
    });

    return (
      <View style={[styles.loadingContainer, { backgroundColor: "#000" }]}>
        <View style={styles.scanPreview}>
          <Image source={{ uri: previewUri }} style={styles.scanImage} resizeMode="cover" />
          <View style={styles.scanOverlay}>
            <Animated.View
              style={[
                styles.scanLine,
                { backgroundColor: colors.tint, transform: [{ translateY }] },
              ]}
            />
          </View>
          <View style={[styles.scanCornerTL, { borderColor: colors.tint }]} />
          <View style={[styles.scanCornerTR, { borderColor: colors.tint }]} />
          <View style={[styles.scanCornerBL, { borderColor: colors.tint }]} />
          <View style={[styles.scanCornerBR, { borderColor: colors.tint }]} />
        </View>
        <View style={styles.loadingBottom}>
          <ActivityIndicator size="small" color={colors.tint} />
          <Text style={[styles.loadingTip, { color: "#fff" }]}>{TIPS[tipIndex]}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerArea}>
        <Text style={[styles.title, { color: colors.text }]}>Scan</Text>
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
          Take a photo of your meal for instant nutrition analysis
        </Text>
      </View>

      <View style={styles.optionsArea}>
        <Pressable
          onPress={handleCamera}
          style={({ pressed }) => [
            styles.mainOption,
            {
              backgroundColor: colors.tint,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <View style={styles.mainOptionIcon}>
            <Ionicons name="camera" size={36} color="#fff" />
          </View>
          <Text style={styles.mainOptionTitle}>Take Photo</Text>
          <Text style={styles.mainOptionSub}>Point at your meal</Text>
        </Pressable>

        <Pressable
          onPress={handleGallery}
          style={({ pressed }) => [
            styles.secondaryOption,
            {
              backgroundColor: colors.backgroundTertiary,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <View style={[styles.secondaryIcon, { backgroundColor: colors.tint + "12" }]}>
            <Ionicons name="images-outline" size={24} color={colors.tint} />
          </View>
          <View style={styles.secondaryText}>
            <Text style={[styles.secondaryTitle, { color: colors.text }]}>Choose from Gallery</Text>
            <Text style={[styles.secondarySub, { color: colors.textTertiary }]}>Select a meal photo</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>

        <Pressable
          onPress={() => router.push("/barcode")}
          style={({ pressed }) => [
            styles.secondaryOption,
            {
              backgroundColor: colors.backgroundTertiary,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <View style={[styles.secondaryIcon, { backgroundColor: colors.purple + "12" }]}>
            <Ionicons name="barcode-outline" size={24} color={colors.purple} />
          </View>
          <View style={styles.secondaryText}>
            <Text style={[styles.secondaryTitle, { color: colors.text }]}>Scan Barcode</Text>
            <Text style={[styles.secondarySub, { color: colors.textTertiary }]}>Packaged food</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>
      </View>

      <Text style={[styles.tip, { color: colors.textTertiary }]}>
        Best with good lighting and a clear view of your food
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanPreview: {
    width: SCREEN_W * 0.8,
    height: SCREEN_W * 0.8,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  scanImage: {
    width: "100%",
    height: "100%",
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  scanLine: {
    height: 3,
    width: "100%",
    borderRadius: 2,
    opacity: 0.8,
  },
  scanCornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 28,
    height: 28,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 24,
  },
  scanCornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 24,
  },
  scanCornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 28,
    height: 28,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 24,
  },
  scanCornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 24,
  },
  loadingBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 32,
  },
  loadingTip: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  headerArea: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  optionsArea: {
    gap: 12,
    marginBottom: 24,
  },
  mainOption: {
    borderRadius: 24,
    paddingVertical: 32,
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  mainOptionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  mainOptionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  mainOptionSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  secondaryOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  secondaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    flex: 1,
    gap: 2,
  },
  secondaryTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  secondarySub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  tip: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
