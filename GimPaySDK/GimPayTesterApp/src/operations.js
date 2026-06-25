// Reprend les memes valeurs de test que les fichiers test_*.php du SDK PHP.
const timestamp = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  ); 
};

export const OPERATIONS = [
  {
    key: 'initiate-order',
    label: 'Initiate Order',
    endpoint: '/initiate-order',
    fields: [
      { name: 'AmountTrxn', label: 'Montant', default: '600' },
      { name: 'MerchantReference', label: 'Reference marchand', default: () => 'CMD_' + timestamp() },
      { name: 'PayerName', label: 'Nom payeur', default: 'Client Test' },
      { name: 'CallBackUrl', label: 'Callback URL', default: 'https://webhook.site/xxxxxxxx' },
      { name: 'ExpiryDateTime', label: 'Expiration (YYYYMMDDHHmm)', default: '202612121032' },
      { name: 'Message ', label: 'Message', default: 'Paiement abonnement' },
    ],
  },
  {
    key: 'pay-by-card',
    label: 'Pay By Card',
    endpoint: '/pay-by-card',
    fields: [
      { name: 'PAN', label: 'Numero de carte (PAN)', default: '4240325739707993' },
      { name: 'DateExpiration', label: 'Expiration (YYMM)', default: '2803' },
      { name: 'CVV', label: 'CVV', default: '659' },
      { name: 'AmountTrxn', label: 'Montant', default: '500' },
      { name: 'MerchantReference', label: 'Reference marchand', default: () => 'PAY_' + timestamp() },
      { name: 'ReturnURL', label: 'Return URL', default: 'https://webhook.site/xxxxxxxx' },
    ],
  },
  {
    key: 'pay-by-card-no-cvv',
    label: 'Pay By Card (MOTO, sans CVV)',
    endpoint: '/pay-by-card-no-cvv',
    fields: [
      { name: 'PAN', label: 'Numero de carte (PAN)', default: '4240325739707993' },
      { name: 'DateExpiration', label: 'Expiration (YYMM)', default: '2803' },
      { name: 'AmountTrxn', label: 'Montant', default: '500' },
      { name: 'MerchantReference', label: 'Reference marchand', default: () => 'MOTO_' + timestamp() },
    ],
  },
  {
    key: 'filter-transactions',
    label: 'Filter Transactions',
    endpoint: '/filter-transactions',
    fields: [
      { name: 'DateFrom', label: 'Date debut (YYYYMMDD)', default: '20251201' },
      { name: 'DateTo', label: 'Date fin (YYYYMMDD)', default: () => timestamp().slice(0, 8) },
      { name: 'DisplayLength', label: 'Nb resultats', default: '10' },
      { name: 'DisplayStart', label: 'Index depart', default: '0' },
      { name: 'MerchantReference', label: 'Reference (optionnel)', default: '' },
    ],
  },
  {
    key: 'capture',
    label: 'Capture',
    endpoint: '/capture',
    fields: [
      { name: 'SystemReference', label: 'System Reference', default: '163016' },
    ],
  },
  {
    key: 'refund',
    label: 'Refund',
    endpoint: '/refund',
    fields: [
      { name: 'amount', label: 'Montant', default: '500' },
      { name: 'amountTrxn', label: 'Montant transaction', default: '500' },
      { name: 'TxnId', label: 'TxnId', default: '163000' },
      { name: 'refundReason', label: 'Motif', default: 'Demande client' },
    ],
  },
  {
    key: 'void',
    label: 'Void / Cancel',
    endpoint: '/void',
    fields: [
      { name: 'amount', label: 'Montant', default: '500' },
      { name: 'amountTrxn', label: 'Montant transaction', default: '500' },
      { name: 'TxnId', label: 'TxnId', default: '163000' },
      { name: 'refundReason', label: 'Motif', default: 'Annulation' },
    ],
  },
];
