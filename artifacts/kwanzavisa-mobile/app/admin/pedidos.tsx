import { Ionicons } from "@expo/vector-icons";
import {
  useAdminListOrders,
  useAdminUpdateOrderStatus,
  useAdminIssueCard,
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
const SERVICE_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  cartao_virtual: "card-outline",
  acesso_assistido: "globe-outline",
  transferencia: "swap-horizontal-outline",
};
const SERVICE_LABELS: Record<string, string> = {
  cartao_virtual: "Cartão Virtual",
  acesso_assistido: "Acesso Assistido",
  transferencia: "Transferência",
};
const ALL_STATUSES = Object.keys(STATUS_LABELS);
const CARD_ELIGIBLE_STATUSES = ["pago", "em_processamento", "concluido"];

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

function OrderCard({
  order,
  onChangeStatus,
  onIssueCard,
  isIssuingCard,
  colors,
}: {
  order: Order;
  onChangeStatus: (id: string, status: string) => void;
  onIssueCard: (id: string) => void;
  isIssuingCard: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const statusColor = STATUS_COLORS[order.status] ?? "#6E6E73";
  const canIssueCard =
    order.service === "cartao_virtual" &&
    CARD_ELIGIBLE_STATUSES.includes(order.status);

  const handleStatus = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancelar", ...ALL_STATUSES.map((s) => STATUS_LABELS[s])],
          cancelButtonIndex: 0,
        },
        (i) => {
          if (i > 0) onChangeStatus(order.id, ALL_STATUSES[i - 1]);
        }
      );
    } else {
      Alert.alert(
        "Alterar estado",
        undefined,
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
      (window as Window).open(url, "_blank");
    } else {
      import("expo-linking").then(({ openURL }) => openURL(url));
    }
  };

  return (
    <View
      style={[
        cardStyles.card,
        { borderColor: colors.border, backgroundColor: colors.background },
      ]}
    >
      <View style={[cardStyles.bar, { backgroundColor: statusColor }]} />
      <View style={cardStyles.body}>
        <View style={cardStyles.top}>
          <View style={[cardStyles.serviceIcon, { backgroundColor: colors.secondary }]}>
            <Ionicons
              name={SERVICE_ICONS[order.service] ?? "help-outline"}
              size={16}
              color={colors.foreground}
            />
          </View>
          <Text style={[cardStyles.serviceName, { color: colors.foreground }]}>
            {SERVICE_LABELS[order.service] ?? order.service}
          </Text>
          <Pressable
            onPress={handleStatus}
            style={[cardStyles.badge, { backgroundColor: statusColor + "20" }]}
          >
            <Text style={[cardStyles.badgeText, { color: statusColor }]}>
              {STATUS_LABELS[order.status] ?? order.status}
            </Text>
            <Ionicons name="chevron-down" size={11} color={statusColor} />
          </Pressable>
        </View>

        <Text style={[cardStyles.clientName, { color: colors.foreground }]}>
          {order.name}
        </Text>
        <Text style={[cardStyles.meta, { color: colors.mutedForeground }]}>
          {order.email}
        </Text>

        <View style={cardStyles.footer}>
          <Text style={[cardStyles.date, { color: colors.mutedForeground }]}>
            {order.formattedDate}
          </Text>
          {order.amountUsd != null && (
            <Text style={[cardStyles.amount, { color: colors.foreground }]}>
              {order.amountUsd} USD
            </Text>
          )}
          <Pressable
            onPress={openWhatsApp}
            style={({ pressed }) => [
              cardStyles.waBtn,
              { backgroundColor: "#25D366", opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="logo-whatsapp" size={14} color="#fff" />
          </Pressable>
        </View>

        {canIssueCard && (
          <Pressable
            onPress={() => onIssueCard(order.id)}
            disabled={isIssuingCard}
            style={({ pressed }) => [
              cardStyles.issueBtn,
              {
                backgroundColor: "#007AFF",
                opacity: pressed || isIssuingCard ? 0.7 : 1,
              },
            ]}
          >
            {isIssuingCard ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="card-outline" size={15} color="#fff" />
                <Text style={cardStyles.issueBtnText}>Emitir Cartão</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  bar: { width: 4 },
  body: { flex: 1, padding: 14 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  serviceIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceName: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 14 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  clientName: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    marginBottom: 2,
  },
  meta: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 10 },
  footer: { flexDirection: "row", alignItems: "center", gap: 8 },
  date: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12 },
  amount: { fontFamily: "Inter_500Medium", fontSize: 13 },
  waBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  issueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
  },
  issueBtnText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});

type ListItem = { type: "filters" } | { type: "order"; order: Order };

export default function AdminPedidosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [page] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useAdminListOrders(
    { search: search || undefined, status: statusFilter || undefined, page, limit: 30 },
    { query: { refetchInterval: 30_000 } as never }
  );
  const { mutateAsync: updateStatus } = useAdminUpdateOrderStatus();
  const { mutateAsync: issueCard } = useAdminIssueCard();

  const handleChangeStatus = async (id: string, status: string) => {
    try {
      await updateStatus({ id, data: { status: status as never } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
    } catch {
      Alert.alert("Erro", "Não foi possível actualizar o estado.");
    }
  };

  const handleIssueCard = (id: string) => {
    const order = (data?.orders ?? []).find((o) => o.id === id) as Order | undefined;
    Alert.alert(
      "Emitir Cartão Virtual",
      `Emitir cartão Visa para ${order?.name ?? id}?\n\nO utilizador deve ter KYC aprovado e conta registada com o mesmo e-mail.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Emitir",
          onPress: async () => {
            setIssuingId(id);
            try {
              await issueCard({ id, data: { issuedBy: "admin-mobile" } });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Sucesso", "Cartão emitido com sucesso! O utilizador já pode vê-lo na app.");
              refetch();
            } catch (err: unknown) {
              const msg =
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                "Não foi possível emitir o cartão. Verifique se o utilizador tem KYC aprovado e conta registada.";
              Alert.alert("Erro ao emitir cartão", msg);
            } finally {
              setIssuingId(null);
            }
          },
        },
      ]
    );
  };

  const filterChips = ["", ...ALL_STATUSES];
  const listData: ListItem[] = [
    { type: "filters" },
    ...(data?.orders ?? []).map<ListItem>((o) => ({
      type: "order",
      order: o as Order,
    })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.searchBar,
          { borderBottomColor: colors.border, paddingTop: isWeb ? 67 : 0 },
        ]}
      >
        <View
          style={[
            styles.searchInput,
            { borderColor: colors.border, backgroundColor: colors.secondary },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={16}
            color={colors.mutedForeground}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Nome, e-mail, WhatsApp..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchText, { color: colors.foreground }]}
            autoCapitalize="none"
          />
          {search ? (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={17}
                color={colors.mutedForeground}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) =>
          item.type === "filters"
            ? "filters"
            : (item as { type: "order"; order: Order }).order.id
        }
        renderItem={({ item }) => {
          if (item.type === "filters") {
            return (
              <View style={styles.filtersRow}>
                {filterChips.map((s) => (
                  <Pressable
                    key={s || "all"}
                    onPress={() => setStatusFilter(s)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          statusFilter === s
                            ? colors.foreground
                            : colors.secondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color:
                            statusFilter === s
                              ? colors.primaryForeground
                              : colors.foreground,
                        },
                      ]}
                    >
                      {s ? STATUS_LABELS[s] : "Todos"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            );
          }
          const { order } = item as { type: "order"; order: Order };
          return (
            <View style={{ paddingHorizontal: 14 }}>
              <OrderCard
                order={order}
                onChangeStatus={handleChangeStatus}
                onIssueCard={handleIssueCard}
                isIssuingCard={issuingId === order.id}
                colors={colors}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.mutedForeground} />
            </View>
          ) : (
            <View style={styles.center}>
              <Ionicons
                name="mail-open-outline"
                size={40}
                color={colors.mutedForeground}
              />
              <Text
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                Nenhum pedido encontrado
              </Text>
            </View>
          )
        }
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{
          paddingBottom: isWeb ? 34 : insets.bottom + 16,
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!(data?.orders.length)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chip: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  center: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
