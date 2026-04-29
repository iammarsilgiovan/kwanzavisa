import { Ionicons } from "@expo/vector-icons";
import { useCreateOrder, useLookupOrders } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type ServiceType =
  | "cartao_virtual"
  | "acesso_assistido"
  | "transferencia"
  | "conta_internacional";

const SERVICES: {
  id: ServiceType;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  { id: "cartao_virtual", label: "Cartão Virtual", icon: "card-outline" },
  { id: "acesso_assistido", label: "Acesso Assistido", icon: "globe-outline" },
  { id: "transferencia", label: "Transferência", icon: "swap-horizontal-outline" },
  { id: "conta_internacional", label: "Conta Internacional", icon: "business-outline" },
];

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
    <View
      style={[
        segStyles.wrap,
        { backgroundColor: colors.secondary, borderColor: colors.border },
      ]}
    >
      {options.map((opt, i) => (
        <Pressable
          key={opt}
          onPress={() => onChange(i)}
          style={[
            segStyles.option,
            selected === i && {
              backgroundColor: colors.background,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: 2,
            },
          ]}
        >
          <Text
            style={[
              segStyles.label,
              { color: selected === i ? colors.foreground : colors.mutedForeground },
            ]}
          >
            {opt}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
const segStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderRadius: 11,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
  },
  option: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: "center" },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  icon,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  multiline?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={fStyles.wrap}>
      <Text style={[fStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View
        style={[
          fStyles.inputRow,
          { borderColor: colors.border, backgroundColor: colors.background },
          multiline && { alignItems: "flex-start", paddingTop: 12 },
        ]}
      >
        {icon && !multiline && (
          <Ionicons name={icon} size={17} color={colors.mutedForeground} style={{ marginLeft: 12 }} />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType}
          multiline={multiline}
          style={[
            fStyles.input,
            { color: colors.foreground },
            multiline && { height: 80, textAlignVertical: "top" },
          ]}
        />
      </View>
    </View>
  );
}
const fStyles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 6 },
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
    paddingVertical: 13,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
});

function SelectInput({
  label,
  value,
  options,
  onSelect,
  icon,
  colors,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onSelect: (v: string) => void;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  colors: ReturnType<typeof useColors>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={fStyles.wrap}>
      <Text style={[fStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Pressable
        onPress={() => setOpen(!open)}
        style={[
          fStyles.inputRow,
          { borderColor: colors.border, paddingHorizontal: 0, paddingVertical: 0 },
        ]}
      >
        {icon && (
          <Ionicons name={icon} size={17} color={colors.mutedForeground} style={{ marginLeft: 12 }} />
        )}
        <Text
          style={[
            fStyles.input,
            { color: value ? colors.foreground : colors.mutedForeground },
          ]}
        >
          {value || "Seleccionar..."}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.mutedForeground}
          style={{ marginRight: 12 }}
        />
      </Pressable>
      {open && (
        <View
          style={[
            selStyles.dropdown,
            { borderColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          {options.map((opt, i) => (
            <Pressable
              key={opt}
              onPress={() => {
                onSelect(opt);
                setOpen(false);
              }}
              style={({ pressed }) => [
                selStyles.option,
                { borderBottomColor: colors.border },
                i === options.length - 1 && { borderBottomWidth: 0 },
                pressed && { backgroundColor: colors.secondary },
              ]}
            >
              <Text style={{ color: colors.foreground, fontFamily: "Inter_400Regular", fontSize: 15 }}>
                {opt}
              </Text>
              {value === opt && (
                <Ionicons name="checkmark" size={16} color={colors.foreground} />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
const selStyles = StyleSheet.create({
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
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

  const reset = () => {
    setSubmitted(false);
    setName("");
    setEmail("");
    setWhatsapp("");
    setDescription("");
    setAmount("");
    setPlatform("");
    setIntlPlatform("");
    setRecipientName("");
    setDestinationCountry("");
  };

  if (submitted) {
    return (
      <View style={successStyles.wrap}>
        <View style={[successStyles.iconWrap, { backgroundColor: colors.secondary }]}>
          <Ionicons name="checkmark-circle" size={56} color={colors.foreground} />
        </View>
        <Text style={[successStyles.title, { color: colors.foreground }]}>Pedido enviado</Text>
        <Text style={[successStyles.sub, { color: colors.mutedForeground }]}>
          Entraremos em contacto pelo WhatsApp em breve.
        </Text>
        <Pressable
          onPress={reset}
          style={[successStyles.btn, { borderColor: colors.border }]}
        >
          <Ionicons name="add-outline" size={18} color={colors.foreground} />
          <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
            Novo pedido
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <FormInput label="Nome completo" value={name} onChangeText={setName} placeholder="O seu nome" icon="person-outline" colors={colors} />
      <FormInput label="E-mail" value={email} onChangeText={setEmail} placeholder="email@exemplo.com" keyboardType="email-address" icon="mail-outline" colors={colors} />
      <FormInput label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} placeholder="+244 9XX XXX XXX" keyboardType="phone-pad" icon="call-outline" colors={colors} />

      <View style={fStyles.wrap}>
        <Text style={[fStyles.label, { color: colors.mutedForeground }]}>Serviço</Text>
        <View style={{ gap: 8 }}>
          {SERVICES.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setService(s.id)}
              style={[
                svcStyles.option,
                {
                  borderColor: service === s.id ? colors.foreground : colors.border,
                  backgroundColor: service === s.id ? colors.secondary : colors.background,
                },
              ]}
            >
              <View style={[svcStyles.iconWrap, { backgroundColor: service === s.id ? colors.foreground : colors.secondary }]}>
                <Ionicons name={s.icon} size={16} color={service === s.id ? colors.primaryForeground : colors.foreground} />
              </View>
              <Text style={[svcStyles.label, { color: colors.foreground, fontFamily: service === s.id ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                {s.label}
              </Text>
              {service === s.id && (
                <Ionicons name="checkmark-circle" size={18} color={colors.foreground} />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {(service === "cartao_virtual" || service === "acesso_assistido") && (
        <SelectInput label="Plataforma" value={platform} options={PLATFORMS} onSelect={setPlatform} icon="storefront-outline" colors={colors} />
      )}
      {service === "transferencia" && (
        <>
          <SelectInput label="Plataforma Internacional" value={intlPlatform} options={INTL_PLATFORMS} onSelect={setIntlPlatform} icon="wallet-outline" colors={colors} />
          <FormInput label="Nome do destinatário" value={recipientName} onChangeText={setRecipientName} placeholder="Nome completo" icon="person-outline" colors={colors} />
          <FormInput label="País de destino" value={destinationCountry} onChangeText={setDestinationCountry} placeholder="Ex: Portugal" icon="location-outline" colors={colors} />
        </>
      )}

      <FormInput label="Montante (USD)" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="numeric" icon="cash-outline" colors={colors} />
      <FormInput label="Observações (opcional)" value={description} onChangeText={setDescription} placeholder="Informação adicional..." multiline colors={colors} />

      <Pressable
        onPress={handleSubmit}
        disabled={isPending}
        style={({ pressed }) => [
          btnStyles.btn,
          { backgroundColor: colors.primary, opacity: pressed || isPending ? 0.7 : 1 },
        ]}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="send-outline" size={17} color="#fff" />
            <Text style={btnStyles.text}>Submeter Pedido</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const successStyles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 48, gap: 12 },
  iconWrap: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingHorizontal: 24 },
  btn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 13 },
});
const svcStyles = StyleSheet.create({
  option: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  iconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  label: { flex: 1, fontSize: 14 },
});
const btnStyles = StyleSheet.create({
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 15, marginTop: 6, marginBottom: 8 },
  text: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
});

function RastrearPedido() {
  const colors = useColors();
  const [contact, setContact] = useState("");
  const [searched, setSearched] = useState("");

  const { data, isLoading } = useLookupOrders(
    { contact: searched },
    { enabled: !!searched }
  );

  const handleSearch = () => {
    if (!contact.trim()) return;
    setSearched(contact.trim());
  };

  return (
    <View>
      <View style={rastrStyles.searchRow}>
        <View style={[rastrStyles.inputWrap, { borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={17} color={colors.mutedForeground} />
          <TextInput
            value={contact}
            onChangeText={setContact}
            placeholder="E-mail ou WhatsApp"
            placeholderTextColor={colors.mutedForeground}
            style={[rastrStyles.searchText, { color: colors.foreground }]}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {contact ? (
            <Pressable onPress={() => { setContact(""); setSearched(""); }}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={handleSearch}
          style={({ pressed }) => [
            rastrStyles.searchBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons name="search" size={18} color="#fff" />
        </Pressable>
      </View>

      {isLoading && (
        <View style={rastrStyles.center}>
          <ActivityIndicator color={colors.mutedForeground} />
        </View>
      )}

      {data && !isLoading && (
        <>
          {data.name && (
            <Text style={[rastrStyles.clientName, { color: colors.foreground }]}>
              {data.name}
            </Text>
          )}
          {data.orders.length === 0 ? (
            <View style={rastrStyles.center}>
              <Ionicons name="inbox-outline" size={40} color={colors.mutedForeground} />
              <Text style={[rastrStyles.emptyText, { color: colors.mutedForeground }]}>
                Nenhum pedido encontrado
              </Text>
            </View>
          ) : (
            data.orders.map((order) => (
              <View
                key={order.id}
                style={[
                  rastrStyles.orderCard,
                  { borderColor: colors.border, backgroundColor: colors.background },
                ]}
              >
                <View style={rastrStyles.orderTop}>
                  <Text style={[rastrStyles.orderId, { color: colors.mutedForeground }]}>
                    #{order.id}
                  </Text>
                  <View
                    style={[
                      rastrStyles.badge,
                      { backgroundColor: (STATUS_COLORS[order.status] ?? "#6E6E73") + "20" },
                    ]}
                  >
                    <Text
                      style={[
                        rastrStyles.badgeText,
                        { color: STATUS_COLORS[order.status] ?? "#6E6E73" },
                      ]}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </Text>
                  </View>
                </View>
                <Text style={[rastrStyles.service, { color: colors.foreground }]}>
                  {SERVICES.find((s) => s.id === order.service)?.label ?? order.service}
                </Text>
                <Text style={[rastrStyles.date, { color: colors.mutedForeground }]}>
                  {order.formattedDate}
                </Text>
                {order.amountUsd != null && (
                  <Text style={[rastrStyles.amount, { color: colors.foreground }]}>
                    {order.amountUsd} USD · {order.amountKwanza?.toLocaleString("pt-AO")} Kz
                  </Text>
                )}
              </View>
            ))
          )}
        </>
      )}
    </View>
  );
}

const rastrStyles = StyleSheet.create({
  searchRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  inputWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 },
  searchText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  searchBtn: { width: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  clientName: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 16 },
  orderCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 16, marginBottom: 12 },
  orderTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  orderId: { fontFamily: "Inter_400Regular", fontSize: 12 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  service: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 4 },
  date: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 4 },
  amount: { fontFamily: "Inter_500Medium", fontSize: 14 },
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
            paddingBottom: isWeb ? 34 + 84 : insets.bottom + 80,
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
        <View style={{ height: 24 }} />
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
