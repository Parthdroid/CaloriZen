import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { useGetGoals, useUpdateGoals } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type GoalInput = {
  dailyCalories: string;
  dailyProtein: string;
  dailyCarbs: string;
  dailyFat: string;
};

export default function GoalsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useGetGoals();
  const { mutate: updateGoals, isPending } = useUpdateGoals();

  const [editing, setEditing] = useState(false);
  const [inputs, setInputs] = useState<GoalInput>({
    dailyCalories: "2000",
    dailyProtein: "150",
    dailyCarbs: "200",
    dailyFat: "65",
  });

  useEffect(() => {
    if (goals) {
      setInputs({
        dailyCalories: String(goals.dailyCalories),
        dailyProtein: String(goals.dailyProtein),
        dailyCarbs: String(goals.dailyCarbs),
        dailyFat: String(goals.dailyFat),
      });
    }
  }, [goals]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const handleSave = () => {
    const calories = parseInt(inputs.dailyCalories);
    const protein = parseInt(inputs.dailyProtein);
    const carbs = parseInt(inputs.dailyCarbs);
    const fat = parseInt(inputs.dailyFat);

    if (isNaN(calories) || isNaN(protein) || isNaN(carbs) || isNaN(fat)) {
      Alert.alert("Invalid Input", "Please enter valid numbers for all goals.");
      return;
    }

    updateGoals(
      {
        data: {
          dailyCalories: calories,
          dailyProtein: protein,
          dailyCarbs: carbs,
          dailyFat: fat,
        },
      },
      {
        onSuccess: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          queryClient.invalidateQueries({ queryKey: ["getGoals"] });
          queryClient.invalidateQueries({ queryKey: ["getDailySummary"] });
          setEditing(false);
        },
        onError: () => {
          Alert.alert("Error", "Failed to update goals. Please try again.");
        },
      }
    );
  };

  const goalFields: Array<{
    key: keyof GoalInput;
    label: string;
    unit: string;
    color: string;
    icon: string;
  }> = [
    { key: "dailyCalories", label: "Daily Calories", unit: "kcal", color: colors.tint, icon: "flame-outline" },
    { key: "dailyProtein", label: "Daily Protein", unit: "g", color: colors.protein, icon: "barbell-outline" },
    { key: "dailyCarbs", label: "Daily Carbs", unit: "g", color: colors.carbs, icon: "leaf-outline" },
    { key: "dailyFat", label: "Daily Fat", unit: "g", color: colors.fat, icon: "water-outline" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 12,
        paddingBottom: bottomPad + 100,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Nutrition Goals</Text>
        {!editing ? (
          <Pressable
            onPress={() => setEditing(true)}
            style={[styles.editBtn, { backgroundColor: colors.tint + "18" }]}
          >
            <Ionicons name="pencil" size={16} color={colors.tint} />
            <Text style={[styles.editBtnText, { color: colors.tint }]}>Edit</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => setEditing(false)}
            style={[styles.editBtn, { backgroundColor: colors.backgroundTertiary }]}
          >
            <Ionicons name="close" size={16} color={colors.textSecondary} />
            <Text style={[styles.editBtnText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        )}
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Set your daily nutrition targets to track your progress
      </Text>

      <View style={styles.goalsGrid}>
        {goalFields.map(({ key, label, unit, color, icon }) => (
          <View
            key={key}
            style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.goalIcon, { backgroundColor: color + "18" }]}>
              <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={22} color={color} />
            </View>
            <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>{label}</Text>
            {editing ? (
              <View style={styles.inputRow}>
                <TextInput
                  value={inputs[key]}
                  onChangeText={(v) => setInputs((p) => ({ ...p, [key]: v }))}
                  keyboardType="numeric"
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: colors.backgroundTertiary,
                      borderColor: colors.border,
                    },
                  ]}
                  selectTextOnFocus
                />
                <Text style={[styles.unit, { color: colors.textTertiary }]}>{unit}</Text>
              </View>
            ) : (
              <View style={styles.valueRow}>
                <Text style={[styles.goalValue, { color: color }]}>
                  {isLoading ? "..." : inputs[key]}
                </Text>
                <Text style={[styles.unit, { color: colors.textTertiary }]}>{unit}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {editing && (
        <Pressable
          onPress={handleSave}
          disabled={isPending}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: colors.tint,
              opacity: pressed || isPending ? 0.8 : 1,
            },
          ]}
        >
          {isPending ? (
            <Text style={styles.saveBtnText}>Saving...</Text>
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Save Goals</Text>
            </>
          )}
        </Pressable>
      )}

      <View
        style={[
          styles.disclaimer,
          { backgroundColor: colors.backgroundTertiary, borderColor: colors.border },
        ]}
      >
        <Ionicons name="information-circle-outline" size={18} color={colors.textTertiary} />
        <Text style={[styles.disclaimerText, { color: colors.textTertiary }]}>
          These targets are estimates. Consult a healthcare professional for personalized nutrition advice.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  subtitle: {
    paddingHorizontal: 20,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
    lineHeight: 20,
  },
  goalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 20,
  },
  goalCard: {
    width: "47%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  goalLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  goalValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  input: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  unit: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  disclaimer: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
