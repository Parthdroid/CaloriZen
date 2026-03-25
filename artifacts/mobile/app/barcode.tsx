import React, { useState, useCallback } from "react";
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
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { lookupBarcode, createMeal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type ProductInfo = {
  barcode: string;
  productName: string;
  brand: string | null;
  servingSize: string;
  servingsPerContainer: number | null;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  imageUrl?: string | null;
};

export default function BarcodeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [barcodeInput, setBarcodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [servings, setServings] = useState("1");
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("snack");
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const lookupProduct = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    setLoading(true);
    setProduct(null);
    try {
      const result = await lookupBarcode(barcode.trim());
      setProduct(result);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(
        "Product Not Found",
        "We couldn't find this barcode. You can try entering it manually or use the photo scanner.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => lookupProduct(barcodeInput);

  const numServings = parseFloat(servings) || 1;
  const calories = Math.round((product?.caloriesPerServing ?? 0) * numServings);
  const protein = Math.round((product?.proteinPerServing ?? 0) * numServings * 10) / 10;
  const carbs = Math.round((product?.carbsPerServing ?? 0) * numServings * 10) / 10;
  const fat = Math.round((product?.fatPerServing ?? 0) * numServings * 10) / 10;

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await createMeal({
        mealType,
        items: [
          {
            name: product.productName + (product.brand ? ` (${product.brand})` : ""),
            servingDescription: `${servings} × ${product.servingSize}`,
            calories,
            protein,
            carbs,
            fat,
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

  const MEAL_TYPES: Array<{ value: "breakfast" | "lunch" | "dinner" | "snack"; label: string }> = [
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "dinner", label: "Dinner" },
    { value: "snack", label: "Snack" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.backgroundTertiary }]}
        >
          <Ionicons name="chevron-down" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Barcode Scanner</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Barcode Input */}
        <View style={[styles.inputCard, { backgroundColor: colors.backgroundTertiary }]}>
          <View style={styles.inputRow}>
            <Ionicons name="barcode-outline" size={22} color={colors.textSecondary} />
            <TextInput
              value={barcodeInput}
              onChangeText={setBarcodeInput}
              placeholder="Enter barcode number..."
              placeholderTextColor={colors.textTertiary}
              style={[styles.barcodeInput, { color: colors.text }]}
              keyboardType="numeric"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              autoFocus
            />
            {barcodeInput.length > 0 && (
              <Pressable onPress={() => { setBarcodeInput(""); setProduct(null); }}>
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={handleSearch}
            disabled={loading || !barcodeInput.trim()}
            style={[
              styles.searchBtn,
              { backgroundColor: colors.tint, opacity: !barcodeInput.trim() ? 0.5 : 1 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={16} color="#fff" />
                <Text style={styles.searchBtnText}>Look Up</Text>
              </>
            )}
          </Pressable>
        </View>

        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          Type the barcode number from the package and tap Look Up
        </Text>

        {/* Product Result */}
        {product && (
          <View style={styles.productSection}>
            <View style={[styles.productCard, { backgroundColor: colors.card }]}>
              <View style={styles.productHeader}>
                <View style={[styles.productIconBg, { backgroundColor: colors.tint + "18" }]}>
                  <Ionicons name="cube-outline" size={24} color={colors.tint} />
                </View>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                    {product.productName}
                  </Text>
                  {product.brand && (
                    <Text style={[styles.productBrand, { color: colors.textSecondary }]}>
                      {product.brand}
                    </Text>
                  )}
                </View>
              </View>

              {/* Nutrition per serving */}
              <View style={[styles.nutritionGrid, { backgroundColor: colors.backgroundTertiary, borderRadius: 12, padding: 12, marginTop: 12 }]}>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: colors.tint }]}>{calories}</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textTertiary }]}>kcal</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: colors.protein }]}>{protein}g</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textTertiary }]}>protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: colors.carbs }]}>{carbs}g</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textTertiary }]}>carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: colors.fat }]}>{fat}g</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textTertiary }]}>fat</Text>
                </View>
              </View>
            </View>

            {/* Servings */}
            <View style={[styles.servingsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Servings</Text>
              <View style={styles.servingsRow}>
                <Pressable
                  onPress={() => setServings(String(Math.max(0.5, numServings - 0.5)))}
                  style={[styles.servingBtn, { backgroundColor: colors.backgroundTertiary }]}
                >
                  <Ionicons name="remove" size={18} color={colors.text} />
                </Pressable>
                <TextInput
                  value={servings}
                  onChangeText={setServings}
                  keyboardType="decimal-pad"
                  style={[styles.servingsInput, { color: colors.text, backgroundColor: colors.backgroundTertiary }]}
                  textAlign="center"
                  selectTextOnFocus
                />
                <Pressable
                  onPress={() => setServings(String(numServings + 0.5))}
                  style={[styles.servingBtn, { backgroundColor: colors.backgroundTertiary }]}
                >
                  <Ionicons name="add" size={18} color={colors.text} />
                </Pressable>
                <Text style={[styles.servingUnit, { color: colors.textSecondary }]}>
                  × {product.servingSize}
                </Text>
              </View>
            </View>

            {/* Meal Type */}
            <View style={[styles.mealTypeCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Meal</Text>
              <View style={styles.mealTypes}>
                {MEAL_TYPES.map(({ value, label }) => (
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
          </View>
        )}
      </ScrollView>
    </View>
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
  },
  inputCard: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  barcodeInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 12,
  },
  searchBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  productSection: {
    gap: 10,
  },
  productCard: {
    borderRadius: 20,
    padding: 16,
  },
  productHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  productIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
  },
  productBrand: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  nutritionGrid: {
    flexDirection: "row",
  },
  nutritionItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  nutritionValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  nutritionLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  servingsCard: {
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
  servingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  servingBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  servingsInput: {
    width: 60,
    height: 40,
    borderRadius: 12,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  servingUnit: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  mealTypeCard: {
    borderRadius: 20,
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
