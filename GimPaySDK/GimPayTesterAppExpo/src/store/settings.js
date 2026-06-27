import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'gimpay.settings.v1';

export const ENVIRONMENTS = {
  uat: 'https://omni-uat.gimpay.org/Cube',
  prod: 'https://omni.gimpay.org/Cube',
};

// Pas de cle secrete ni d'identifiants reels par defaut : a saisir dans Reglages.
export const DEFAULT_SETTINGS = {
  baseUrl: ENVIRONMENTS.uat,
  merchantId: '',
  terminalId: '',
  secretKey: '',
  currency: '952',
};

export async function loadSettings() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_SETTINGS;
  }
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings) {
  const normalized = { ...settings, baseUrl: settings.baseUrl.replace(/\/+$/, '') };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function isConfigured(settings) {
  return Boolean(settings.baseUrl && settings.merchantId && settings.terminalId && settings.secretKey);
}

export function getEnvironmentLabel(settings) {
  if (settings.baseUrl === ENVIRONMENTS.prod) {
    return 'Production';
  }
  if (settings.baseUrl === ENVIRONMENTS.uat) {
    return 'UAT';
  }
  return 'Custom';
}
