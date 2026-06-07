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
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
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
  const sw = 14;
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

function MacroBar({ value, goal, color, label, icon }: { value: number; goal: number; color: string; label: string; icon: string }) {
  const pct = Math.min(value / (goal || 1), 1);
  const left = Math.max(goal - value, 0);
  return (
    <View style={s.macroCard}>
      <View style={s.macroHeader}>
        <Text style={s.macroIcon}>{icon}</Text>
        <Text style={s.macroLabel}>{label}</Text>
      </View>
      <Text style={s.macroVal}>{Math.round(left)}<Text style={s.macroUnit}>g left</Text></Text>
      <View style={s.macroBarBg}>
        <View style={[s.macroBarFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.macroSub}>{Math.round(value)} / {goal}g</Text>
    </View>
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
            <Text style={s.greeting}>Hello,</Text>
            <Text style={[s.userName, { color: colors.text }]}>{firstName}</Text>
          </View>
          <Pressable onPress={() => router.push("/(tabs)/goals")} hitSlop={12} style={s.profileBtn}>
            <View style={[s.avatarCircle, { backgroundColor: colors.tint + "12" }]}>
              <Text style={[s.avatarInitial, { color: colors.tint }]}>
                {(user?.name?.[0] || "U").toUpperCase()}
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={s.dateChip}>
          <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
          <Text style={s.dateText}>
            {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </Text>
        </View>

        <View style={s.calCard}>
          <View style={s.calTop}>
            <View style={s.calLeft}>
              <Text style={s.calLabel}>Calories remaining</Text>
              <Text style={s.calNum}>{Math.round(remaining)}</Text>
              <View style={s.calMeta}>
                <View style={s.calMetaItem}>
                  <View style={[s.calMetaDot, { backgroundColor: "#34C759" }]} />
                  <Text style={s.calMetaText}>{Math.round(cal)} eaten</Text>
                </View>
                <View style={s.calMetaItem}>
                  <View style={[s.calMetaDot, { backgroundColor: "#E0E0E0" }]} />
                  <Text style={s.calMetaText}>{gCal} goal</Text>
                </View>
              </View>
            </View>
            <View style={s.calRight}>
              <View style={s.calRingWrap}>
                <CalRing eaten={cal} goal={gCal} size={120} />
                <View style={s.calRingCenter}>
                  <Ionicons name="flame" size={28} color="#FF6B35" />
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={s.macroRow}>
          <MacroBar value={pro} goal={gPro} color={colors.protein} label="Protein" icon="🥩" />
          <MacroBar value={carb} goal={gCarb} color={colors.carbs} label="Carbs" icon="🍞" />
          <MacroBar value={fat} goal={gFat} color={colors.fat} label="Fat" icon="🥑" />
        </View>

        <View style={s.intakeSection}>
          <View style={s.intakeHeader}>
            <Text style={[s.intakeTitle, { color: colors.text }]}>Today's meals</Text>
            {meals.length > 0 && (
              <Pressable onPress={() => router.push("/(tabs)/log")} hitSlop={8}>
                <Text style={s.seeAllText}>See all</Text>
              </Pressable>
            )}
          </View>
          {isLoading ? (
            <View style={s.emptyCard}>
              <Text style={s.emptySubtitle}>Loading...</Text>
            </View>
          ) : meals.length === 0 ? (
            <View style={s.emptyCard}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="restaurant-outline" size={24} color="#FF6B35" />
              </View>
              <Text style={s.emptyTitle}>No meals logged yet</Text>
              <Text style={s.emptySubtitle}>Tap + to scan or log your first meal</Text>
            </View>
          ) : (
            <View style={s.mealsList}>
              {meals.slice(0, 5).map((meal) => <MealCard key={meal.id} meal={meal} />)}
            </View>
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/(tabs)/scan");
        }}
        style={({ pressed }) => [
          s.fab,
          {
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.92 : 1 }],
            bottom: bottomPad + 80,
          },
        ]}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 24, marginBottom: 4 },
  greeting: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#AEAEB2", marginBottom: 2 },
  userName: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.8 },
  profileBtn: {},
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 18, fontFamily: "Inter_700Bold" },

  dateChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 24, marginBottom: 20 },
  dateText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#AEAEB2" },

  calCard: {
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 24,
    marginBottom: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  calTop: { flexDirection: "row", alignItems: "center" },
  calLeft: { flex: 1 },
  calLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#AEAEB2", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  calNum: { fontSize: 52, fontFamily: "Inter_700Bold", letterSpacing: -2.5, lineHeight: 56, color: "#000" },
  calMeta: { flexDirection: "row", gap: 16, marginTop: 12 },
  calMetaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  calMetaDot: { width: 8, height: 8, borderRadius: 4 },
  calMetaText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#AEAEB2" },
  calRight: { marginLeft: 8 },
  calRingWrap: { width: 120, height: 120, alignItems: "center", justifyContent: "center" },
  calRingCenter: { position: "absolute", alignItems: "center", justifyContent: "center" },

  macroRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 28 },
  macroCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  macroHeader: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  macroIcon: { fontSize: 14 },
  macroLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#AEAEB2", textTransform: "uppercase", letterSpacing: 0.3 },
  macroVal: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5, color: "#000", marginBottom: 2 },
  macroUnit: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#AEAEB2" },
  macroBarBg: { height: 5, borderRadius: 3, backgroundColor: "#F0F0F0", marginTop: 8, overflow: "hidden" },
  macroBarFill: { height: 5, borderRadius: 3 },
  macroSub: { fontSize: 10, fontFamily: "Inter_500Medium", color: "#C7C7CC", marginTop: 4 },

  intakeSection: { paddingHorizontal: 20 },
  intakeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  intakeTitle: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  seeAllText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FF6B35" },
  mealsList: { gap: 8 },

  emptyCard: {
    alignItems: "center",
    borderRadius: 24,
    padding: 40,
    gap: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: "rgba(255,107,53,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#000" },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#AEAEB2", textAlign: "center" },

  fab: {
    position: "absolute",
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B35",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
});
