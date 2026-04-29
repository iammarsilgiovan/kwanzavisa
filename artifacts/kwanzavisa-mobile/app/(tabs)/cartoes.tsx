import { Ionicons } from "@expo/vector-icons";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type Feature = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  desc: string;
  soon?: boolean;
};

const FEATURES: Feature[] = [
  {
    icon: "add-circle-outline",
    title: "Criar Cartão Virtual",
    desc: "Cartão Visa virtual para pagamentos internacionais",
    soon: true,
  },
  {
    icon: "time-outline",
    title: "Histórico de Pagamentos",
    desc: "Consulte todas as transacções realizadas",
    soon: true,
  },
  {
    icon: "shield-checkmark-outline",
    title: "Bloquear / Desbloquear",
    desc: "Controle total sobre a segurança do cartão",
    soon: true,
  },
  {
    icon: "document-text-outline",
    title: "Descarregar Extracto",
    desc: "Exporte o extracto em PDF",
    soon: true,
  },
  {
    icon: "checkmark-circle-outline",
    title: "Aprovar Transacção",
    desc: "Autorize pagamentos pendentes",
    soon: true,
  },
  {
    icon: "trash-outline",
    title: "Eliminar Cartão",
    desc: "Cancele o cartão de forma permanente",
    soon: true,
  },
];

function PlaceholderCard({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[pcStyles.card, { backgroundColor: colors.primary }]}>
      <View style={pcStyles.top}>
        <Text style={pcStyles.brand}>KwanzaVisa</Text>
        <View style={[pcStyles.chip, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
          <View style={[pcStyles.chipInner, { backgroundColor: "rgba(255,255,255,0.5)" }]} />
        </View>
      </View>
      <Text style={pcStyles.number} numberOfLines={1}>
        •••• •••• •••• ••••
      </Text>
      <View style={pcStyles.bottom}>
        <View>
          <Text style={pcStyles.small}>TITULAR</Text>
          <Text style={pcStyles.value}>— Em Breve —</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={pcStyles.small}>VALIDADE</Text>
          <Text style={pcStyles.value}>••/••</Text>
        </View>
        <View>
          <Text style={pcStyles.small}>CVV</Text>
          <Text style={pcStyles.value}>•••</Text>
        </View>
      </View>
      <View style={[pcStyles.visaWrap]}>
        <Text style={pcStyles.visaText}>VISA</Text>
      </View>
    </View>
  );
}

const pcStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  top: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  brand: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  chip: { width: 36, height: 28, borderRadius: 5, justifyContent: "center", alignItems: "center" },
  chipInner: { width: 20, height: 14, borderRadius: 3 },
  number: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_500Medium",
    fontSize: 20,
    letterSpacing: 3,
    marginBottom: 24,
  },
  bottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  small: {
    color: "rgba(255,255,255,0.55)",
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  value: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  visaWrap: { position: "absolute", bottom: 22, right: 24 },
  visaText: {
    color: "rgba(255,255,255,0.3)",
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: 2,
  },
});

export default function CartoesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

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
      <PlaceholderCard colors={colors} />

      <View
        style={[
          styles.comingSoonBadge,
          { backgroundColor: colors.secondary, borderColor: colors.border },
        ]}
      >
        <Ionicons name="construct-outline" size={14} color={colors.mutedForeground} />
        <Text style={[styles.comingSoonText, { color: colors.mutedForeground }]}>
          Funcionalidade em desenvolvimento — Em breve
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>O que poderá fazer</Text>

      <View style={[styles.featureList, { borderColor: colors.border }]}>
        {FEATURES.map((f, i) => (
          <View
            key={f.title}
            style={[
              styles.featureRow,
              { borderBottomColor: colors.border },
              i === FEATURES.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={[styles.featureIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name={f.icon} size={19} color={colors.foreground} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
              <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{f.desc}</Text>
            </View>
            <View style={[styles.lockBadge, { backgroundColor: colors.secondary }]}>
              <Ionicons name="lock-closed-outline" size={12} color={colors.mutedForeground} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  comingSoonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 28,
  },
  comingSoonText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    marginBottom: 12,
  },
  featureList: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    overflow: "hidden",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
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
  lockBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
