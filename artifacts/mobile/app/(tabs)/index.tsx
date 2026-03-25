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
  value,
  goal,
  size,
  strokeWidth,
  color,
  trackColor,
}: {
  value: number;
  goal: number;
  size: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / (goal || 1), 1);
  const offset = circumference * (1 - progress);

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
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

  const dayName = new Date().toLocaleDateString([], { weekday: "long" });
  const monthDay = new Date().toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 100 }}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.textTertiary} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.dayLabel, { color: colors.textTertiary }]}>{dayName}</Text>
          <Text style={[styles.dateLabel, { color: colors.text }]}>{monthDay}</Text>
        </View>
        <Pressable
          onPress={() => router.push("/(tabs)/goals")}
          accessibilityLabel="Goals"
          hitSlop={8}
        >
          <View style={[styles.avatarBtn, { backgroundColor: colors.backgroundTertiary }]}>
            <Ionicons name="person" size={16} color={colors.textTertiary} />
          </View>
        </Pressable>
      </View>

      <View style={[styles.calorieCard, { backgroundColor: colors.card }]}>
        <View style={styles.calorieCardInner}>
          <View style={styles.ringWrap}>
            <ProgressRing
              value={totalCalories}
              goal={goalCalories}
              size={148}
              strokeWidth={11}
              color={isOver ? colors.fat : colors.tint}
              trackColor={colors.backgroundTertiary}
            />
            <View style={styles.ringCenter}>
              <Text style={[styles.ringNumber, { color: colors.text }]}>
                {Math.round(remaining)}
              </Text>
              <Text style={[styles.ringLabel, { color: colors.textTertiary }]}>
                {isOver ? "over" : "remaining"}
              </Text>
            </View>
          </View>

          <View style={styles.calorieMeta}>
            <View style={styles.metaItem}>
              <View style={[styles.metaDot, { backgroundColor: colors.tint }]} />
              <View style={styles.metaTextGroup}>
                <Text style={[styles.metaValue, { color: colors.text }]}>{Math.round(totalCalories)}</Text>
                <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>eaten</Text>
              </View>
            </View>
            <View style={[styles.metaDivider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.metaItem}>
              <View style={[styles.metaDot, { backgroundColor: colors.backgroundTertiary }]} />
              <View style={styles.metaTextGroup}>
                <Text style={[styles.metaValue, { color: colors.text }]}>{goalCalories}</Text>
                <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>goal</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.macroRow}>
        {macros.map((m) => {
          const pct = Math.min(m.value / (m.goal || 1), 1);
          return (
            <View key={m.label} style={[styles.macroCard, { backgroundColor: colors.card }]}>
              <View style={styles.macroRingWrap}>
                <ProgressRing value={m.value} goal={m.goal} size={44} strokeWidth={4.5} color={m.color} trackColor={colors.backgroundTertiary} />
                <Text style={[styles.macroPct, { color: m.color }]}>{Math.round(pct * 100)}%</Text>
              </View>
              <Text style={[styles.macroVal, { color: colors.text }]}>
                {Math.round(m.value)}<Text style={{ color: colors.textTertiary, fontFamily: "Inter_400Regular", fontSize: 11 }}>/{m.goal}{m.unit}</Text>
              </Text>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>{m.label}</Text>
            </View>
          );
        })}
      </View>

      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/(tabs)/scan");
        }}
        style={({ pressed }) => [
          styles.scanBtn,
          { backgroundColor: colors.tint, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Ionicons name="scan-outline" size={20} color="#fff" />
        <Text style={styles.scanBtnText}>Scan</Text>
      </Pressable>

      <View style={styles.mealsSection}>
        <View style={styles.mealsHeader}>
          <Text style={[styles.mealsTitle, { color: colors.text }]}>Today's Meals</Text>
          {meals.length > 0 && (
            <Pressable onPress={() => router.push("/(tabs)/log")} hitSlop={12}>
              <Text style={[styles.seeAll, { color: colors.tint }]}>See all</Text>
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>Loading...</Text>
          </View>
        ) : meals.length === 0 ? (
          <View style={[styles.emptyWrap, { backgroundColor: colors.card }]}>
            <Ionicons name="restaurant-outline" size={28} color={colors.textTertiary} style={{ marginBottom: 4 }} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No meals yet</Text>
            <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>
              Scan or log your first meal to get started
            </Text>
          </View>
        ) : (
          <View>
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
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  dayLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  dateLabel: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginTop: 1,
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  calorieCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 24,
    marginBottom: 12,
  },
  calorieCardInner: {
    alignItems: "center",
    gap: 20,
  },
  ringWrap: {
    width: 148,
    height: 148,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
  },
  ringNumber: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1.5,
  },
  ringLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: -1,
  },
  calorieMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metaTextGroup: {
    alignItems: "flex-start",
  },
  metaValue: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.3,
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: -1,
  },
  metaDivider: {
    width: 1,
    height: 28,
  },

  macroRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  macroCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  macroRingWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  macroPct: {
    position: "absolute",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  macroVal: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.2,
  },
  macroLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: -4,
  },

  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 28,
  },
  scanBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },

  mealsSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  mealsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealsTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.2,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  emptyWrap: {
    padding: 36,
    borderRadius: 20,
    alignItems: "center",
    gap: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
