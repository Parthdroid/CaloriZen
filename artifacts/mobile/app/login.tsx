import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as AuthSession from "expo-auth-session";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
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
        <View style={s.logoBadge}>
          <LinearGradient
            colors={["#FF6B35", "#FF8A5C"]}
            style={s.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="flame" size={36} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={s.title}>NutriSnap</Text>
        <Text style={s.subtitle}>
          AI-powered calorie tracking{"\n"}from a single photo
        </Text>

        <View style={s.buttonContainer}>
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
                <View style={s.googleIconWrap}>
                  <Text style={s.googleG}>G</Text>
                </View>
                <Text style={s.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          {Platform.OS === "ios" && (
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
                  <Ionicons name="logo-apple" size={20} color="#fff" />
                  <Text style={s.appleButtonText}>Continue with Apple</Text>
                </>
              )}
            </Pressable>
          )}

          {Platform.OS === "web" && (
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
                  <Ionicons name="logo-apple" size={20} color="#fff" />
                  <Text style={s.appleButtonText}>Continue with Apple</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </View>

      <View style={[s.footer, { paddingBottom: bottomPad }]}>
        <Text style={s.footerText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },
  content: { flex: 1, paddingHorizontal: 32, alignItems: "center" },
  logoBadge: { marginBottom: 24 },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    color: "#FF6B35",
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
  googleIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4285F4",
    alignItems: "center",
    justifyContent: "center",
  },
  googleG: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#fff",
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
});
