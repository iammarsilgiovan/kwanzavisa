import { Ionicons } from "@expo/vector-icons";
import { useAdminListKyc, useAdminReviewKyc } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentProps<typeof Ionicons>["name"] }> = {
  not_submitted: { label: "Não submetido", color: "#636366", icon: "document-outline" },
  pending: { label: "Pendente", color: "#FF9500", icon: "time-outline" },
  approved: { label: "Aprovado", color: "#34C759", icon: "shield-checkmark-outline" },
  rejected: { label: "Rejeitado", color: "#FF3B30", icon: "close-circle-outline" },
};

type KycEntry = {
  userId: string;
  status: string;
  rejectReason?: string | null;
  reviewedBy?: string | null;
  formattedDate: string;
  user?: { id: string; nome: string; email: string } | null;
};

function KycCard({ entry, onReview, colors }: { entry: KycEntry; onReview: (userId: string, action: "approve" | "reject") => void; colors: ReturnType<typeof useColors> }) {
  const cfg = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.not_submitted;
  const isPending = entry.status === "pending";

  return (
    <View style={[cardStyles.card, { borderColor: colors.border, backgroundColor: colors.background }]}>
      <View style={[cardStyles.bar, { backgroundColor: cfg.color }]} />
      <View style={cardStyles.body}>
        <View style={cardStyles.top}>
          <View style={[cardStyles.icon, { backgroundColor: cfg.color + "20" }]}>
            <Ionicons name={cfg.icon} size={18} color={cfg.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[cardStyles.name, { color: colors.foreground }]} numberOfLines={1}>
              {entry.user?.nome ?? entry.userId}
            </Text>
            <Text style={[cardStyles.email, { color: colors.mutedForeground }]} numberOfLines={1}>
              {entry.user?.email ?? "—"}
            </Text>
          </View>
          <View style={[cardStyles.badge, { backgroundColor: cfg.color + "20" }]}>
            <Text style={[cardStyles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {entry.rejectReason && (
          <View style={[cardStyles.rejectBox, { backgroundColor: "#FF3B3010", borderColor: "#FF3B3030" }]}>
            <Ionicons name="alert-circle-outline" size={13} color="#FF3B30" />
            <Text style={cardStyles.rejectText}>{entry.rejectReason}</Text>
          </View>
        )}

        <View style={cardStyles.footer}>
          <Text style={[cardStyles.date, { color: colors.mutedForeground }]}>{entry.formattedDate}</Text>
          {isPending && (
            <View style={cardStyles.actions}>
              <Pressable
                onPress={() => onReview(entry.userId, "approve")}
                style={({ pressed }) => [cardStyles.approveBtn, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Ionicons name="checkmark" size={14} color="#fff" />
                <Text style={cardStyles.approveBtnText}>Aprovar</Text>
              </Pressable>
              <Pressable
                onPress={() => onReview(entry.userId, "reject")}
                style={({ pressed }) => [cardStyles.rejectBtn, { borderColor: "#FF3B3040", opacity: pressed ? 0.75 : 1 }]}
              >
                <Ionicons name="close" size={14} color="#FF3B30" />
                <Text style={cardStyles.rejectBtnText}>Rejeitar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: { flexDirection: "row", borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10, overflow: "hidden" },
  bar: { width: 4 },
  body: { flex: 1, padding: 14 },
  top: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  email: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  rejectBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 10 },
  rejectText: { flex: 1, color: "#FF3B30", fontFamily: "Inter_400Regular", fontSize: 12 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  date: { fontFamily: "Inter_400Regular", fontSize: 12 },
  actions: { flexDirection: "row", gap: 8 },
  approveBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#34C759", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  approveBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 },
  rejectBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  rejectBtnText: { color: "#FF3B30", fontFamily: "Inter_600SemiBold", fontSize: 12 },
});

type ListItem = { type: "filter" } | { type: "entry"; entry: KycEntry };

export default function AdminKycScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [statusFilter, setStatusFilter] = useState("pending");

  const { data, isLoading, refetch, isRefetching } = useAdminListKyc(
    { status: statusFilter || undefined },
    { query: { refetchInterval: 30_000 } as never }
  );
  const { mutateAsync: reviewKyc } = useAdminReviewKyc();

  const handleReview = (userId: string, action: "approve" | "reject") => {
    if (action === "reject") {
      Alert.prompt
        ? Alert.prompt("Motivo de rejeição", "Indique o motivo:", async (reason) => {
            if (!reason?.trim()) return;
            try {
              await reviewKyc({ userId, data: { action: "reject", rejectReason: reason.trim(), reviewedBy: "admin-mobile" } });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              refetch();
            } catch { Alert.alert("Erro", "Não foi possível rejeitar o KYC."); }
          })
        : Alert.alert("Rejeitar KYC", "Esta acção irá rejeitar a verificação de identidade.", [
            { text: "Cancelar", style: "cancel" },
            { text: "Rejeitar", style: "destructive", onPress: async () => {
              try {
                await reviewKyc({ userId, data: { action: "reject", rejectReason: "Documentos inválidos ou ilegíveis", reviewedBy: "admin-mobile" } });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                refetch();
              } catch { Alert.alert("Erro", "Não foi possível rejeitar."); }
            }},
          ]);
    } else {
      Alert.alert("Aprovar KYC", "Confirma que os documentos são válidos?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Aprovar", onPress: async () => {
          try {
            await reviewKyc({ userId, data: { action: "approve", reviewedBy: "admin-mobile" } });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            refetch();
          } catch { Alert.alert("Erro", "Não foi possível aprovar o KYC."); }
        }},
      ]);
    }
  };

  const filterOptions = [
    { key: "pending", label: "Pendente" },
    { key: "approved", label: "Aprovado" },
    { key: "rejected", label: "Rejeitado" },
    { key: "", label: "Todos" },
  ];

  const listData: ListItem[] = [
    { type: "filter" },
    ...(data?.kyc ?? []).map<ListItem>((e) => ({ type: "entry", entry: e as KycEntry })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={listData}
        keyExtractor={(item, i) => item.type === "filter" ? "filter" : (item as { type: "entry"; entry: KycEntry }).entry.userId}
        renderItem={({ item }) => {
          if (item.type === "filter") {
            return (
              <View style={[styles.filters, { paddingTop: isWeb ? 67 + 12 : 12 }]}>
                {filterOptions.map((f) => (
                  <Pressable
                    key={f.key}
                    onPress={() => setStatusFilter(f.key)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: statusFilter === f.key ? colors.foreground : colors.secondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: statusFilter === f.key ? colors.primaryForeground : colors.foreground }]}>
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            );
          }
          const { entry } = item as { type: "entry"; entry: KycEntry };
          return (
            <View style={{ paddingHorizontal: 14 }}>
              <KycCard entry={entry} onReview={handleReview} colors={colors} />
            </View>
          );
        }}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.center}><ActivityIndicator color={colors.mutedForeground} /></View>
          ) : (
            <View style={styles.center}>
              <Ionicons name="shield-checkmark-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Nenhum KYC encontrado</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: isWeb ? 34 : insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 14, paddingBottom: 12 },
  chip: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  center: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
