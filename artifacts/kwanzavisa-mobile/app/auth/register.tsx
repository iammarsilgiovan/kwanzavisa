import { Ionicons } from "@expo/vector-icons";
import { useAuthRegister } from "@workspace/api-client-react";
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

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { mutateAsync: doRegister, isPending } = useAuthRegister();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!nome.trim() || !email.trim() || !password) {
      Alert.alert("Campos obrigatórios", "Nome, e-mail e palavra-passe são obrigatórios.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Palavra-passe curta", "A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Palavras-passe diferentes", "As palavras-passe não coincidem.");
      return;
    }
    try {
      const res = await doRegister({
        data: {
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          telefone: telefone.trim() || null,
          password,
        },
      });
      await login(res.token, res.user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Erro ao criar conta. Tente novamente.";
      Alert.alert("Erro", msg);
    }
  };

  const InputField = ({
    label,
    value,
    onChange,
    placeholder,
    icon,
    keyboard,
    secure,
    autoComplete,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    keyboard?: "default" | "email-address" | "phone-pad";
    secure?: boolean;
    autoComplete?: "off" | "email" | "name" | "tel" | "password" | "new-password";
  }) => (
    <View style={fStyles.wrap}>
      <Text style={[fStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[fStyles.row, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
        <Ionicons name={icon} size={17} color={colors.mutedForeground} style={{ marginLeft: 13 }} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboard}
          secureTextEntry={secure}
          autoCapitalize={keyboard === "email-address" ? "none" : "words"}
          autoComplete={autoComplete}
          style={[fStyles.input, { color: colors.foreground }]}
        />
      </View>
    </View>
  );

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
            <Ionicons name="person-add-outline" size={28} color={colors.primaryForeground} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Criar conta</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Registe-se para aceder a todas as funcionalidades
          </Text>
        </View>

        <InputField label="Nome completo" value={nome} onChange={setNome} placeholder="O seu nome" icon="person-outline" autoComplete="name" />
        <InputField label="E-mail" value={email} onChange={setEmail} placeholder="email@exemplo.com" icon="mail-outline" keyboard="email-address" autoComplete="email" />
        <InputField label="Telemóvel (opcional)" value={telefone} onChange={setTelefone} placeholder="+244 9XX XXX XXX" icon="call-outline" keyboard="phone-pad" autoComplete="tel" />

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
              autoComplete="new-password"
              style={[fStyles.input, { color: colors.foreground }]}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 13 }}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={19} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        <InputField label="Confirmar palavra-passe" value={confirm} onChange={setConfirm} placeholder="Repita a palavra-passe" icon="shield-checkmark-outline" secure={!showPassword} autoComplete="new-password" />

        <Pressable
          onPress={handleRegister}
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
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Criar conta</Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.replace("/auth/login")}
          style={styles.link}
        >
          <Text style={[styles.linkText, { color: colors.mutedForeground }]}>
            Já tem conta?{" "}
            <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>
              Entrar
            </Text>
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
  closeBtn: { alignSelf: "flex-start", padding: 4, marginBottom: 24 },
  header: { alignItems: "center", marginBottom: 32, gap: 12 },
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
    marginBottom: 16,
  },
  btnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
  link: { alignItems: "center", paddingVertical: 4 },
  linkText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
