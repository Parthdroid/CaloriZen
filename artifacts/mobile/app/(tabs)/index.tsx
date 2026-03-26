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
import Svg, { Circle, Path } from "react-native-svg";
import { useQueryClient } from "@tanstack/react-query";

import { useTheme } from "@/hooks/useTheme";
import { MealCard } from "@/components/MealCard";
import {
  useGetDailySummary,
  getGetDailySummaryQueryKey,
  getListMealsQueryKey,
} from "@workspace/api-client-react";

function CalRing({ eaten, goal, size, color, track }: { eaten: number; goal: number; size: number; color: string; track: string }) {
  const sw = 10;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(eaten / (goal || 1), 1);
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={sw} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={sw} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
    </Svg>
  );
}

function MacroArc({ value, goal, size, color, track }: { value: number; goal: number; size: number; color: string; track: string }) {
  const sw = 6;
  const r = (size - sw) / 2;
  const startAngle = 135;
  const sweepAngle = 270;
  const pct = Math.min(value / (goal || 1), 1);

  const polarToCartesian = (cx: number, cy: number, radius: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const arcPath = (startA: number, endA: number) => {
    const s = polarToCartesian(size / 2, size / 2, r, startA);
    const e = polarToCartesian(size / 2, size / 2, r, endA);
    const large = endA - startA > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const endAngle = startAngle + sweepAngle;
  const filledEnd = startAngle + sweepAngle * pct;

  return (
    <Svg width={size} height={size}>
      <Path d={arcPath(startAngle, endAngle)} stroke={track} strokeWidth={sw} fill="none" strokeLinecap="round" />
      {pct > 0.01 && <Path d={arcPath(startAngle, filledEnd)} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" />}
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
  const proLeft = Math.max(gPro - pro, 0);
  const carbLeft = Math.max(gCarb - carb, 0);
  const fatLeft = Math.max(gFat - fat, 0);

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
          <Text style={[s.brand, { color: colors.tint }]}>NutriSnap</Text>
          <Text style={[s.greeting, { color: colors.textSecondary }]}>
            {new Date().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
          </Text>
        </View>
        <Pressable onPress={() => router.push("/(tabs)/goals")} hitSlop={8}>
          <View style={[s.avatarCircle, { backgroundColor: colors.tint + "18" }]}>
            <Ionicons name="person" size={18} color={colors.tint} />
          </View>
        </Pressable>
      </View>

      <View style={[s.calCard, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={s.calLeft}>
          <Text style={[s.calNum, { color: colors.text }]}>{Math.round(remaining)}</Text>
          <Text style={[s.calLabel, { color: colors.textSecondary }]}>Calories left</Text>
          <View style={s.calMeta}>
            <View style={s.calMetaItem}>
              <View style={[s.calMetaDot, { backgroundColor: colors.tint }]} />
              <Text style={[s.calMetaText, { color: colors.textTertiary }]}>Eaten {Math.round(cal)}</Text>
            </View>
            <View style={s.calMetaItem}>
              <View style={[s.calMetaDot, { backgroundColor: colors.backgroundTertiary }]} />
              <Text style={[s.calMetaText, { color: colors.textTertiary }]}>Goal {gCal}</Text>
            </View>
          </View>
        </View>
        <View style={s.calRight}>
          <View style={s.calRingWrap}>
            <CalRing eaten={cal} goal={gCal} size={100} color={isOver ? colors.fat : colors.tint} track={colors.backgroundTertiary} />
            <Ionicons name="flame" size={28} color={colors.tint} style={s.calRingIcon} />
          </View>
        </View>
      </View>

      <View style={s.macroRow}>
        {([
          { label: "Protein", left: proLeft, unit: "g", val: pro, goal: gPro, color: colors.protein, icon: "barbell-outline" as const },
          { label: "Carbs", left: carbLeft, unit: "g", val: carb, goal: gCarb, color: colors.carbs, icon: "leaf-outline" as const },
          { label: "Fat", left: fatLeft, unit: "g", val: fat, goal: gFat, color: colors.fat, icon: "water-outline" as const },
        ]).map((m) => (
          <View key={m.label} style={[s.macroCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[s.macroVal, { color: colors.text }]}>{Math.round(m.left)}<Text style={s.macroUnit}>{m.unit}</Text></Text>
            <Text style={[s.macroLabel, { color: colors.textTertiary }]}>{m.label} left</Text>
            <View style={s.macroArcWrap}>
              <MacroArc value={m.val} goal={m.goal} size={44} color={m.color} track={colors.backgroundTertiary} />
              <Ionicons name={m.icon} size={14} color={m.color} style={s.macroArcIcon} />
            </View>
          </View>
        ))}
      </View>

      <View style={s.intakeSection}>
        <Text style={[s.intakeTitle, { color: colors.text }]}>Food intake</Text>
        {isLoading ? (
          <Text style={[s.emptyText, { color: colors.textTertiary }]}>Loading...</Text>
        ) : meals.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={[s.emptyIconWrap, { backgroundColor: colors.tint + "12" }]}>
              <Ionicons name="restaurant-outline" size={24} color={colors.tint} />
            </View>
            <View style={s.emptyTextCol}>
              <Text style={[s.emptyTitle, { color: colors.text }]}>No meals yet</Text>
              <Text style={[s.emptyText, { color: colors.textTertiary }]}>Scan or log your first meal</Text>
            </View>
          </View>
        ) : (
          <View style={s.mealsList}>
            {meals.slice(0, 5).map((meal) => <MealCard key={meal.id} meal={meal} />)}
            {meals.length > 5 && (
              <Pressable onPress={() => router.push("/(tabs)/log")} style={s.seeAllBtn}>
                <Text style={[s.seeAllText, { color: colors.tint }]}>See all meals</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.tint} />
              </Pressable>
            )}
          </View>
        )}
      </View>

      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/(tabs)/scan");
        }}
        style={({ pressed }) => [s.fab, { backgroundColor: colors.text, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.95 : 1 }], bottom: bottomPad + 80 }]}
      >
        <Ionicons name="add" size={28} color={colors.background} />
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 16 },
  brand: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 1 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },

  calCard: { marginHorizontal: 20, borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", marginBottom: 12 },
  calLeft: { flex: 1 },
  calNum: { fontSize: 42, fontFamily: "Inter_700Bold", letterSpacing: -2, lineHeight: 46 },
  calLabel: { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 2 },
  calMeta: { flexDirection: "row", gap: 14, marginTop: 10 },
  calMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  calMetaDot: { width: 6, height: 6, borderRadius: 3 },
  calMetaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  calRight: { marginLeft: 8 },
  calRingWrap: { width: 100, height: 100, alignItems: "center", justifyContent: "center" },
  calRingIcon: { position: "absolute" },

  macroRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 20 },
  macroCard: { flex: 1, borderRadius: 16, padding: 14, paddingBottom: 10 },
  macroVal: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  macroUnit: { fontSize: 14, fontFamily: "Inter_500Medium" },
  macroLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  macroArcWrap: { width: 44, height: 44, alignSelf: "flex-end", marginTop: 4, alignItems: "center", justifyContent: "center" },
  macroArcIcon: { position: "absolute", top: 10 },

  intakeSection: { paddingHorizontal: 20, gap: 10 },
  intakeTitle: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  mealsList: { gap: 0 },

  emptyCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 18, gap: 14 },
  emptyIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  emptyTextCol: { flex: 1 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },

  seeAllBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 12 },
  seeAllText: { fontSize: 14, fontFamily: "Inter_500Medium" },

  fab: { position: "absolute", right: 20, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
});
