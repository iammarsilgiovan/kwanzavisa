/**
 * cardProvider — interface para emissão de cartões.
 * Actualmente usa implementação mock (Fyatu stub).
 * Para ligar ao Fyatu real: substituir as funções abaixo
 * mantendo a mesma assinatura.
 */

export interface ProviderCard {
  providerCardId: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  cardNumber: string;
  cvv: string;
}

function luhnGenerate(prefix: string, length: number): string {
  let num = prefix;
  while (num.length < length - 1) {
    num += Math.floor(Math.random() * 10).toString();
  }
  let sum = 0;
  let alt = true;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  const check = (10 - (sum % 10)) % 10;
  return num + check;
}

export async function createCardholder(_name: string, _email: string): Promise<string> {
  return `CARDHOLDER_MOCK_${Date.now()}`;
}

export async function createCard(_cardholderId: string): Promise<ProviderCard> {
  const cardNumber = luhnGenerate("4", 16);
  const now = new Date();
  const expiryYear = now.getFullYear() + 3;
  const expiryMonth = now.getMonth() + 1;
  const cvv = String(Math.floor(Math.random() * 900) + 100);
  return {
    providerCardId: `CARD_MOCK_${Date.now()}`,
    last4: cardNumber.slice(-4),
    expiryMonth,
    expiryYear,
    cardNumber,
    cvv,
  };
}

export async function fundCard(
  _providerCardId: string,
  _amountUsd: number
): Promise<{ success: boolean; transactionId: string }> {
  return { success: true, transactionId: `TXN_MOCK_${Date.now()}` };
}

export async function getCardBalance(_providerCardId: string): Promise<number> {
  return 0;
}

export async function blockCard(_providerCardId: string): Promise<void> {}
export async function unblockCard(_providerCardId: string): Promise<void> {}
