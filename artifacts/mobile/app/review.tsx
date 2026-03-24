import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { clarifymeal, createMeal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { NutritionAnalysis, MealItem } from "@workspace/api-client-react";

type ClarificationAnswers = Record<number, string>;

export default function ReviewScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { pendingAnalysis, setPendingAnalysis, pendingImageBase64, setPendingImageBase64 } = useApp();

  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(pendingAnalysis);
  const [clarificationAnswers, setClarificationAnswers] = useState<ClarificationAnswers>({});
  const [clarifying, setClarifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("snack");
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editedItems, setEditedItems] = useState<MealItem[]>(
    (pendingAnalysis?.items ?? []) as MealItem[]
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleClarify = useCallback(async () => {
    if (!analysis) return;
    const questions = analysis.clarificationQuestions ?? [];
    if (Object.keys(clarificationAnswers).length < questions.length) {
      Alert.alert("Please answer all questions first.");
      return;
    }

    setClarifying(true);
    try {
      const answers = questions.map((q, i) => ({
        question: q.question,
        answer: clarificationAnswers[i] ?? "",
      }));

      const updated = await clarifymeal({
        originalAnalysis: analysis,
        imageBase64: pendingImageBase64 ?? null,
        answers,
      });
      setAnalysis(updated);
      setEditedItems(updated.items as MealItem[]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Failed to clarify meal. Using original estimates.");
    } finally {
      setClarifying(false);
    }
  }, [analysis, clarificationAnswers, pendingImageBase64]);

  const handleSave = useCallback(async () => {
    if (!analysis) return;
    setSaving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await createMeal({
        mealType,
        items: editedItems,
        loggedAt: new Date().toISOString(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["listMeals"] });
      queryClient.invalidateQueries({ queryKey: ["getDailySummary"] });
      setPendingAnalysis(null);
      setPendingImageBase64(null);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save meal. Please try again.");
      setSaving(false);
    }
  }, [analysis, editedItems, mealType, queryClient, setPendingAnalysis, setPendingImageBase64]);

  const totalCalories = editedItems.reduce((s, i) => s + (Number(i.calories) || 0), 0);
  const totalProtein = editedItems.reduce((s, i) => s + (Number(i.protein) || 0), 0);
  const totalCarbs = editedItems.reduce((s, i) => s + (Number(i.carbs) || 0), 0);
  const totalFat = editedItems.reduce((s, i) => s + (Number(i.fat) || 0), 0);

  const updateItem = (index: number, updates: Partial<MealItem>) => {
    setEditedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const removeItem = (index: number) => {
    setEditedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const MEAL_TYPES: Array<{ value: "breakfast" | "lunch" | "dinner" | "snack"; label: string }> = [
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "dinner", label: "Dinner" },
    { value: "snack", label: "Snack" },
  ];

  if (!analysis) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>No analysis found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.tint, fontFamily: "Inter_500Medium" }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const questions = analysis.clarificationQuestions ?? [];
  const allAnswered = questions.every((_, i) => clarificationAnswers[i]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable
          onPress={() => { setPendingAnalysis(null); router.back(); }}
          style={[styles.backBtn, { backgroundColor: colors.backgroundTertiary }]}
        >
          <Ionicons name="chevron-down" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Review Meal</Text>
        <Pressable
          onPress={handleSave}
          disabled={saving || (analysis.needsClarification && !allAnswered && questions.length > 0)}
          style={[
            styles.saveHeaderBtn,
            { backgroundColor: colors.tint, opacity: saving ? 0.7 : 1 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveHeaderBtnText}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Clarification Questions (if needed) */}
        {analysis.needsClarification && questions.length > 0 && (
          <View style={[styles.clarifyCard, { backgroundColor: colors.card, borderColor: colors.tint + "40" }]}>
            <View style={styles.clarifyHeader}>
              <Ionicons name="help-circle" size={22} color={colors.tint} />
              <Text style={[styles.clarifyTitle, { color: colors.text }]}>Quick Questions</Text>
            </View>
            <Text style={[styles.clarifySubtitle, { color: colors.textSecondary }]}>
              Answer these to improve accuracy
            </Text>

            {questions.map((q, qi) => (
              <View key={qi} style={styles.questionBlock}>
                <Text style={[styles.question, { color: colors.text }]}>{q.question}</Text>
                <View style={styles.optionsRow}>
                  {q.options.map((opt) => (
                    <Pressable
                      key={opt}
                      onPress={() => {
                        setClarificationAnswers((prev) => ({ ...prev, [qi]: opt }));
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor:
                            clarificationAnswers[qi] === opt
                              ? colors.tint
                              : colors.backgroundTertiary,
                          borderColor:
                            clarificationAnswers[qi] === opt
                              ? colors.tint
                              : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color:
                              clarificationAnswers[qi] === opt
                                ? "#fff"
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}

            <Pressable
              onPress={handleClarify}
              disabled={!allAnswered || clarifying}
              style={[
                styles.clarifyBtn,
                {
                  backgroundColor: allAnswered ? colors.tint : colors.backgroundTertiary,
                  opacity: clarifying ? 0.8 : 1,
                },
              ]}
            >
              {clarifying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={16} color={allAnswered ? "#fff" : colors.textTertiary} />
                  <Text
                    style={[
                      styles.clarifyBtnText,
                      { color: allAnswered ? "#fff" : colors.textTertiary },
                    ]}
                  >
                    Update Estimates
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* Nutrition Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Total Nutrition</Text>
          <View style={styles.nutritionRow}>
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionBig, { color: colors.tint }]}>
                {Math.round(totalCalories)}
              </Text>
              <Text style={[styles.nutritionSub, { color: colors.textTertiary }]}>kcal</Text>
            </View>
            <View style={[styles.nutritionDivider, { backgroundColor: colors.border }]} />
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionBig, { color: colors.protein }]}>
                {Math.round(totalProtein)}g
              </Text>
              <Text style={[styles.nutritionSub, { color: colors.textTertiary }]}>protein</Text>
            </View>
            <View style={[styles.nutritionDivider, { backgroundColor: colors.border }]} />
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionBig, { color: colors.carbs }]}>
                {Math.round(totalCarbs)}g
              </Text>
              <Text style={[styles.nutritionSub, { color: colors.textTertiary }]}>carbs</Text>
            </View>
            <View style={[styles.nutritionDivider, { backgroundColor: colors.border }]} />
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionBig, { color: colors.fat }]}>
                {Math.round(totalFat)}g
              </Text>
              <Text style={[styles.nutritionSub, { color: colors.textTertiary }]}>fat</Text>
            </View>
          </View>
          {analysis.confidence !== undefined && (
            <View style={styles.confidenceRow}>
              <View
                style={[
                  styles.confidenceBadge,
                  {
                    backgroundColor:
                      analysis.confidence >= 0.8
                        ? colors.success + "20"
                        : colors.carbs + "20",
                  },
                ]}
              >
                <Ionicons
                  name={analysis.confidence >= 0.8 ? "checkmark-circle" : "alert-circle"}
                  size={14}
                  color={analysis.confidence >= 0.8 ? colors.success : colors.carbs}
                />
                <Text
                  style={[
                    styles.confidenceText,
                    {
                      color:
                        analysis.confidence >= 0.8 ? colors.success : colors.carbs,
                    },
                  ]}
                >
                  {analysis.confidence >= 0.8
                    ? "High confidence"
                    : analysis.confidence >= 0.6
                    ? "Medium confidence"
                    : "Low confidence"}{" "}
                  ({Math.round(analysis.confidence * 100)}%)
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Food Items */}
        <View style={[styles.itemsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Food Items</Text>

          {editedItems.map((item, index) => (
            <View
              key={index}
              style={[
                styles.itemRow,
                index < editedItems.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              {editingItem === index ? (
                <View style={styles.editForm}>
                  <TextInput
                    value={item.name}
                    onChangeText={(v) => updateItem(index, { name: v })}
                    style={[styles.editInput, { color: colors.text, backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}
                    placeholder="Food name"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    value={item.servingDescription}
                    onChangeText={(v) => updateItem(index, { servingDescription: v })}
                    style={[styles.editInput, { color: colors.text, backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}
                    placeholder="Serving (e.g. 1 cup)"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <View style={styles.macroInputs}>
                    {(["calories", "protein", "carbs", "fat"] as const).map((field) => (
                      <View key={field} style={styles.macroInputBlock}>
                        <Text style={[styles.macroInputLabel, { color: colors.textTertiary }]}>
                          {field === "calories" ? "kcal" : field.charAt(0).toUpperCase() + field.slice(1)}
                        </Text>
                        <TextInput
                          value={String(item[field])}
                          onChangeText={(v) => updateItem(index, { [field]: parseFloat(v) || 0 })}
                          keyboardType="decimal-pad"
                          style={[
                            styles.macroInput,
                            {
                              color: colors.text,
                              backgroundColor: colors.backgroundTertiary,
                              borderColor: colors.border,
                            },
                          ]}
                          selectTextOnFocus
                        />
                      </View>
                    ))}
                  </View>
                  <Pressable
                    onPress={() => setEditingItem(null)}
                    style={[styles.doneBtn, { backgroundColor: colors.tint }]}
                  >
                    <Text style={styles.doneBtnText}>Done</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.itemDisplay}>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.itemServing, { color: colors.textSecondary }]}>
                      {item.servingDescription}
                    </Text>
                    <View style={styles.itemMacros}>
                      <Text style={[styles.itemCalories, { color: colors.tint }]}>
                        {Math.round(Number(item.calories))} kcal
                      </Text>
                      <Text style={[styles.itemMacroSmall, { color: colors.protein }]}>
                        P{Math.round(Number(item.protein))}
                      </Text>
                      <Text style={[styles.itemMacroSmall, { color: colors.carbs }]}>
                        C{Math.round(Number(item.carbs))}
                      </Text>
                      <Text style={[styles.itemMacroSmall, { color: colors.fat }]}>
                        F{Math.round(Number(item.fat))}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.itemActions}>
                    <Pressable
                      onPress={() => setEditingItem(index)}
                      style={[styles.iconBtn, { backgroundColor: colors.backgroundTertiary }]}
                    >
                      <Ionicons name="pencil" size={14} color={colors.textSecondary} />
                    </Pressable>
                    <Pressable
                      onPress={() => removeItem(index)}
                      style={[styles.iconBtn, { backgroundColor: colors.fat + "18" }]}
                    >
                      <Ionicons name="trash-outline" size={14} color={colors.fat} />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Meal Type */}
        <View style={[styles.mealTypeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Meal Type</Text>
          <View style={styles.mealTypes}>
            {MEAL_TYPES.map(({ value, label }) => (
              <Pressable
                key={value}
                onPress={() => setMealType(value)}
                style={[
                  styles.mealTypeBtn,
                  {
                    backgroundColor: mealType === value ? colors.tint : colors.backgroundTertiary,
                    borderColor: mealType === value ? colors.tint : colors.border,
                  },
                ]}
              >
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

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={saving || editedItems.length === 0}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: colors.tint,
              opacity: pressed || saving || editedItems.length === 0 ? 0.75 : 1,
            },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save to Log</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const MEAL_TYPES: Array<{ value: "breakfast" | "lunch" | "dinner" | "snack"; label: string }> = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    textAlign: "center",
    padding: 40,
  },
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
  saveHeaderBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 64,
    alignItems: "center",
  },
  saveHeaderBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  scroll: {
    padding: 16,
    gap: 12,
    paddingBottom: 50,
  },
  clarifyCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  clarifyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clarifyTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  clarifySubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: -4,
  },
  questionBlock: {
    gap: 10,
    paddingTop: 4,
  },
  question: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  clarifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  clarifyBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  nutritionRow: {
    flexDirection: "row",
  },
  nutritionItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  nutritionBig: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  nutritionSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  nutritionDivider: {
    width: 1,
  },
  confidenceRow: {
    flexDirection: "row",
  },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confidenceText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  itemsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  itemRow: {
    paddingVertical: 12,
  },
  itemDisplay: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  itemServing: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  itemMacros: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  itemCalories: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  itemMacroSmall: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  itemActions: {
    flexDirection: "row",
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  editForm: {
    gap: 8,
  },
  editInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  macroInputs: {
    flexDirection: "row",
    gap: 8,
  },
  macroInputBlock: {
    flex: 1,
    gap: 4,
  },
  macroInputLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  macroInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  doneBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  mealTypeCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  mealTypes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mealTypeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
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
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
