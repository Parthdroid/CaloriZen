import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { authApiRequest } from "@/lib/api";

export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAccount = async () => {
    if (!user || !token) return;
    if (user.authMethods.password && !password) {
      setError("Enter your password to continue.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let appleIdentityToken: string | undefined;
      let appleAuthorizationCode: string | undefined;
      if (user.authMethods.apple) {
        const available = await AppleAuthentication.isAvailableAsync();
        if (!available)
          throw new Error(
            "Apple confirmation is only available on a supported Apple device.",
          );
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [],
        });
        if (!credential.identityToken || !credential.authorizationCode) {
          throw new Error(
            "Apple did not return the confirmation required for deletion.",
          );
        }
        appleIdentityToken = credential.identityToken;
        appleAuthorizationCode = credential.authorizationCode;
      }

      await authApiRequest(
        "/api/auth/account",
        {
          method: "DELETE",
          body: JSON.stringify({
            password,
            appleIdentityToken,
            appleAuthorizationCode,
          }),
        },
        token,
      );

      await signOut();
      await AsyncStorage.removeItem("@onboarding_complete");
      queryClient.clear();
      Alert.alert(
        "Account Deleted",
        "Your CaloriZen account and associated meal data were deleted.",
      );
      router.replace("/login");
    } catch (caught) {
      if ((caught as { code?: string }).code !== "ERR_REQUEST_CANCELED") {
        setError(
          caught instanceof Error ? caught.message : "Account deletion failed.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={s.headerButton}
          hitSlop={10}
        >
          <Ionicons name="close" size={24} color="#111" />
        </Pressable>
        <Text style={s.headerTitle}>Delete Account</Text>
        <View style={s.headerButton} />
      </View>
      <ScrollView
        contentContainerStyle={[
          s.content,
          { paddingBottom: insets.bottom + 30 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.warningIcon}>
          <Ionicons name="trash-outline" size={30} color="#FF3B30" />
        </View>
        <Text style={s.title}>This action is permanent</Text>
        <Text style={s.body}>
          Deleting your account removes your profile, nutrition goals, meals,
          and authentication records. This cannot be undone.
        </Text>

        <View style={s.list}>
          <Text style={s.listItem}>
            • Your account will be deleted immediately.
          </Text>
          <Text style={s.listItem}>
            • Meal history and goals will be permanently removed.
          </Text>
          {user?.authMethods.apple && (
            <Text style={s.listItem}>
              • You will be asked to confirm with Apple so access can be
              revoked.
            </Text>
          )}
        </View>

        {user?.authMethods.password && (
          <View style={s.field}>
            <Ionicons name="lock-closed-outline" size={18} color="#8E8E93" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Current password"
              placeholderTextColor="#AEAEB2"
              secureTextEntry
              autoComplete="current-password"
              style={s.input}
            />
          </View>
        )}

        {error && <Text style={s.error}>{error}</Text>}

        <Pressable
          onPress={deleteAccount}
          disabled={loading}
          style={({ pressed }) => [
            s.deleteButton,
            (pressed || loading) && s.dimmed,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.deleteText}>Permanently Delete Account</Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          disabled={loading}
          style={s.cancelButton}
        >
          <Text style={s.cancelText}>Keep My Account</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F8FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D1D1D6",
    backgroundColor: "#fff",
  },
  headerButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#111", fontFamily: "Inter_600SemiBold", fontSize: 17 },
  content: { padding: 24 },
  warningIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#FF3B3012",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 22,
  },
  title: {
    color: "#111",
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.6,
  },
  body: {
    color: "#636366",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
  },
  list: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    gap: 10,
    marginVertical: 24,
  },
  listItem: {
    color: "#3C3C43",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 11,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    color: "#111",
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  error: {
    color: "#D70015",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  deleteButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
  cancelButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  cancelText: {
    color: "#3C3C43",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  dimmed: { opacity: 0.65 },
});
