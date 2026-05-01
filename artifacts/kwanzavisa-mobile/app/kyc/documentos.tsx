import { Ionicons } from "@expo/vector-icons";
import { useKycUpload, useKycSubmit, useKycGetStatus } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type DocTipo = "bi_frente" | "bi_verso" | "selfie";

const DOC_TIPOS: { tipo: DocTipo; label: string; desc: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { tipo: "bi_frente", label: "BI — Frente", desc: "Frente do Bilhete de Identidade", icon: "card-outline" },
  { tipo: "bi_verso", label: "BI — Verso", desc: "Verso do Bilhete de Identidade", icon: "card-outline" },
  { tipo: "selfie", label: "Selfie com BI", desc: "Foto sua segurando o BI visível", icon: "camera-outline" },
];

export default function KycDocumentosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { mutateAsync: uploadDoc, isPending: uploading } = useKycUpload();
  const { mutateAsync: submitKyc, isPending: submitting } = useKycSubmit();
  const { data: kycStatus } = useKycGetStatus({});

  const [docs, setDocs] = useState<Record<DocTipo, string | null>>({
    bi_frente: null,
    bi_verso: null,
    selfie: null,
  });
  const [uploading_tipo, setUploadingTipo] = useState<DocTipo | null>(null);

  const uploadedFromServer = kycStatus?.uploadedDocs?.map((d) => d.tipo) ?? [];

  const pickImage = async (tipo: DocTipo) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão negada", "Precisamos de acesso à sua galeria.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      aspect: tipo === "selfie" ? [1, 1] : [16, 10],
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const base64 = `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`;

    setUploadingTipo(tipo);
    try {
      await uploadDoc({
        data: {
          tipo,
          base64Data: base64,
          fileName: asset.fileName ?? `${tipo}.jpg`,
          mimeType: asset.mimeType ?? "image/jpeg",
        },
      });
      setDocs((prev) => ({ ...prev, [tipo]: asset.uri }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Erro", "Não foi possível enviar o documento. Tente novamente.");
    } finally {
      setUploadingTipo(null);
    }
  };

  const takePhoto = async (tipo: DocTipo) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão negada", "Precisamos de acesso à câmara.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      aspect: tipo === "selfie" ? [1, 1] : [16, 10],
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const base64 = `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`;

    setUploadingTipo(tipo);
    try {
      await uploadDoc({
        data: {
          tipo,
          base64Data: base64,
          fileName: `${tipo}.jpg`,
          mimeType: asset.mimeType ?? "image/jpeg",
        },
      });
      setDocs((prev) => ({ ...prev, [tipo]: asset.uri }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Erro", "Não foi possível enviar o documento. Tente novamente.");
    } finally {
      setUploadingTipo(null);
    }
  };

  const handlePickOptions = (tipo: DocTipo) => {
    Alert.alert("Adicionar documento", "Como quer enviar?", [
      { text: "Tirar foto", onPress: () => takePhoto(tipo) },
      { text: "Escolher da galeria", onPress: () => pickImage(tipo) },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const isDocDone = (tipo: DocTipo) => docs[tipo] !== null || uploadedFromServer.includes(tipo);

  const allDone = DOC_TIPOS.every((d) => isDocDone(d.tipo));

  const handleSubmit = async () => {
    if (!allDone) {
      Alert.alert("Documentos em falta", "Envie todos os documentos antes de submeter.");
      return;
    }
    try {
      await submitKyc({});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/kyc/estado");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Erro ao submeter. Tente novamente.";
      Alert.alert("Erro", msg);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Envie os documentos abaixo. Formatos aceites: JPG, PNG.
      </Text>

      {DOC_TIPOS.map((d) => {
        const done = isDocDone(d.tipo);
        const isUploading = uploading_tipo === d.tipo;
        return (
          <View key={d.tipo} style={[styles.docCard, { borderColor: done ? "#34C759" : colors.border, backgroundColor: colors.background }]}>
            <View style={styles.docTop}>
              <View style={[styles.docIcon, { backgroundColor: done ? "#34C75920" : colors.secondary }]}>
                <Ionicons
                  name={done ? "checkmark-circle" : d.icon}
                  size={22}
                  color={done ? "#34C759" : colors.foreground}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.docLabel, { color: colors.foreground }]}>{d.label}</Text>
                <Text style={[styles.docDesc, { color: colors.mutedForeground }]}>{d.desc}</Text>
              </View>
              {done && <Ionicons name="checkmark-circle" size={22} color="#34C759" />}
            </View>

            {docs[d.tipo] && (
              <Image source={{ uri: docs[d.tipo]! }} style={styles.preview} resizeMode="cover" />
            )}

            <Pressable
              onPress={() => handlePickOptions(d.tipo)}
              disabled={isUploading || uploading}
              style={({ pressed }) => [
                styles.docBtn,
                {
                  backgroundColor: done ? colors.secondary : colors.primary,
                  opacity: pressed || isUploading || uploading ? 0.7 : 1,
                },
              ]}
            >
              {isUploading ? (
                <ActivityIndicator color={done ? colors.foreground : "#fff"} size="small" />
              ) : (
                <>
                  <Ionicons
                    name={done ? "refresh-outline" : "cloud-upload-outline"}
                    size={16}
                    color={done ? colors.foreground : "#fff"}
                  />
                  <Text style={[styles.docBtnText, { color: done ? colors.foreground : "#fff" }]}>
                    {done ? "Substituir" : "Enviar"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        );
      })}

      {allDone && (
        <View style={[styles.readyBadge, { backgroundColor: "#34C75918", borderColor: "#34C75940" }]}>
          <Ionicons name="checkmark-circle" size={16} color="#34C759" />
          <Text style={styles.readyText}>Todos os documentos enviados. Pode submeter.</Text>
        </View>
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={!allDone || submitting}
        style={({ pressed }) => [
          styles.submitBtn,
          { backgroundColor: allDone ? colors.primary : colors.secondary, opacity: pressed || submitting ? 0.7 : 1 },
        ]}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="send-outline" size={17} color={allDone ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.submitBtnText, { color: allDone ? "#fff" : colors.mutedForeground }]}>
              Submeter para revisão
            </Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 24 },
  docCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  docTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  docIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  docLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  docDesc: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  preview: { width: "100%", height: 140, borderRadius: 10 },
  docBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    paddingVertical: 11,
  },
  docBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  readyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 13,
    marginBottom: 16,
  },
  readyText: { color: "#34C759", fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 15,
  },
  submitBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
});
