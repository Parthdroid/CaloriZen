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
const TYPE_ICON: Record<string, string> = { breakfast: "sunny", lunch: "partly-sunny", dinner: "moon", snack: "cafe" };
const TYPE_COLOR: Record<string, string> = { breakfast: "#FFB347", lunch: "#34C759", dinner: "#8B5CF6", snack: "#007AFF" };

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
              style={[st.dateBtn, active && st.dateBtnActive]}
            >
              <Text style={[st.dateLabel, { color: active ? "#fff" : "#AEAEB2" }]}>{d.label}</Text>
              <Text style={[st.dateNum, { color: active ? "#fff" : colors.text }]}>{d.day}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {meals.length > 0 && (
        <View style={st.summary}>
          <View style={st.sumItem}>
            <Text style={[st.sumVal, { color: colors.tint }]}>{Math.round(totalCal)}</Text>
            <Text style={st.sumLabel}>kcal</Text>
          </View>
          <View style={st.sumDivider} />
          <View style={st.sumItem}>
            <Text style={[st.sumVal, { color: colors.protein }]}>{Math.round(totalP)}g</Text>
            <Text style={st.sumLabel}>protein</Text>
          </View>
          <View style={st.sumDivider} />
          <View style={st.sumItem}>
            <Text style={[st.sumVal, { color: colors.carbs }]}>{Math.round(totalC)}g</Text>
            <Text style={st.sumLabel}>carbs</Text>
          </View>
          <View style={st.sumDivider} />
          <View style={st.sumItem}>
            <Text style={[st.sumVal, { color: colors.fat }]}>{Math.round(totalF)}g</Text>
            <Text style={st.sumLabel}>fat</Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad + 100 }} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={st.empty}><Text style={st.emptyText}>Loading...</Text></View>
        ) : meals.length === 0 ? (
          <View style={st.empty}>
            <View style={st.emptyCircle}>
              <Ionicons name="calendar-outline" size={28} color="#AEAEB2" />
            </View>
            <Text style={st.emptyTitle}>No meals logged</Text>
            <Text style={st.emptyText}>Use the Scan tab to log your meals</Text>
          </View>
        ) : (
          <>
            {TYPES.map((t) => {
              const tm = byType[t];
              if (!tm || tm.length === 0) return null;
              return (
                <View key={t} style={st.section}>
                  <View style={st.sectionHeader}>
                    <Ionicons name={TYPE_ICON[t] as keyof typeof Ionicons.glyphMap} size={14} color={TYPE_COLOR[t]} />
                    <Text style={st.sectionTitle}>{TYPE_LABEL[t]}</Text>
                  </View>
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
  dateBtn: { alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, gap: 2, minWidth: 52, backgroundColor: "#fff" },
  dateBtnActive: { backgroundColor: "#1A1A1A" },
  dateLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  dateNum: { fontSize: 20, fontFamily: "Inter_700Bold" },

  summary: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginHorizontal: 20,
    borderRadius: 18,
    paddingVertical: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sumItem: { alignItems: "center" },
  sumVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sumLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2, color: "#AEAEB2" },
  sumDivider: { width: 1, height: 28, backgroundColor: "#F0F0F0" },

  section: { marginBottom: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 24, paddingVertical: 10 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, color: "#AEAEB2" },

  empty: { paddingVertical: 80, alignItems: "center", gap: 10 },
  emptyCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#F2F2F7", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#3C3C43" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", color: "#AEAEB2" },
});
