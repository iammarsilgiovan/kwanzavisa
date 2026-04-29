import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

function CardPlaceholder() {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardLabel}>KwanzaVisa</Text>
        <View style={styles.chipRow}>
          <View style={[styles.chip, { backgroundColor: "rgba(255,255,255,0.4)" }]} />
        </View>
      </View>
      <Text style={styles.cardNumber}>•••• •••• •••• ••••</Text>
      <View style={styles.cardBottom}>
        <View>
          <Text style={styles.cardSmall}>Titular</Text>
          <Text style={styles.cardName}>— Em Breve —</Text>
        </View>
        <View>
          <Text style={styles.cardSmall}>Validade</Text>
          <Text style={styles.cardName}>••/••</Text>
        </View>
      </View>
    </View>
  );
}

export default function CartoesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const features = [
    { icon: "credit-card" as const, title: "Criar Cartão Virtual", desc: "Cartão Visa virtual para pagamentos internacionais" },
    { icon: "clock" as const, title: "Histórico de Pagamentos", desc: "Consulte todas as transacções realizadas" },
    { icon: "shield" as const, title: "Bloquear / Desbloquear", desc: "Controle total sobre a segurança do cartão" },
    { icon: "download" as const, title: "Descarregar Extracto", desc: "Exporte o extracto em PDF" },
    { icon: "check-circle" as const, title: "Aprovar Transacção", desc: "Autorize pagamentos pendentes de aprovação" },
    { icon: "trash-2" as const, title: "Eliminar Cartão", desc: "Cancele o cartão de forma permanente" },
  ];

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
      <CardPlaceholder />

      <View style={[styles.comingBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Feather name="clock" size={14} color={colors.mutedForeground} />
        <Text style={[styles.comingText, { color: colors.mutedForeground }]}>Funcionalidade em desenvolvimento</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>O que poderá fazer</Text>

      {features.map((f) => (
        <View key={f.title} style={[styles.featureRow, { borderBottomColor: colors.border }]}>
          <View style={[styles.featureIcon, { backgroundColor: colors.secondary }]}>
            <Feather name={f.icon} size={18} color={colors.foreground} />
          </View>
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
            <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{f.desc}</Text>
          </View>
          <Feather name="lock" size={14} color={colors.mutedForeground} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 0 },
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  cardLabel: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  chipRow: { flexDirection: "row" },
  chip: { width: 32, height: 24, borderRadius: 4 },
  cardNumber: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    letterSpacing: 3,
    marginBottom: 24,
  },
  cardBottom: { flexDirection: "row", justifyContent: "space-between" },
  cardSmall: { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", fontSize: 11, marginBottom: 2 },
  cardName: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  comingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 24,
  },
  comingText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    marginBottom: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { flex: 1 },
  featureTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  featureDesc: { fontFamily: "Inter_400Regular", fontSize: 12 },
});
