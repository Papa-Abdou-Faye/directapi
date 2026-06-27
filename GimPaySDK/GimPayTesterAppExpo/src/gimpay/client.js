import { computeSecureHash } from './secureHash';
import { now } from './now';

const DEFAULT_TIMEOUT_MS = 30000;

async function post(baseUrl, path, payload) {
  const url = `${baseUrl}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (e) {
    const reason = e.name === 'AbortError' ? `timeout apres ${DEFAULT_TIMEOUT_MS / 1000}s` : e.message;
    throw new Error(`Echec requete (${url}) : ${reason}`);
  } finally {
    clearTimeout(timer);
  }

  const raw = await response.text();
  let body = null;
  try {
    body = JSON.parse(raw);
  } catch (e) {
    body = null; // reponse non-JSON
  }

  return { http: response.status, body, raw };
}

/** Resout merchantId / terminalId (surcharge appel > settings) */
function ids(settings, o) {
  const merchantId = o.merchantId ?? settings.merchantId;
  const terminalId = o.terminalId ?? settings.terminalId;
  if (merchantId == null || merchantId === '' || terminalId == null || terminalId === '') {
    throw new Error('merchantId / terminalId manquant (Reglages ou appel).');
  }
  return [merchantId, terminalId];
}

function requireSecretKey(settings) {
  if (!settings.secretKey) {
    throw new Error('Cle secrete (SecretKey) manquante : configure-la dans Reglages.');
  }
}

/** InitiateOrder : cree un lien / un ordre de paiement */
export async function initiateOrder(settings, o) {
  requireSecretKey(settings);
  const [merchantId, terminalId] = ids(settings, o);
  const dt = o.DateTimeLocalTrxn ?? now();

  const payload = {
    AmountTrxn: o.AmountTrxn,
    Currency: o.Currency ?? settings.currency,
    ExpiryDateTime: o.ExpiryDateTime ?? '',
    MerchantReference: o.MerchantReference,
    PayerName: o.PayerName ?? '',
    CallBackUrl: o.CallBackUrl ?? '',
    MaxNumberOfPayment: o.MaxNumberOfPayment ?? 1,
    Message: o.Message ?? '',
    PayLinkType: o.PayLinkType ?? 1,
    TokenizationCustomerOperatorId: o.TokenizationCustomerOperatorId ?? null,
    OrderReceiptPath: o.OrderReceiptPath ?? '',
    OrderReceiptName: o.OrderReceiptName ?? '',
    TerminalId: terminalId,
    MerchantId: merchantId,
    DateTimeLocalTrxn: dt,
    HostName: o.HostName ?? 0,
    CorrelationId: o.CorrelationId ?? null,
  };

  payload.SecureHash = computeSecureHash(merchantId, terminalId, dt, settings.secretKey);
  return post(settings.baseUrl, '/PayLink.svc/api/InitiateOrder', payload);
}

/** PayByCard : paiement direct par carte */
export async function payByCard(settings, o) {
  requireSecretKey(settings);
  const [merchantId, terminalId] = ids(settings, o);
  const dt = o.DateTimeLocalTrxn ?? now();

  const payload = {
    PAN: o.PAN,
    DateExpiration: o.DateExpiration,
    CVV: o.CVV ?? '',
    AmountTrxn: o.AmountTrxn,
    IsWebRequest: o.IsWebRequest ?? true,
    CurrencyCodeTrxn: String(o.CurrencyCodeTrxn ?? settings.currency),
    MerchantReference: o.MerchantReference,
    Disable3DS: o.Disable3DS ?? false,
    TerminalId: terminalId,
    MerchantId: merchantId,
    DateTimeLocalTrxn: dt,
    ReturnURL: o.ReturnURL ?? '',
  };
  if (o.MotoFlag !== undefined) {
    payload.MotoFlag = o.MotoFlag;
  }

  payload.SecureHash = computeSecureHash(merchantId, terminalId, dt, settings.secretKey);
  return post(settings.baseUrl, '/PayLink.svc/api/PayByCard', payload);
}

/** PayByCard sans CVV (MOTO) : MotoFlag = 1, CVV vide */
export async function payByCardWithoutCvv(settings, o) {
  return payByCard(settings, { ...o, CVV: '', MotoFlag: o.MotoFlag ?? 1 });
}

/** FilterTransactions : recherche/pagination des transactions */
export async function filterTransactions(settings, o) {
  requireSecretKey(settings);
  const [merchantId, terminalId] = ids(settings, o);
  const dt = o.DateTimeLocalTrxn ?? now();

  const payload = {
    MerchantId: String(merchantId),
    MerchantReference: o.MerchantReference ?? '',
    TerminalId: String(terminalId),
    DisplayLength: String(o.DisplayLength ?? 10),
    DisplayStart: String(o.DisplayStart ?? 0),
    DateFrom: o.DateFrom,
    DateTo: o.DateTo,
    DateTimeLocalTrxn: dt,
  };

  payload.SecureHash = computeSecureHash(merchantId, terminalId, dt, settings.secretKey);
  return post(settings.baseUrl, '/PayLink.svc/api/FilterTransactions', payload);
}

/** Capture (CaptureGIM) : capture d'une transaction pre-autorisee */
export async function capture(settings, o) {
  requireSecretKey(settings);
  const [merchantId, terminalId] = ids(settings, o);
  const dt = o.DateTimeLocalTrxn ?? now();

  const payload = {
    terminalId: String(terminalId),
    merchantId: String(merchantId),
    DateTimeLocalTrxn: dt,
    SystemReference: o.SystemReference,
  };

  payload.SecureHash = computeSecureHash(merchantId, terminalId, dt, settings.secretKey);
  return post(settings.baseUrl, '/PayLink.svc/api/CaptureGIM', payload);
}

/** Refund (RefundTransaction) : remboursement total/partiel */
export async function refund(settings, o) {
  requireSecretKey(settings);
  const [merchantId, terminalId] = ids(settings, o);
  const dt = o.DateTimeLocalTrxn ?? now();

  const payload = {
    terminalId: String(terminalId),
    merchantId: String(merchantId),
    amount: o.amount,
    amountTrxn: o.amountTrxn ?? o.amount,
    DateTimeLocalTrxn: dt,
    refundReason: o.refundReason ?? '',
    TxnId: o.TxnId,
    isMobileSDK: o.isMobileSDK ?? false,
  };

  payload.SecureHash = computeSecureHash(merchantId, terminalId, dt, settings.secretKey);
  return post(settings.baseUrl, '/PayLink.svc/api/RefundTransaction', payload);
}

/** Void / Cancel : reutilise RefundTransaction (endpoint a confirmer cote GIM Pay) */
export async function voidTrxn(settings, o) {
  return refund(settings, o);
}

export const OPS = {
  initiateOrder,
  payByCard,
  payByCardWithoutCvv,
  filterTransactions,
  capture,
  refund,
  void: voidTrxn,
};
