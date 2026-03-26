import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import type { Meal } from "@workspace/api-client-react";
import { useDeleteMeal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  meal: Meal;
  onPress?: () => void;
};

const MEAL_ICONS: Record<string, string> = {
  breakfast: "sunny-outline",
  lunch: "partly-sunny-outline",
  dinner: "moon-outline",
  snack: "cafe-outline",
};

const MEAL_COLORS: Record<string, string> = {
  breakfast: "#F59E0B",
  lunch: "#22C55E",
  dinner: "#8B5CF6",
  snack: "#3B82F6",
};

export function MealCard({ meal, onPress }: Props) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { mutate: deleteMeal } = useDeleteMeal();

  const time = new Date(meal.loggedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const mealColor = MEAL_COLORS[meal.mealType] ?? colors.tint;
  const itemNames = (meal.items as Array<{ name: string }>).map((i) => i.name).join(", ");

  const handleDelete = () => {
    Alert.alert("Delete Meal", "Are you sure you want to delete this meal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          deleteMeal(
            { id: meal.id },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["listMeals"] });
                queryClient.invalidateQueries({ queryKey: ["getDailySummary"] });
              },
            }
          );
        },
      },
    ]);
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={handleDelete}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: mealColor + "14" }]}>
        <Ionicons
          name={MEAL_ICONS[meal.mealType] as keyof typeof Ionicons.glyphMap ?? "restaurant-outline"}
          size={18}
          color={mealColor}
        />
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.itemNames, { color: colors.text }]} numberOfLines={1}>
            {itemNames}
          </Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>{time}</Text>
        </View>
        <View style={styles.chipRow}>
          <Text style={[styles.calChip, { color: colors.tint }]}>🔥 {Math.round(meal.totalCalories)}</Text>
          <Text style={[styles.macroChip, { color: colors.protein }]}>{Math.round(meal.totalProtein)}g</Text>
          <Text style={[styles.macroChip, { color: colors.carbs }]}>{Math.round(meal.totalCarbs)}g</Text>
          <Text style={[styles.macroChip, { color: colors.fat }]}>{Math.round(meal.totalFat)}g</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    marginHorizontal: 0,
    marginBottom: 8,
    borderRadius: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 5,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemNames: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  chipRow: {
    flexDirection: "row",
    gap: 10,
  },
  calChip: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  macroChip: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
