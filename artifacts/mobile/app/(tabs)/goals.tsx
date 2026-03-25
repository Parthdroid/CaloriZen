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
  const { colors } = useTheme();
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

  const topPad = Platform.OS === "web" ? 56 : insets.top;
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
      { data: { dailyCalories: calories, dailyProtein: protein, dailyCarbs: carbs, dailyFat: fat } },
      {
        onSuccess: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          queryClient.invalidateQueries({ queryKey: ["getGoals"] });
          queryClient.invalidateQueries({ queryKey: ["getDailySummary"] });
          setEditing(false);
        },
        onError: () => Alert.alert("Error", "Failed to update goals. Please try again."),
      }
    );
  };

  const goalFields: Array<{ key: keyof GoalInput; label: string; unit: string; color: string; icon: string }> = [
    { key: "dailyCalories", label: "Calories", unit: "kcal", color: colors.tint, icon: "flame" },
    { key: "dailyProtein", label: "Protein", unit: "g", color: colors.protein, icon: "fitness" },
    { key: "dailyCarbs", label: "Carbs", unit: "g", color: colors.carbs, icon: "nutrition" },
    { key: "dailyFat", label: "Fat", unit: "g", color: colors.fat, icon: "water" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: bottomPad + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Goals</Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>Daily nutrition targets</Text>
        </View>
        {!editing ? (
          <Pressable onPress={() => setEditing(true)} style={[styles.editBtn, { backgroundColor: colors.tint + "12" }]}>
            <Ionicons name="pencil-outline" size={14} color={colors.tint} />
            <Text style={[styles.editBtnText, { color: colors.tint }]}>Edit</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setEditing(false)} style={[styles.editBtn, { backgroundColor: colors.backgroundTertiary }]}>
            <Ionicons name="close" size={14} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <View style={styles.goalsList}>
        {goalFields.map(({ key, label, unit, color, icon }) => (
          <View key={key} style={[styles.goalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.goalIconWrap, { backgroundColor: color + "12" }]}>
              <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={color} />
            </View>
            <View style={styles.goalInfo}>
              <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>{label}</Text>
              {editing ? (
                <View style={styles.inputRow}>
                  <TextInput
                    value={inputs[key]}
                    onChangeText={(v) => setInputs((p) => ({ ...p, [key]: v }))}
                    keyboardType="numeric"
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundTertiary }]}
                    selectTextOnFocus
                  />
                  <Text style={[styles.unit, { color: colors.textTertiary }]}>{unit}</Text>
                </View>
              ) : (
                <View style={styles.valueRow}>
                  <Text style={[styles.goalValue, { color }]}>{isLoading ? "..." : inputs[key]}</Text>
                  <Text style={[styles.unit, { color: colors.textTertiary }]}>{unit}</Text>
                </View>
              )}
            </View>
            {!editing && (
              <View style={[styles.goalBadge, { backgroundColor: color + "10" }]}>
                <Ionicons name="checkmark-circle" size={16} color={color} />
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
            { backgroundColor: colors.tint, opacity: pressed || isPending ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
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

      <View style={[styles.infoCard, { backgroundColor: colors.backgroundTertiary }]}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
        <Text style={[styles.infoText, { color: colors.textTertiary }]}>
          Consult a healthcare professional for personalized nutrition advice.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 24, marginBottom: 24 },
  title: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.8 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 2 },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  editBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  goalsList: { paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  goalCard: { flexDirection: "row", alignItems: "center", borderRadius: 20, padding: 18, gap: 14 },
  goalIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  goalInfo: { flex: 1, gap: 4 },
  goalLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  valueRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  goalValue: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  goalBadge: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  input: { flex: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, fontFamily: "Inter_600SemiBold" },
  unit: { fontSize: 14, fontFamily: "Inter_400Regular" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 20, paddingVertical: 16, borderRadius: 16, marginBottom: 20 },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  infoCard: { flexDirection: "row", gap: 10, marginHorizontal: 20, padding: 16, borderRadius: 16, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
});
