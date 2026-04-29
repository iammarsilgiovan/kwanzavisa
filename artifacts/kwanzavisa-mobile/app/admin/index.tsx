import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAdmin } from "@/contexts/AdminContext";
import { useColors } from "@/hooks/useColors";

export default function AdminLoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { login } = useAdmin();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!password) return;
    setLoading(true);
    const ok = await login(password);
    setLoading(false);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/admin/dashboard");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Acesso negado", "Palavra-passe incorrecta.");
      setPassword("");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.inner,
          {
            paddingTop: isWeb ? 67 : insets.top + 20,
            paddingBottom: isWeb ? 34 : insets.bottom + 20,
          },
        ]}
      >
        <View style={styles.top}>
          <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
            <Feather name="shield" size={32} color={colors.foreground} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Área Reservada</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Apenas para administradores KwanzaVisa
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Palavra-passe</Text>
          <View style={[styles.passwordRow, { borderColor: colors.border }]}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPassword}
              style={[styles.input, { color: colors.foreground }]}
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loading || !password}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: colors.primary, opacity: pressed || loading || !password ? 0.6 : 1 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitText}>Entrar</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 28, justifyContent: "center" },
  top: { alignItems: "center", marginBottom: 40, gap: 12 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  form: { gap: 0 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 8 },
  passwordRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, marginBottom: 16 },
  input: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontFamily: "Inter_400Regular", fontSize: 16 },
  eyeBtn: { padding: 14 },
  submitBtn: { borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  submitText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
});
