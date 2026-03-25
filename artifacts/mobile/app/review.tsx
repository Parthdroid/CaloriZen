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
  Image,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { clarifymeal, createMeal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { NutritionAnalysis, MealItem } from "@workspace/api-client-react";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ClarificationAnswers = Record<number, string>;

function MiniRing({ value, goal, color, size = 40 }: { value: number; goal: number; color: string; size?: number }) {
  const { colors } = useTheme();
  const radius = (size - 5) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / (goal || 1), 1);
  const offset = circumference * (1 - progress);

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.backgroundTertiary} strokeWidth={3.5} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={3.5} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
    </Svg>
  );
}

function MacroChip({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.macroChip, { backgroundColor: color + "12" }]}>
      <Text style={[styles.macroChipValue, { color }]}>{Math.round(value)}{unit}</Text>
      <Text style={[styles.macroChipLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const MEAL_ICONS: Record<string, string> = {
  breakfast: "sunny-outline",
  lunch: "partly-sunny-outline",
  dinner: "moon-outline",
  snack: "cafe-outline",
};

export default function ReviewScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { pendingAnalysis, setPendingAnalysis, pendingImageBase64, setPendingImageBase64 } = useApp();

  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(pendingAnalysis);
  const [clarificationAnswers, setClarificationAnswers] = useState<ClarificationAnswers>({});
  const [clarifying, setClarifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">(() => {
    const hour = new Date().getHours();
    if (hour < 11) return "breakfast";
    if (hour < 15) return "lunch";
    if (hour < 20) return "dinner";
    return "snack";
  });
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editedItems, setEditedItems] = useState<MealItem[]>(
    (pendingAnalysis?.items ?? []) as MealItem[]
  );

  const topPad = Platform.OS === "web" ? 20 : insets.top;

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
    if (!analysis || editedItems.length === 0) return;
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

  if (!analysis) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 16 }}>No analysis found.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.tint, fontFamily: "Inter_600SemiBold" }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const questions = analysis.clarificationQuestions ?? [];
  const allAnswered = questions.every((_, i) => clarificationAnswers[i]);

  const MEAL_TYPES: Array<{ value: "breakfast" | "lunch" | "dinner" | "snack"; label: string; icon: string }> = [
    { value: "breakfast", label: "Breakfast", icon: "sunny-outline" },
    { value: "lunch", label: "Lunch", icon: "partly-sunny-outline" },
    { value: "dinner", label: "Dinner", icon: "moon-outline" },
    { value: "snack", label: "Snack", icon: "cafe-outline" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero image */}
        {pendingImageBase64 ? (
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${pendingImageBase64}` }}
              style={[styles.heroImage, { height: SCREEN_WIDTH * 0.55 }]}
              resizeMode="cover"
            />
            <View style={[styles.heroOverlay, { paddingTop: topPad + 8 }]}>
              <Pressable
                onPress={() => { setPendingAnalysis(null); router.back(); }}
                style={styles.heroBtn}
              >
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </Pressable>
              <View style={{ flex: 1 }} />
              {analysis.confidence !== undefined && (
                <View style={[styles.confidencePill, { backgroundColor: analysis.confidence >= 0.8 ? "rgba(34,197,94,0.85)" : "rgba(251,191,36,0.85)" }]}>
                  <Ionicons name={analysis.confidence >= 0.8 ? "checkmark-circle" : "alert-circle"} size={14} color="#fff" />
                  <Text style={styles.confidenceText}>{Math.round(analysis.confidence * 100)}% match</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.noImageHeader, { paddingTop: topPad + 12 }]}>
            <Pressable
              onPress={() => { setPendingAnalysis(null); router.back(); }}
              style={[styles.backBtnFlat, { backgroundColor: colors.backgroundTertiary }]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>
            <Text style={[styles.noImageTitle, { color: colors.text }]}>Meal Analysis</Text>
            <View style={{ width: 40 }} />
          </View>
        )}

        {/* Calories hero card */}
        <View style={[styles.calorieCard, { backgroundColor: colors.card, marginTop: pendingImageBase64 ? -28 : 16 }]}>
          <View style={styles.calorieCenter}>
            <View style={styles.calorieRingWrap}>
              <MiniRing value={totalCalories} goal={2000} color={colors.tint} size={72} />
              <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
                <Ionicons name="flame" size={20} color={colors.tint} />
              </View>
            </View>
            <View style={styles.calorieText}>
              <Text style={[styles.calorieBig, { color: colors.text }]}>{Math.round(totalCalories)}</Text>
              <Text style={[styles.calorieUnit, { color: colors.textSecondary }]}>calories</Text>
            </View>
          </View>
          <View style={styles.macroChips}>
            <MacroChip label="Protein" value={totalProtein} unit="g" color={colors.protein} />
            <MacroChip label="Carbs" value={totalCarbs} unit="g" color={colors.carbs} />
            <MacroChip label="Fat" value={totalFat} unit="g" color={colors.fat} />
          </View>
        </View>

        {/* Clarification Questions */}
        {analysis.needsClarification && questions.length > 0 && (
          <View style={[styles.clarifyCard, { backgroundColor: colors.card }]}>
            <View style={styles.clarifyHeaderRow}>
              <View style={[styles.clarifyIconBg, { backgroundColor: colors.tint + "18" }]}>
                <Ionicons name="chatbubble-ellipses" size={18} color={colors.tint} />
              </View>
              <View>
                <Text style={[styles.clarifyTitle, { color: colors.text }]}>Help us be more accurate</Text>
                <Text style={[styles.clarifySubtitle, { color: colors.textSecondary }]}>Answer to refine estimates</Text>
              </View>
            </View>

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
                          backgroundColor: clarificationAnswers[qi] === opt ? colors.tint : colors.backgroundTertiary,
                        },
                      ]}
                    >
                      <Text style={[styles.optionText, { color: clarificationAnswers[qi] === opt ? "#fff" : colors.textSecondary }]}>
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
              style={[styles.updateBtn, { backgroundColor: allAnswered ? colors.tint : colors.backgroundTertiary, opacity: clarifying ? 0.7 : 1 }]}
            >
              {clarifying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={16} color={allAnswered ? "#fff" : colors.textTertiary} />
                  <Text style={[styles.updateBtnText, { color: allAnswered ? "#fff" : colors.textTertiary }]}>
                    Update Estimates
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* Food Items — Cal AI style */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Detected Items</Text>
          {editedItems.map((item, index) => (
            <View key={index} style={[styles.foodCard, { backgroundColor: colors.card }]}>
              {editingItem === index ? (
                <View style={styles.editForm}>
                  <TextInput
                    value={item.name}
                    onChangeText={(v) => updateItem(index, { name: v })}
                    style={[styles.editInput, { color: colors.text, backgroundColor: colors.backgroundTertiary }]}
                    placeholder="Food name"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    value={item.servingDescription}
                    onChangeText={(v) => updateItem(index, { servingDescription: v })}
                    style={[styles.editInput, { color: colors.text, backgroundColor: colors.backgroundTertiary }]}
                    placeholder="Serving (e.g. 1 cup)"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <View style={styles.macroEditRow}>
                    {(["calories", "protein", "carbs", "fat"] as const).map((field) => (
                      <View key={field} style={styles.macroEditBlock}>
                        <Text style={[styles.macroEditLabel, { color: field === "calories" ? colors.tint : field === "protein" ? colors.protein : field === "carbs" ? colors.carbs : colors.fat }]}>
                          {field === "calories" ? "Cal" : field.charAt(0).toUpperCase()}
                        </Text>
                        <TextInput
                          value={String(item[field])}
                          onChangeText={(v) => updateItem(index, { [field]: parseFloat(v) || 0 })}
                          keyboardType="decimal-pad"
                          style={[styles.macroEditInput, { color: colors.text, backgroundColor: colors.backgroundTertiary }]}
                          selectTextOnFocus
                        />
                      </View>
                    ))}
                  </View>
                  <Pressable
                    onPress={() => setEditingItem(null)}
                    style={[styles.doneEditBtn, { backgroundColor: colors.tint }]}
                  >
                    <Text style={styles.doneEditBtnText}>Done</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.foodCardTop}>
                    <View style={styles.foodInfo}>
                      <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                      <Text style={[styles.foodServing, { color: colors.textTertiary }]}>{item.servingDescription}</Text>
                    </View>
                    <View style={styles.foodActions}>
                      <Pressable
                        onPress={() => setEditingItem(index)}
                        hitSlop={8}
                        style={[styles.foodActionBtn, { backgroundColor: colors.backgroundTertiary }]}
                      >
                        <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          removeItem(index);
                        }}
                        hitSlop={8}
                        style={[styles.foodActionBtn, { backgroundColor: colors.fat + "15" }]}
                      >
                        <Ionicons name="close" size={14} color={colors.fat} />
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.foodMacroRow}>
                    <View style={[styles.foodMacroPill, { backgroundColor: colors.tint + "12" }]}>
                      <Text style={[styles.foodMacroValue, { color: colors.tint }]}>{Math.round(Number(item.calories))}</Text>
                      <Text style={[styles.foodMacroUnit, { color: colors.tint }]}>cal</Text>
                    </View>
                    <View style={[styles.foodMacroPill, { backgroundColor: colors.protein + "12" }]}>
                      <Text style={[styles.foodMacroValue, { color: colors.protein }]}>{Math.round(Number(item.protein))}</Text>
                      <Text style={[styles.foodMacroUnit, { color: colors.protein }]}>P</Text>
                    </View>
                    <View style={[styles.foodMacroPill, { backgroundColor: colors.carbs + "12" }]}>
                      <Text style={[styles.foodMacroValue, { color: colors.carbs }]}>{Math.round(Number(item.carbs))}</Text>
                      <Text style={[styles.foodMacroUnit, { color: colors.carbs }]}>C</Text>
                    </View>
                    <View style={[styles.foodMacroPill, { backgroundColor: colors.fat + "12" }]}>
                      <Text style={[styles.foodMacroValue, { color: colors.fat }]}>{Math.round(Number(item.fat))}</Text>
                      <Text style={[styles.foodMacroUnit, { color: colors.fat }]}>F</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          ))}
        </View>

        {/* Meal type selector — pill style */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Log as</Text>
          <View style={[styles.mealTypeRow, { backgroundColor: colors.backgroundTertiary }]}>
            {MEAL_TYPES.map(({ value, label, icon }) => (
              <Pressable
                key={value}
                onPress={() => { setMealType(value); Haptics.selectionAsync(); }}
                style={[
                  styles.mealTypeItem,
                  { backgroundColor: mealType === value ? colors.tint : "transparent" },
                ]}
              >
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color={mealType === value ? "#fff" : colors.textSecondary} />
                <Text style={[styles.mealTypeLabel, { color: mealType === value ? "#fff" : colors.textSecondary }]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom save bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 16 : insets.bottom + 8 }]}>
        <Pressable
          onPress={handleSave}
          disabled={saving || editedItems.length === 0}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: colors.tint,
              opacity: pressed || saving || editedItems.length === 0 ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Add to Log</Text>
              <View style={styles.saveBtnCalBadge}>
                <Text style={styles.saveBtnCalText}>{Math.round(totalCalories)} cal</Text>
              </View>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroContainer: { position: "relative" },
  heroImage: { width: "100%", backgroundColor: "#1a1a2e" },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  heroBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  confidencePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  confidenceText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  noImageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtnFlat: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  noImageTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  calorieCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  calorieCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  calorieRingWrap: { position: "relative" },
  calorieText: { gap: 2 },
  calorieBig: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  calorieUnit: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  macroChips: {
    flexDirection: "row",
    gap: 8,
  },
  macroChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: "center",
    gap: 2,
  },
  macroChipValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  macroChipLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  clarifyCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  clarifyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clarifyIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  clarifyTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  clarifySubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  questionBlock: { gap: 8 },
  question: {
    fontSize: 14,
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
  },
  optionText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  updateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
  },
  updateBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  sectionWrap: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  foodCard: {
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  foodCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  foodInfo: { flex: 1, gap: 3 },
  foodName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
  foodServing: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  foodActions: {
    flexDirection: "row",
    gap: 6,
  },
  foodActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  foodMacroRow: {
    flexDirection: "row",
    gap: 6,
  },
  foodMacroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  foodMacroValue: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  foodMacroUnit: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  editForm: { gap: 10 },
  editInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  macroEditRow: {
    flexDirection: "row",
    gap: 8,
  },
  macroEditBlock: {
    flex: 1,
    gap: 4,
    alignItems: "center",
  },
  macroEditLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  macroEditInput: {
    width: "100%",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 8,
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  doneEditBtn: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  doneEditBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  mealTypeRow: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
  },
  mealTypeItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 12,
  },
  mealTypeLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 0,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    paddingVertical: 16,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  saveBtnCalBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  saveBtnCalText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
