import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAdmin } from "@/contexts/AdminContext";
import { useColors } from "@/hooks/useColors";

function SettingRow({
  icon,
  label,
  sub,
  onPress,
  colors,
  danger,
  rightIcon,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  sub?: string;
  onPress?: () => void;
  colors: ReturnType<typeof useColors>;
  danger?: boolean;
  rightIcon?: React.ComponentProps<typeof Feather>["name"];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border, opacity: pressed ? 0.65 : 1 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={18} color={danger ? colors.destructive : colors.foreground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: danger ? colors.destructive : colors.foreground }]}>{label}</Text>
        {sub && <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{sub}</Text>}
      </View>
      <Feather name={rightIcon ?? "chevron-right"} size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function ContaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { isAuthenticated, logout } = useAdmin();

  const openWhatsApp = () => {
    const url = "https://wa.me/244957636981";
    if (Platform.OS === "web") {
      // @ts-ignore
      window.open(url, "_blank");
    } else {
      import("expo-linking").then(({ openURL }) => openURL(url));
    }
  };

  const openWebsite = () => {
    const url = "https://kwanzavisa.com";
    if (Platform.OS === "web") {
      // @ts-ignore
      window.open(url, "_blank");
    } else {
      import("expo-linking").then(({ openURL }) => openURL(url));
    }
  };

  const handleAdminLogout = () => {
    Alert.alert("Terminar sessão de admin", "Tem a certeza?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Terminar sessão", style: "destructive", onPress: logout },
    ]);
  };

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
      <View style={[styles.profileCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Feather name="user" size={28} color={colors.primaryForeground} />
        </View>
        <View>
          <Text style={[styles.profileName, { color: colors.foreground }]}>Convidado</Text>
          <Text style={[styles.profileSub, { color: colors.mutedForeground }]}>Conta de utilizador — Em breve</Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SUPORTE</Text>
      <View style={[styles.section, { borderColor: colors.border }]}>
        <SettingRow icon="message-circle" label="WhatsApp" sub="+244 957 636 981" onPress={openWhatsApp} colors={colors} />
        <SettingRow icon="globe" label="Website" sub="kwanzavisa.com" onPress={openWebsite} colors={colors} rightIcon="external-link" />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PEDIDOS</Text>
      <View style={[styles.section, { borderColor: colors.border }]}>
        <SettingRow icon="plus-circle" label="Novo Pedido" onPress={() => router.push("/(tabs)/pedidos")} colors={colors} />
        <SettingRow icon="search" label="Rastrear Pedido" onPress={() => router.push({ pathname: "/(tabs)/pedidos", params: { tab: "rastrear" } })} colors={colors} />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ADMINISTRAÇÃO</Text>
      <View style={[styles.section, { borderColor: colors.border }]}>
        {isAuthenticated ? (
          <>
            <SettingRow icon="layout" label="Dashboard Admin" onPress={() => router.push("/admin/dashboard")} colors={colors} />
            <SettingRow icon="list" label="Gerir Pedidos" onPress={() => router.push("/admin/pedidos")} colors={colors} />
            <SettingRow icon="trending-up" label="Taxa de Câmbio" onPress={() => router.push("/admin/cambio")} colors={colors} />
            <SettingRow icon="log-out" label="Terminar Sessão Admin" onPress={handleAdminLogout} colors={colors} danger />
          </>
        ) : (
          <SettingRow icon="lock" label="Acesso Restrito" sub="Apenas para administradores" onPress={() => router.push("/admin")} colors={colors} />
        )}
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>KwanzaVisa v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 0 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 28,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  profileName: { fontFamily: "Inter_700Bold", fontSize: 18 },
  profileSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  section: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontFamily: "Inter_500Medium", fontSize: 15 },
  rowSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 1 },
  version: { textAlign: "center", fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 8 },
});
