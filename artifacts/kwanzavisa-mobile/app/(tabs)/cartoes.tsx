import { Ionicons } from "@expo/vector-icons";
import { useListCards } from "@workspace/api-client-react";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

type Card = {
  id: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
  status: string;
  balanceUsd: string | null;
};

function CardItem({ card, colors }: { card: Card; colors: ReturnType<typeof useColors> }) {
  const isActive = card.status === "active";
  const isBlocked = card.status === "blocked";
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/cartao/[id]", params: { id: card.id } })}
      style={({ pressed }) => [
        cStyles.card,
        {
          backgroundColor: isActive ? colors.primary : colors.secondary,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {isBlocked && (
        <View style={cStyles.blockedOverlay}>
          <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.7)" />
          <Text style={cStyles.blockedText}>Bloqueado</Text>
        </View>
      )}
      <View style={cStyles.top}>
        <Text style={[cStyles.brand, { color: isActive ? "#fff" : colors.foreground }]}>KwanzaVisa</Text>
        <View style={[cStyles.chip, { backgroundColor: isActive ? "rgba(255,255,255,0.2)" : colors.border }]}>
          <View style={[cStyles.chipInner, { backgroundColor: isActive ? "rgba(255,255,255,0.4)" : colors.mutedForeground + "50" }]} />
        </View>
      </View>
      <Text style={[cStyles.number, { color: isActive ? "rgba(255,255,255,0.85)" : colors.foreground }]}>
        •••• •••• •••• {card.last4}
      </Text>
      <View style={cStyles.bottom}>
        <View>
          <Text style={[cStyles.small, { color: isActive ? "rgba(255,255,255,0.55)" : colors.mutedForeground }]}>TITULAR</Text>
          <Text style={[cStyles.value, { color: isActive ? "#fff" : colors.foreground }]} numberOfLines={1}>{card.cardholderName}</Text>
        </View>
        <View>
          <Text style={[cStyles.small, { color: isActive ? "rgba(255,255,255,0.55)" : colors.mutedForeground }]}>VALIDADE</Text>
          <Text style={[cStyles.value, { color: isActive ? "#fff" : colors.foreground }]}>
            {String(card.expiryMonth).padStart(2, "0")}/{String(card.expiryYear).slice(-2)}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[cStyles.small, { color: isActive ? "rgba(255,255,255,0.55)" : colors.mutedForeground }]}>SALDO</Text>
          <Text style={[cStyles.value, { color: isActive ? "#fff" : colors.foreground }]}>
            ${parseFloat(card.balanceUsd ?? "0").toFixed(2)}
          </Text>
        </View>
      </View>
      <Text style={[cStyles.visaText, { color: isActive ? "rgba(255,255,255,0.25)" : colors.mutedForeground + "40" }]}>VISA</Text>
    </Pressable>
  );
}

const cStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  blockedOverlay: {
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
  blockedText: { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_600SemiBold", fontSize: 12 },
  top: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  brand: { fontFamily: "Inter_700Bold", fontSize: 15 },
  chip: { width: 34, height: 26, borderRadius: 5, justifyContent: "center", alignItems: "center" },
  chipInner: { width: 18, height: 13, borderRadius: 3 },
  number: { fontFamily: "Inter_500Medium", fontSize: 18, letterSpacing: 3, marginBottom: 20 },
  bottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  small: { fontFamily: "Inter_500Medium", fontSize: 9, letterSpacing: 0.7, marginBottom: 3 },
  value: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  visaText: { position: "absolute", bottom: 18, right: 18, fontFamily: "Inter_700Bold", fontSize: 20, letterSpacing: 2 },
});

function EmptyCards({ isAuthenticated, kycOk, colors }: { isAuthenticated: boolean; kycOk: boolean; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={emStyles.wrap}>
      <View style={[emStyles.iconWrap, { backgroundColor: colors.secondary }]}>
        <Ionicons name="card-outline" size={48} color={colors.mutedForeground} />
      </View>
      {!isAuthenticated ? (
        <>
          <Text style={[emStyles.title, { color: colors.foreground }]}>Entre na sua conta</Text>
          <Text style={[emStyles.desc, { color: colors.mutedForeground }]}>
            Para ver os seus cartões, inicie sessão primeiro.
          </Text>
          <Pressable onPress={() => router.push("/auth/login")} style={[emStyles.btn, { backgroundColor: colors.primary }]}>
            <Text style={emStyles.btnText}>Entrar / Registar</Text>
          </Pressable>
        </>
      ) : !kycOk ? (
        <>
          <Text style={[emStyles.title, { color: colors.foreground }]}>Verificação necessária</Text>
          <Text style={[emStyles.desc, { color: colors.mutedForeground }]}>
            Para emitir cartões, verifique a sua identidade (KYC) primeiro.
          </Text>
          <Pressable onPress={() => router.push("/kyc")} style={[emStyles.btn, { backgroundColor: colors.primary }]}>
            <Text style={emStyles.btnText}>Verificar identidade</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={[emStyles.title, { color: colors.foreground }]}>Nenhum cartão ainda</Text>
          <Text style={[emStyles.desc, { color: colors.mutedForeground }]}>
            O administrador irá emitir o seu cartão após aprovação do pedido.
          </Text>
          <Pressable onPress={() => router.push("/(tabs)/pedidos")} style={[emStyles.btn, { backgroundColor: colors.primary }]}>
            <Text style={emStyles.btnText}>Fazer pedido</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
const emStyles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32, gap: 12 },
  iconWrap: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, textAlign: "center" },
  desc: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
  btn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 13, marginTop: 4 },
  btnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
});

export default function CartoesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { isAuthenticated } = useAuth();

  const { data, isLoading, refetch, isRefetching } = useListCards(
    {},
    { enabled: isAuthenticated, refetchInterval: 30_000 }
  );

  const cards = data?.cards ?? [];

  return (
    <FlatList
      style={[{ flex: 1, backgroundColor: colors.background }]}
      contentContainerStyle={[
        { paddingHorizontal: 20, paddingTop: isWeb ? 67 + 16 : 16, paddingBottom: isWeb ? 34 + 84 : insets.bottom + 80 },
        cards.length === 0 && { flex: 1 },
      ]}
      data={isAuthenticated ? cards : []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <CardItem card={item} colors={colors} />}
      onRefresh={refetch}
      refreshing={isRefetching}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        isLoading && isAuthenticated ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={colors.mutedForeground} />
          </View>
        ) : (
          <EmptyCards isAuthenticated={isAuthenticated} kycOk={false} colors={colors} />
        )
      }
      ListHeaderComponent={
        cards.length > 0 ? (
          <Text style={[{ fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.8, color: colors.mutedForeground, marginBottom: 14 }]}>
            OS MEUS CARTÕES
          </Text>
        ) : null
      }
    />
  );
}
