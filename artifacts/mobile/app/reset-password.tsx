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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { authApiRequest } from "@/lib/api";

function PasswordField(props: {
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={s.field}>
      <Ionicons
        name="lock-closed-outline"
        size={18}
        color="rgba(255,255,255,0.42)"
      />
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="rgba(255,255,255,0.28)"
        style={s.input}
        secureTextEntry={!visible}
        autoComplete="new-password"
        selectionColor="#FF6B35"
      />
      <Pressable onPress={() => setVisible((value) => !value)} hitSlop={10}>
        <Ionicons
          name={visible ? "eye-off-outline" : "eye-outline"}
          size={19}
          color="rgba(255,255,255,0.42)"
        />
      </Pressable>
    </View>
  );
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const submit = async () => {
    if (!token) {
      setError(
        "This reset link is incomplete. Request a new one from the sign-in screen.",
      );
      return;
    }
    if (password.length < 12) {
      setError("Use at least 12 characters for your password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authApiRequest("/api/auth/password/reset", {
        method: "POST",
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      await signOut();
      setComplete(true);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Password reset failed.",
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
          <Pressable
            onPress={() => router.replace("/login")}
            style={s.back}
            hitSlop={10}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          <View style={s.icon}>
            <Ionicons
              name={
                complete
                  ? "checkmark-circle-outline"
                  : "shield-checkmark-outline"
              }
              size={31}
              color="#FF8A5F"
            />
          </View>
          <Text style={s.title}>
            {complete ? "Password updated" : "Choose a new password"}
          </Text>
          <Text style={s.subtitle}>
            {complete
              ? "Your previous sessions have been invalidated. Sign in again with your new password."
              : "Use a unique password with at least 12 characters."}
          </Text>

          {!complete ? (
            <View style={s.form}>
              <PasswordField
                placeholder="New password"
                value={password}
                onChangeText={setPassword}
              />
              <PasswordField
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              {error && <Text style={s.error}>{error}</Text>}
              <Pressable
                onPress={submit}
                disabled={loading}
                style={[s.button, loading && s.dimmed]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.buttonText}>Update Password</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => router.replace("/login")}
              style={s.button}
            >
              <Text style={s.buttonText}>Sign In</Text>
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
  form: { gap: 13 },
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
  error: {
    color: "#FFAA98",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
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
