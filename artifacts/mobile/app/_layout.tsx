import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, Redirect, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import { loadOnboardingComplete } from "@/lib/onboarding-storage";
import { setBaseUrl } from "@workspace/api-client-react";

setBaseUrl(API_BASE_URL);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10000 },
  },
});

type OnboardingStatus = {
  userId: number;
  routeKey: string;
  done: boolean;
};

function RootLayoutNav() {
  const { user, isLoading: authLoading } = useAuth();
  const segments = useSegments();
  const userId = user?.id;
  const routeKey = String(segments[0] ?? "");
  const [onboardingStatus, setOnboardingStatus] =
    useState<OnboardingStatus | null>(null);

  useEffect(() => {
    if (userId === undefined) {
      setOnboardingStatus(null);
      return;
    }

    let active = true;
    loadOnboardingComplete(userId)
      .then((done) => {
        if (active) setOnboardingStatus({ userId, routeKey, done });
      })
      .catch(() => {
        if (active) setOnboardingStatus({ userId, routeKey, done: false });
      });
    return () => {
      active = false;
    };
  }, [routeKey, userId]);

  const onboardingReady =
    userId === undefined ||
    (onboardingStatus?.userId === userId &&
      onboardingStatus.routeKey === routeKey);
  if (authLoading || !onboardingReady) return null;

  const isLoggedIn = !!user;
  const onboardingDone = onboardingStatus?.done ?? false;
  const needsOnboarding = isLoggedIn && !onboardingDone;
  const publicRoutes = [
    "login",
    "forgot-password",
    "reset-password",
    "terms",
    "privacy",
  ];
  const isPublicRoute = publicRoutes.includes(routeKey);
  const isAuthRoute = ["login", "forgot-password", "reset-password"].includes(
    routeKey,
  );
  const isLoginRoute = routeKey === "login";
  const isOnboardingRoute = routeKey === "onboarding";
  let redirectPath: "/login" | "/onboarding" | "/(tabs)" | null = null;
  if (!isLoggedIn && !isPublicRoute) redirectPath = "/login";
  else if (needsOnboarding && !isOnboardingRoute) redirectPath = "/onboarding";
  else if (isLoggedIn && onboardingDone && (isLoginRoute || isOnboardingRoute))
    redirectPath = "/(tabs)";

  return (
    <>
      <StatusBar style={isAuthRoute ? "light" : "dark"} />
      {redirectPath && <Redirect href={redirectPath} />}
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          contentStyle: { backgroundColor: "#F8F8FA" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        <Stack.Screen
          name="delete-account"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen name="terms" options={{ headerShown: false }} />
        <Stack.Screen name="privacy" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="barcode"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="review"
          options={{ headerShown: false, presentation: "modal" }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppProvider>
              <GestureHandlerRootView
                style={{ flex: 1, backgroundColor: "#F8F8FA" }}
              >
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </AppProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
