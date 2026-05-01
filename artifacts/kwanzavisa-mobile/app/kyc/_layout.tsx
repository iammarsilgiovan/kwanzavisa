import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";

export default function KycLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: colors.foreground },
        headerShadowVisible: false,
        headerBackTitle: "Voltar",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Verificar Identidade" }} />
      <Stack.Screen name="documentos" options={{ title: "Documentos" }} />
      <Stack.Screen name="estado" options={{ title: "Estado do KYC" }} />
    </Stack>
  );
}
