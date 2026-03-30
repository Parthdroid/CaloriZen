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
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

type GoalInput = { dailyCalories: string; dailyProtein: string; dailyCarbs: string; dailyFat: string };

export default function GoalsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { user, signOut } = useAuth();
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

  const fields: Array<{ key: keyof GoalInput; label: string; unit: string; color: string; icon: keyof typeof Ionicons.glyphMap; bg: string }> = [
    { key: "dailyCalories", label: "Daily Calories", unit: "kcal", color: colors.tint, icon: "flame", bg: colors.tint + "10" },
    { key: "dailyProtein", label: "Daily Protein", unit: "g", color: colors.protein, icon: "fitness", bg: colors.protein + "10" },
    { key: "dailyCarbs", label: "Daily Carbs", unit: "g", color: colors.carbs, icon: "nutrition", bg: colors.carbs + "10" },
    { key: "dailyFat", label: "Daily Fat", unit: "g", color: colors.fat, icon: "water", bg: colors.fat + "10" },
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
          <Pressable onPress={() => setEditing(true)} style={st.editBtn}>
            <Ionicons name="pencil" size={14} color="#FF6B35" />
            <Text style={st.editBtnText}>Edit</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setEditing(false)} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <View style={st.cards}>
        {fields.map(({ key, label, unit, color, icon, bg }) => (
          <View key={key} style={st.card}>
            <View style={st.cardRow}>
              <View style={[st.cardIconWrap, { backgroundColor: bg }]}>
                <Ionicons name={icon} size={18} color={color} />
              </View>
              <Text style={st.cardLabel}>{label}</Text>
            </View>
            {editing ? (
              <View style={st.editRow}>
                <TextInput
                  value={inputs[key]}
                  onChangeText={(v) => setInputs((p) => ({ ...p, [key]: v }))}
                  keyboardType="numeric"
                  style={st.input}
                  selectTextOnFocus
                />
                <Text style={st.unit}>{unit}</Text>
              </View>
            ) : (
              <Text style={[st.cardValue, { color: colors.text }]}>
                {isLoading ? "..." : inputs[key]} <Text style={st.cardUnit}>{unit}</Text>
              </Text>
            )}
          </View>
        ))}
      </View>

      {editing && (
        <Pressable
          onPress={handleSave}
          disabled={isPending}
          style={({ pressed }) => [st.saveBtn, { opacity: pressed || isPending ? 0.85 : 1 }]}
        >
          <Text style={st.saveBtnText}>{isPending ? "Saving..." : "Save Goals"}</Text>
        </Pressable>
      )}

      <View style={st.infoCard}>
        <Ionicons name="information-circle" size={18} color="#007AFF" />
        <Text style={st.infoText}>Consult a healthcare professional for personalized nutrition advice.</Text>
      </View>

      {user && (
        <View style={st.accountSection}>
          <View style={st.accountCard}>
            <View style={st.accountRow}>
              <View style={[st.accountAvatar, { backgroundColor: colors.tint + "12" }]}>
                <Text style={[st.accountAvatarText, { color: colors.tint }]}>
                  {(user.name?.[0] || "U").toUpperCase()}
                </Text>
              </View>
              <View style={st.accountInfo}>
                <Text style={[st.accountName, { color: colors.text }]}>{user.name || "User"}</Text>
                <Text style={st.accountEmail}>{user.email}</Text>
              </View>
            </View>
          </View>
          <Pressable
            onPress={() => {
              Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Sign Out",
                  style: "destructive",
                  onPress: async () => {
                    await signOut();
                    await AsyncStorage.removeItem("@onboarding_complete");
                    qc.clear();
                    router.replace("/login");
                  },
                },
              ]);
            }}
            style={({ pressed }) => [st.signOutBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="log-out-outline" size={18} color="#FF3B30" />
            <Text style={st.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, marginBottom: 24 },
  title: { fontSize: 34, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#FF6B3510" },
  editBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FF6B35" },

  cards: { paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  card: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  cardIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#AEAEB2" },
  cardValue: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  cardUnit: { fontSize: 16, fontFamily: "Inter_400Regular", color: "#AEAEB2" },

  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#E5E5EA", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 22, fontFamily: "Inter_600SemiBold", color: "#000", backgroundColor: "#F8F8FA" },
  unit: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#AEAEB2" },

  saveBtn: { marginHorizontal: 20, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginBottom: 20, backgroundColor: "#FF6B35" },
  saveBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#fff" },

  infoCard: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    alignItems: "flex-start",
    backgroundColor: "#007AFF08",
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, color: "#8E8E93" },

  accountSection: { marginTop: 32, paddingHorizontal: 20, gap: 12 },
  accountCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  accountRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  accountAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  accountAvatarText: { fontSize: 20, fontFamily: "Inter_700Bold" },
  accountInfo: { flex: 1, gap: 2 },
  accountName: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  accountEmail: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#AEAEB2" },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#FF3B3008",
    borderWidth: 1,
    borderColor: "#FF3B3018",
  },
  signOutText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FF3B30" },
});
