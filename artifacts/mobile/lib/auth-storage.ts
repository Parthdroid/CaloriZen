import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const AUTH_TOKEN_KEY = "@auth_token";
const AUTH_USER_KEY = "@auth_user";

async function readToken(): Promise<string | null> {
  if (Platform.OS === "web") return AsyncStorage.getItem(AUTH_TOKEN_KEY);

  const secureToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  if (secureToken) return secureToken;

  const legacyToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (legacyToken) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, legacyToken, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }
  return legacyToken;
}

async function writeToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

async function removeToken(): Promise<void> {
  if (Platform.OS !== "web") await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function loadStoredSession() {
  const [token, user] = await Promise.all([
    readToken(),
    AsyncStorage.getItem(AUTH_USER_KEY),
  ]);
  return { token, user };
}

export async function storeSession(
  token: string,
  user: unknown,
): Promise<void> {
  await Promise.all([
    writeToken(token),
    AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)),
  ]);
}

export async function clearStoredSession(): Promise<void> {
  await Promise.all([removeToken(), AsyncStorage.removeItem(AUTH_USER_KEY)]);
}
