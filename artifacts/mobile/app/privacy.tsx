import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function PrivacyScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[s.container, { paddingTop: top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={s.lastUpdated}>Last Updated: March 26, 2026</Text>

        <Text style={s.body}>
          NutriSnap™ ("Company," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy describes how we collect, use, store, and share your personal information when you use the NutriSnap™ mobile application ("App"). By using the App, you consent to the practices described in this policy.
        </Text>

        <Text style={s.sectionTitle}>1. Information We Collect</Text>
        <Text style={s.subTitle}>a) Information You Provide</Text>
        <Text style={s.body}>
          • Account Information: When you sign in using Google or Apple, we receive your name, email address, and profile identifier from the authentication provider.{"\n"}
          • Profile Data: Information you provide during onboarding, including age, weight, height, gender, activity level, and nutrition goals.{"\n"}
          • Food Log Data: Meal names, calorie counts, macronutrient breakdowns, and timestamps you record.{"\n"}
          • Photographs: Food images you capture for AI nutritional analysis.
        </Text>

        <Text style={s.subTitle}>b) Information Collected Automatically</Text>
        <Text style={s.body}>
          • Device Information: Device type, operating system version, and unique device identifiers.{"\n"}
          • Usage Data: App interaction patterns, feature usage, screen views, and session duration.{"\n"}
          • Log Data: Error reports, crash logs, and diagnostic information.
        </Text>

        <Text style={s.subTitle}>c) Information from Third Parties</Text>
        <Text style={s.body}>
          • Google Sign-In: Name, email, and Google account identifier.{"\n"}
          • Apple Sign-In: Name (if provided), email (or Apple's private relay email), and Apple user identifier.{"\n"}
          • Barcode Data: Product information retrieved from food databases when you scan barcodes.
        </Text>

        <Text style={s.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={s.body}>
          We use your information for the following purposes:{"\n\n"}
          • Providing Services: To create and manage your account, track your nutrition, and deliver AI-powered meal analysis.{"\n"}
          • AI Analysis: Food photographs are sent to OpenAI's GPT Vision API for nutritional estimation. Images are processed in real-time and are not stored by OpenAI beyond the processing request.{"\n"}
          • Personalization: To customize your nutrition goals and daily recommendations based on your profile.{"\n"}
          • Improvement: To analyze usage patterns and improve App features, performance, and user experience.{"\n"}
          • Communication: To send important account notifications, updates, and security alerts.{"\n"}
          • Legal Compliance: To comply with applicable laws, regulations, and legal processes.
        </Text>

        <Text style={s.sectionTitle}>3. Data Storage & Security</Text>
        <Text style={s.body}>
          • Your data is stored in secure PostgreSQL databases hosted on encrypted, access-controlled servers.{"\n"}
          • All data transmission between the App and our servers uses TLS/SSL encryption.{"\n"}
          • Authentication tokens are stored securely on your device using platform-provided secure storage mechanisms.{"\n"}
          • We implement industry-standard security practices including access controls, monitoring, and regular security assessments.{"\n"}
          • Multi-user data isolation ensures that your data is only accessible to your authenticated account.{"\n\n"}
          While we take reasonable measures to protect your information, no method of electronic storage or transmission is 100% secure. We cannot guarantee absolute security.
        </Text>

        <Text style={s.sectionTitle}>4. Data Sharing & Disclosure</Text>
        <Text style={s.body}>
          We do not sell your personal information. We may share your data in the following limited circumstances:{"\n\n"}
          • Service Providers: With trusted third-party providers who assist in operating the App (e.g., OpenAI for AI analysis, cloud hosting providers). These providers are contractually obligated to protect your data.{"\n"}
          • Authentication Providers: Google and Apple process authentication data according to their own privacy policies.{"\n"}
          • Legal Requirements: When required by law, regulation, subpoena, or court order.{"\n"}
          • Safety: To protect the rights, property, or safety of NutriSnap™, our users, or the public.{"\n"}
          • Business Transfers: In connection with a merger, acquisition, or sale of assets, with appropriate notice to users.
        </Text>

        <Text style={s.sectionTitle}>5. Your Rights & Choices</Text>
        <Text style={s.body}>
          Depending on your jurisdiction, you may have the following rights:{"\n\n"}
          • Access: Request a copy of the personal data we hold about you.{"\n"}
          • Correction: Request correction of inaccurate or incomplete data.{"\n"}
          • Deletion: Request deletion of your account and associated data. You can delete your account through the App's settings or by contacting us.{"\n"}
          • Data Portability: Request your data in a portable, machine-readable format.{"\n"}
          • Opt-Out: Opt out of non-essential data collection and marketing communications.{"\n"}
          • Withdraw Consent: Withdraw consent for data processing where consent is the legal basis.{"\n\n"}
          To exercise these rights, contact us at privacy@nutrisnap.app. We will respond within 30 days.
        </Text>

        <Text style={s.sectionTitle}>6. Apple Sign-In & Hide My Email</Text>
        <Text style={s.body}>
          If you choose to use Apple's "Hide My Email" feature, Apple generates a unique, random email address that forwards to your personal email. We respect this choice and will use the relay email provided. We do not attempt to discover or collect your actual email address when you use this feature.
        </Text>

        <Text style={s.sectionTitle}>7. Children's Privacy</Text>
        <Text style={s.body}>
          NutriSnap™ is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we discover that a child under 13 has provided personal information, we will promptly delete it. If you believe a child under 13 has provided us with personal data, please contact us at privacy@nutrisnap.app.
        </Text>

        <Text style={s.sectionTitle}>8. Data Retention</Text>
        <Text style={s.body}>
          We retain your personal data for as long as your account is active or as needed to provide services. After account deletion:{"\n\n"}
          • Account data is permanently deleted within 30 days.{"\n"}
          • Food photographs are deleted immediately upon account deletion.{"\n"}
          • Anonymized, aggregated data may be retained for analytical purposes.{"\n"}
          • Backup copies are purged within 90 days of deletion.{"\n\n"}
          We may retain certain information longer if required by law or for legitimate business purposes such as fraud prevention.
        </Text>

        <Text style={s.sectionTitle}>9. International Data Transfers</Text>
        <Text style={s.body}>
          Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for international transfers, including standard contractual clauses and compliance with applicable data protection frameworks.
        </Text>

        <Text style={s.sectionTitle}>10. Cookies & Tracking</Text>
        <Text style={s.body}>
          The NutriSnap™ mobile app does not use browser cookies. We may use mobile analytics SDKs to collect anonymized usage data for improving the App experience. You can opt out of analytics tracking in the App's settings.
        </Text>

        <Text style={s.sectionTitle}>11. California Privacy Rights (CCPA)</Text>
        <Text style={s.body}>
          If you are a California resident, you have the right to:{"\n\n"}
          • Know what personal information is collected and how it is used{"\n"}
          • Request deletion of your personal information{"\n"}
          • Opt out of the sale of personal information (we do not sell personal data){"\n"}
          • Non-discrimination for exercising your privacy rights
        </Text>

        <Text style={s.sectionTitle}>12. European Privacy Rights (GDPR)</Text>
        <Text style={s.body}>
          If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have additional rights under the General Data Protection Regulation (GDPR), including the right to lodge a complaint with your local data protection authority. Our legal basis for processing your data includes consent, contractual necessity, and legitimate interests.
        </Text>

        <Text style={s.sectionTitle}>13. Changes to This Policy</Text>
        <Text style={s.body}>
          We may update this Privacy Policy from time to time. Changes will be effective upon posting within the App. We will notify you of material changes through in-app notifications or email. Your continued use of the App after changes are posted constitutes acceptance of the revised policy.
        </Text>

        <Text style={s.sectionTitle}>14. Contact Us</Text>
        <Text style={s.body}>
          If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at:{"\n\n"}
          NutriSnap™{"\n"}
          Privacy Team{"\n"}
          Email: privacy@nutrisnap.app{"\n"}
          Website: https://nutrisnap.app{"\n\n"}
          For data protection inquiries in the EU, you may also contact our designated Data Protection Officer at dpo@nutrisnap.app.
        </Text>

        <Text style={[s.body, { marginTop: 24, fontFamily: "Inter_600SemiBold" }]}>
          By using NutriSnap™, you acknowledge that you have read and understood this Privacy Policy and agree to the collection, use, and sharing of your information as described herein.
        </Text>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#fff" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24 },
  lastUpdated: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.4)",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginTop: 28,
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.85)",
    marginTop: 12,
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    lineHeight: 22,
    marginBottom: 8,
  },
});
