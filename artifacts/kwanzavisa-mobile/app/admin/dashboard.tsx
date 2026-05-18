import { Ionicons } from "@expo/vector-icons";
import { useAdminGetExchangeRates, useAdminGetStats } from "@workspace/api-client-react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAdmin } from "@/contexts/AdminContext";
import { useColors } from "@/hooks/useColors";

function StatCard({
  label,
  value,
  icon,
  iconBg,
  colors,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconBg: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        statStyles.card,
        { borderColor: colors.border, backgroundColor: colors.background },
      ]}
    >
      <View style={[statStyles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color="#fff" />
      </View>
      <Text style={[statStyles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}
const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  value: { fontFamily: "Inter_700Bold", fontSize: 24, letterSpacing: -0.3 },
  label: { fontFamily: "Inter_400Regular", fontSize: 13 },
});

function QuickLink({
  icon,
  label,
  onPress,
  iconBg,
  colors,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  iconBg: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        qlStyles.btn,
        { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={[qlStyles.icon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color="#fff" />
      </View>
      <Text style={[qlStyles.label, { color: colors.foreground }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
    </Pressable>
  );
}
const qlStyles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  icon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  label: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15 },
});

export default function AdminDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { logout } = useAdmin();
  const { width } = useWindowDimensions();

  const { data: stats, isLoading: statsLoading } = useAdminGetStats({
    query: { refetchInterval: 30_000 } as never,
  });
  const { data: rates, isLoading: ratesLoading } = useAdminGetExchangeRates({
    query: { refetchInterval: 30_000 } as never,
  });

  const numColumns = width >= 600 ? 4 : 2;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: isWeb ? 67 + 16 : 16,
          paddingBottom: isWeb ? 34 + 20 : insets.bottom + 20,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.rateStrip,
          { backgroundColor: colors.secondary, borderColor: colors.border },
        ]}
      >
        <View style={[styles.rateIconWrap, { backgroundColor: "#FF9500" }]}>
          <Ionicons name="trending-up-outline" size={16} color="#fff" />
        </View>
        {ratesLoading ? (
          <ActivityIndicator size="small" color={colors.mutedForeground} />
        ) : (
          <Text style={[styles.rateText, { color: colors.foreground }]}>
            1 USD = {rates?.activeUsd?.toLocaleString("pt-AO") ?? "—"} Kz
          </Text>
        )}
        <Pressable
          onPress={() => router.push("/admin/cambio")}
          style={[styles.rateEditBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <Ionicons name="pencil-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.rateEditText, { color: colors.mutedForeground }]}>Editar</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACÇÕES RÁPIDAS</Text>
      <QuickLink icon="list-outline" label="Gerir Pedidos" onPress={() => router.push("/admin/pedidos")} iconBg="#34C759" colors={colors} />
      <QuickLink icon="trending-up-outline" label="Taxa de Câmbio" onPress={() => router.push("/admin/cambio")} iconBg="#FF9500" colors={colors} />
      <QuickLink icon="log-out-outline" label="Terminar Sessão Admin" onPress={logout} iconBg="#FF3B30" colors={colors} />

      {statsLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={colors.mutedForeground} />
        </View>
      ) : stats ? (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RESUMO GERAL</Text>
          <View style={[styles.statsGrid, { gap: 12 }]}>
            <StatCard label="Total Pedidos" value={stats.totalOrders} icon="layers-outline" iconBg="#5856D6" colors={colors} />
            <StatCard label="Clientes" value={stats.totalClients} icon="people-outline" iconBg="#007AFF" colors={colors} />
            <StatCard label="Pendentes" value={stats.pendingOrders} icon="time-outline" iconBg="#FF9500" colors={colors} />
            <StatCard label="Concluídos" value={stats.completedOrders} icon="checkmark-circle-outline" iconBg="#34C759" colors={colors} />
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ESTE MÊS</Text>
          <View style={[styles.statsGrid, { gap: 12 }]}>
            <StatCard label="Pedidos" value={stats.ordersThisMonth} icon="calendar-outline" iconBg="#32ADE6" colors={colors} />
            <StatCard
              label="Volume USD"
              value={`$${(stats.volumeUsdThisMonth ?? 0).toLocaleString("pt-AO")}`}
              icon="cash-outline"
              iconBg="#34C759"
              colors={colors}
            />
            <StatCard
              label="Volume Kz"
              value={`${(stats.volumeKwanzaThisMonth ?? 0).toLocaleString("pt-AO")}`}
              icon="bar-chart-outline"
              iconBg="#FF9500"
              colors={colors}
            />
            <StatCard
              label="Receita"
              value={`${(stats.totalRevenueKwanza ?? 0).toLocaleString("pt-AO")} Kz`}
              icon="trending-up-outline"
              iconBg="#5856D6"
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
  content: { paddingHorizontal: 16 },
  rateStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 24,
  },
  rateIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rateText: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 15 },
  rateEditBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  rateEditText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 24 },
  loadingCenter: { paddingVertical: 60, alignItems: "center" },
});
