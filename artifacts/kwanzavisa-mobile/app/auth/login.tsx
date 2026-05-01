import { Ionicons } from "@expo/vector-icons";
import { useAuthLogin } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { mutateAsync: doLogin, isPending } = useAuthLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Campos obrigatórios", "Preencha o e-mail e a palavra-passe.");
      return;
    }
    try {
      const res = await doLogin({ data: { email: email.trim().toLowerCase(), password } });
      await login(res.token, res.user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "E-mail ou palavra-passe incorrectos.";
      Alert.alert("Acesso negado", msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.foreground} />
        </Pressable>

        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="person-outline" size={30} color={colors.primaryForeground} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Entrar</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Aceda à sua conta KwanzaVisa
          </Text>
        </View>

        <View style={fStyles.wrap}>
          <Text style={[fStyles.label, { color: colors.mutedForeground }]}>E-mail</Text>
          <View style={[fStyles.row, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
            <Ionicons name="mail-outline" size={17} color={colors.mutedForeground} style={{ marginLeft: 13 }} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="email@exemplo.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={[fStyles.input, { color: colors.foreground }]}
            />
          </View>
        </View>

        <View style={fStyles.wrap}>
          <Text style={[fStyles.label, { color: colors.mutedForeground }]}>Palavra-passe</Text>
          <View style={[fStyles.row, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
            <Ionicons name="lock-closed-outline" size={17} color={colors.mutedForeground} style={{ marginLeft: 13 }} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPassword}
              autoComplete="password"
              style={[fStyles.input, { color: colors.foreground }]}
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 13 }}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={19} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={isPending}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: colors.primary, opacity: pressed || isPending ? 0.7 : 1 },
          ]}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="log-in-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Entrar</Text>
            </>
          )}
        </Pressable>

        <View style={styles.divider}>
          <View style={[styles.divLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.divText, { color: colors.mutedForeground }]}>ou</Text>
          <View style={[styles.divLine, { backgroundColor: colors.border }]} />
        </View>

        <Pressable
          onPress={() => router.replace("/auth/register")}
          style={[styles.secondaryBtn, { borderColor: colors.border }]}
        >
          <Ionicons name="person-add-outline" size={18} color={colors.foreground} />
          <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>
            Criar conta nova
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const fStyles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 7 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 13,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24 },
  closeBtn: {
    alignSelf: "flex-start",
    padding: 4,
    marginBottom: 32,
  },
  header: { alignItems: "center", marginBottom: 40, gap: 12 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 26 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 8,
  },
  btnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 },
  divLine: { flex: 1, height: StyleSheet.hairlineWidth },
  divText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
  },
  secondaryBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
