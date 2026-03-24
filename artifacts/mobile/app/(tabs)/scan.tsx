import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { analyzePhoto } from "@workspace/api-client-react";

export default function ScanTab() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { setPendingAnalysis, setPendingImageBase64 } = useApp();
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const handleImage = useCallback(
    async (uri: string) => {
      setLoading(true);
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
        const analysis = await analyzePhoto({ imageBase64: base64, mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif" });

        setPendingAnalysis(analysis);
        setPendingImageBase64(base64);
        router.push("/review");
      } catch (err) {
        Alert.alert("Analysis Failed", "Could not analyze this photo. Please try again or use manual entry.");
      } finally {
        setLoading(false);
      }
    },
    [setPendingAnalysis, setPendingImageBase64]
  );

  const handleCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera Permission", "Please allow camera access to take meal photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      base64: false,
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
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await handleImage(result.assets[0].uri);
    }
  }, [handleImage]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingTitle, { color: colors.text }]}>Analyzing Meal</Text>
          <Text style={[styles.loadingSubtitle, { color: colors.textSecondary }]}>
            AI is identifying foods and estimating portions...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: topPad + 12,
          paddingBottom: bottomPad + 90,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Scan Meal</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Take a photo or choose from gallery for AI nutrition analysis
      </Text>

      <View style={styles.options}>
        <Pressable
          onPress={handleCamera}
          style={({ pressed }) => [
            styles.optionCard,
            {
              backgroundColor: colors.tint,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <View style={[styles.optionIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Ionicons name="camera" size={32} color="#fff" />
          </View>
          <Text style={styles.optionTitle}>Take Photo</Text>
          <Text style={styles.optionDescription}>
            Use your camera to capture a meal
          </Text>
        </Pressable>

        <Pressable
          onPress={handleGallery}
          style={({ pressed }) => [
            styles.optionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <View style={[styles.optionIcon, { backgroundColor: colors.tint + "18" }]}>
            <Ionicons name="images-outline" size={32} color={colors.tint} />
          </View>
          <Text style={[styles.optionTitleDark, { color: colors.text }]}>Choose from Gallery</Text>
          <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
            Select an existing meal photo
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push("/barcode")}
        style={({ pressed }) => [
          styles.barcodeButton,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
            borderWidth: 1,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Ionicons name="barcode-outline" size={20} color={colors.textSecondary} />
        <Text style={[styles.barcodeText, { color: colors.textSecondary }]}>
          Scan packaged food barcode instead
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </Pressable>

      <Text style={[styles.tip, { color: colors.textTertiary }]}>
        Works best with good lighting and a clear view of the food
      </Text>
    </View>
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
  loadingCard: {
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    gap: 16,
    marginHorizontal: 40,
  },
  loadingTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  loadingSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 28,
    lineHeight: 22,
  },
  options: {
    gap: 12,
    marginBottom: 16,
  },
  optionCard: {
    borderRadius: 20,
    padding: 24,
    gap: 8,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  optionTitleDark: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  barcodeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  barcodeText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  tip: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
