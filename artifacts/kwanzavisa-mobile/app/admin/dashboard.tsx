import { Feather } from "@expo/vector-icons";
import { useAdminGetStats, useAdminGetExchangeRates } from "@workspace/api-client-react";
import { router } from "expo-router";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAdmin } from "@/contexts/AdminContext";
import { useColors } from "@/hooks/useColors";

function StatCard({ label, value, sub, icon, colors }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[statStyles.card, { borderColor: colors.border, backgroundColor: colors.background }]}>
      <View style={[statStyles.iconWrap, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={18} color={colors.foreground} />
      </View>
      <Text style={[statStyles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      {sub && <Text style={[statStyles.sub, { color: colors.mutedForeground }]}>{sub}</Text>}
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { width: "47%", borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 6 },
  iconWrap: { width: 36, height: 36, borderRadius: 9, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  value: { fontFamily: "Inter_700Bold", fontSize: 22 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 12 },
});

export default function AdminDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { logout } = useAdmin();

  const { data: stats, isLoading: statsLoading } = useAdminGetStats({ refetchInterval: 30_000 });
  const { data: rates, isLoading: ratesLoading } = useAdminGetExchangeRates({ refetchInterval: 30_000 });

  const quickLinks = [
    { label: "Pedidos", icon: "list" as const, path: "/admin/pedidos" as const },
    { label: "Câmbio", icon: "trending-up" as const, path: "/admin/cambio" as const },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: isWeb ? 67 + 16 : 16,
          paddingBottom: isWeb ? 34 + 80 : insets.bottom + 20,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.quickRow}>
        {quickLinks.map((l) => (
          <Pressable
            key={l.path}
            onPress={() => router.push(l.path)}
            style={({ pressed }) => [
              styles.quickBtn,
              { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name={l.icon} size={20} color={colors.foreground} />
            <Text style={[styles.quickLabel, { color: colors.foreground }]}>{l.label}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.quickBtn,
            { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="log-out" size={20} color={colors.destructive} />
          <Text style={[styles.quickLabel, { color: colors.destructive }]}>Sair</Text>
        </Pressable>
      </View>

      <View style={[styles.rateStrip, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Feather name="trending-up" size={16} color={colors.foreground} />
        {ratesLoading ? (
          <ActivityIndicator size="small" color={colors.mutedForeground} />
        ) : (
          <Text style={[styles.rateText, { color: colors.foreground }]}>
            1 USD = {rates?.activeUsd?.toLocaleString("pt-AO") ?? "—"} Kz
          </Text>
        )}
        <Pressable onPress={() => router.push("/admin/cambio")}>
          <Text style={[styles.rateEdit, { color: colors.mutedForeground }]}>Editar</Text>
        </Pressable>
      </View>

      {statsLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={colors.mutedForeground} />
        </View>
      ) : stats ? (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RESUMO GERAL</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Total Pedidos" value={stats.totalOrders} icon="package" colors={colors} />
            <StatCard label="Clientes" value={stats.totalClients} icon="users" colors={colors} />
            <StatCard label="Pendentes" value={stats.pendingOrders} icon="clock" colors={colors} />
            <StatCard label="Concluídos" value={stats.completedOrders} icon="check-circle" colors={colors} />
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ESTE MÊS</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Pedidos" value={stats.ordersThisMonth} icon="calendar" colors={colors} />
            <StatCard
              label="Volume (USD)"
              value={`$${stats.volumeUsdThisMonth?.toLocaleString("pt-AO") ?? 0}`}
              icon="dollar-sign"
              colors={colors}
            />
            <StatCard
              label="Volume (Kz)"
              value={`${stats.volumeKwanzaThisMonth?.toLocaleString("pt-AO") ?? 0} Kz`}
              icon="bar-chart-2"
              colors={colors}
            />
            <StatCard
              label="Receita"
              value={`${stats.totalRevenueKwanza?.toLocaleString("pt-AO") ?? 0} Kz`}
              icon="trending-up"
              colors={colors}
            />
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 0 },
  quickRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  quickBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    alignItems: "center",
    gap: 6,
  },
  quickLabel: { fontFamily: "Inter_500Medium", fontSize: 12 },
  rateStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  rateText: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 15 },
  rateEdit: { fontFamily: "Inter_400Regular", fontSize: 13 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  loadingCenter: { flex: 1, paddingVertical: 60, alignItems: "center" },
});
