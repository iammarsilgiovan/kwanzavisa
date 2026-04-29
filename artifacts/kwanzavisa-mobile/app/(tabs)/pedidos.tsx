import { Feather } from "@expo/vector-icons";
import {
  useCreateOrder,
  useLookupOrders,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

import { useColors } from "@/hooks/useColors";

type ServiceType = "cartao_virtual" | "acesso_assistido" | "transferencia" | "conta_internacional";

const SERVICE_LABELS: Record<ServiceType, string> = {
  cartao_virtual: "Cartão Virtual",
  acesso_assistido: "Acesso Assistido",
  transferencia: "Transferência",
  conta_internacional: "Conta Internacional",
};

const PLATFORMS = ["Amazon", "Netflix", "Spotify", "Steam", "PayPal", "Apple", "Google", "Outro"];
const INTL_PLATFORMS = ["Wise", "Bybit", "Kast"] as const;
const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  em_contacto: "Em Contacto",
  aguarda_pagamento: "Aguarda Pagamento",
  pago: "Pago",
  em_processamento: "Em Processamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};
const STATUS_COLORS: Record<string, string> = {
  pendente: "#FF9500",
  em_contacto: "#007AFF",
  aguarda_pagamento: "#FF9500",
  pago: "#34C759",
  em_processamento: "#007AFF",
  concluido: "#34C759",
  cancelado: "#FF3B30",
};

function SegmentedControl({
  options,
  selected,
  onChange,
  colors,
}: {
  options: string[];
  selected: number;
  onChange: (i: number) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[segStyles.container, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      {options.map((opt, i) => (
        <Pressable
          key={opt}
          onPress={() => onChange(i)}
          style={[
            segStyles.option,
            selected === i && { backgroundColor: colors.background },
            selected === i && { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
          ]}
        >
          <Text style={[segStyles.label, { color: selected === i ? colors.foreground : colors.mutedForeground }]}>
            {opt}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const segStyles = StyleSheet.create({
  container: { flexDirection: "row", borderRadius: 10, padding: 3, borderWidth: StyleSheet.hairlineWidth },
  option: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  multiline?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={inputStyles.wrapper}>
      <Text style={[inputStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          inputStyles.input,
          { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background },
          multiline && { height: 80, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
});

function SelectInput({
  label,
  value,
  options,
  onSelect,
  colors,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onSelect: (v: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={inputStyles.wrapper}>
      <Text style={[inputStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Pressable
        onPress={() => setOpen(!open)}
        style={[inputStyles.input, { borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
      >
        <Text style={{ color: value ? colors.foreground : colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 15 }}>
          {value || "Seleccionar..."}
        </Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
      </Pressable>
      {open && (
        <View style={[selectStyles.dropdown, { borderColor: colors.border, backgroundColor: colors.background }]}>
          {options.map((opt) => (
            <Pressable
              key={opt}
              onPress={() => { onSelect(opt); setOpen(false); }}
              style={[selectStyles.option, { borderBottomColor: colors.border }]}
            >
              <Text style={{ color: colors.foreground, fontFamily: "Inter_400Regular", fontSize: 15 }}>{opt}</Text>
              {value === opt && <Feather name="check" size={16} color={colors.foreground} />}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const selectStyles = StyleSheet.create({
  dropdown: { borderWidth: 1, borderRadius: 10, marginTop: 4, overflow: "hidden" },
  option: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});

function NovoPedido({ preselectedService }: { preselectedService?: string }) {
  const colors = useColors();
  const { mutateAsync: createOrder, isPending } = useCreateOrder();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [service, setService] = useState<ServiceType>(
    (preselectedService as ServiceType) || "cartao_virtual"
  );
  const [platform, setPlatform] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [intlPlatform, setIntlPlatform] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !whatsapp.trim()) {
      Alert.alert("Campos obrigatórios", "Nome, e-mail e WhatsApp são obrigatórios.");
      return;
    }
    try {
      await createOrder({
        data: {
          name: name.trim(),
          email: email.trim(),
          whatsapp: whatsapp.trim(),
          service,
          platform: platform || null,
          amount: amount ? Number(amount) : null,
          currency: amount ? "USD" : null,
          description: description || null,
          intlPlatform: (intlPlatform as "Wise" | "Bybit" | "Kast") || null,
          recipientName: recipientName || null,
          destinationCountry: destinationCountry || null,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch {
      Alert.alert("Erro", "Não foi possível submeter o pedido. Tente novamente.");
    }
  };

  if (submitted) {
    return (
      <View style={formStyles.success}>
        <View style={[formStyles.successIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="check-circle" size={40} color={colors.foreground} />
        </View>
        <Text style={[formStyles.successTitle, { color: colors.foreground }]}>Pedido submetido</Text>
        <Text style={[formStyles.successSub, { color: colors.mutedForeground }]}>
          Entraremos em contacto via WhatsApp em breve.
        </Text>
        <Pressable
          onPress={() => { setSubmitted(false); setName(""); setEmail(""); setWhatsapp(""); setDescription(""); setAmount(""); setPlatform(""); setIntlPlatform(""); setRecipientName(""); setDestinationCountry(""); }}
          style={[formStyles.newBtn, { borderColor: colors.border }]}
        >
          <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>Novo pedido</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ gap: 0 }}>
      <Input label="Nome completo" value={name} onChangeText={setName} placeholder="O seu nome" colors={colors} />
      <Input label="E-mail" value={email} onChangeText={setEmail} placeholder="email@exemplo.com" keyboardType="email-address" colors={colors} />
      <Input label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} placeholder="+244 9XX XXX XXX" keyboardType="phone-pad" colors={colors} />

      <View style={inputStyles.wrapper}>
        <Text style={[inputStyles.label, { color: colors.mutedForeground }]}>Serviço</Text>
        <View style={{ gap: 8 }}>
          {(Object.entries(SERVICE_LABELS) as [ServiceType, string][]).map(([k, v]) => (
            <Pressable
              key={k}
              onPress={() => setService(k)}
              style={[
                serviceSelectStyles.option,
                { borderColor: service === k ? colors.foreground : colors.border, backgroundColor: service === k ? colors.secondary : colors.background },
              ]}
            >
              <Text style={{ color: colors.foreground, fontFamily: service === k ? "Inter_600SemiBold" : "Inter_400Regular", fontSize: 14 }}>{v}</Text>
              {service === k && <Feather name="check" size={16} color={colors.foreground} />}
            </Pressable>
          ))}
        </View>
      </View>

      {(service === "cartao_virtual" || service === "acesso_assistido") && (
        <SelectInput label="Plataforma" value={platform} options={PLATFORMS} onSelect={setPlatform} colors={colors} />
      )}
      {service === "transferencia" && (
        <>
          <SelectInput label="Plataforma Internacional" value={intlPlatform} options={INTL_PLATFORMS} onSelect={setIntlPlatform} colors={colors} />
          <Input label="Nome do destinatário" value={recipientName} onChangeText={setRecipientName} placeholder="Nome completo" colors={colors} />
          <Input label="País de destino" value={destinationCountry} onChangeText={setDestinationCountry} placeholder="Ex: Portugal" colors={colors} />
        </>
      )}

      <Input label="Montante (USD)" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="numeric" colors={colors} />
      <Input label="Observações (opcional)" value={description} onChangeText={setDescription} placeholder="Informação adicional..." multiline colors={colors} />

      <Pressable
        onPress={handleSubmit}
        disabled={isPending}
        style={({ pressed }) => [
          formStyles.submitBtn,
          { backgroundColor: colors.primary, opacity: pressed || isPending ? 0.7 : 1 },
        ]}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={formStyles.submitText}>Submeter Pedido</Text>
        )}
      </Pressable>
    </View>
  );
}

const formStyles = StyleSheet.create({
  success: { alignItems: "center", paddingVertical: 40, gap: 12 },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 22 },
  successSub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingHorizontal: 20 },
  newBtn: { marginTop: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  submitBtn: { borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  submitText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
});

const serviceSelectStyles = StyleSheet.create({
  option: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
});

function RastrearPedido() {
  const colors = useColors();
  const [contact, setContact] = useState("");
  const [searched, setSearched] = useState("");

  const { data, isLoading, refetch } = useLookupOrders(
    { contact: searched },
    { enabled: !!searched }
  );

  const handleSearch = () => {
    if (!contact.trim()) return;
    setSearched(contact.trim());
  };

  return (
    <View style={{ gap: 0 }}>
      <View style={[rastrearStyles.searchRow]}>
        <TextInput
          value={contact}
          onChangeText={setContact}
          placeholder="E-mail ou WhatsApp"
          placeholderTextColor={colors.mutedForeground}
          style={[rastrearStyles.searchInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Pressable
          onPress={handleSearch}
          style={[rastrearStyles.searchBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="search" size={18} color="#fff" />
        </Pressable>
      </View>

      {isLoading && (
        <View style={rastrearStyles.center}>
          <ActivityIndicator color={colors.mutedForeground} />
        </View>
      )}

      {data && !isLoading && (
        <>
          {data.name && (
            <Text style={[rastrearStyles.clientName, { color: colors.foreground }]}>
              {data.name}
            </Text>
          )}
          {data.orders.length === 0 && (
            <View style={rastrearStyles.center}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={[rastrearStyles.emptyText, { color: colors.mutedForeground }]}>Nenhum pedido encontrado</Text>
            </View>
          )}
          {data.orders.map((order) => (
            <View key={order.id} style={[rastrearStyles.orderCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <View style={rastrearStyles.orderTop}>
                <Text style={[rastrearStyles.orderService, { color: colors.foreground }]}>
                  {SERVICE_LABELS[order.service as ServiceType] ?? order.service}
                </Text>
                <View style={[rastrearStyles.statusBadge, { backgroundColor: (STATUS_COLORS[order.status] ?? "#6E6E73") + "20" }]}>
                  <Text style={[rastrearStyles.statusText, { color: STATUS_COLORS[order.status] ?? "#6E6E73" }]}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Text>
                </View>
              </View>
              <Text style={[rastrearStyles.orderDate, { color: colors.mutedForeground }]}>
                {order.formattedDate}
              </Text>
              {order.amountUsd && (
                <Text style={[rastrearStyles.orderAmount, { color: colors.foreground }]}>
                  {order.amountUsd} USD · {order.amountKwanza?.toLocaleString("pt-AO")} Kz
                </Text>
              )}
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const rastrearStyles = StyleSheet.create({
  searchRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  searchInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 15 },
  searchBtn: { width: 48, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  clientName: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 16 },
  orderCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 14, marginBottom: 12 },
  orderTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  orderService: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  orderDate: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 4 },
  orderAmount: { fontFamily: "Inter_500Medium", fontSize: 14 },
});

export default function PedidosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const params = useLocalSearchParams<{ service?: string; tab?: string }>();
  const [tab, setTab] = useState(params.tab === "rastrear" ? 1 : 0);

  useEffect(() => {
    if (params.tab === "rastrear") setTab(1);
    else if (params.service) setTab(0);
  }, [params.tab, params.service]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: isWeb ? 67 + 16 : 16,
            paddingBottom: isWeb ? 34 + 80 : insets.bottom + 80,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SegmentedControl
          options={["Novo Pedido", "Rastrear"]}
          selected={tab}
          onChange={setTab}
          colors={colors}
        />
        <View style={{ height: 20 }} />

        {tab === 0 ? (
          <NovoPedido preselectedService={params.service} />
        ) : (
          <RastrearPedido />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
});
