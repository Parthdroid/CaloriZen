import React, { useState, useRef, useEffect } from "react";
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
  const opts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    opts.push({
      date: d.toISOString().split("T")[0],
      day: d.getDate(),
      label: i === 0 ? "Today" : i === 1 ? "Yesterday" : d.toLocaleDateString([], { weekday: "short" }),
    });
  }
  return opts;
}

const TYPES = ["breakfast", "lunch", "dinner", "snack"];
const TYPE_LABEL: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

export default function LogScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const today = new Date().toISOString().split("T")[0];
  const [sel, setSel] = useState(today);
  const { data: meals = [], isLoading } = useListMeals({ date: sel });
  const dates = getDateOptions();
  const dateScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => dateScrollRef.current?.scrollToEnd({ animated: false }), 100);
  }, []);

  const topPad = Platform.OS === "web" ? 56 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const totalCal = meals.reduce((s, m) => s + m.totalCalories, 0);
  const totalP = meals.reduce((s, m) => s + m.totalProtein, 0);
  const totalC = meals.reduce((s, m) => s + m.totalCarbs, 0);
  const totalF = meals.reduce((s, m) => s + m.totalFat, 0);

  const byType = TYPES.reduce<Record<string, typeof meals>>((a, t) => { a[t] = meals.filter((m) => m.mealType === t); return a; }, {});

  return (
    <View style={[st.root, { backgroundColor: colors.background }]}>
      <View style={[st.header, { paddingTop: topPad + 12 }]}>
        <Text style={[st.title, { color: colors.text }]}>Food Log</Text>
      </View>

      <ScrollView ref={dateScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.dateRow}>
        {dates.map((d) => {
          const active = sel === d.date;
          return (
            <Pressable
              key={d.date}
              onPress={() => { setSel(d.date); Haptics.selectionAsync(); }}
              style={[st.dateBtn, active && { backgroundColor: colors.text }]}
            >
              <Text style={[st.dateLabel, { color: active ? colors.background : colors.textTertiary }]}>{d.label}</Text>
              <Text style={[st.dateNum, { color: active ? colors.background : colors.text }]}>{d.day}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {meals.length > 0 && (
        <View style={[st.summary, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={st.sumItem}>
            <Text style={[st.sumVal, { color: colors.tint }]}>{Math.round(totalCal)}</Text>
            <Text style={[st.sumLabel, { color: colors.textTertiary }]}>kcal</Text>
          </View>
          <View style={st.sumItem}>
            <Text style={[st.sumVal, { color: colors.protein }]}>{Math.round(totalP)}g</Text>
            <Text style={[st.sumLabel, { color: colors.textTertiary }]}>protein</Text>
          </View>
          <View style={st.sumItem}>
            <Text style={[st.sumVal, { color: colors.carbs }]}>{Math.round(totalC)}g</Text>
            <Text style={[st.sumLabel, { color: colors.textTertiary }]}>carbs</Text>
          </View>
          <View style={st.sumItem}>
            <Text style={[st.sumVal, { color: colors.fat }]}>{Math.round(totalF)}g</Text>
            <Text style={[st.sumLabel, { color: colors.textTertiary }]}>fat</Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad + 100 }} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={st.empty}><Text style={[st.emptyText, { color: colors.textTertiary }]}>Loading...</Text></View>
        ) : meals.length === 0 ? (
          <View style={st.empty}>
            <View style={[st.emptyCircle, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="calendar-outline" size={28} color={colors.textTertiary} />
            </View>
            <Text style={[st.emptyTitle, { color: colors.textSecondary }]}>No meals logged</Text>
            <Text style={[st.emptyText, { color: colors.textTertiary }]}>Use the Scan tab to log your meals</Text>
          </View>
        ) : (
          <>
            {TYPES.map((t) => {
              const tm = byType[t];
              if (!tm || tm.length === 0) return null;
              return (
                <View key={t} style={st.section}>
                  <Text style={[st.sectionTitle, { color: colors.textTertiary }]}>{TYPE_LABEL[t]}</Text>
                  {tm.map((m) => <MealCard key={m.id} meal={m} />)}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 34, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },

  dateRow: { paddingHorizontal: 20, gap: 8, marginBottom: 16, alignItems: "flex-start" },
  dateBtn: { alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, gap: 2, minWidth: 52 },
  dateLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  dateNum: { fontSize: 20, fontFamily: "Inter_700Bold" },

  summary: { flexDirection: "row", justifyContent: "space-around", marginHorizontal: 20, borderRadius: 14, paddingVertical: 14, marginBottom: 12 },
  sumItem: { alignItems: "center" },
  sumVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sumLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },

  section: { marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.6, paddingHorizontal: 24, paddingVertical: 8 },

  empty: { paddingVertical: 80, alignItems: "center", gap: 8 },
  emptyCircle: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
