import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useHeaderHeight } from '@react-navigation/elements';
import { Ionicons } from '@expo/vector-icons';
import FieldInput from '../components/FieldInput';
import {
  DEFAULT_SETTINGS,
  ENVIRONMENTS,
  loadSettings,
  saveSettings,
} from '../store/settings';
import { colors, radius, shadow, spacing } from '../theme';

const FIELDS = [
  { name: 'baseUrl', label: 'Base URL', icon: 'globe-outline', autoCapitalize: 'none' },
  { name: 'merchantId', label: 'MerchantId', icon: 'business-outline', keyboardType: 'numeric' },
  { name: 'terminalId', label: 'TerminalId', icon: 'hardware-chip-outline', keyboardType: 'numeric' },
  { name: 'secretKey', label: 'Merchant Shared Key (hex)', icon: 'key-outline', autoCapitalize: 'none', secure: true },
  { name: 'currency', label: 'Code devise (ex: 952 = XOF)', icon: 'cash-outline', keyboardType: 'numeric' },
];

export default function SettingsScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const [values, setValues] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [revealKey, setRevealKey] = useState(false);
  const [activeField, setActiveField] = useState(null);

  useEffect(() => {
    loadSettings().then(s => {
      setValues(s);
      setLoaded(true);
    });
  }, []);

  const setField = useCallback(
    (name, text) => setValues(prev => ({ ...prev, [name]: text })),
    [],
  );

  const toggleRevealKey = useCallback(() => setRevealKey(v => !v), []);
  const deactivateField = useCallback(() => setActiveField(null), []);

  const applyEnv = env => setField('baseUrl', ENVIRONMENTS[env]);

  const validate = () => {
    if (!values.baseUrl || !values.merchantId || !values.terminalId || !values.secretKey) {
      return 'Tous les champs (sauf devise) sont obligatoires.';
    }
    if (!/^[0-9a-fA-F]+$/.test(values.secretKey) || values.secretKey.length % 2 !== 0) {
      return 'La cle secrete doit etre une chaine hexadecimale (longueur paire).';
    }
    return null;
  };

  const onSave = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Champs invalides', validationError);
      return;
    }
    await saveSettings(values);
    Alert.alert('Reglages enregistres', 'Tes identifiants sont sauvegardes sur cet appareil.');
    navigation.goBack();
  };

  if (!loaded) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.warning}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#7A5B00" />
          <Text style={styles.warningText}>
            Ces identifiants (dont la cle secrete) sont stockes uniquement sur cet appareil et
            servent a signer les requetes directement depuis l'app. Ne les utilise pas avec des
            identifiants de production sur un device partage.
          </Text>
        </View>

        <View style={styles.envRow}>
          <Pressable
            style={[styles.envButton, values.baseUrl === ENVIRONMENTS.uat && styles.envButtonActive]}
            onPress={() => applyEnv('uat')}>
            <Text
              style={[styles.envButtonText, values.baseUrl === ENVIRONMENTS.uat && styles.envButtonTextActive]}>
              UAT
            </Text>
          </Pressable>
          <Pressable
            style={[styles.envButton, values.baseUrl === ENVIRONMENTS.prod && styles.envButtonActive]}
            onPress={() => applyEnv('prod')}>
            <Text
              style={[styles.envButtonText, values.baseUrl === ENVIRONMENTS.prod && styles.envButtonTextActive]}>
              Production
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          {FIELDS.map(f => (
            <FieldInput
              key={f.name}
              name={f.name}
              field={f}
              value={String(values[f.name] ?? '')}
              onChangeText={setField}
              accentColor={colors.primary}
              secureVisible={revealKey}
              onToggleSecureVisible={toggleRevealKey}
              active={activeField === f.name}
              onActivate={() => setActiveField(f.name)}
              onDeactivate={deactivateField}
            />
          ))}
        </View>

        <Pressable style={styles.saveButton} onPress={onSave}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  warning: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.warningBg,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  warningText: { fontSize: 12, color: '#7A5B00', flex: 1, lineHeight: 17 },
  envRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    padding: 4,
  },
  envButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  envButtonActive: { backgroundColor: colors.primary, ...shadow.card },
  envButtonText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  envButtonTextActive: { color: '#fff' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  saveButton: { marginTop: spacing.lg, borderRadius: radius.pill, overflow: 'hidden', ...shadow.raised },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
