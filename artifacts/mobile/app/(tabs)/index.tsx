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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
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
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / (goal || 1), 1);
  const strokeDashoffset = circumference * (1 - progress);
  const remaining = Math.max(goal - consumed, 0);
  const isOver = consumed > goal;

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }], position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isOver ? colors.fat : colors.tint}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 36, color: colors.text }}>
          {Math.round(remaining)}
        </Text>
        <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: colors.textSecondary }}>
          {isOver ? "over goal" : "remaining"}
        </Text>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.textTertiary, marginTop: 2 }}>
          {Math.round(consumed)} / {goal} kcal
        </Text>
      </View>
    </View>
  );
}

function MacroBar({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const { colors } = useTheme();
  const progress = Math.min(value / (goal || 1), 1);

  return (
    <View style={{ flex: 1, gap: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: colors.textSecondary }}>
          {label}
        </Text>
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: color }}>
          {Math.round(value)}g
        </Text>
      </View>
      <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
        <View
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            backgroundColor: color,
            borderRadius: 3,
          }}
        />
      </View>
      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 10, color: colors.textTertiary }}>
        / {goal}g
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split("T")[0];
  const { data: summary, isLoading, refetch } = useGetDailySummary({ date: today });

  const scanScale = useSharedValue(1);
  const barcodeScale = useSharedValue(1);

  const scanAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scanScale.value }],
  }));
  const barcodeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: barcodeScale.value }],
  }));

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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {dateLabel}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>Today's Calories</Text>
        </View>
        <Pressable
          onPress={() => router.push("/(tabs)/goals")}
          style={[styles.profileBtn, { backgroundColor: colors.backgroundTertiary }]}
        >
          <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Calorie Ring */}
      <View style={[styles.ringCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CalorieRing consumed={totalCalories} goal={goalCalories} size={200} />

        {/* Macro bars */}
        <View style={styles.macroBars}>
          <MacroBar label="Protein" value={totalProtein} goal={goalProtein} color={colors.protein} />
          <MacroBar label="Carbs" value={totalCarbs} goal={goalCarbs} color={colors.carbs} />
          <MacroBar label="Fat" value={totalFat} goal={goalFat} color={colors.fat} />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Animated.View style={[{ flex: 1 }, scanAnimStyle]}>
          <Pressable
            onPress={handleScanMeal}
            onPressIn={() => { scanScale.value = withSpring(0.96); }}
            onPressOut={() => { scanScale.value = withSpring(1); }}
            style={[styles.actionBtn, styles.primaryBtn, { backgroundColor: colors.tint }]}
          >
            <Ionicons name="camera" size={22} color="#fff" />
            <Text style={styles.actionBtnText}>Scan Meal</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={[{ flex: 1 }, barcodeAnimStyle]}>
          <Pressable
            onPress={handleScanBarcode}
            onPressIn={() => { barcodeScale.value = withSpring(0.96); }}
            onPressOut={() => { barcodeScale.value = withSpring(1); }}
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <Ionicons name="barcode-outline" size={22} color={colors.text} />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Scan Barcode</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Today's Meals */}
      <View style={styles.mealsSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Meals</Text>
          <Pressable onPress={() => router.push("/(tabs)/log")}>
            <Text style={[styles.seeAll, { color: colors.tint }]}>See all</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Loading...</Text>
          </View>
        ) : meals.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="restaurant-outline" size={32} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No meals yet</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Tap Scan Meal to log your first meal
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
  container: {
    flex: 1,
  },
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
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 24,
    marginBottom: 16,
  },
  macroBars: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
  },
  primaryBtn: {},
  actionBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  mealsSection: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  mealList: {
    gap: 2,
  },
  emptyState: {
    marginHorizontal: 16,
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
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
