import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Dimensions,
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
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";
import { updateGoals } from "@workspace/api-client-react";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const ONBOARDING_KEY = "@onboarding_complete";

const GOALS = [
  { id: "lose", label: "Lose Weight", icon: "trending-down-outline" as const, desc: "Calorie deficit plan", cal: 1600, p: 130, c: 160, f: 55 },
  { id: "maintain", label: "Maintain Weight", icon: "swap-horizontal-outline" as const, desc: "Stay at your current weight", cal: 2000, p: 150, c: 200, f: 65 },
  { id: "gain", label: "Build Muscle", icon: "trending-up-outline" as const, desc: "Calorie surplus plan", cal: 2500, p: 180, c: 280, f: 80 },
  { id: "health", label: "Eat Healthier", icon: "heart-outline" as const, desc: "Focus on balanced nutrition", cal: 2000, p: 140, c: 220, f: 65 },
];

type Step = "welcome" | "height" | "weight" | "goal" | "complete";
const STEPS: Step[] = ["welcome", "height", "weight", "goal", "complete"];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("welcome");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("8");
  const [weight, setWeight] = useState("150");
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const topPad = Platform.OS === "web" ? 60 : insets.top;

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex) / (STEPS.length - 1);

  const animateTransition = useCallback((nextStep: Step) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  const goNext = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) {
      animateTransition(STEPS[idx + 1]);
    }
  }, [step, animateTransition]);

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) {
      animateTransition(STEPS[idx - 1]);
    }
  }, [step, animateTransition]);

  const handleComplete = useCallback(async () => {
    setSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const goal = GOALS.find(g => g.id === selectedGoal) ?? GOALS[1];
      await updateGoals({
        dailyCalories: goal.cal,
        dailyProtein: goal.p,
        dailyCarbs: goal.c,
        dailyFat: goal.f,
      });
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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {step !== "welcome" && step !== "complete" && (
        <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={goBack} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.progressBar}>
            <View style={[styles.progressTrack, { backgroundColor: colors.backgroundTertiary }]}>
              <Animated.View style={[styles.progressFill, { backgroundColor: colors.tint, width: `${progress * 100}%` }]} />
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>
      )}

      <Animated.View style={[styles.contentWrap, { opacity: fadeAnim }]}>
        {step === "welcome" && (
          <View style={[styles.welcomeContainer, { paddingTop: topPad + 60 }]}>
            <View style={styles.welcomeLogoWrap}>
              <View style={[styles.welcomeLogo, { backgroundColor: colors.tint }]}>
                <Ionicons name="flame" size={48} color="#fff" />
              </View>
            </View>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              Track smarter,{"\n"}not harder
            </Text>
            <Text style={[styles.welcomeSub, { color: colors.textSecondary }]}>
              AI-powered nutrition tracking that understands your food from a single photo
            </Text>
            <View style={styles.welcomeFeatures}>
              {[
                { icon: "camera-outline" as const, text: "Snap a photo, get instant nutrition" },
                { icon: "barcode-outline" as const, text: "Scan barcodes for packaged food" },
                { icon: "analytics-outline" as const, text: "Track macros with smart goals" },
              ].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: colors.tint + "15" }]}>
                    <Ionicons name={f.icon} size={20} color={colors.tint} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.text }]}>{f.text}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.bottomAction, { paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 16 }]}>
              <Pressable
                onPress={goNext}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: colors.tint, transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                <Text style={styles.primaryBtnText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        )}

        {step === "height" && (
          <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
            <View style={styles.stepHeader}>
              <Text style={[styles.stepEmoji]}>📏</Text>
              <Text style={[styles.stepTitle, { color: colors.text }]}>How tall are you?</Text>
              <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
                This helps us personalize your nutrition plan
              </Text>
            </View>
            <View style={styles.heightInputs}>
              <View style={styles.heightField}>
                <TextInput
                  value={heightFt}
                  onChangeText={setHeightFt}
                  keyboardType="number-pad"
                  style={[styles.bigInput, { color: colors.text, backgroundColor: colors.backgroundTertiary }]}
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                />
                <Text style={[styles.unitLabel, { color: colors.textSecondary }]}>ft</Text>
              </View>
              <View style={styles.heightField}>
                <TextInput
                  value={heightIn}
                  onChangeText={setHeightIn}
                  keyboardType="number-pad"
                  style={[styles.bigInput, { color: colors.text, backgroundColor: colors.backgroundTertiary }]}
                  maxLength={2}
                  textAlign="center"
                  selectTextOnFocus
                />
                <Text style={[styles.unitLabel, { color: colors.textSecondary }]}>in</Text>
              </View>
            </View>
            <View style={[styles.bottomAction, { paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 16 }]}>
              <Pressable
                onPress={goNext}
                disabled={!canProceed()}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: canProceed() ? colors.tint : colors.backgroundTertiary, transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                <Text style={[styles.primaryBtnText, { color: canProceed() ? "#fff" : colors.textTertiary }]}>Continue</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {step === "weight" && (
          <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
            <View style={styles.stepHeader}>
              <Text style={[styles.stepEmoji]}>⚖️</Text>
              <Text style={[styles.stepTitle, { color: colors.text }]}>What's your weight?</Text>
              <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
                We'll use this to calculate your ideal calorie target
              </Text>
            </View>
            <View style={styles.weightInputWrap}>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                style={[styles.bigInput, styles.weightInput, { color: colors.text, backgroundColor: colors.backgroundTertiary }]}
                maxLength={5}
                textAlign="center"
                selectTextOnFocus
              />
              <Text style={[styles.unitLabel, { color: colors.textSecondary }]}>lbs</Text>
            </View>
            <View style={[styles.bottomAction, { paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 16 }]}>
              <Pressable
                onPress={goNext}
                disabled={!canProceed()}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: canProceed() ? colors.tint : colors.backgroundTertiary, transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                <Text style={[styles.primaryBtnText, { color: canProceed() ? "#fff" : colors.textTertiary }]}>Continue</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {step === "goal" && (
          <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
            <View style={styles.stepHeader}>
              <Text style={[styles.stepEmoji]}>🎯</Text>
              <Text style={[styles.stepTitle, { color: colors.text }]}>What's your goal?</Text>
              <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
                We'll set up your daily targets accordingly
              </Text>
            </View>
            <View style={styles.goalList}>
              {GOALS.map((g) => (
                <Pressable
                  key={g.id}
                  onPress={() => { setSelectedGoal(g.id); Haptics.selectionAsync(); }}
                  style={[
                    styles.goalCard,
                    {
                      backgroundColor: selectedGoal === g.id ? colors.tint + "12" : colors.backgroundTertiary,
                    },
                    selectedGoal === g.id && { borderColor: colors.tint, borderWidth: 1.5 },
                  ]}
                >
                  <View style={[styles.goalIcon, { backgroundColor: selectedGoal === g.id ? colors.tint + "20" : colors.background }]}>
                    <Ionicons name={g.icon} size={22} color={selectedGoal === g.id ? colors.tint : colors.textSecondary} />
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={[styles.goalLabel, { color: colors.text }]}>{g.label}</Text>
                    <Text style={[styles.goalDesc, { color: colors.textSecondary }]}>{g.desc}</Text>
                  </View>
                  {selectedGoal === g.id && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.tint} />
                  )}
                </Pressable>
              ))}
            </View>
            <View style={[styles.bottomAction, { paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 16 }]}>
              <Pressable
                onPress={goNext}
                disabled={!canProceed()}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: canProceed() ? colors.tint : colors.backgroundTertiary, transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                <Text style={[styles.primaryBtnText, { color: canProceed() ? "#fff" : colors.textTertiary }]}>Continue</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {step === "complete" && (
          <View style={[styles.completeContainer, { paddingTop: topPad + 80 }]}>
            <View style={styles.completeRing}>
              <Svg width={120} height={120} style={{ transform: [{ rotate: "-90deg" }] }}>
                <Circle cx={60} cy={60} r={52} stroke={colors.backgroundTertiary} strokeWidth={8} fill="none" />
                <Circle cx={60} cy={60} r={52} stroke={colors.tint} strokeWidth={8} fill="none" strokeDasharray={2 * Math.PI * 52} strokeDashoffset={0} strokeLinecap="round" />
              </Svg>
              <View style={StyleSheet.absoluteFill}>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="checkmark" size={48} color={colors.tint} />
                </View>
              </View>
            </View>
            <Text style={[styles.completeTitle, { color: colors.text }]}>You're all set!</Text>
            <Text style={[styles.completeSub, { color: colors.textSecondary }]}>
              Your personalized plan is ready.{"\n"}Start scanning your meals to track nutrition.
            </Text>
            {selectedGoal && (
              <View style={[styles.goalSummary, { backgroundColor: colors.backgroundTertiary }]}>
                {(() => {
                  const g = GOALS.find(x => x.id === selectedGoal)!;
                  return (
                    <>
                      <View style={styles.goalSummaryRow}>
                        <Text style={[styles.goalSummaryLabel, { color: colors.textSecondary }]}>Daily calories</Text>
                        <Text style={[styles.goalSummaryValue, { color: colors.tint }]}>{g.cal} kcal</Text>
                      </View>
                      <View style={styles.goalSummaryRow}>
                        <Text style={[styles.goalSummaryLabel, { color: colors.textSecondary }]}>Protein</Text>
                        <Text style={[styles.goalSummaryValue, { color: colors.protein }]}>{g.p}g</Text>
                      </View>
                      <View style={styles.goalSummaryRow}>
                        <Text style={[styles.goalSummaryLabel, { color: colors.textSecondary }]}>Carbs</Text>
                        <Text style={[styles.goalSummaryValue, { color: colors.carbs }]}>{g.c}g</Text>
                      </View>
                      <View style={styles.goalSummaryRow}>
                        <Text style={[styles.goalSummaryLabel, { color: colors.textSecondary }]}>Fat</Text>
                        <Text style={[styles.goalSummaryValue, { color: colors.fat }]}>{g.f}g</Text>
                      </View>
                    </>
                  );
                })()}
              </View>
            )}
            <View style={[styles.bottomAction, { paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 16 }]}>
              <Pressable
                onPress={handleComplete}
                disabled={saving}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: colors.tint, opacity: saving ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                <Text style={styles.primaryBtnText}>{saving ? "Setting up..." : "Start Tracking"}</Text>
                {!saving && <Ionicons name="arrow-forward" size={18} color="#fff" />}
              </Pressable>
            </View>
          </View>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: { flex: 1 },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  contentWrap: { flex: 1 },
  welcomeContainer: {
    flex: 1,
    paddingHorizontal: 28,
  },
  welcomeLogoWrap: {
    marginBottom: 40,
    alignItems: "center",
  },
  welcomeLogo: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeTitle: {
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    textAlign: "center",
    lineHeight: 42,
    marginBottom: 14,
  },
  welcomeSub: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  welcomeFeatures: {
    gap: 16,
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  stepContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
  },
  stepHeader: {
    alignItems: "center",
    marginBottom: 40,
    gap: 10,
  },
  stepEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  stepSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  heightInputs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 32,
  },
  heightField: {
    alignItems: "center",
    gap: 8,
  },
  bigInput: {
    width: 100,
    height: 72,
    borderRadius: 20,
    fontSize: 36,
    fontFamily: "Inter_700Bold",
  },
  unitLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  weightInputWrap: {
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  weightInput: {
    width: 160,
  },
  goalList: {
    gap: 10,
    marginBottom: 32,
  },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    gap: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  goalInfo: {
    flex: 1,
    gap: 2,
  },
  goalLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  goalDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  completeContainer: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  completeRing: {
    marginBottom: 32,
    position: "relative",
    width: 120,
    height: 120,
  },
  completeTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  completeSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  goalSummary: {
    width: "100%",
    borderRadius: 18,
    padding: 18,
    gap: 12,
    marginBottom: 32,
  },
  goalSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalSummaryLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  goalSummaryValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  bottomAction: {
    marginTop: "auto",
    paddingTop: 16,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 18,
  },
  primaryBtnText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
