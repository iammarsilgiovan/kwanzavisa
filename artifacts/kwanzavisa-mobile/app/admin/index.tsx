import { Ionicons } from "@expo/vector-icons";
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
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="shield-checkmark-outline" size={34} color={colors.primaryForeground} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Área Reservada</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Acesso exclusivo para administradores KwanzaVisa
          </Text>
        </View>

        <View>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Palavra-passe</Text>
          <View
            style={[
              styles.inputRow,
              { borderColor: colors.border, backgroundColor: colors.secondary },
            ]}
          >
            <Ionicons name="lock-closed-outline" size={17} color={colors.mutedForeground} style={{ marginLeft: 14 }} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Introduza a palavra-passe"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPassword}
              style={[styles.input, { color: colors.foreground }]}
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={19}
                color={colors.mutedForeground}
              />
            </Pressable>
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loading || !password}
            style={({ pressed }) => [
              styles.loginBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed || loading || !password ? 0.6 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={18} color="#fff" />
                <Text style={styles.loginText}>Entrar</Text>
              </>
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
  top: { alignItems: "center", marginBottom: 48, gap: 14 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 26 },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 15,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  eyeBtn: { padding: 14 },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 15,
  },
  loginText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
});
