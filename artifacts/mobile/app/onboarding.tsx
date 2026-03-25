import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  ScrollView,
  Animated,
  Easing,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { updateGoals } from "@workspace/api-client-react";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";

const ONBOARDING_KEY = "@onboarding_complete";

const GOALS = [
  { id: "lose", label: "Lose Weight", icon: "trending-down-outline" as const, emoji: "🔥", desc: "Calorie deficit to burn fat", cal: 1600, p: 130, c: 160, f: 55 },
  { id: "maintain", label: "Maintain Weight", icon: "swap-horizontal-outline" as const, emoji: "⚖️", desc: "Stay at your current weight", cal: 2000, p: 150, c: 200, f: 65 },
  { id: "gain", label: "Build Muscle", icon: "trending-up-outline" as const, emoji: "💪", desc: "Surplus for muscle growth", cal: 2500, p: 180, c: 280, f: 80 },
  { id: "health", label: "Eat Healthier", icon: "heart-outline" as const, emoji: "🥗", desc: "Balanced nutrition focus", cal: 2000, p: 140, c: 220, f: 65 },
];

type Step = "welcome" | "height" | "weight" | "goal" | "complete";
const STEPS: Step[] = ["welcome", "height", "weight", "goal", "complete"];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("welcome");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("8");
  const [weight, setWeight] = useState("150");
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 60 : insets.top;
  const bottomPad = Platform.OS === "web" ? 40 : insets.bottom + 16;

  const stepIndex = STEPS.indexOf(step);
  const progress = stepIndex / (STEPS.length - 1);

  const animateTransition = useCallback((nextStep: Step) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 20, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(-20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const goNext = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) animateTransition(STEPS[idx + 1]);
  }, [step, animateTransition]);

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) animateTransition(STEPS[idx - 1]);
  }, [step, animateTransition]);

  const handleComplete = useCallback(async () => {
    setSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const goal = GOALS.find(g => g.id === selectedGoal) ?? GOALS[1];
      await updateGoals({ dailyCalories: goal.cal, dailyProtein: goal.p, dailyCarbs: goal.c, dailyFat: goal.f });
    } catch {}
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(tabs)");
  }, [selectedGoal]);

  const canProceed = () => {
    switch (step) {
      case "welcome": return true;
      case "height": return heightFt.length > 0 && heightIn.length > 0;
      case "weight": return weight.length > 0 && parseFloat(weight) > 0;
      case "goal": return selectedGoal !== null;
      default: return true;
    }
  };

  const renderProgressDots = () => (
    <View style={s.dotsRow}>
      {STEPS.slice(1, -1).map((_, i) => (
        <View key={i} style={[s.dot, { backgroundColor: i < stepIndex ? "#FF6B35" : i === stepIndex - 1 ? "#FF6B35" : "rgba(255,255,255,0.2)" }]} />
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ExpoLinearGradient colors={["#0F0F0F", "#1A1A2E", "#0F0F0F"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      {step !== "welcome" && step !== "complete" && (
        <View style={[s.topBar, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={goBack} style={s.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.7)" />
          </Pressable>
          <View style={s.progressBarWrap}>
            <View style={s.progressTrack}>
              <Animated.View style={[s.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>
      )}

      <Animated.View style={[s.contentWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {step === "welcome" && (
          <View style={[s.welcomeContainer, { paddingTop: topPad + 80 }]}>
            <View style={s.logoBadge}>
              <ExpoLinearGradient colors={["#FF6B35", "#FF8A5C"]} style={s.logoGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="flame" size={36} color="#fff" />
              </ExpoLinearGradient>
            </View>

            <Text style={s.welcomeTitle}>Track smarter,{"\n"}not harder</Text>
            <Text style={s.welcomeSub}>AI-powered nutrition tracking that understands{"\n"}your food from a single photo</Text>

            <View style={s.featureList}>
              {[
                { icon: "camera" as const, text: "Snap a photo, get instant nutrition" },
                { icon: "barcode" as const, text: "Scan barcodes for packaged food" },
                { icon: "analytics" as const, text: "Track macros with smart goals" },
              ].map((f, i) => (
                <View key={i} style={s.featureRow}>
                  <View style={s.featureIconWrap}>
                    <Ionicons name={f.icon} size={18} color="#FF6B35" />
                  </View>
                  <Text style={s.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>

            <View style={[s.bottomAction, { paddingBottom: bottomPad }]}>
              <Pressable
                onPress={goNext}
                style={({ pressed }) => [s.primaryBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
              >
                <ExpoLinearGradient colors={["#FF6B35", "#FF8A5C"]} style={s.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.primaryBtnText}>Get Started</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </ExpoLinearGradient>
              </Pressable>
            </View>
          </View>
        )}

        {step === "height" && (
          <ScrollView contentContainerStyle={s.stepContent} keyboardShouldPersistTaps="handled">
            <View style={s.stepHeader}>
              <Text style={s.stepNum}>01</Text>
              <Text style={s.stepTitle}>How tall are you?</Text>
              <Text style={s.stepSub}>This helps us personalize your nutrition plan</Text>
            </View>
            <View style={s.heightInputs}>
              <View style={s.inputBlock}>
                <TextInput value={heightFt} onChangeText={setHeightFt} keyboardType="number-pad" style={s.bigInput} maxLength={1} textAlign="center" selectTextOnFocus placeholderTextColor="rgba(255,255,255,0.2)" />
                <Text style={s.inputUnit}>ft</Text>
              </View>
              <View style={s.inputBlock}>
                <TextInput value={heightIn} onChangeText={setHeightIn} keyboardType="number-pad" style={s.bigInput} maxLength={2} textAlign="center" selectTextOnFocus placeholderTextColor="rgba(255,255,255,0.2)" />
                <Text style={s.inputUnit}>in</Text>
              </View>
            </View>
            {renderProgressDots()}
            <View style={[s.bottomAction, { paddingBottom: bottomPad }]}>
              <Pressable onPress={goNext} disabled={!canProceed()} style={({ pressed }) => [s.primaryBtn, { opacity: canProceed() ? 1 : 0.4, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                <ExpoLinearGradient colors={canProceed() ? ["#FF6B35", "#FF8A5C"] : ["#333", "#333"]} style={s.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.primaryBtnText}>Continue</Text>
                </ExpoLinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {step === "weight" && (
          <ScrollView contentContainerStyle={s.stepContent} keyboardShouldPersistTaps="handled">
            <View style={s.stepHeader}>
              <Text style={s.stepNum}>02</Text>
              <Text style={s.stepTitle}>Current weight?</Text>
              <Text style={s.stepSub}>We'll calculate your ideal calorie target</Text>
            </View>
            <View style={s.weightInputWrap}>
              <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" style={[s.bigInput, { width: 180 }]} maxLength={5} textAlign="center" selectTextOnFocus placeholderTextColor="rgba(255,255,255,0.2)" />
              <Text style={s.inputUnit}>lbs</Text>
            </View>
            {renderProgressDots()}
            <View style={[s.bottomAction, { paddingBottom: bottomPad }]}>
              <Pressable onPress={goNext} disabled={!canProceed()} style={({ pressed }) => [s.primaryBtn, { opacity: canProceed() ? 1 : 0.4, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                <ExpoLinearGradient colors={canProceed() ? ["#FF6B35", "#FF8A5C"] : ["#333", "#333"]} style={s.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.primaryBtnText}>Continue</Text>
                </ExpoLinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {step === "goal" && (
          <ScrollView contentContainerStyle={s.stepContent} showsVerticalScrollIndicator={false}>
            <View style={s.stepHeader}>
              <Text style={s.stepNum}>03</Text>
              <Text style={s.stepTitle}>What's your goal?</Text>
              <Text style={s.stepSub}>We'll customize your daily targets</Text>
            </View>
            <View style={s.goalList}>
              {GOALS.map((g) => {
                const sel = selectedGoal === g.id;
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => { setSelectedGoal(g.id); Haptics.selectionAsync(); }}
                    style={[s.goalCard, sel && s.goalCardSelected]}
                  >
                    <Text style={s.goalEmoji}>{g.emoji}</Text>
                    <View style={s.goalInfo}>
                      <Text style={[s.goalLabel, sel && { color: "#FF6B35" }]}>{g.label}</Text>
                      <Text style={s.goalDesc}>{g.desc}</Text>
                    </View>
                    {sel && <Ionicons name="checkmark-circle" size={22} color="#FF6B35" />}
                  </Pressable>
                );
              })}
            </View>
            {renderProgressDots()}
            <View style={[s.bottomAction, { paddingBottom: bottomPad }]}>
              <Pressable onPress={goNext} disabled={!canProceed()} style={({ pressed }) => [s.primaryBtn, { opacity: canProceed() ? 1 : 0.4, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                <ExpoLinearGradient colors={canProceed() ? ["#FF6B35", "#FF8A5C"] : ["#333", "#333"]} style={s.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.primaryBtnText}>Continue</Text>
                </ExpoLinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {step === "complete" && (
          <View style={[s.completeContainer, { paddingTop: topPad + 60 }]}>
            <View style={s.completeRing}>
              <Svg width={140} height={140}>
                <Defs>
                  <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#FF6B35" />
                    <Stop offset="1" stopColor="#FF8A5C" />
                  </LinearGradient>
                </Defs>
                <Circle cx={70} cy={70} r={60} stroke="rgba(255,255,255,0.08)" strokeWidth={8} fill="none" />
                <Circle cx={70} cy={70} r={60} stroke="url(#ring)" strokeWidth={8} fill="none" strokeDasharray={2 * Math.PI * 60} strokeDashoffset={0} strokeLinecap="round" transform="rotate(-90 70 70)" />
              </Svg>
              <View style={StyleSheet.absoluteFill}>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="checkmark" size={52} color="#FF6B35" />
                </View>
              </View>
            </View>
            <Text style={s.completeTitle}>You're all set!</Text>
            <Text style={s.completeSub}>Your personalized plan is ready.{"\n"}Start scanning meals to track nutrition.</Text>

            {selectedGoal && (() => {
              const g = GOALS.find(x => x.id === selectedGoal)!;
              return (
                <View style={s.summaryCard}>
                  {[
                    { label: "Daily calories", val: `${g.cal} kcal`, color: "#FF6B35" },
                    { label: "Protein", val: `${g.p}g`, color: "#3B82F6" },
                    { label: "Carbs", val: `${g.c}g`, color: "#F59E0B" },
                    { label: "Fat", val: `${g.f}g`, color: "#EF4444" },
                  ].map((r, i) => (
                    <View key={i} style={s.summaryRow}>
                      <Text style={s.summaryLabel}>{r.label}</Text>
                      <Text style={[s.summaryValue, { color: r.color }]}>{r.val}</Text>
                    </View>
                  ))}
                </View>
              );
            })()}

            <View style={[s.bottomAction, { paddingBottom: bottomPad }]}>
              <Pressable onPress={handleComplete} disabled={saving} style={({ pressed }) => [s.primaryBtn, { opacity: saving ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                <ExpoLinearGradient colors={["#FF6B35", "#FF8A5C"]} style={s.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.primaryBtnText}>{saving ? "Setting up..." : "Start Tracking"}</Text>
                  {!saving && <Ionicons name="arrow-forward" size={18} color="#fff" />}
                </ExpoLinearGradient>
              </Pressable>
            </View>
          </View>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8, gap: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  progressBarWrap: { flex: 1 },
  progressTrack: { height: 3, borderRadius: 1.5, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 1.5, backgroundColor: "#FF6B35" },
  contentWrap: { flex: 1 },
  welcomeContainer: { flex: 1, paddingHorizontal: 32 },
  logoBadge: { alignItems: "center", marginBottom: 48 },
  logoGradient: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  welcomeTitle: { fontSize: 38, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center", letterSpacing: -1.5, lineHeight: 46, marginBottom: 16 },
  welcomeSub: { fontSize: 16, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 24, marginBottom: 48 },
  featureList: { gap: 20, marginBottom: 40 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  featureIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(255,107,53,0.12)", alignItems: "center", justifyContent: "center" },
  featureText: { fontSize: 15, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)", flex: 1 },
  stepContent: { flexGrow: 1, paddingHorizontal: 32, paddingTop: 40 },
  stepHeader: { alignItems: "center", marginBottom: 48, gap: 10 },
  stepNum: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FF6B35", letterSpacing: 2 },
  stepTitle: { fontSize: 30, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -1, textAlign: "center" },
  stepSub: { fontSize: 15, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)", textAlign: "center", lineHeight: 22 },
  heightInputs: { flexDirection: "row", justifyContent: "center", gap: 24, marginBottom: 40 },
  inputBlock: { alignItems: "center", gap: 10 },
  bigInput: { width: 110, height: 80, borderRadius: 24, fontSize: 40, fontFamily: "Inter_700Bold", color: "#fff", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  inputUnit: { fontSize: 15, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.4)" },
  weightInputWrap: { alignItems: "center", gap: 10, marginBottom: 40 },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  goalList: { gap: 12, marginBottom: 32 },
  goalCard: { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 20, gap: 14, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.06)" },
  goalCardSelected: { backgroundColor: "rgba(255,107,53,0.08)", borderColor: "rgba(255,107,53,0.3)" },
  goalEmoji: { fontSize: 28 },
  goalInfo: { flex: 1, gap: 3 },
  goalLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  goalDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)" },
  completeContainer: { flex: 1, paddingHorizontal: 32, alignItems: "center" },
  completeRing: { marginBottom: 36, position: "relative", width: 140, height: 140 },
  completeTitle: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.8, marginBottom: 12 },
  completeSub: { fontSize: 15, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)", textAlign: "center", lineHeight: 22, marginBottom: 32 },
  summaryCard: { width: "100%", borderRadius: 20, padding: 20, gap: 14, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 32 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)" },
  summaryValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  bottomAction: { marginTop: "auto", paddingTop: 16 },
  primaryBtn: { borderRadius: 18, overflow: "hidden" },
  btnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 18 },
  primaryBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
