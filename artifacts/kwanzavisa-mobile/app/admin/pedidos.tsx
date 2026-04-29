import { Feather } from "@expo/vector-icons";
import {
  useAdminListOrders,
  useAdminUpdateOrderStatus,
} from "@workspace/api-client-react";
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

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  em_contacto: "Em Contacto",
  aguarda_pagamento: "Aguarda Pagamento",
  pago: "Pago",
  em_processamento: "Em Processamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pendente: "#FF9500",
  em_contacto: "#007AFF",
  aguarda_pagamento: "#FF9500",
  pago: "#34C759",
  em_processamento: "#007AFF",
  concluido: "#34C759",
  cancelado: "#FF3B30",
};

const SERVICE_LABELS: Record<string, string> = {
  cartao_virtual: "Cartão Virtual",
  acesso_assistido: "Acesso Assistido",
  transferencia: "Transferência",
  conta_internacional: "Conta Internacional",
};

const ALL_STATUSES = Object.keys(STATUS_LABELS);

type Order = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  service: string;
  status: string;
  formattedDate: string;
  amountUsd?: number | null;
};

function OrderItem({ order, onChangeStatus, colors }: {
  order: Order;
  onChangeStatus: (id: string, status: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const handleStatusPress = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancelar", ...ALL_STATUSES.map((s) => STATUS_LABELS[s])],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            onChangeStatus(order.id, ALL_STATUSES[buttonIndex - 1]);
          }
        }
      );
    } else {
      Alert.alert(
        "Alterar estado",
        "Seleccione o novo estado",
        ALL_STATUSES.map((s) => ({
          text: STATUS_LABELS[s],
          onPress: () => onChangeStatus(order.id, s),
        })).concat([{ text: "Cancelar", onPress: () => {} }])
      );
    }
  };

  const openWhatsApp = () => {
    const num = order.whatsapp.replace(/\D/g, "");
    const url = `https://wa.me/${num}`;
    if (Platform.OS === "web") {
      // @ts-ignore
      window.open(url, "_blank");
    } else {
      import("expo-linking").then(({ openURL }) => openURL(url));
    }
  };

  return (
    <View style={[itemStyles.card, { borderColor: colors.border, backgroundColor: colors.background }]}>
      <View style={itemStyles.top}>
        <Text style={[itemStyles.service, { color: colors.foreground }]}>
          {SERVICE_LABELS[order.service] ?? order.service}
        </Text>
        <Pressable onPress={handleStatusPress} style={[itemStyles.badge, { backgroundColor: (STATUS_COLORS[order.status] ?? "#6E6E73") + "20" }]}>
          <Text style={[itemStyles.badgeText, { color: STATUS_COLORS[order.status] ?? "#6E6E73" }]}>
            {STATUS_LABELS[order.status] ?? order.status}
          </Text>
          <Feather name="chevron-down" size={11} color={STATUS_COLORS[order.status] ?? "#6E6E73"} />
        </Pressable>
      </View>
      <Text style={[itemStyles.name, { color: colors.foreground }]}>{order.name}</Text>
      <Text style={[itemStyles.meta, { color: colors.mutedForeground }]}>{order.email}</Text>
      {order.amountUsd != null && (
        <Text style={[itemStyles.meta, { color: colors.mutedForeground }]}>{order.amountUsd} USD</Text>
      )}
      <View style={itemStyles.footer}>
        <Text style={[itemStyles.date, { color: colors.mutedForeground }]}>{order.formattedDate}</Text>
        <Pressable onPress={openWhatsApp} style={[itemStyles.waBtn, { backgroundColor: "#25D366" }]}>
          <Feather name="message-circle" size={14} color="#fff" />
          <Text style={itemStyles.waText}>WhatsApp</Text>
        </Pressable>
      </View>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 14, marginBottom: 10 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  service: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  name: { fontFamily: "Inter_500Medium", fontSize: 15, marginBottom: 2 },
  meta: { fontFamily: "Inter_400Regular", fontSize: 13 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  date: { fontFamily: "Inter_400Regular", fontSize: 12 },
  waBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  waText: { color: "#fff", fontFamily: "Inter_500Medium", fontSize: 12 },
});

export default function AdminPedidosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useAdminListOrders(
    { search: search || undefined, status: statusFilter || undefined, page, limit: 20 },
    { refetchInterval: 30_000 }
  );

  const { mutateAsync: updateStatus } = useAdminUpdateOrderStatus();

  const handleChangeStatus = async (id: string, status: string) => {
    try {
      await updateStatus({ id, data: { status: status as never } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
    } catch {
      Alert.alert("Erro", "Não foi possível actualizar o estado.");
    }
  };

  const filterChips = ["", ...ALL_STATUSES];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchRow, { borderBottomColor: colors.border, paddingTop: isWeb ? 67 : 0 }]}>
        <View style={[styles.searchInput, { borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={(t) => { setSearch(t); setPage(1); }}
            placeholder="Pesquisar por nome, e-mail..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchText, { color: colors.foreground }]}
            autoCapitalize="none"
          />
          {search ? (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={[{ type: "filters" as const }, ...(data?.orders ?? []).map((o) => ({ type: "order" as const, order: o }))]}
        keyExtractor={(item, i) => (item.type === "filters" ? "filters" : (item as { type: "order"; order: Order }).order.id)}
        renderItem={({ item }) => {
          if (item.type === "filters") {
            return (
              <View style={styles.filtersScroll}>
                {filterChips.map((s) => (
                  <Pressable
                    key={s || "all"}
                    onPress={() => { setStatusFilter(s); setPage(1); }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: statusFilter === s ? colors.foreground : colors.secondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: statusFilter === s ? colors.primaryForeground : colors.foreground }]}>
                      {s ? STATUS_LABELS[s] : "Todos"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            );
          }
          return (
            <View style={{ paddingHorizontal: 16 }}>
              <OrderItem
                order={(item as { type: "order"; order: Order }).order}
                onChangeStatus={handleChangeStatus}
                colors={colors}
              />
            </View>
          );
        }}
        ListHeaderComponent={null}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.mutedForeground} />
            </View>
          ) : (
            <View style={styles.center}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Nenhum pedido</Text>
            </View>
          )
        }
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: isWeb ? 34 : insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!(data?.orders.length)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  filtersScroll: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  center: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
