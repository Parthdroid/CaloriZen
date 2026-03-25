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

function Ring({ value, max, size, sw, color, track }: { value: number; max: number; size: number; sw: number; color: string; track: string }) {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(value / (max || 1), 1);
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={sw} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={sw} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - p)} strokeLinecap="round" />
    </Svg>
  );
}

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
  const remaining = Math.max(gCal - cal, 0);
  const isOver = cal > gCal;

  const handleRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: getGetDailySummaryQueryKey() });
    qc.invalidateQueries({ queryKey: getListMealsQueryKey() });
    refetch();
  }, [qc, refetch]);

  const macros = [
    { label: "Protein", val: pro, goal: gPro, color: colors.protein, unit: "g" },
    { label: "Carbs", val: carb, goal: gCarb, color: colors.carbs, unit: "g" },
    { label: "Fat", val: fat, goal: gFat, color: colors.fat, unit: "g" },
  ];

  return (
    <ScrollView
      style={[s.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 100 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.textTertiary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <Text style={[s.title, { color: colors.text }]}>Today</Text>
        <Pressable onPress={() => router.push("/(tabs)/goals")} hitSlop={8} accessibilityLabel="Goals">
          <View style={[s.profileCircle, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="person" size={16} color={colors.textTertiary} />
          </View>
        </Pressable>
      </View>

      <View style={s.ringSection}>
        <View style={s.ringWrap}>
          <Ring value={cal} max={gCal} size={180} sw={14} color={isOver ? colors.fat : colors.tint} track={colors.backgroundSecondary} />
          <View style={s.ringInner}>
            <Text style={[s.ringNum, { color: colors.text }]}>{Math.round(remaining)}</Text>
            <Text style={[s.ringLabel, { color: colors.textSecondary }]}>kcal left</Text>
          </View>
        </View>
      </View>

      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={[s.statNum, { color: colors.text }]}>{Math.round(cal)}</Text>
          <Text style={[s.statLabel, { color: colors.textTertiary }]}>Consumed</Text>
        </View>
        <View style={[s.statDivider, { backgroundColor: colors.backgroundSecondary }]} />
        <View style={s.statItem}>
          <Text style={[s.statNum, { color: colors.text }]}>{gCal}</Text>
          <Text style={[s.statLabel, { color: colors.textTertiary }]}>Target</Text>
        </View>
      </View>

      <View style={s.macroRow}>
        {macros.map((m) => {
          const pct = Math.min(m.val / (m.goal || 1), 1);
          return (
            <View key={m.label} style={s.macroItem}>
              <View style={s.macroRingWrap}>
                <Ring value={m.val} max={m.goal} size={48} sw={5} color={m.color} track={colors.backgroundSecondary} />
                <Text style={[s.macroPct, { color: m.color }]}>{Math.round(pct * 100)}</Text>
              </View>
              <Text style={[s.macroValue, { color: colors.text }]}>{Math.round(m.val)}<Text style={{ color: colors.textTertiary }}>{m.unit}</Text></Text>
              <Text style={[s.macroLabel, { color: colors.textSecondary }]}>{m.label}</Text>
            </View>
          );
        })}
      </View>

      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/(tabs)/scan");
        }}
        style={({ pressed }) => [s.scanBtn, { backgroundColor: colors.text, opacity: pressed ? 0.8 : 1 }]}
      >
        <Ionicons name="scan-outline" size={20} color={colors.background} />
        <Text style={[s.scanBtnText, { color: colors.background }]}>Scan</Text>
      </Pressable>

      <View style={s.mealsBlock}>
        <View style={s.mealsHead}>
          <Text style={[s.mealsTitle, { color: colors.text }]}>Recent</Text>
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
            <Ionicons name="restaurant-outline" size={24} color={colors.textTertiary} />
            <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>No meals logged</Text>
            <Text style={[s.emptyText, { color: colors.textTertiary }]}>Tap Scan to add your first meal</Text>
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, marginBottom: 8 },
  title: { fontSize: 34, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  profileCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  ringSection: { alignItems: "center", paddingVertical: 16 },
  ringWrap: { width: 180, height: 180, alignItems: "center", justifyContent: "center" },
  ringInner: { position: "absolute", alignItems: "center" },
  ringNum: { fontSize: 40, fontFamily: "Inter_700Bold", letterSpacing: -2 },
  ringLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: -2 },

  statsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 32, marginBottom: 24 },
  statItem: { alignItems: "center" },
  statNum: { fontSize: 20, fontFamily: "Inter_600SemiBold", letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  statDivider: { width: 1, height: 32 },

  macroRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, marginBottom: 24 },
  macroItem: { alignItems: "center", gap: 4 },
  macroRingWrap: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  macroPct: { position: "absolute", fontSize: 11, fontFamily: "Inter_700Bold" },
  macroValue: { fontSize: 15, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
  macroLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },

  scanBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 24, borderRadius: 14, paddingVertical: 16, marginBottom: 32 },
  scanBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },

  mealsBlock: { paddingHorizontal: 24, gap: 12 },
  mealsHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mealsTitle: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  seeAll: { fontSize: 14, fontFamily: "Inter_500Medium" },
  emptyCard: { padding: 32, borderRadius: 16, alignItems: "center", gap: 6 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
});
