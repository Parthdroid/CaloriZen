import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";

export default function TabLayout() {
  const colors = Colors.light;
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarLabelStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 10,
          letterSpacing: 0.2,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "rgba(255,255,255,0.97)",
          borderTopWidth: 0,
          elevation: 0,
          height: isWeb ? 64 : undefined,
          ...(isWeb ? { paddingBottom: 8 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={95}
              tint="systemChromeMaterialLight"
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: "rgba(255,255,255,0.97)",
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: "rgba(0,0,0,0.08)",
                },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name="house.fill" tintColor={color} size={22} />
            ) : (
              <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: "Log",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name="list.bullet.circle.fill" tintColor={color} size={22} />
            ) : (
              <Ionicons name={focused ? "list-circle" : "list-circle-outline"} size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name="camera.viewfinder" tintColor={color} size={22} />
            ) : (
              <Ionicons name={focused ? "scan-circle" : "scan-circle-outline"} size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name="target" tintColor={color} size={22} />
            ) : (
              <Ionicons name={focused ? "trophy" : "trophy-outline"} size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}
