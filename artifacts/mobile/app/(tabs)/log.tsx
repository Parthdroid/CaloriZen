import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { MealCard } from "@/components/MealCard";
import { useListMeals } from "@workspace/api-client-react";

function getDateOptions() {
  const options = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    const dayNum = d.getDate();
    const dayName = i === 0 ? "Today" : i === 1 ? "Yday" : d.toLocaleDateString([], { weekday: "short" });
    options.push({ date: iso, dayNum, dayName });
  }
  return options;
}

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_LABELS: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
const MEAL_ICONS: Record<string, string> = { breakfast: "sunny-outline", lunch: "partly-sunny-outline", dinner: "moon-outline", snack: "cafe-outline" };

export default function LogScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: meals = [], isLoading } = useListMeals({ date: selectedDate });
  const dateOptions = getDateOptions();

  const topPad = Platform.OS === "web" ? 56 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const mealsByType = MEAL_ORDER.reduce<Record<string, typeof meals[0][]>>((acc, type) => {
    acc[type] = meals.filter((m) => m.mealType === type);
    return acc;
  }, {});

  const totalCalories = meals.reduce((s, m) => s + m.totalCalories, 0);
  const totalProtein = meals.reduce((s, m) => s + m.totalProtein, 0);
  const totalCarbs = meals.reduce((s, m) => s + m.totalCarbs, 0);
  const totalFat = meals.reduce((s, m) => s + m.totalFat, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Food Log</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
        {dateOptions.map(({ date, dayNum, dayName }) => {
          const isSelected = selectedDate === date;
          const isToday = date === today;
          return (
            <Pressable
              key={date}
              onPress={() => { setSelectedDate(date); Haptics.selectionAsync(); }}
              style={[styles.dateItem, isSelected && { backgroundColor: colors.tint }]}
            >
              <Text style={[styles.dateDayName, { color: isSelected ? "rgba(255,255,255,0.8)" : colors.textTertiary }]}>
                {dayName.toUpperCase()}
              </Text>
              <Text style={[styles.dateDayNum, { color: isSelected ? "#fff" : colors.text }]}>
                {dayNum}
              </Text>
              {isToday && !isSelected && <View style={[styles.todayDot, { backgroundColor: colors.tint }]} />}
            </Pressable>
          );
        })}
      </ScrollView>

      {meals.length > 0 && (
        <View style={[styles.summaryStrip, { backgroundColor: colors.backgroundTertiary }]}>
          <View style={styles.summaryChip}>
            <Text style={[styles.summaryVal, { color: colors.tint }]}>{Math.round(totalCalories)}</Text>
            <Text style={[styles.summaryUnit, { color: colors.textTertiary }]}>cal</Text>
          </View>
          <View style={[styles.summaryDot, { backgroundColor: colors.border }]} />
          <View style={styles.summaryChip}>
            <Text style={[styles.summaryVal, { color: colors.protein }]}>{Math.round(totalProtein)}g</Text>
            <Text style={[styles.summaryUnit, { color: colors.textTertiary }]}>P</Text>
          </View>
          <View style={[styles.summaryDot, { backgroundColor: colors.border }]} />
          <View style={styles.summaryChip}>
            <Text style={[styles.summaryVal, { color: colors.carbs }]}>{Math.round(totalCarbs)}g</Text>
            <Text style={[styles.summaryUnit, { color: colors.textTertiary }]}>C</Text>
          </View>
          <View style={[styles.summaryDot, { backgroundColor: colors.border }]} />
          <View style={styles.summaryChip}>
            <Text style={[styles.summaryVal, { color: colors.fat }]}>{Math.round(totalFat)}g</Text>
            <Text style={[styles.summaryUnit, { color: colors.textTertiary }]}>F</Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad + 100 }} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.centered}>
            <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading...</Text>
          </View>
        ) : meals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.backgroundTertiary }]}>
              <Ionicons name="calendar-outline" size={32} color={colors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No meals logged</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Use the Scan tab to log your meals</Text>
          </View>
        ) : (
          <>
            {MEAL_ORDER.map((type) => {
              const typeMeals = mealsByType[type];
              if (!typeMeals || typeMeals.length === 0) return null;
              return (
                <View key={type} style={styles.mealGroup}>
                  <View style={styles.groupHeader}>
                    <Ionicons name={MEAL_ICONS[type] as keyof typeof Ionicons.glyphMap} size={14} color={colors.textTertiary} />
                    <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>{MEAL_LABELS[type]}</Text>
                  </View>
                  {typeMeals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} />
                  ))}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 20 },
  title: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.8 },
  dateScroll: { paddingHorizontal: 16, paddingRight: 20, gap: 6, marginBottom: 16 },
  dateItem: { alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, gap: 4, minWidth: 46 },
  dateDayName: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  dateDayNum: { fontSize: 18, fontFamily: "Inter_700Bold" },
  todayDot: { width: 5, height: 5, borderRadius: 2.5 },
  summaryStrip: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginHorizontal: 20, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 8, gap: 10 },
  summaryChip: { flexDirection: "row", alignItems: "baseline", gap: 3 },
  summaryVal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  summaryUnit: { fontSize: 11, fontFamily: "Inter_400Regular" },
  summaryDot: { width: 3, height: 3, borderRadius: 1.5 },
  mealGroup: { marginBottom: 8 },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 24, paddingVertical: 8 },
  groupLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.6 },
  centered: { padding: 40, alignItems: "center" },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  emptyContainer: { padding: 60, alignItems: "center", gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
