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
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/hooks/useTheme";
import { MealCard } from "@/components/MealCard";
import {
  useGetDailySummary,
  getGetDailySummaryQueryKey,
  getListMealsQueryKey,
} from "@workspace/api-client-react";

function CalorieRing({ consumed, goal, size }: { consumed: number; goal: number; size: number }) {
  const { colors } = useTheme();
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / (goal || 1), 1);
  const strokeDashoffset = circumference * (1 - progress);
  const remaining = Math.max(goal - consumed, 0);
  const isOver = consumed > goal;

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Defs>
          <LinearGradient id="calRing" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FF6B35" />
            <Stop offset="1" stopColor="#FF8A5C" />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.backgroundTertiary} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={isOver ? colors.fat : "url(#calRing)"} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 44, color: colors.text, letterSpacing: -2 }}>
          {Math.round(remaining)}
        </Text>
        <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: colors.textTertiary, marginTop: -2, textTransform: "uppercase", letterSpacing: 1 }}>
          {isOver ? "over" : "remaining"}
        </Text>
      </View>
    </View>
  );
}

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const { colors } = useTheme();
  const progress = Math.min(value / (goal || 1), 1);

  return (
    <View style={styles.macroBarItem}>
      <View style={styles.macroBarTop}>
        <Text style={[styles.macroBarLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.macroBarValue, { color }]}>{Math.round(value)}<Text style={[styles.macroBarGoal, { color: colors.textTertiary }]}>/{goal}g</Text></Text>
      </View>
      <View style={[styles.macroBarTrack, { backgroundColor: colors.backgroundTertiary }]}>
        <View style={[styles.macroBarFill, { backgroundColor: color, width: `${progress * 100}%` }]} />
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

  const topPad = Platform.OS === "web" ? 56 : insets.top;
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

  const dateLabel = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: bottomPad + 100 }}
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
        <Pressable onPress={() => router.push("/(tabs)/goals")} style={[styles.profileBtn, { backgroundColor: colors.backgroundTertiary }]}>
          <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={[styles.dashCard, { backgroundColor: colors.card }]}>
        <CalorieRing consumed={totalCalories} goal={goalCalories} size={170} />
        <View style={styles.consumedRow}>
          <View style={[styles.consumedChip, { backgroundColor: colors.tint + "12" }]}>
            <Ionicons name="flame" size={12} color={colors.tint} />
            <Text style={[styles.consumedText, { color: colors.tint }]}>{Math.round(totalCalories)} eaten</Text>
          </View>
          <View style={[styles.consumedChip, { backgroundColor: colors.backgroundTertiary }]}>
            <Ionicons name="flag" size={12} color={colors.textTertiary} />
            <Text style={[styles.consumedText, { color: colors.textTertiary }]}>{goalCalories} goal</Text>
          </View>
        </View>
        <View style={styles.macroBars}>
          <MacroBar label="Protein" value={totalProtein} goal={goalProtein} color={colors.protein} />
          <MacroBar label="Carbs" value={totalCarbs} goal={goalCarbs} color={colors.carbs} />
          <MacroBar label="Fat" value={totalFat} goal={goalFat} color={colors.fat} />
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={handleScanMeal}
          style={({ pressed }) => [styles.actionBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
        >
          <ExpoLinearGradient colors={["#FF6B35", "#FF8A5C"]} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.actionBtnTextWhite}>Scan Meal</Text>
          </ExpoLinearGradient>
        </Pressable>
        <Pressable
          onPress={handleScanBarcode}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionBtnOutline,
            { borderColor: colors.backgroundTertiary, transform: [{ scale: pressed ? 0.97 : 1 }] },
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
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Scan your first meal to start tracking</Text>
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 24, marginBottom: 24 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.8 },
  profileBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  dashCard: { marginHorizontal: 20, borderRadius: 28, paddingVertical: 32, paddingHorizontal: 24, alignItems: "center", gap: 20, marginBottom: 20 },
  consumedRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: -4 },
  consumedChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  consumedText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  macroBars: { width: "100%", gap: 14 },
  macroBarItem: { gap: 6 },
  macroBarTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  macroBarLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  macroBarValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  macroBarGoal: { fontSize: 12, fontFamily: "Inter_400Regular" },
  macroBarTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  macroBarFill: { height: "100%", borderRadius: 3 },
  actions: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 28 },
  actionBtn: { flex: 1, borderRadius: 16, overflow: "hidden" },
  actionGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  actionBtnOutline: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderWidth: 1.5 },
  actionBtnTextWhite: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
  actionBtnTextDark: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  mealsSection: { gap: 10 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24 },
  sectionTitle: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  seeAll: { fontSize: 14, fontFamily: "Inter_500Medium" },
  mealList: { gap: 0 },
  emptyState: { marginHorizontal: 20, padding: 40, borderRadius: 20, alignItems: "center", gap: 10 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
});
