import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";

export default function AdminLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
        headerShadowVisible: false,
        headerBackTitle: "Voltar",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Administração" }} />
      <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Stack.Screen name="pedidos" options={{ title: "Pedidos" }} />
      <Stack.Screen name="cambio" options={{ title: "Taxa de Câmbio" }} />
      <Stack.Screen name="kyc" options={{ title: "Verificações KYC" }} />
    </Stack>
  );
}
