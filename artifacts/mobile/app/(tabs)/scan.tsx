import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
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
        Alert.alert("Analysis Failed", "Could not analyze this photo. Please try again.");
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
        <View style={styles.loadingContent}>
          <View style={[styles.loadingRing, { borderColor: colors.tint + "20" }]}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
          <Text style={[styles.loadingTitle, { color: colors.text }]}>Analyzing your meal...</Text>
          <Text style={[styles.loadingSubtitle, { color: colors.textTertiary }]}>
            Identifying foods and estimating nutrition
          </Text>
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
  loadingContent: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 40,
  },
  loadingRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  loadingTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  loadingSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
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
