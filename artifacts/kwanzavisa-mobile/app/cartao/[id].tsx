import { Ionicons } from "@expo/vector-icons";
import { useGetCard, useCardToggleBlock } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const TIPO_LABELS: Record<string, string> = {
  fund: "Carregamento",
  debit: "Pagamento",
  credit: "Reembolso",
  block: "Cartão bloqueado",
  unblock: "Cartão desbloqueado",
};

const TIPO_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  fund: "arrow-down-circle-outline",
  debit: "arrow-up-circle-outline",
  credit: "arrow-down-circle-outline",
  block: "lock-closed-outline",
  unblock: "lock-open-outline",
};

export default function CartaoDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showNumber, setShowNumber] = useState(false);

  const { data, isLoading, refetch } = useGetCard({ id: id! });
  const { mutateAsync: toggleBlock, isPending: toggling } = useCardToggleBlock();

  const card = data?.card;

  const handleToggleBlock = () => {
    const isActive = card?.status === "active";
    Alert.alert(
      isActive ? "Bloquear cartão" : "Desbloquear cartão",
      isActive
        ? "Tem a certeza que quer bloquear este cartão? Não poderá ser usado até desbloquear."
        : "Quer desbloquear o cartão?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: isActive ? "Bloquear" : "Desbloquear",
          style: isActive ? "destructive" : "default",
          onPress: async () => {
            try {
              await toggleBlock({ id: id! });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              refetch();
            } catch {
              Alert.alert("Erro", "Não foi possível alterar o estado do cartão.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.mutedForeground} />
      </View>
    );
  }
  if (!card) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Cartão não encontrado</Text>
      </View>
    );
  }

  const isActive = card.status === "active";
  const isBlocked = card.status === "blocked";

  const fullNumber = card.cardNumberEncrypted
    ? `${card.cardNumberEncrypted.slice(0, 4)} ${card.cardNumberEncrypted.slice(4, 8)} ${card.cardNumberEncrypted.slice(8, 12)} ${card.cardNumberEncrypted.slice(12)}`
    : `•••• •••• •••• ${card.last4}`;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.cardVisual, { backgroundColor: isActive ? colors.primary : colors.secondary }]}>
        {isBlocked && (
          <View style={styles.blockedBadge}>
            <Ionicons name="lock-closed" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={styles.blockedBadgeText}>Bloqueado</Text>
          </View>
        )}
        <View style={styles.cardTop}>
          <Text style={[styles.cardBrand, { color: isActive ? "#fff" : colors.foreground }]}>KwanzaVisa</Text>
          <View style={[styles.chip, { backgroundColor: isActive ? "rgba(255,255,255,0.2)" : colors.border }]}>
            <View style={[styles.chipInner, { backgroundColor: isActive ? "rgba(255,255,255,0.4)" : colors.mutedForeground + "50" }]} />
          </View>
        </View>
        <Pressable onPress={() => setShowNumber(!showNumber)} style={styles.numberRow}>
          <Text style={[styles.cardNumber, { color: isActive ? "rgba(255,255,255,0.9)" : colors.foreground }]}>
            {showNumber ? fullNumber : `•••• •••• •••• ${card.last4}`}
          </Text>
          <Ionicons
            name={showNumber ? "eye-off-outline" : "eye-outline"}
            size={15}
            color={isActive ? "rgba(255,255,255,0.5)" : colors.mutedForeground}
          />
        </Pressable>
        <View style={styles.cardBottom}>
          <View>
            <Text style={[styles.cardSmall, { color: isActive ? "rgba(255,255,255,0.5)" : colors.mutedForeground }]}>TITULAR</Text>
            <Text style={[styles.cardValue, { color: isActive ? "#fff" : colors.foreground }]} numberOfLines={1}>{card.cardholderName}</Text>
          </View>
          <View>
            <Text style={[styles.cardSmall, { color: isActive ? "rgba(255,255,255,0.5)" : colors.mutedForeground }]}>VALIDADE</Text>
            <Text style={[styles.cardValue, { color: isActive ? "#fff" : colors.foreground }]}>
              {String(card.expiryMonth).padStart(2, "0")}/{String(card.expiryYear).slice(-2)}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.cardSmall, { color: isActive ? "rgba(255,255,255,0.5)" : colors.mutedForeground }]}>SALDO</Text>
            <Text style={[styles.cardValue, { color: isActive ? "#fff" : colors.foreground }]}>
              ${parseFloat(card.balanceUsd ?? "0").toFixed(2)}
            </Text>
          </View>
        </View>
        <Text style={[styles.visaText, { color: isActive ? "rgba(255,255,255,0.2)" : colors.mutedForeground + "30" }]}>VISA</Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleToggleBlock}
          disabled={toggling || card.status === "cancelled"}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: isBlocked ? "#34C75920" : "#FF3B3015",
              borderColor: isBlocked ? "#34C75940" : "#FF3B3030",
              opacity: pressed || toggling ? 0.7 : 1,
            },
          ]}
        >
          {toggling ? (
            <ActivityIndicator size="small" color={isBlocked ? "#34C759" : "#FF3B30"} />
          ) : (
            <>
              <Ionicons name={isBlocked ? "lock-open-outline" : "lock-closed-outline"} size={20} color={isBlocked ? "#34C759" : "#FF3B30"} />
              <Text style={[styles.actionBtnText, { color: isBlocked ? "#34C759" : "#FF3B30" }]}>
                {isBlocked ? "Desbloquear" : "Bloquear"}
              </Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={() => Alert.alert("Extracto", "Funcionalidade em desenvolvimento.")}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="document-text-outline" size={20} color={colors.foreground} />
          <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Extracto</Text>
        </Pressable>
      </View>

      {card.transactions && card.transactions.length > 0 ? (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>HISTÓRICO</Text>
          <View style={[styles.txList, { borderColor: colors.border }]}>
            {card.transactions.map((tx, i) => (
              <View
                key={tx.id}
                style={[
                  styles.txRow,
                  { borderBottomColor: colors.border },
                  i === card.transactions.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={[styles.txIcon, { backgroundColor: tx.tipo === "fund" || tx.tipo === "credit" ? "#34C75920" : colors.secondary }]}>
                  <Ionicons
                    name={TIPO_ICONS[tx.tipo] ?? "help-outline"}
                    size={18}
                    color={tx.tipo === "fund" || tx.tipo === "credit" ? "#34C759" : colors.foreground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.txLabel, { color: colors.foreground }]}>
                    {tx.merchant ?? TIPO_LABELS[tx.tipo] ?? tx.tipo}
                  </Text>
                  <Text style={[styles.txDate, { color: colors.mutedForeground }]}>
                    {new Date(tx.createdAt).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                  </Text>
                </View>
                {parseFloat(tx.amount) > 0 && (
                  <Text
                    style={[
                      styles.txAmount,
                      {
                        color: tx.tipo === "fund" || tx.tipo === "credit" ? "#34C759" : colors.foreground,
                      },
                    ]}
                  >
                    {tx.tipo === "fund" || tx.tipo === "credit" ? "+" : "-"}${parseFloat(tx.amount).toFixed(2)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.emptyTx}>
          <Ionicons name="time-outline" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyTxText, { color: colors.mutedForeground }]}>Nenhuma transacção ainda</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 15 },
  cardVisual: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  blockedBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  blockedBadgeText: { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_600SemiBold", fontSize: 11 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  cardBrand: { fontFamily: "Inter_700Bold", fontSize: 15 },
  chip: { width: 34, height: 26, borderRadius: 5, justifyContent: "center", alignItems: "center" },
  chipInner: { width: 18, height: 13, borderRadius: 3 },
  numberRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  cardNumber: { fontFamily: "Inter_500Medium", fontSize: 17, letterSpacing: 2.5, flex: 1 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  cardSmall: { fontFamily: "Inter_500Medium", fontSize: 9, letterSpacing: 0.7, marginBottom: 3 },
  cardValue: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  visaText: { position: "absolute", bottom: 18, right: 18, fontFamily: "Inter_700Bold", fontSize: 20, letterSpacing: 2 },
  actionsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 13,
  },
  actionBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.8, marginBottom: 10 },
  txList: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden", marginBottom: 8 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  txIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  txLabel: { fontFamily: "Inter_500Medium", fontSize: 14, marginBottom: 2 },
  txDate: { fontFamily: "Inter_400Regular", fontSize: 12 },
  txAmount: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  emptyTx: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyTxText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
