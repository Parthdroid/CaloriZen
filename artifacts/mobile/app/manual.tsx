import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { createMeal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function ManualEntryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("snack");
  const [saving, setSaving] = useState(false);

  const MEAL_TYPES: Array<{ value: "breakfast" | "lunch" | "dinner" | "snack"; label: string; icon: string }> = [
    { value: "breakfast", label: "Breakfast", icon: "sunny-outline" },
    { value: "lunch", label: "Lunch", icon: "restaurant-outline" },
    { value: "dinner", label: "Dinner", icon: "moon-outline" },
    { value: "snack", label: "Snack", icon: "cafe-outline" },
  ];

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Info", "Please enter a food name.");
      return;
    }
    const cal = parseFloat(calories) || 0;
    if (cal <= 0) {
      Alert.alert("Missing Info", "Please enter the calorie amount.");
      return;
    }

    setSaving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await createMeal({
        mealType,
        items: [
          {
            name: name.trim(),
            servingDescription: servingSize.trim() || "1 serving",
            calories: cal,
            protein: parseFloat(protein) || 0,
            carbs: parseFloat(carbs) || 0,
            fat: parseFloat(fat) || 0,
          },
        ],
        loggedAt: new Date().toISOString(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["listMeals"] });
      queryClient.invalidateQueries({ queryKey: ["getDailySummary"] });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save meal. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.backgroundTertiary }]}
        >
          <Ionicons name="chevron-down" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Food Manually</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Food Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Chicken Breast, Rice, Salad..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundTertiary }]}
            returnKeyType="next"
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Serving Size</Text>
          <TextInput
            value={servingSize}
            onChangeText={setServingSize}
            placeholder="e.g. 1 cup, 200g, 1 piece..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundTertiary }]}
            returnKeyType="next"
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Nutrition</Text>
          <View style={styles.nutritionRow}>
            <View style={styles.nutritionField}>
              <Text style={[styles.nutritionLabel, { color: colors.tint }]}>Calories *</Text>
              <TextInput
                value={calories}
                onChangeText={setCalories}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                style={[styles.nutritionInput, { color: colors.text, backgroundColor: colors.backgroundTertiary }]}
                keyboardType="numeric"
                textAlign="center"
              />
              <Text style={[styles.unitLabel, { color: colors.textTertiary }]}>kcal</Text>
            </View>
            <View style={styles.nutritionField}>
              <Text style={[styles.nutritionLabel, { color: colors.protein }]}>Protein</Text>
              <TextInput
                value={protein}
                onChangeText={setProtein}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                style={[styles.nutritionInput, { color: colors.text, backgroundColor: colors.backgroundTertiary }]}
                keyboardType="numeric"
                textAlign="center"
              />
              <Text style={[styles.unitLabel, { color: colors.textTertiary }]}>g</Text>
            </View>
            <View style={styles.nutritionField}>
              <Text style={[styles.nutritionLabel, { color: colors.carbs }]}>Carbs</Text>
              <TextInput
                value={carbs}
                onChangeText={setCarbs}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                style={[styles.nutritionInput, { color: colors.text, backgroundColor: colors.backgroundTertiary }]}
                keyboardType="numeric"
                textAlign="center"
              />
              <Text style={[styles.unitLabel, { color: colors.textTertiary }]}>g</Text>
            </View>
            <View style={styles.nutritionField}>
              <Text style={[styles.nutritionLabel, { color: colors.fat }]}>Fat</Text>
              <TextInput
                value={fat}
                onChangeText={setFat}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                style={[styles.nutritionInput, { color: colors.text, backgroundColor: colors.backgroundTertiary }]}
                keyboardType="numeric"
                textAlign="center"
              />
              <Text style={[styles.unitLabel, { color: colors.textTertiary }]}>g</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Meal</Text>
          <View style={styles.mealTypes}>
            {MEAL_TYPES.map(({ value, label, icon }) => (
              <Pressable
                key={value}
                onPress={() => setMealType(value)}
                style={[
                  styles.mealTypeBtn,
                  {
                    backgroundColor: mealType === value ? colors.tint : colors.backgroundTertiary,
                  },
                ]}
              >
                <Ionicons
                  name={icon as any}
                  size={16}
                  color={mealType === value ? "#fff" : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.mealTypeBtnText,
                    { color: mealType === value ? "#fff" : colors.textSecondary },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: colors.tint, opacity: pressed || saving ? 0.85 : 1 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save Meal</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  nutritionRow: {
    flexDirection: "row",
    gap: 8,
  },
  nutritionField: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  nutritionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  nutritionInput: {
    width: "100%",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    paddingVertical: 10,
    borderRadius: 12,
  },
  unitLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  mealTypes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mealTypeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mealTypeBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
