import { Ionicons } from "@expo/vector-icons";
import { useKycGetStatus } from "@workspace/api-client-react";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const STATUS_CONFIG = {
  not_submitted: {
    icon: "document-outline" as const,
    iconBg: "#636366",
    title: "Não submetido",
    desc: "Ainda não iniciou o processo de verificação.",
    color: "#636366",
  },
  pending: {
    icon: "time-outline" as const,
    iconBg: "#FF9500",
    title: "Em análise",
    desc: "Os seus documentos estão a ser analisados pela equipa. Este processo demora 24-48h.",
    color: "#FF9500",
  },
  approved: {
    icon: "shield-checkmark" as const,
    iconBg: "#34C759",
    title: "Verificado",
    desc: "A sua identidade foi verificada. Já pode emitir cartões virtuais.",
    color: "#34C759",
  },
  rejected: {
    icon: "close-circle" as const,
    iconBg: "#FF3B30",
    title: "Rejeitado",
    desc: "Os seus documentos foram rejeitados. Corrija os problemas e resubmeta.",
    color: "#FF3B30",
  },
};

export default function KycEstadoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useKycGetStatus({ query: { refetchInterval: 30_000 } as never });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.mutedForeground} />
      </View>
    );
  }

  const status = (data?.status ?? "not_submitted") as keyof typeof STATUS_CONFIG;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_submitted;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.statusCard, { borderColor: cfg.color + "60" }]}>
        <View style={[styles.statusIcon, { backgroundColor: cfg.iconBg + "20" }]}>
          <Ionicons name={cfg.icon} size={48} color={cfg.iconBg} />
        </View>
        <Text style={[styles.statusTitle, { color: colors.foreground }]}>{cfg.title}</Text>
        <Text style={[styles.statusDesc, { color: colors.mutedForeground }]}>{cfg.desc}</Text>
        {status === "rejected" && data?.rejectReason && (
          <View style={[styles.rejectBox, { backgroundColor: "#FF3B3012", borderColor: "#FF3B3040" }]}>
            <Ionicons name="alert-circle-outline" size={15} color="#FF3B30" />
            <Text style={styles.rejectText}>{data.rejectReason}</Text>
          </View>
        )}
      </View>

      {data?.uploadedDocs && data.uploadedDocs.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DOCUMENTOS ENVIADOS</Text>
          <View style={[styles.docList, { borderColor: colors.border }]}>
            {data.uploadedDocs.map((d, i) => (
              <View
                key={d.tipo}
                style={[
                  styles.docRow,
                  { borderBottomColor: colors.border },
                  i === data.uploadedDocs.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={[styles.docIcon, { backgroundColor: "#34C75920" }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                </View>
                <Text style={[styles.docLabel, { color: colors.foreground }]}>
                  {{ bi_frente: "BI — Frente", bi_verso: "BI — Verso", selfie: "Selfie com BI" }[d.tipo] ?? d.tipo}
                </Text>
                <Text style={[styles.docDate, { color: colors.mutedForeground }]}>
                  {new Date(d.uploadedAt).toLocaleDateString("pt-AO")}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {status === "not_submitted" || status === "rejected" ? (
        <Pressable
          onPress={() => router.push("/kyc/documentos")}
          style={({ pressed }) => [styles.btn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
        >
          <Ionicons name={status === "rejected" ? "refresh-outline" : "arrow-forward-outline"} size={18} color="#fff" />
          <Text style={styles.btnText}>
            {status === "rejected" ? "Resubmeter documentos" : "Iniciar verificação"}
          </Text>
        </Pressable>
      ) : null}

      {status === "approved" && (
        <Pressable
          onPress={() => router.push("/(tabs)/cartoes")}
          style={({ pressed }) => [styles.btn, { backgroundColor: "#34C759", opacity: pressed ? 0.8 : 1 }]}
        >
          <Ionicons name="card-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Ver os meus cartões</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  statusCard: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 32,
    marginBottom: 28,
    gap: 12,
  },
  statusIcon: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statusTitle: { fontFamily: "Inter_700Bold", fontSize: 22 },
  statusDesc: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
  rejectBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  rejectText: { flex: 1, color: "#FF3B30", fontFamily: "Inter_400Regular", fontSize: 13 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.8, marginBottom: 10 },
  docList: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden", marginBottom: 24 },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  docIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  docLabel: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14 },
  docDate: { fontFamily: "Inter_400Regular", fontSize: 12 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 15,
  },
  btnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
});
