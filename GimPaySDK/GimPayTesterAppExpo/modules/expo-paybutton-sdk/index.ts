import { requireNativeModule } from 'expo-modules-core';

export type CustomerIdentifier =
  | { type: 'mobile'; value: string }
  | { type: 'email'; value: string }
  | { type: 'subscribed'; value: string };

export type PayButtonSdkParams = {
  merchantId: string;
  terminalId: string;
  amount: string;
  currencyCode: string;
  secureHash: string;
  transactionReference: string;
  // TODO: aucune constante UAT/sandbox n'est documentee dans le PDF (seul
  // "PRODUCTION" apparait). Ajuster cette valeur une fois le vrai enum
  // decouvert dans Android Studio.
  productionStatus?: string;
  customer: CustomerIdentifier;
};

export type CardTransactionResult = {
  type: 'card';
  networkReference: string;
  authCode: string;
  actionCode: string;
  receiptNumber: string;
  amount: string;
};

export type WalletTransactionResult = {
  type: 'wallet';
  networkReference: string;
  amount: string;
};

// Le module natif n'est resolu qu'a l'appel (pas au chargement du fichier),
// pour que le reste de l'app continue de fonctionner sous Expo Go (iOS et
// Android) sans jamais toucher a ce code natif custom.
export function startPayment(
  params: PayButtonSdkParams,
): Promise<CardTransactionResult | WalletTransactionResult> {
  const PayButtonSdkModule = requireNativeModule('PayButtonSdkModule');
  return PayButtonSdkModule.startPayment(params);
}
