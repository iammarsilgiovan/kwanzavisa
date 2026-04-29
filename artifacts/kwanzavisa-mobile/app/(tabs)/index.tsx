import { Ionicons } from "@expo/vector-icons";
import { useGetExchangeRate } from "@workspace/api-client-react";
import { router } from "expo-router";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type ServiceId = "cartao_virtual" | "acesso_assistido" | "transferencia" | "conta_internacional";

const SERVICES: {
  id: ServiceId;
  label: string;
  desc: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  {
    id: "cartao_virtual",
    label: "Cartão Virtual",
    desc: "Visa virtual para compras online",
    icon: "card-outline",
  },
  {
    id: "acesso_assistido",
    label: "Acesso Assistido",
    desc: "Acesso a plataformas internacionais",
    icon: "globe-outline",
  },
  {
    id: "transferencia",
    label: "Transferência",
    desc: "Envio de fundos para o exterior",
    icon: "swap-horizontal-outline",
  },
  {
    id: "conta_internacional",
    label: "Conta Internacional",
    desc: "Abertura de contas no exterior",
    icon: "business-outline",
  },
];

function ServiceCard({
  service,
  cardWidth,
  colors,
}: {
  service: (typeof SERVICES)[number];
  cardWidth: number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(tabs)/pedidos",
          params: { service: service.id },
        })
      }
      style={({ pressed }) => [
        cardStyles.card,
        {
          width: cardWidth,
          backgroundColor: colors.background,
          borderColor: colors.border,
          opacity: pressed ? 0.72 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <View style={[cardStyles.iconWrap, { backgroundColor: colors.secondary }]}>
        <Ionicons name={service.icon} size={22} color={colors.foreground} />
      </View>
      <Text style={[cardStyles.label, { color: colors.foreground }]} numberOfLines={1}>
        {service.label}
      </Text>
      <Text style={[cardStyles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
        {service.desc}
      </Text>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  desc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
});

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { width } = useWindowDimensions();

  const numColumns = width >= 600 ? 4 : 2;
  const cardWidth = (width - 40 - (numColumns - 1) * 12) / numColumns;

  const { data: rate, isLoading: rateLoading } = useGetExchangeRate(
    { currency: "USD", amount: 1 },
    { refetchInterval: 60_000 }
  );

  const openWhatsApp = () => {
    const url = "https://wa.me/244957636981";
    if (Platform.OS === "web") {
      (window as Window).open(url, "_blank");
    } else {
      import("expo-linking").then(({ openURL }) => openURL(url));
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: isWeb ? 67 + 16 : 16,
          paddingBottom: isWeb ? 34 + 84 : insets.bottom + 80,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.logoRow, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.logoText, { color: colors.foreground }]}>KwanzaVisa</Text>
          <Text style={[styles.logoSub, { color: colors.mutedForeground }]}>
            Pagamentos internacionais
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>AO</Text>
        </View>
      </View>

      <View style={[styles.rateCard, { backgroundColor: colors.primary }]}>
        <View style={styles.rateTop}>
          <View style={styles.rateTopLeft}>
            <Ionicons name="trending-up-outline" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.rateTopLabel}>Taxa de Câmbio · USD</Text>
          </View>
          <Ionicons name="refresh-outline" size={15} color="rgba(255,255,255,0.5)" />
        </View>
        {rateLoading ? (
          <View style={styles.rateLoading}>
            <Text style={styles.rateLoadingText}>A carregar...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.rateValue}>
              {rate?.ratePerUnit?.toLocaleString("pt-AO") ?? "—"}
              <Text style={styles.rateUnit}> Kz</Text>
            </Text>
            <Text style={styles.rateSub}>por 1 USD · actualizado às{" "}
              {rate?.updatedAt
                ? new Date(rate.updatedAt).toLocaleTimeString("pt-AO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </Text>
          </>
        )}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SERVIÇOS</Text>

      <View style={[styles.grid, { gap: 12 }]}>
        {SERVICES.map((s) => (
          <ServiceCard key={s.id} service={s} cardWidth={cardWidth} colors={colors} />
        ))}
      </View>

      <View
        style={[
          styles.disclaimer,
          { backgroundColor: colors.secondary, borderColor: colors.border },
        ]}
      >
        <Ionicons name="information-circle-outline" size={15} color={colors.mutedForeground} />
        <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
          Pagamentos em Euro poderão ser processados mediante conversão do valor para USD à taxa do
          dia.
        </Text>
      </View>

      <Pressable
        onPress={openWhatsApp}
        style={({ pressed }) => [
          styles.waBtn,
          { backgroundColor: "#25D366", opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Ionicons name="logo-whatsapp" size={20} color="#fff" />
        <Text style={styles.waBtnText}>Contactar pelo WhatsApp</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
    marginBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logoText: { fontFamily: "Inter_700Bold", fontSize: 22 },
  logoSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 1 },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  rateCard: { borderRadius: 18, padding: 22, marginBottom: 28 },
  rateTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  rateTopLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  rateTopLabel: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  rateLoading: { paddingVertical: 10 },
  rateLoadingText: {
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  rateValue: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 38,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  rateUnit: { fontFamily: "Inter_400Regular", fontSize: 22 },
  rateSub: {
    color: "rgba(255,255,255,0.55)",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 12,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 24 },
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 13,
    marginBottom: 14,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  waBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 6,
  },
  waBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
