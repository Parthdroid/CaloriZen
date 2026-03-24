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
import { useTheme } from "@/hooks/useTheme";
import { MealCard } from "@/components/MealCard";
import { useListMeals } from "@workspace/api-client-react";

function DateButton({
  date,
  label,
  selected,
  onPress,
}: {
  date: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.dateBtn,
        {
          backgroundColor: selected ? colors.tint : colors.backgroundTertiary,
          borderColor: selected ? colors.tint : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.dateBtnText,
          { color: selected ? "#fff" : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getDateOptions() {
  const options = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    let label: string;
    if (i === 0) label = "Today";
    else if (i === 1) label = "Yesterday";
    else {
      label = d.toLocaleDateString([], { weekday: "short", month: "numeric", day: "numeric" });
    }
    options.push({ date: iso, label });
  }
  return options;
}

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];

export default function LogScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: meals = [], isLoading } = useListMeals({ date: selectedDate });
  const dateOptions = getDateOptions();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const mealsByType = MEAL_ORDER.reduce<Record<string, typeof meals[0][]>>(
    (acc, type) => {
      acc[type] = meals.filter((m) => m.mealType === type);
      return acc;
    },
    {}
  );

  const totalCalories = meals.reduce((s, m) => s + m.totalCalories, 0);
  const totalProtein = meals.reduce((s, m) => s + m.totalProtein, 0);
  const totalCarbs = meals.reduce((s, m) => s + m.totalCarbs, 0);
  const totalFat = meals.reduce((s, m) => s + m.totalFat, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Food Log</Text>
      </View>

      {/* Date picker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.datePicker}
        style={{ flexGrow: 0 }}
      >
        {dateOptions.map(({ date, label }) => (
          <DateButton
            key={date}
            date={date}
            label={label}
            selected={selectedDate === date}
            onPress={() => setSelectedDate(date)}
          />
        ))}
      </ScrollView>

      {/* Summary row */}
      {meals.length > 0 && (
        <View
          style={[
            styles.summaryRow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.tint }]}>
              {Math.round(totalCalories)}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>kcal</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.protein }]}>
              {Math.round(totalProtein)}g
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>protein</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.carbs }]}>
              {Math.round(totalCarbs)}g
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>carbs</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.fat }]}>
              {Math.round(totalFat)}g
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>fat</Text>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.centered}>
            <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading...</Text>
          </View>
        ) : meals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No meals logged</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Use the Scan tab to log your meals
            </Text>
          </View>
        ) : (
          <>
            {MEAL_ORDER.map((type) => {
              const typeMeals = mealsByType[type];
              if (!typeMeals || typeMeals.length === 0) return null;
              return (
                <View key={type} style={styles.mealGroup}>
                  <Text
                    style={[styles.groupLabel, { color: colors.textSecondary }]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  datePicker: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexDirection: "row",
  },
  dateBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  dateBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  summaryRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    width: 1,
    height: "100%",
  },
  mealGroup: {
    marginBottom: 16,
  },
  groupLabel: {
    paddingHorizontal: 20,
    marginBottom: 6,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  centered: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  emptyContainer: {
    padding: 60,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
