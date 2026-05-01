import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const STEPS = [
  { step: 1, icon: "person-circle-outline" as const, title: "Dados Pessoais", desc: "Confirme o nome e dados de contacto da sua conta" },
  { step: 2, icon: "card-outline" as const, title: "Documentos de Identidade", desc: "Envie frente e verso do seu Bilhete de Identidade" },
  { step: 3, icon: "camera-outline" as const, title: "Selfie de Confirmação", desc: "Tire uma selfie segurando o seu BI para validação" },
  { step: 4, icon: "shield-checkmark-outline" as const, title: "Revisão pelo Admin", desc: "A equipa valida os documentos em 24-48h" },
];

export default function KycIndexScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sessão necessária</Text>
        <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>Entre na sua conta para iniciar a verificação.</Text>
        <Pressable onPress={() => router.push("/auth/login")} style={[styles.btn, { backgroundColor: colors.primary }]}>
          <Text style={styles.btnText}>Entrar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.profileCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
            {user!.nome.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>{user!.nome}</Text>
          <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user!.email}</Text>
        </View>
      </View>

      <View style={[styles.infoBadge, { backgroundColor: "#007AFF18", borderColor: "#007AFF40" }]}>
        <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
        <Text style={styles.infoText}>
          A verificação KYC é obrigatória para emissão de cartões virtuais.
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Como funciona</Text>

      {STEPS.map((s) => (
        <View key={s.step} style={styles.stepRow}>
          <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
            <Text style={[styles.stepNum, { color: colors.primaryForeground }]}>{s.step}</Text>
          </View>
          <View style={[styles.stepLine, { backgroundColor: colors.border }, s.step === STEPS.length && { backgroundColor: "transparent" }]} />
          <View style={styles.stepContent}>
            <View style={[styles.stepIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name={s.icon} size={20} color={colors.foreground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>{s.title}</Text>
              <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
            </View>
          </View>
        </View>
      ))}

      <Pressable
        onPress={() => router.push("/kyc/documentos")}
        style={({ pressed }) => [styles.btn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
      >
        <Ionicons name="arrow-forward-outline" size={18} color="#fff" />
        <Text style={styles.btnText}>Iniciar verificação</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/kyc/estado")} style={styles.link}>
        <Text style={[styles.linkText, { color: colors.mutedForeground }]}>Ver estado da minha verificação</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 20 },
  profileName: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  profileEmail: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  infoBadge: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    borderRadius: 10,
    borderWidth: 1,
    padding: 13,
    marginBottom: 24,
  },
  infoText: { flex: 1, color: "#007AFF", fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, marginBottom: 20 },
  stepRow: { flexDirection: "row", marginBottom: 0, gap: 0 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", zIndex: 1 },
  stepNum: { fontFamily: "Inter_700Bold", fontSize: 13 },
  stepLine: { width: 2, marginLeft: 13, marginTop: -2, flex: 1, minHeight: 16 },
  stepContent: { flexDirection: "row", gap: 12, paddingLeft: 12, paddingBottom: 24, flex: 1 },
  stepIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  stepTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 3 },
  stepDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 12,
    marginTop: 8,
  },
  btnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
  link: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10 },
  linkText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
