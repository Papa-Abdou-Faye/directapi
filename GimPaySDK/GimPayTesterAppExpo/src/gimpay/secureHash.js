import CryptoJS from 'crypto-js';

const HEX_PATTERN = /^[0-9a-fA-F]+$/;

// Equivalent JS de GimPaySecureHash::compute() du SDK PHP :
// HMAC-SHA256(message, hex2bin(secretKey)), message = "DateTimeLocalTrxn=...&MerchantId=...&TerminalId=..."
export function computeSecureHash(merchantId, terminalId, dateTimeLocalTrxn, secretKeyHex) {
  if (secretKeyHex.length % 2 !== 0 || !HEX_PATTERN.test(secretKeyHex)) {
    throw new Error('Merchant Shared Key invalide (doit etre une chaine hexadecimale).');
  }

  const message =
    `DateTimeLocalTrxn=${dateTimeLocalTrxn}` +
    `&MerchantId=${merchantId}` +
    `&TerminalId=${terminalId}`;

  const binKey = CryptoJS.enc.Hex.parse(secretKeyHex);
  return CryptoJS.HmacSHA256(message, binKey).toString(CryptoJS.enc.Hex);
}
