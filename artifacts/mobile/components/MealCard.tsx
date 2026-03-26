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
import type { Meal } from "@workspace/api-client-react";
import { useDeleteMeal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  meal: Meal;
  onPress?: () => void;
};

const MEAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  breakfast: "sunny",
  lunch: "partly-sunny",
  dinner: "moon",
  snack: "cafe",
};

const MEAL_COLORS: Record<string, string> = {
  breakfast: "#FFB347",
  lunch: "#34C759",
  dinner: "#8B5CF6",
  snack: "#007AFF",
};

export function MealCard({ meal, onPress }: Props) {
  const queryClient = useQueryClient();
  const { mutate: deleteMeal } = useDeleteMeal();

  const time = new Date(meal.loggedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const mealColor = MEAL_COLORS[meal.mealType] ?? "#FF6B35";
  const mealIcon = MEAL_ICONS[meal.mealType] ?? "restaurant";
  const itemNames = (meal.items as Array<{ name: string }>).map((i) => i.name).join(", ");
  const totalWeight = (meal.items as Array<{ servingDescription?: string }>)
    .map((i) => i.servingDescription || "")
    .filter(Boolean)
    .join(", ");

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
        st.card,
        {
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[st.iconWrap, { backgroundColor: mealColor + "14" }]}>
        <Ionicons name={mealIcon} size={20} color={mealColor} />
      </View>

      <View style={st.info}>
        <View style={st.topRow}>
          <Text style={st.itemNames} numberOfLines={1}>{itemNames}</Text>
          <Text style={st.time}>{time}</Text>
        </View>
        {totalWeight ? (
          <Text style={st.servingText} numberOfLines={1}>🔥 {Math.round(meal.totalCalories)} cal</Text>
        ) : (
          <Text style={st.servingText}>🔥 {Math.round(meal.totalCalories)} cal</Text>
        )}
        <View style={st.macroRow}>
          <View style={[st.macroPill, { backgroundColor: "#007AFF10" }]}>
            <Text style={[st.macroText, { color: "#007AFF" }]}>{Math.round(meal.totalProtein)}g</Text>
          </View>
          <View style={[st.macroPill, { backgroundColor: "#FF950010" }]}>
            <Text style={[st.macroText, { color: "#FF9500" }]}>{Math.round(meal.totalCarbs)}g</Text>
          </View>
          <View style={[st.macroPill, { backgroundColor: "#FF3B3010" }]}>
            <Text style={[st.macroText, { color: "#FF3B30" }]}>{Math.round(meal.totalFat)}g</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    marginBottom: 4,
    borderRadius: 18,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemNames: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    marginRight: 10,
    color: "#000",
  },
  time: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#AEAEB2",
  },
  servingText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#6C6C70",
  },
  macroRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  macroPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  macroText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
