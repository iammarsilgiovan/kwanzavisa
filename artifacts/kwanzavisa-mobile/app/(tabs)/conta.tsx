import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAdmin } from "@/contexts/AdminContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

type SettingRowProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconBg: string;
  label: string;
  sub?: string;
  onPress?: () => void;
  colors: ReturnType<typeof useColors>;
  danger?: boolean;
  external?: boolean;
};

function SettingRow({ icon, iconBg, label, sub, onPress, colors, danger, external }: SettingRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        rowStyles.row,
        { borderBottomColor: colors.border, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View style={[rowStyles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[rowStyles.label, { color: danger ? colors.destructive : colors.foreground }]}>
          {label}
        </Text>
        {sub && <Text style={[rowStyles.sub, { color: colors.mutedForeground }]}>{sub}</Text>}
      </View>
      <Ionicons
        name={external ? "open-outline" : "chevron-forward"}
        size={15}
        color={colors.mutedForeground}
      />
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontFamily: "Inter_500Medium", fontSize: 15 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
});

function openUrl(url: string) {
  if (Platform.OS === "web") {
    (window as Window).open(url, "_blank");
  } else {
    import("expo-linking").then(({ openURL }) => openURL(url));
  }
}

export default function ContaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { isAuthenticated: isAdminAuth, logout: adminLogout } = useAdmin();
  const { user, isAuthenticated: isUserAuth, logout: userLogout } = useAuth();

  const handleUserLogout = () => {
    Alert.alert("Terminar sessão", "Tem a certeza que quer sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Terminar", style: "destructive", onPress: userLogout },
    ]);
  };

  const handleAdminLogout = () => {
    Alert.alert("Terminar sessão de admin", "Tem a certeza que quer sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Terminar", style: "destructive", onPress: adminLogout },
    ]);
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
      {isUserAuth && user ? (
        <View style={[styles.profileCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
              {user.nome.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{user.nome}</Text>
            <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user.email}</Text>
            {user.telefone && (
              <Text style={[styles.profileTel, { color: colors.mutedForeground }]}>{user.telefone}</Text>
            )}
          </View>
          <View style={[styles.aoBadge, { borderColor: colors.border }]}>
            <Text style={[styles.aoBadgeText, { color: colors.mutedForeground }]}>AO</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.guestCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="person-outline" size={26} color={colors.primaryForeground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>Convidado</Text>
            <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>Entre para aceder a todas as funcionalidades</Text>
          </View>
        </View>
      )}

      {!isUserAuth && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CONTA</Text>
          <View style={[styles.section, { borderColor: colors.border }]}>
            <SettingRow
              icon="log-in-outline"
              iconBg={colors.primary}
              label="Entrar"
              sub="Aceder à minha conta"
              onPress={() => router.push("/auth/login")}
              colors={colors}
            />
            <SettingRow
              icon="person-add-outline"
              iconBg="#5856D6"
              label="Criar conta"
              sub="Registo gratuito"
              onPress={() => router.push("/auth/register")}
              colors={colors}
            />
          </View>
        </>
      )}

      {isUserAuth && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>IDENTIDADE</Text>
          <View style={[styles.section, { borderColor: colors.border }]}>
            <SettingRow
              icon="shield-checkmark-outline"
              iconBg="#007AFF"
              label="Verificação KYC"
              sub="Necessária para emissão de cartões"
              onPress={() => router.push("/kyc")}
              colors={colors}
            />
          </View>
        </>
      )}

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SUPORTE</Text>
      <View style={[styles.section, { borderColor: colors.border }]}>
        <SettingRow
          icon="logo-whatsapp"
          iconBg="#25D366"
          label="WhatsApp"
          sub="+244 957 636 981"
          onPress={() => openUrl("https://wa.me/244957636981")}
          colors={colors}
          external
        />
        <SettingRow
          icon="globe-outline"
          iconBg="#007AFF"
          label="Website"
          sub="kwanzavisa.com"
          onPress={() => openUrl("https://kwanzavisa.com")}
          colors={colors}
          external
        />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PEDIDOS</Text>
      <View style={[styles.section, { borderColor: colors.border }]}>
        <SettingRow
          icon="add-circle-outline"
          iconBg={colors.primary}
          label="Novo Pedido"
          onPress={() => router.push("/(tabs)/pedidos")}
          colors={colors}
        />
        <SettingRow
          icon="search-outline"
          iconBg="#636366"
          label="Rastrear Pedido"
          onPress={() => router.push({ pathname: "/(tabs)/pedidos", params: { tab: "rastrear" } })}
          colors={colors}
        />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ADMINISTRAÇÃO</Text>
      <View style={[styles.section, { borderColor: colors.border }]}>
        {isAdminAuth ? (
          <>
            <SettingRow icon="grid-outline" iconBg="#5856D6" label="Dashboard" onPress={() => router.push("/admin/dashboard")} colors={colors} />
            <SettingRow icon="list-outline" iconBg="#34C759" label="Gerir Pedidos" onPress={() => router.push("/admin/pedidos")} colors={colors} />
            <SettingRow icon="people-outline" iconBg="#007AFF" label="KYC Pendente" onPress={() => router.push("/admin/kyc")} colors={colors} />
            <SettingRow icon="trending-up-outline" iconBg="#FF9500" label="Taxa de Câmbio" onPress={() => router.push("/admin/cambio")} colors={colors} />
            <SettingRow icon="log-out-outline" iconBg={colors.destructive} label="Terminar Sessão Admin" onPress={handleAdminLogout} colors={colors} danger />
          </>
        ) : (
          <SettingRow
            icon="lock-closed-outline"
            iconBg="#636366"
            label="Acesso Restrito"
            sub="Apenas para administradores"
            onPress={() => router.push("/admin")}
            colors={colors}
          />
        )}
      </View>

      {isUserAuth && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SESSÃO</Text>
          <View style={[styles.section, { borderColor: colors.border }]}>
            <SettingRow
              icon="log-out-outline"
              iconBg={colors.destructive}
              label="Terminar sessão"
              onPress={handleUserLogout}
              colors={colors}
              danger
            />
          </View>
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 28,
  },
  guestCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 28,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 22 },
  profileName: { fontFamily: "Inter_700Bold", fontSize: 17 },
  profileEmail: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  profileTel: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  aoBadge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aoBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  section: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 24,
  },
  version: {
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 4,
  },
});
