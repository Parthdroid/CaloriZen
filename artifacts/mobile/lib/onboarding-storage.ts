import AsyncStorage from "@react-native-async-storage/async-storage";

const LEGACY_ONBOARDING_KEY = "@onboarding_complete";
const ONBOARDING_KEY_PREFIX = "@onboarding_complete:";

function onboardingKey(userId: number): string {
  return `${ONBOARDING_KEY_PREFIX}${userId}`;
}

export async function loadOnboardingComplete(userId: number): Promise<boolean> {
  const stored = await AsyncStorage.getItem(onboardingKey(userId));
  if (stored !== null) return stored === "true";

  const legacy = await AsyncStorage.getItem(LEGACY_ONBOARDING_KEY);
  if (legacy !== "true") return false;

  await AsyncStorage.setItem(onboardingKey(userId), "true");
  await AsyncStorage.removeItem(LEGACY_ONBOARDING_KEY);
  return true;
}

export async function setOnboardingComplete(userId: number): Promise<void> {
  await AsyncStorage.setItem(onboardingKey(userId), "true");
}

export async function clearOnboardingComplete(userId: number): Promise<void> {
  await AsyncStorage.removeItem(onboardingKey(userId));
}
