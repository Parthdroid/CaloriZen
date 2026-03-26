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
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { useQueryClient } from "@tanstack/react-query";

import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { MealCard } from "@/components/MealCard";
import {
  useGetDailySummary,
  getGetDailySummaryQueryKey,
  getListMealsQueryKey,
} from "@workspace/api-client-react";

function CalRing({ eaten, goal, size }: { eaten: number; goal: number; size: number }) {
  const sw = 12;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(eaten / (goal || 1), 1);
  const isOver = eaten > goal;
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Defs>
        <LinearGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={isOver ? "#FF3B30" : "#34C759"} />
          <Stop offset="1" stopColor={isOver ? "#FF6B6B" : "#30D158"} />
        </LinearGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="#F0F0F0" strokeWidth={sw} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="url(#calGrad)" strokeWidth={sw} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
    </Svg>
  );
}

function MacroArc({ value, goal, size, color, gradEnd }: { value: number; goal: number; size: number; color: string; gradEnd: string }) {
  const sw = 7;
  const r = (size - sw) / 2;
  const startAngle = 135;
  const sweepAngle = 270;
  const pct = Math.min(value / (goal || 1), 1);
  const id = `macro_${color.replace("#", "")}`;

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
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={color} />
          <Stop offset="1" stopColor={gradEnd} />
        </LinearGradient>
      </Defs>
      <Path d={arcPath(startAngle, endAngle)} stroke="#F0F0F0" strokeWidth={sw} fill="none" strokeLinecap="round" />
      {pct > 0.01 && <Path d={arcPath(startAngle, filledEnd)} stroke={`url(#${id})`} strokeWidth={sw} fill="none" strokeLinecap="round" />}
    </Svg>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
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
  const proLeft = Math.max(gPro - pro, 0);
  const carbLeft = Math.max(gCarb - carb, 0);
  const fatLeft = Math.max(gFat - fat, 0);

  const firstName = user?.name?.split(" ")[0] || "there";

  const handleRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: getGetDailySummaryQueryKey() });
    qc.invalidateQueries({ queryKey: getListMealsQueryKey() });
    refetch();
  }, [qc, refetch]);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.textTertiary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <View>
            <Text style={[s.userName, { color: colors.text }]}>{firstName}</Text>
            <Text style={[s.dateText, { color: colors.textTertiary }]}>
              {new Date().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
            </Text>
          </View>
          <View style={s.headerRight}>
            <Pressable onPress={() => router.push("/(tabs)/goals")} hitSlop={8} style={s.profileBtn}>
              {user?.avatarUrl ? (
                <View style={[s.avatarCircle, { backgroundColor: colors.tint + "15" }]}>
                  <Ionicons name="person" size={16} color={colors.tint} />
                </View>
              ) : (
                <View style={[s.avatarCircle, { backgroundColor: colors.tint + "15" }]}>
                  <Text style={[s.avatarInitial, { color: colors.tint }]}>
                    {(user?.name?.[0] || "U").toUpperCase()}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <View style={[s.calCard, s.cardShadow]}>
          <View style={s.calLeft}>
            <Text style={s.calNum}>{Math.round(remaining)}</Text>
            <Text style={s.calLabel}>Calories left</Text>
            <View style={s.calMeta}>
              <View style={s.calMetaItem}>
                <View style={[s.calMetaDot, { backgroundColor: "#34C759" }]} />
                <Text style={s.calMetaText}>Eaten {Math.round(cal)}</Text>
              </View>
              <View style={s.calMetaItem}>
                <View style={[s.calMetaDot, { backgroundColor: "#E0E0E0" }]} />
                <Text style={s.calMetaText}>Goal {gCal}</Text>
              </View>
            </View>
          </View>
          <View style={s.calRight}>
            <View style={s.calRingWrap}>
              <CalRing eaten={cal} goal={gCal} size={110} />
              <View style={s.calRingCenter}>
                <Ionicons name="flame" size={30} color="#FF6B35" />
              </View>
            </View>
          </View>
        </View>

        <View style={s.macroRow}>
          {([
            { label: "Protein left", left: proLeft, unit: "g", val: pro, goal: gPro, color: "#FF6B6B", gradEnd: "#FF8E8E", icon: "💪" },
            { label: "Carbs Left", left: carbLeft, unit: "g", val: carb, goal: gCarb, color: "#FFB347", gradEnd: "#FFD280", icon: "🌾" },
            { label: "Fat Left", left: fatLeft, unit: "g", val: fat, goal: gFat, color: "#34C759", gradEnd: "#5AD87A", icon: "🥑" },
          ]).map((m) => (
            <View key={m.label} style={[s.macroCard, s.cardShadow]}>
              <Text style={s.macroVal}>{Math.round(m.left)}<Text style={s.macroUnit}>{m.unit}</Text></Text>
              <Text style={s.macroLabel}>{m.label}</Text>
              <View style={s.macroArcWrap}>
                <MacroArc value={m.val} goal={m.goal} size={50} color={m.color} gradEnd={m.gradEnd} />
                <Text style={s.macroEmoji}>{m.icon}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.intakeSection}>
          <Text style={[s.intakeTitle, { color: colors.text }]}>Food intake</Text>
          {isLoading ? (
            <View style={[s.emptyCard, s.cardShadow]}>
              <Text style={s.emptySubtitle}>Loading...</Text>
            </View>
          ) : meals.length === 0 ? (
            <View style={[s.emptyCard, s.cardShadow]}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="restaurant-outline" size={22} color="#FF6B35" />
              </View>
              <View style={s.emptyTextCol}>
                <Text style={s.emptyTitle}>No meals yet</Text>
                <Text style={s.emptySubtitle}>Scan or log your first meal</Text>
              </View>
            </View>
          ) : (
            <View style={s.mealsList}>
              {meals.slice(0, 5).map((meal) => <MealCard key={meal.id} meal={meal} />)}
              {meals.length > 5 && (
                <Pressable onPress={() => router.push("/(tabs)/log")} style={s.seeAllBtn}>
                  <Text style={s.seeAllText}>See all meals</Text>
                  <Ionicons name="chevron-forward" size={14} color="#FF6B35" />
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/(tabs)/scan");
        }}
        style={({ pressed }) => [s.fab, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.93 : 1 }], bottom: bottomPad + 80 }]}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, marginBottom: 20 },
  userName: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.8 },
  dateText: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  profileBtn: {},
  avatarCircle: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 17, fontFamily: "Inter_700Bold" },

  cardShadow: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  calCard: { marginHorizontal: 20, borderRadius: 24, padding: 24, flexDirection: "row", alignItems: "center", marginBottom: 14 },
  calLeft: { flex: 1 },
  calNum: { fontSize: 48, fontFamily: "Inter_700Bold", letterSpacing: -2, lineHeight: 52, color: "#000" },
  calLabel: { fontSize: 15, fontFamily: "Inter_500Medium", marginTop: 2, color: "#6C6C70" },
  calMeta: { flexDirection: "row", gap: 16, marginTop: 14 },
  calMetaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  calMetaDot: { width: 7, height: 7, borderRadius: 3.5 },
  calMetaText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#AEAEB2" },
  calRight: { marginLeft: 12 },
  calRingWrap: { width: 110, height: 110, alignItems: "center", justifyContent: "center" },
  calRingCenter: { position: "absolute", alignItems: "center", justifyContent: "center" },

  macroRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 24 },
  macroCard: { flex: 1, borderRadius: 20, padding: 14, paddingBottom: 8 },
  macroVal: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5, color: "#000" },
  macroUnit: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#000" },
  macroLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 2, color: "#AEAEB2" },
  macroArcWrap: { width: 50, height: 50, alignSelf: "flex-end", marginTop: 6, alignItems: "center", justifyContent: "center" },
  macroEmoji: { position: "absolute", fontSize: 16, top: 12 },

  intakeSection: { paddingHorizontal: 20, gap: 12 },
  intakeTitle: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  mealsList: { gap: 0 },

  emptyCard: { flexDirection: "row", alignItems: "center", borderRadius: 20, padding: 20, gap: 14 },
  emptyIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(255,107,53,0.08)", alignItems: "center", justifyContent: "center" },
  emptyTextCol: { flex: 1 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#000" },
  emptySubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#AEAEB2" },

  seeAllBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 14 },
  seeAllText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FF6B35" },

  fab: { position: "absolute", right: 24, width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", backgroundColor: "#1A1A1A" },
});
