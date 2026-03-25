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

type GoalInput = { dailyCalories: string; dailyProtein: string; dailyCarbs: string; dailyFat: string };

export default function GoalsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: goals, isLoading } = useGetGoals();
  const { mutate: updateGoals, isPending } = useUpdateGoals();
  const [editing, setEditing] = useState(false);
  const [inputs, setInputs] = useState<GoalInput>({ dailyCalories: "2000", dailyProtein: "150", dailyCarbs: "200", dailyFat: "65" });

  useEffect(() => {
    if (goals) setInputs({ dailyCalories: String(goals.dailyCalories), dailyProtein: String(goals.dailyProtein), dailyCarbs: String(goals.dailyCarbs), dailyFat: String(goals.dailyFat) });
  }, [goals]);

  const topPad = Platform.OS === "web" ? 56 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const handleSave = () => {
    const vals = { dailyCalories: parseInt(inputs.dailyCalories), dailyProtein: parseInt(inputs.dailyProtein), dailyCarbs: parseInt(inputs.dailyCarbs), dailyFat: parseInt(inputs.dailyFat) };
    if (Object.values(vals).some(isNaN)) { Alert.alert("Invalid Input", "Please enter valid numbers."); return; }
    updateGoals({ data: vals }, {
      onSuccess: async () => { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); qc.invalidateQueries({ queryKey: ["getGoals"] }); qc.invalidateQueries({ queryKey: ["getDailySummary"] }); setEditing(false); },
      onError: () => Alert.alert("Error", "Failed to update goals."),
    });
  };

  const fields: Array<{ key: keyof GoalInput; label: string; unit: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { key: "dailyCalories", label: "Calories", unit: "kcal", color: colors.tint, icon: "flame" },
    { key: "dailyProtein", label: "Protein", unit: "g", color: colors.protein, icon: "fitness" },
    { key: "dailyCarbs", label: "Carbs", unit: "g", color: colors.carbs, icon: "nutrition" },
    { key: "dailyFat", label: "Fat", unit: "g", color: colors.fat, icon: "water" },
  ];

  return (
    <ScrollView
      style={[st.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: bottomPad + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={st.header}>
        <Text style={[st.title, { color: colors.text }]}>Goals</Text>
        {!editing ? (
          <Pressable onPress={() => setEditing(true)} style={[st.editBtn, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[st.editBtnText, { color: colors.text }]}>Edit</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setEditing(false)} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <View style={st.cards}>
        {fields.map(({ key, label, unit, color, icon }) => (
          <View key={key} style={[st.card, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={st.cardRow}>
              <Ionicons name={icon} size={20} color={color} />
              <Text style={[st.cardLabel, { color: colors.textSecondary }]}>{label}</Text>
            </View>
            {editing ? (
              <View style={st.editRow}>
                <TextInput
                  value={inputs[key]}
                  onChangeText={(v) => setInputs((p) => ({ ...p, [key]: v }))}
                  keyboardType="numeric"
                  style={[st.input, { color: colors.text, borderColor: colors.border }]}
                  selectTextOnFocus
                />
                <Text style={[st.unit, { color: colors.textTertiary }]}>{unit}</Text>
              </View>
            ) : (
              <Text style={[st.cardValue, { color: colors.text }]}>
                {isLoading ? "..." : inputs[key]} <Text style={{ color: colors.textTertiary, fontSize: 14, fontFamily: "Inter_400Regular" }}>{unit}</Text>
              </Text>
            )}
          </View>
        ))}
      </View>

      {editing && (
        <Pressable
          onPress={handleSave}
          disabled={isPending}
          style={({ pressed }) => [st.saveBtn, { backgroundColor: colors.text, opacity: pressed || isPending ? 0.8 : 1 }]}
        >
          <Text style={[st.saveBtnText, { color: colors.background }]}>{isPending ? "Saving..." : "Save Goals"}</Text>
        </Pressable>
      )}

      <View style={[st.info, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
        <Text style={[st.infoText, { color: colors.textTertiary }]}>Consult a healthcare professional for personalized nutrition advice.</Text>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, marginBottom: 24 },
  title: { fontSize: 34, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  editBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  editBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  cards: { paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  card: { borderRadius: 16, padding: 18 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  cardLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  cardValue: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },

  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 20, fontFamily: "Inter_600SemiBold" },
  unit: { fontSize: 14, fontFamily: "Inter_400Regular" },

  saveBtn: { marginHorizontal: 20, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 20 },
  saveBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },

  info: { flexDirection: "row", gap: 10, marginHorizontal: 20, padding: 16, borderRadius: 14, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
});
