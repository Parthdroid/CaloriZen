import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import * as AuthSession from "expo-auth-session";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);

  const router = useRouter();
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "nutrisnap" });

  const handleGoogleSignIn = async () => {
    setLoading("google");
    try {
      const nonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(36),
      );

      const authRequest = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ["openid", "profile", "email"],
        redirectUri,
        responseType: AuthSession.ResponseType.IdToken,
        extraParams: { nonce },
      });

      const result = await authRequest.promptAsync(discovery);

      if (result.type === "success" && result.params?.id_token) {
        const resp = await fetch(`${API_BASE}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: result.params.id_token }),
        });

        if (!resp.ok) {
          throw new Error("Server authentication failed");
        }

        const data = await resp.json();
        await signIn(data.token, data.user);
      } else if (result.type === "error") {
        Alert.alert("Sign In Failed", "Google sign in was not completed. Please try again.");
      }
    } catch (err: any) {
      Alert.alert("Sign In Error", err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading("apple");
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const fullName = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName]
            .filter(Boolean)
            .join(" ")
        : null;

      const resp = await fetch(`${API_BASE}/api/auth/apple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityToken: credential.identityToken,
          email: credential.email,
          fullName: fullName || null,
          appleUserId: credential.user,
        }),
      });

      if (!resp.ok) {
        throw new Error("Server authentication failed");
      }

      const data = await resp.json();
      await signIn(data.token, data.user);
    } catch (err: any) {
      if (err.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Sign In Error", err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(null);
    }
  };

  const topPad = Platform.OS === "web" ? 60 : insets.top;
  const bottomPad = Platform.OS === "web" ? 40 : insets.bottom + 16;

  return (
    <View style={s.container}>
      <LinearGradient
        colors={["#0F0F0F", "#1A1A2E", "#0F0F0F"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={[s.content, { paddingTop: topPad + 80 }]}>
        <Image
          source={require("@/assets/logo.png")}
          style={s.logoImage}
          resizeMode="contain"
        />

        <Text style={s.title}>NutriSnap™</Text>
        <Text style={s.subtitle}>
          AI-powered calorie tracking{"\n"}from a single photo
        </Text>

        <View style={s.buttonContainer}>
          <Pressable
            onPress={handleAppleSignIn}
            disabled={loading !== null}
            style={({ pressed }) => [
              s.authButton,
              s.appleButton,
              { opacity: loading !== null && loading !== "apple" ? 0.5 : pressed ? 0.9 : 1 },
            ]}
          >
            {loading === "apple" ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={22} color="#fff" />
                <Text style={s.appleButtonText}>Sign in with Apple</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={handleGoogleSignIn}
            disabled={loading !== null}
            style={({ pressed }) => [
              s.authButton,
              s.googleButton,
              { opacity: loading !== null && loading !== "google" ? 0.5 : pressed ? 0.9 : 1 },
            ]}
          >
            {loading === "google" ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Svg width={20} height={20} viewBox="0 0 48 48">
                  <Path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#FFC107" />
                  <Path d="M3.2 14.1l7.1 5.2C12.3 15.1 17.7 11 24 11c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 14.9 2 7.2 6.9 3.2 14.1z" fill="#FF3D00" />
                  <Path d="M24 46c5.4 0 10.3-1.8 14.1-5l-6.5-5.5C29.6 37.1 27 38 24 38c-6 0-11.1-3.8-12.9-9.2l-7 5.4C7.8 41.3 15.3 46 24 46z" fill="#4CAF50" />
                  <Path d="M44.5 20H24v8.5h11.8c-1 3.2-3 5.8-5.6 7.5l6.5 5.5C40.6 38 46 32 46 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2" />
                </Svg>
                <Text style={s.googleButtonText}>Sign in with Google</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      <View style={[s.footer, { paddingBottom: bottomPad }]}>
        <Text style={s.footerText}>
          By continuing, you agree to our{" "}
          <Text style={s.footerLink} onPress={() => router.push("/terms")}>
            Terms of Service
          </Text>
          {" "}and{" "}
          <Text style={s.footerLink} onPress={() => router.push("/privacy")}>
            Privacy Policy
          </Text>
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },
  content: { flex: 1, paddingHorizontal: 32, alignItems: "center" },
  logoImage: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    color: "#2E7D32",
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 64,
  },
  buttonContainer: { width: "100%", gap: 14 },
  authButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    gap: 12,
  },
  googleButton: {
    backgroundColor: "#fff",
  },
  googleButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#1a1a1a",
  },
  appleButton: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  appleButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  footer: { paddingHorizontal: 40 },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
    lineHeight: 18,
  },
  footerLink: {
    color: "rgba(255,255,255,0.5)",
    textDecorationLine: "underline",
  },
});
