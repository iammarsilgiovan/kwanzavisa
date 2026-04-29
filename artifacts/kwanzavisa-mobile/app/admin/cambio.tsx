import { Ionicons } from "@expo/vector-icons";
import { useAdminGetExchangeRates, useAdminSetExchangeRate } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function AdminCambioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const { data, isLoading, refetch } = useAdminGetExchangeRates({ refetchInterval: 30_000 });
  const { mutateAsync: setRate, isPending } = useAdminSetExchangeRate();

  const [newRate, setNewRate] = useState("");
  const [changedBy, setChangedBy] = useState("admin-mobile");

  useEffect(() => {
    if (data?.activeUsd) setNewRate(String(data.activeUsd));
  }, [data?.activeUsd]);

  const handleSave = async () => {
    const rate = Number(newRate);
    if (!rate || rate <= 0) {
      Alert.alert("Valor inválido", "Introduza uma taxa maior que zero.");
      return;
    }
    try {
      await setRate({ data: { currency: "USD", rate, changedBy: changedBy || "admin-mobile" } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
      Alert.alert("Actualizado", `Taxa actualizada: 1 USD = ${rate.toLocaleString("pt-AO")} Kz`);
    } catch {
      Alert.alert("Erro", "Não foi possível actualizar a taxa.");
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: isWeb ? 67 + 16 : 16,
          paddingBottom: isWeb ? 34 : insets.bottom + 20,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.currentCard, { backgroundColor: colors.primary }]}>
        <View style={styles.currentCardTop}>
          <View style={[styles.rateIcon, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Ionicons name="trending-up-outline" size={18} color="#fff" />
          </View>
          <View>
            <Text style={styles.currentLabel}>Taxa Actual</Text>
            <Text style={styles.currentSub}>USD → Kwanza angolano</Text>
          </View>
        </View>
        {isLoading ? (
          <ActivityIndicator color="rgba(255,255,255,0.7)" style={{ marginVertical: 12 }} />
        ) : (
          <>
            <Text style={styles.currentRate}>
              {data?.activeUsd?.toLocaleString("pt-AO") ?? "—"}
              <Text style={styles.currentRateUnit}> Kz</Text>
            </Text>
            <Text style={styles.currentMeta}>
              por {data?.lastUpdatedBy ?? "—"}
              {data?.lastUpdated
                ? ` · ${new Date(data.lastUpdated).toLocaleDateString("pt-AO")}`
                : ""}
            </Text>
          </>
        )}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACTUALIZAR TAXA</Text>

      <View style={[styles.formCard, { borderColor: colors.border }]}>
        <View style={formStyles.wrap}>
          <Text style={[formStyles.label, { color: colors.mutedForeground }]}>
            Nova taxa (Kz por 1 USD)
          </Text>
          <View style={[formStyles.inputRow, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
            <Ionicons name="cash-outline" size={17} color={colors.mutedForeground} style={{ marginLeft: 12 }} />
            <TextInput
              value={newRate}
              onChangeText={setNewRate}
              placeholder="Ex: 920"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              style={[formStyles.input, { color: colors.foreground }]}
            />
          </View>
        </View>

        <View style={formStyles.wrap}>
          <Text style={[formStyles.label, { color: colors.mutedForeground }]}>Alterado por</Text>
          <View style={[formStyles.inputRow, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
            <Ionicons name="person-outline" size={17} color={colors.mutedForeground} style={{ marginLeft: 12 }} />
            <TextInput
              value={changedBy}
              onChangeText={setChangedBy}
              placeholder="admin-mobile"
              placeholderTextColor={colors.mutedForeground}
              style={[formStyles.input, { color: colors.foreground }]}
            />
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={isPending}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: colors.primary, opacity: pressed || isPending ? 0.7 : 1 },
          ]}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="save-outline" size={17} color="#fff" />
              <Text style={styles.saveBtnText}>Guardar Taxa</Text>
            </>
          )}
        </Pressable>
      </View>

      {(data?.history?.length ?? 0) > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>HISTÓRICO</Text>
          <View style={[styles.historyCard, { borderColor: colors.border }]}>
            {data!.history.slice(0, 10).map((h, i) => (
              <View
                key={h.id}
                style={[
                  styles.historyRow,
                  { borderBottomColor: colors.border },
                  i === Math.min(data!.history.length, 10) - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyRate, { color: colors.foreground }]}>
                    {h.rate.toLocaleString("pt-AO")} Kz
                  </Text>
                  <Text style={[styles.historyMeta, { color: colors.mutedForeground }]}>
                    {h.changedBy} · {h.formattedDate}
                  </Text>
                </View>
                {h.previousRate != null && (
                  <View
                    style={[
                      styles.diffBadge,
                      {
                        backgroundColor:
                          h.rate > h.previousRate ? "#34C75920" : "#FF3B3020",
                      },
                    ]}
                  >
                    <Ionicons
                      name={h.rate > h.previousRate ? "arrow-up" : "arrow-down"}
                      size={12}
                      color={h.rate > h.previousRate ? "#34C759" : "#FF3B30"}
                    />
                    <Text
                      style={[
                        styles.diffText,
                        {
                          color: h.rate > h.previousRate ? "#34C759" : "#FF3B30",
                        },
                      ]}
                    >
                      {Math.abs(h.rate - h.previousRate).toLocaleString("pt-AO")}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const formStyles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 7 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
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
  content: { paddingHorizontal: 16 },
  currentCard: { borderRadius: 18, padding: 22, marginBottom: 24 },
  currentCardTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  rateIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  currentLabel: { color: "rgba(255,255,255,0.85)", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  currentSub: { color: "rgba(255,255,255,0.55)", fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  currentRate: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 42, letterSpacing: -1 },
  currentRateUnit: { fontFamily: "Inter_400Regular", fontSize: 24 },
  currentMeta: { color: "rgba(255,255,255,0.55)", fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.8, marginBottom: 10 },
  formCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 24 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  saveBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  historyCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden", marginBottom: 8 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyRate: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  historyMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  diffBadge: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  diffText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
});
