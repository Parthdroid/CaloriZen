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

function CalorieRing({ eaten, goal, size, colors }: { eaten: number; goal: number; size: number; colors: Record<string, string> }) {
  const sw = 10;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(eaten / (goal || 1), 1);
  const isOver = eaten > goal;
  const remaining = Math.max(goal - eaten, 0);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.backgroundTertiary} strokeWidth={sw} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={isOver ? colors.fat : colors.tint} strokeWidth={sw} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
      </Svg>
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontSize: 44, fontFamily: "Inter_700Bold", color: colors.text, letterSpacing: -2, includeFontPadding: false }}>{Math.round(remaining)}</Text>
        <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.textSecondary, marginTop: -4 }}>remaining</Text>
      </View>
    </View>
  );
}

function MacroBar({ label, current, goal, color, colors }: { label: string; current: number; goal: number; color: string; colors: Record<string, string> }) {
  const pct = Math.min(current / (goal || 1), 1);
  return (
    <View style={ms.row}>
      <View style={ms.labelCol}>
        <View style={[ms.dot, { backgroundColor: color }]} />
        <Text style={[ms.label, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={ms.barCol}>
        <View style={[ms.barTrack, { backgroundColor: colors.backgroundTertiary }]}>
          <View style={[ms.barFill, { backgroundColor: color, width: `${Math.round(pct * 100)}%` }]} />
        </View>
      </View>
      <Text style={[ms.values, { color: colors.textSecondary }]}>
        <Text style={{ color: colors.text, fontFamily: "Inter_600SemiBold" }}>{Math.round(current)}</Text>/{goal}g
      </Text>
    </View>
  );
}

const ms = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  labelCol: { flexDirection: "row", alignItems: "center", gap: 6, width: 72 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  barCol: { flex: 1 },
  barTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  values: { fontSize: 13, fontFamily: "Inter_400Regular", width: 64, textAlign: "right" },
});

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const { data: summary, isLoading, refetch } = useGetDailySummary({ date: today });

  const topPad = Platform.OS === "web" ? 52 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const meals = summary?.meals ?? [];
  const cal = summary?.totalCalories ?? 0;
  const pro = summary?.totalProtein ?? 0;
  const carb = summary?.totalCarbs ?? 0;
  const fat = summary?.totalFat ?? 0;
  const gCal = summary?.goalCalories ?? 2000;
  const gPro = summary?.goalProtein ?? 150;
  const gCarb = summary?.goalCarbs ?? 200;
  const gFat = summary?.goalFat ?? 65;

  const handleRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: getGetDailySummaryQueryKey() });
    qc.invalidateQueries({ queryKey: getListMealsQueryKey() });
    refetch();
  }, [qc, refetch]);

  return (
    <ScrollView
      style={[s.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 4, paddingBottom: bottomPad + 100 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.textTertiary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <View>
          <Text style={[s.greeting, { color: colors.textSecondary }]}>Today</Text>
          <Text style={[s.dateText, { color: colors.text }]}>
            {new Date().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
          </Text>
        </View>
        <Pressable onPress={() => router.push("/(tabs)/goals")} hitSlop={8}>
          <View style={[s.profileCircle, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="person" size={16} color={colors.textTertiary} />
          </View>
        </Pressable>
      </View>

      <View style={s.ringSection}>
        <CalorieRing eaten={cal} goal={gCal} size={200} colors={colors} />
      </View>

      <View style={s.eatenRow}>
        <View style={s.eatenItem}>
          <Text style={[s.eatenVal, { color: colors.tint }]}>{Math.round(cal)}</Text>
          <Text style={[s.eatenLabel, { color: colors.textTertiary }]}>eaten</Text>
        </View>
        <View style={[s.eatenDivider, { backgroundColor: colors.backgroundTertiary }]} />
        <View style={s.eatenItem}>
          <Text style={[s.eatenVal, { color: colors.textSecondary }]}>{gCal}</Text>
          <Text style={[s.eatenLabel, { color: colors.textTertiary }]}>goal</Text>
        </View>
      </View>

      <View style={[s.macroCard, { backgroundColor: colors.backgroundSecondary }]}>
        <MacroBar label="Protein" current={pro} goal={gPro} color={colors.protein} colors={colors} />
        <MacroBar label="Carbs" current={carb} goal={gCarb} color={colors.carbs} colors={colors} />
        <MacroBar label="Fat" current={fat} goal={gFat} color={colors.fat} colors={colors} />
      </View>

      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/(tabs)/scan");
        }}
        style={({ pressed }) => [s.logFoodBtn, { backgroundColor: colors.tint, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={s.logFoodText}>Log Food</Text>
      </Pressable>

      <View style={s.mealsBlock}>
        <View style={s.mealsHead}>
          <Text style={[s.mealsTitle, { color: colors.text }]}>Recent Meals</Text>
          {meals.length > 0 && (
            <Pressable onPress={() => router.push("/(tabs)/log")} hitSlop={12}>
              <Text style={[s.seeAll, { color: colors.tint }]}>See all</Text>
            </Pressable>
          )}
        </View>
        {isLoading ? (
          <Text style={[s.emptyText, { color: colors.textTertiary }]}>Loading...</Text>
        ) : meals.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="restaurant-outline" size={28} color={colors.textTertiary} />
            <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>No meals yet</Text>
            <Text style={[s.emptyText, { color: colors.textTertiary }]}>Tap Log Food to get started</Text>
          </View>
        ) : (
          <View>{meals.slice(0, 5).map((meal) => <MealCard key={meal.id} meal={meal} />)}</View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, marginBottom: 4 },
  greeting: { fontSize: 14, fontFamily: "Inter_500Medium" },
  dateText: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3, marginTop: 1 },
  profileCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  ringSection: { alignItems: "center", paddingVertical: 12 },

  eatenRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 28, marginBottom: 20 },
  eatenItem: { alignItems: "center" },
  eatenVal: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  eatenLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  eatenDivider: { width: 1, height: 28 },

  macroCard: { marginHorizontal: 24, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 10, marginBottom: 20 },

  logFoodBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginHorizontal: 24, borderRadius: 14, paddingVertical: 16, marginBottom: 28 },
  logFoodText: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#fff" },

  mealsBlock: { paddingHorizontal: 24, gap: 12 },
  mealsHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mealsTitle: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  seeAll: { fontSize: 14, fontFamily: "Inter_500Medium" },
  emptyCard: { padding: 36, borderRadius: 16, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
});
