import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Svg, { Circle } from "react-native-svg";
import { useQueryClient } from "@tanstack/react-query";

import { useTheme } from "@/hooks/useTheme";
import { MealCard } from "@/components/MealCard";
import {
  useGetDailySummary,
  getGetDailySummaryQueryKey,
  getListMealsQueryKey,
} from "@workspace/api-client-react";

function CalorieRing({
  consumed,
  goal,
  size,
}: {
  consumed: number;
  goal: number;
  size: number;
}) {
  const { colors } = useTheme();
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / (goal || 1), 1);
  const strokeDashoffset = circumference * (1 - progress);
  const remaining = Math.max(goal - consumed, 0);
  const isOver = consumed > goal;

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }], position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.backgroundTertiary} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={isOver ? colors.fat : colors.tint} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
      </Svg>
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 42, color: colors.text, letterSpacing: -1.5 }}>
          {Math.round(remaining)}
        </Text>
        <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: colors.textSecondary, marginTop: -2 }}>
          {isOver ? "over" : "remaining"}
        </Text>
      </View>
    </View>
  );
}

function MacroRing({
  label,
  value,
  goal,
  color,
  unit,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
  unit: string;
}) {
  const { colors } = useTheme();
  const size = 64;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / (goal || 1), 1);
  const offset = circumference * (1 - progress);

  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }], position: "absolute" }}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.backgroundTertiary} strokeWidth={strokeWidth} fill="none" />
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
        </Svg>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: colors.text }}>
          {Math.round(value)}
        </Text>
      </View>
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: colors.textSecondary }}>{label}</Text>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 10, color: colors.textTertiary }}>
          / {goal}{unit}
        </Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split("T")[0];
  const { data: summary, isLoading, refetch } = useGetDailySummary({ date: today });

  const handleScanMeal = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(tabs)/scan");
  }, []);

  const handleScanBarcode = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/barcode");
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const meals = summary?.meals ?? [];
  const totalCalories = summary?.totalCalories ?? 0;
  const totalProtein = summary?.totalProtein ?? 0;
  const totalCarbs = summary?.totalCarbs ?? 0;
  const totalFat = summary?.totalFat ?? 0;
  const goalCalories = summary?.goalCalories ?? 2000;
  const goalProtein = summary?.goalProtein ?? 150;
  const goalCarbs = summary?.goalCarbs ?? 200;
  const goalFat = summary?.goalFat ?? 65;

  const dateLabel = new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 16,
        paddingBottom: bottomPad + 100,
      }}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
            refetch();
          }}
          tintColor={colors.tint}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textTertiary }]}>{dateLabel}</Text>
          <Text style={[styles.title, { color: colors.text }]}>Today</Text>
        </View>
        <Pressable
          onPress={() => router.push("/(tabs)/goals")}
          style={[styles.profileBtn, { backgroundColor: colors.backgroundTertiary }]}
        >
          <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={[styles.ringCard, { backgroundColor: colors.card }]}>
        <View style={styles.ringRow}>
          <CalorieRing consumed={totalCalories} goal={goalCalories} size={160} />
        </View>
        <View style={styles.consumedRow}>
          <Text style={[styles.consumedLabel, { color: colors.textTertiary }]}>
            {Math.round(totalCalories)} eaten
          </Text>
          <View style={[styles.consumedDot, { backgroundColor: colors.textTertiary }]} />
          <Text style={[styles.consumedLabel, { color: colors.textTertiary }]}>
            {goalCalories} goal
          </Text>
        </View>
        <View style={styles.macroRings}>
          <MacroRing label="Protein" value={totalProtein} goal={goalProtein} color={colors.protein} unit="g" />
          <MacroRing label="Carbs" value={totalCarbs} goal={goalCarbs} color={colors.carbs} unit="g" />
          <MacroRing label="Fat" value={totalFat} goal={goalFat} color={colors.fat} unit="g" />
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={handleScanMeal}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: colors.tint,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <Ionicons name="camera-outline" size={20} color="#fff" />
          <Text style={styles.actionBtnTextWhite}>Scan Meal</Text>
        </Pressable>

        <Pressable
          onPress={handleScanBarcode}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: colors.backgroundTertiary,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <Ionicons name="barcode-outline" size={20} color={colors.text} />
          <Text style={[styles.actionBtnTextDark, { color: colors.text }]}>Barcode</Text>
        </Pressable>
      </View>

      <View style={styles.mealsSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Meals</Text>
          {meals.length > 0 && (
            <Pressable onPress={() => router.push("/(tabs)/log")} hitSlop={12}>
              <Text style={[styles.seeAll, { color: colors.tint }]}>See all</Text>
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Loading...</Text>
          </View>
        ) : meals.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.tint + "10" }]}>
              <Ionicons name="restaurant-outline" size={28} color={colors.tint} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No meals yet</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Scan your first meal to start tracking
            </Text>
          </View>
        ) : (
          <View style={styles.mealList}>
            {meals.slice(0, 5).map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCard: {
    marginHorizontal: 20,
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 20,
    marginBottom: 16,
  },
  ringRow: {
    alignItems: "center",
  },
  consumedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -8,
  },
  consumedLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  consumedDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  macroRings: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 10,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 28,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  actionBtnTextWhite: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  actionBtnTextDark: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  mealsSection: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  mealList: {
    gap: 0,
  },
  emptyState: {
    marginHorizontal: 20,
    padding: 36,
    borderRadius: 20,
    alignItems: "center",
    gap: 10,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
