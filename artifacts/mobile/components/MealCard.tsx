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

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export function MealCard({ meal, onPress }: Props) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { mutate: deleteMeal } = useDeleteMeal();

  const time = new Date(meal.loggedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

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
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.tint + "18" }]}>
        <Ionicons
          name={MEAL_ICONS[meal.mealType] as keyof typeof Ionicons.glyphMap ?? "restaurant-outline"}
          size={20}
          color={colors.tint}
        />
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.mealType, { color: colors.text }]}>
            {MEAL_LABELS[meal.mealType] ?? meal.mealType}
          </Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>{time}</Text>
        </View>
        <Text style={[styles.items, { color: colors.textSecondary }]} numberOfLines={1}>
          {(meal.items as Array<{ name: string }>).map((i) => i.name).join(", ")}
        </Text>
        <View style={styles.macros}>
          <Text style={[styles.calories, { color: colors.tint }]}>
            {Math.round(meal.totalCalories)} kcal
          </Text>
          <Text style={[styles.macroText, { color: colors.protein }]}>
            P {Math.round(meal.totalProtein)}g
          </Text>
          <Text style={[styles.macroText, { color: colors.carbs }]}>
            C {Math.round(meal.totalCarbs)}g
          </Text>
          <Text style={[styles.macroText, { color: colors.fat }]}>
            F {Math.round(meal.totalFat)}g
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealType: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  time: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  items: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  macros: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  calories: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  macroText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
