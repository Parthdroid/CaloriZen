import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, type AuthUser } from "@/context/AuthContext";
import { authApiRequest } from "@/lib/api";

type Mode = "login" | "register";
type AuthResponse = { token: string; user: AuthUser };

function Field(props: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
  autoComplete?: "email" | "name" | "current-password" | "new-password";
  keyboardType?: "default" | "email-address";
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <View style={s.field}>
      <Ionicons name={props.icon} size={18} color="rgba(255,255,255,0.42)" />
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="rgba(255,255,255,0.28)"
        style={s.input}
        autoCapitalize={
          props.keyboardType === "email-address" ? "none" : "sentences"
        }
        autoCorrect={false}
        autoComplete={props.autoComplete}
        keyboardType={props.keyboardType}
        secureTextEntry={props.secure && !revealed}
        selectionColor="#FF6B35"
      />
      {props.secure && (
        <Pressable onPress={() => setRevealed((value) => !value)} hitSlop={10}>
          <Ionicons
            name={revealed ? "eye-off-outline" : "eye-outline"}
            size={19}
            color="rgba(255,255,255,0.42)"
          />
        </Pressable>
      )}
    </View>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState<"email" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const validate = () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail))
      return "Enter a valid email address.";
    if (mode === "register" && name.trim().length < 2)
      return "Enter your full name.";
    if (mode === "register" && password.length < 12) {
      return "Use at least 12 characters for your password.";
    }
    if (!password) return "Enter your password.";
    if (mode === "register" && password !== confirmPassword)
      return "Passwords do not match.";
    return null;
  };

  const handleEmailAuth = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading("email");
    setError(null);
    try {
      const data = await authApiRequest<AuthResponse>(
        mode === "register" ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify(
            mode === "register"
              ? {
                  name: name.trim(),
                  email: email.trim(),
                  password,
                  confirmPassword,
                }
              : { email: email.trim(), password },
          ),
        },
      );
      await signIn(data.token, data.user);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Sign in failed. Please try again.",
      );
    } finally {
      setLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading("apple");
    setError(null);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken)
        throw new Error("Apple did not return an identity token.");

      const fullName = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName]
            .filter(Boolean)
            .join(" ")
        : null;
      const data = await authApiRequest<AuthResponse>("/api/auth/apple", {
        method: "POST",
        body: JSON.stringify({
          identityToken: credential.identityToken,
          fullName,
        }),
      });
      await signIn(data.token, data.user);
    } catch (caught) {
      if ((caught as { code?: string }).code !== "ERR_REQUEST_CANCELED") {
        setError(
          caught instanceof Error
            ? caught.message
            : "Apple sign in failed. Please try again.",
        );
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={s.root}>
      <LinearGradient
        colors={["#08080D", "#12122A", "#08080D"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            {
              paddingTop: Math.max(insets.top, 20) + 24,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require("@/assets/logo.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.title}>Welcome to CaloriZen</Text>
          <Text style={s.subtitle}>
            Your meals, macros, and goals—securely in one place.
          </Text>

          <View style={s.segment}>
            {(["login", "register"] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => switchMode(value)}
                style={[
                  s.segmentButton,
                  mode === value && s.segmentButtonActive,
                ]}
              >
                <Text
                  style={[s.segmentText, mode === value && s.segmentTextActive]}
                >
                  {value === "login" ? "Sign In" : "Create Account"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={s.form}>
            {mode === "register" && (
              <Field
                icon="person-outline"
                placeholder="Full name"
                value={name}
                onChangeText={setName}
                autoComplete="name"
              />
            )}
            <Field
              icon="mail-outline"
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              autoComplete="email"
              keyboardType="email-address"
            />
            <Field
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secure
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
            {mode === "register" && (
              <>
                <Field
                  icon="shield-checkmark-outline"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secure
                  autoComplete="new-password"
                />
                <Text style={s.hint}>
                  Use 12 or more characters. A password manager is recommended.
                </Text>
              </>
            )}

            {error && (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle" size={17} color="#FF8A72" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {mode === "login" && (
              <Pressable
                onPress={() => router.push("/forgot-password")}
                style={s.forgotButton}
              >
                <Text style={s.forgotText}>Forgot password?</Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleEmailAuth}
              disabled={loading !== null}
              style={({ pressed }) => [
                s.primaryButton,
                (pressed || loading !== null) && s.dimmed,
              ]}
            >
              {loading === "email" ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.primaryText}>
                  {mode === "login" ? "Sign In" : "Create Account"}
                </Text>
              )}
            </Pressable>
          </View>

          {appleAvailable && (
            <>
              <View style={s.dividerRow}>
                <View style={s.divider} />
                <Text style={s.dividerText}>or</Text>
                <View style={s.divider} />
              </View>
              <View
                style={[s.appleButtonContainer, loading !== null && s.dimmed]}
                pointerEvents={loading === null ? "auto" : "none"}
              >
                {loading === "apple" ? (
                  <View style={s.appleLoading}>
                    <ActivityIndicator color="#000" />
                  </View>
                ) : (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={
                      AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
                    }
                    buttonStyle={
                      AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                    }
                    cornerRadius={16}
                    style={s.appleButton}
                    onPress={handleAppleSignIn}
                  />
                )}
              </View>
            </>
          )}

          <Text style={s.legal}>
            By continuing, you agree to our{" "}
            <Text style={s.legalLink} onPress={() => router.push("/terms")}>
              Terms
            </Text>
            {" and "}
            <Text style={s.legalLink} onPress={() => router.push("/privacy")}>
              Privacy Policy
            </Text>
            .
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#08080D" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, alignItems: "center" },
  logo: { width: 112, height: 112, marginBottom: 8 },
  title: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.48)",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  segment: {
    width: "100%",
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 11,
  },
  segmentButtonActive: { backgroundColor: "rgba(255,255,255,0.14)" },
  segmentText: {
    color: "rgba(255,255,255,0.45)",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  segmentTextActive: { color: "#fff" },
  form: { width: "100%", gap: 12 },
  field: {
    height: 54,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    paddingVertical: 0,
  },
  hint: {
    color: "rgba(255,255,255,0.34)",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(255,107,53,0.12)",
  },
  errorText: {
    flex: 1,
    color: "#FFAA98",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  forgotButton: { alignSelf: "flex-end", paddingVertical: 2 },
  forgotText: {
    color: "#FF8A5F",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  primaryText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
  dividerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 18,
  },
  divider: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  dividerText: {
    color: "rgba(255,255,255,0.3)",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  appleButtonContainer: {
    width: "100%",
    height: 56,
  },
  appleButton: { width: "100%", height: 56 },
  appleLoading: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  dimmed: { opacity: 0.65 },
  legal: {
    color: "rgba(255,255,255,0.28)",
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 22,
    paddingHorizontal: 14,
  },
  legalLink: {
    color: "rgba(255,255,255,0.55)",
    textDecorationLine: "underline",
  },
});
