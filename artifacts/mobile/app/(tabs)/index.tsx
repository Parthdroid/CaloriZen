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

function ProgressRing({
  consumed,
  goal,
  size,
  strokeWidth,
  color,
  trackColor,
}: {
  consumed: number;
  goal: number;
  size: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / (goal || 1), 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split("T")[0];
  const { data: summary, isLoading, refetch } = useGetDailySummary({ date: today });

  const topPad = Platform.OS === "web" ? 52 : insets.top;
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

  const remaining = Math.max(goalCalories - totalCalories, 0);
  const isOver = totalCalories > goalCalories;

  const dateLabel = new Date().toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
    refetch();
  }, [queryClient, refetch]);

  const macros = [
    { label: "Protein", value: totalProtein, goal: goalProtein, color: colors.protein, unit: "g" },
    { label: "Carbs", value: totalCarbs, goal: goalCarbs, color: colors.carbs, unit: "g" },
    { label: "Fat", value: totalFat, goal: goalFat, color: colors.fat, unit: "g" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: bottomPad + 100 }}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.tint} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.dateText, { color: colors.textTertiary }]}>{dateLabel}</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Dashboard</Text>
        </View>
        <Pressable
          onPress={() => router.push("/(tabs)/goals")}
          style={[styles.settingsBtn, { borderColor: colors.border }]}
          accessibilityLabel="Settings"
        >
          <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={[styles.calorieSection, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.calorieMain}>
          <View style={styles.ringContainer}>
            <ProgressRing
              consumed={totalCalories}
              goal={goalCalories}
              size={136}
              strokeWidth={10}
              color={isOver ? colors.fat : colors.tint}
              trackColor={colors.backgroundTertiary}
            />
            <View style={styles.ringCenter}>
              <Text style={[styles.calorieNumber, { color: colors.text }]}>
                {Math.round(remaining)}
              </Text>
              <Text style={[styles.calorieLabel, { color: colors.textTertiary }]}>
                {isOver ? "over" : "kcal left"}
              </Text>
            </View>
          </View>
          <View style={styles.calorieStats}>
            <View style={styles.statRow}>
              <View style={[styles.statDot, { backgroundColor: colors.tint }]} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Consumed</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{Math.round(totalCalories)}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.backgroundTertiary }]} />
            <View style={styles.statRow}>
              <View style={[styles.statDot, { backgroundColor: colors.backgroundTertiary }]} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Target</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{goalCalories}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.backgroundTertiary }]} />
            <View style={styles.statRow}>
              <View style={[styles.statDot, { backgroundColor: isOver ? colors.fat : "#22C55E" }]} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{isOver ? "Over" : "Remaining"}</Text>
              <Text style={[styles.statValue, { color: isOver ? colors.fat : colors.text }]}>{Math.round(remaining)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.macroSection}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>MACRONUTRIENTS</Text>
        <View style={styles.macroGrid}>
          {macros.map((m) => {
            const pct = Math.min(m.value / (m.goal || 1), 1);
            return (
              <View key={m.label} style={[styles.macroCard, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={styles.macroCardTop}>
                  <View style={styles.macroRingWrap}>
                    <ProgressRing consumed={m.value} goal={m.goal} size={40} strokeWidth={4} color={m.color} trackColor={colors.backgroundTertiary} />
                    <View style={styles.macroRingCenter}>
                      <Text style={[styles.macroPct, { color: m.color }]}>{Math.round(pct * 100)}</Text>
                    </View>
                  </View>
                  <Text style={[styles.macroName, { color: colors.textSecondary }]}>{m.label}</Text>
                </View>
                <Text style={[styles.macroValueText, { color: colors.text }]}>
                  {Math.round(m.value)}<Text style={[styles.macroGoalText, { color: colors.textTertiary }]}>/{m.goal}{m.unit}</Text>
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.quickActions}>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/(tabs)/scan");
          }}
          style={({ pressed }) => [
            styles.quickBtn,
            { backgroundColor: colors.text, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="camera-outline" size={18} color={colors.background} />
          <Text style={[styles.quickBtnText, { color: colors.background }]}>Scan Meal</Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/barcode");
          }}
          style={({ pressed }) => [
            styles.quickBtn,
            { backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="barcode-outline" size={18} color={colors.text} />
          <Text style={[styles.quickBtnText, { color: colors.text }]}>Barcode</Text>
        </Pressable>
      </View>

      <View style={styles.mealsSection}>
        <View style={styles.mealsSectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>RECENT MEALS</Text>
          {meals.length > 0 && (
            <Pressable onPress={() => router.push("/(tabs)/log")} hitSlop={12}>
              <Text style={[styles.seeAllBtn, { color: colors.tint }]}>View all</Text>
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Loading...</Text>
          </View>
        ) : meals.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="restaurant-outline" size={24} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No meals logged today</Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Use the scanner to add your first meal
            </Text>
          </View>
        ) : (
          <View style={styles.mealsList}>
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
  dateText: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.2, marginBottom: 1 },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.6 },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  calorieSection: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  calorieMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  ringContainer: {
    width: 136,
    height: 136,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
  },
  calorieNumber: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1.5,
  },
  calorieLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: -2,
  },
  calorieStats: {
    flex: 1,
    gap: 0,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  statDivider: {
    height: 1,
  },

  macroSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  macroGrid: {
    flexDirection: "row",
    gap: 8,
  },
  macroCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  macroCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  macroRingWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  macroRingCenter: {
    position: "absolute",
  },
  macroPct: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
  },
  macroName: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  macroValueText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  macroGoalText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 24,
  },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 13,
  },
  quickBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  mealsSection: {
    paddingHorizontal: 16,
    gap: 10,
  },
  mealsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seeAllBtn: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  mealsList: {
    gap: 0,
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    gap: 6,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubtext: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
