import { Feather } from "@expo/vector-icons";
import { useGetExchangeRate } from "@workspace/api-client-react";
import { router } from "expo-router";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const SERVICES = [
  {
    id: "cartao_virtual",
    label: "Cartão Virtual",
    desc: "Visa virtual para compras internacionais",
    icon: "credit-card" as const,
  },
  {
    id: "acesso_assistido",
    label: "Acesso Assistido",
    desc: "Acesso a plataformas internacionais",
    icon: "globe" as const,
  },
  {
    id: "transferencia",
    label: "Transferência",
    desc: "Envio de fundos para o exterior",
    icon: "send" as const,
  },
  {
    id: "conta_internacional",
    label: "Conta Internacional",
    desc: "Abertura de contas no exterior",
    icon: "briefcase" as const,
  },
] as const;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const { data: rate, isLoading: rateLoading } = useGetExchangeRate(
    { currency: "USD", amount: 1 },
    { refetchInterval: 60_000 }
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: isWeb ? 67 + 16 : 16,
          paddingBottom: isWeb ? 34 + 80 : insets.bottom + 80,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.logoText, { color: colors.foreground }]}>KwanzaVisa</Text>
          <Text style={[styles.logoSub, { color: colors.mutedForeground }]}>Pagamentos internacionais</Text>
        </View>
        <View style={[styles.logoBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.logoBadgeText, { color: colors.foreground }]}>AO</Text>
        </View>
      </View>

      <View style={[styles.rateCard, { backgroundColor: colors.primary }]}>
        <View style={styles.rateCardTop}>
          <View style={[styles.rateBadge, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Text style={styles.rateBadgeText}>Taxa de Câmbio</Text>
          </View>
          <Feather name="refresh-cw" size={16} color="rgba(255,255,255,0.6)" />
        </View>
        {rateLoading ? (
          <View style={styles.rateLoading}>
            <Text style={styles.rateLoadingText}>A carregar...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.rateMain}>
              1 USD = {rate?.ratePerUnit?.toLocaleString("pt-AO") ?? "—"} Kz
            </Text>
            <Text style={styles.rateSub}>
              Actualizado às {rate?.updatedAt ? new Date(rate.updatedAt).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" }) : "—"}
            </Text>
          </>
        )}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SERVIÇOS</Text>

      <View style={styles.servicesGrid}>
        {SERVICES.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => router.push({ pathname: "/(tabs)/pedidos", params: { service: s.id } })}
            style={({ pressed }) => [
              styles.serviceCard,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View style={[styles.serviceIconBg, { backgroundColor: colors.background }]}>
              <Feather name={s.icon} size={20} color={colors.foreground} />
            </View>
            <Text style={[styles.serviceLabel, { color: colors.foreground }]}>{s.label}</Text>
            <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.disclaimer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Feather name="info" size={13} color={colors.mutedForeground} />
        <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
          Pagamentos em Euro poderão ser processados mediante conversão do valor para USD à taxa do dia.
        </Text>
      </View>

      <Pressable
        onPress={() => {
          const url = "https://wa.me/244957636981";
          if (Platform.OS === "web") {
            // @ts-ignore
            window.open(url, "_blank");
          } else {
            import("expo-linking").then(({ openURL }) => openURL(url));
          }
        }}
        style={({ pressed }) => [
          styles.whatsappBtn,
          { backgroundColor: "#25D366", opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Feather name="message-circle" size={18} color="#fff" />
        <Text style={styles.whatsappText}>Contactar pelo WhatsApp</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
    marginBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logoText: { fontFamily: "Inter_700Bold", fontSize: 22 },
  logoSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadgeText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  rateCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  rateCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  rateBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  rateBadgeText: { color: "#fff", fontFamily: "Inter_500Medium", fontSize: 12 },
  rateLoading: { paddingVertical: 12 },
  rateLoadingText: { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", fontSize: 14 },
  rateMain: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    marginBottom: 6,
  },
  rateSub: {
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  serviceCard: {
    width: "47%",
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  serviceIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  serviceDesc: { fontFamily: "Inter_400Regular", fontSize: 12 },
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    marginBottom: 16,
  },
  disclaimerText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 8,
  },
  whatsappText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
