import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authApiRequest } from "@/lib/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApiRequest("/api/auth/password/forgot", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not request a reset link.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <LinearGradient
        colors={["#08080D", "#12122A", "#08080D"]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            s.content,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
          ]}
        >
          <Pressable onPress={() => router.back()} style={s.back} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <View style={s.icon}>
            <Ionicons
              name={sent ? "mail-open-outline" : "key-outline"}
              size={30}
              color="#FF8A5F"
            />
          </View>
          <Text style={s.title}>
            {sent ? "Check your email" : "Reset your password"}
          </Text>
          <Text style={s.subtitle}>
            {sent
              ? "If an account exists for that address, we sent a one-time link that expires in 30 minutes."
              : "Enter your account email. This also lets former social-login users securely set a password."}
          </Text>

          {!sent ? (
            <View style={s.form}>
              <View style={s.field}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color="rgba(255,255,255,0.42)"
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  style={s.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  selectionColor="#FF6B35"
                />
              </View>
              {error && <Text style={s.error}>{error}</Text>}
              <Pressable
                onPress={submit}
                disabled={loading}
                style={[s.button, loading && s.dimmed]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.buttonText}>Send Reset Link</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => router.replace("/login")}
              style={s.button}
            >
              <Text style={s.buttonText}>Back to Sign In</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#08080D" },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
  back: { width: 44, height: 44, justifyContent: "center", marginBottom: 52 },
  icon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "rgba(255,107,53,0.13)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  title: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    letterSpacing: -0.8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.48)",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
    marginBottom: 30,
  },
  form: { gap: 14 },
  field: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
    backgroundColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 11,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  error: { color: "#FFAA98", fontFamily: "Inter_400Regular", fontSize: 13 },
  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  buttonText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
  dimmed: { opacity: 0.65 },
});
