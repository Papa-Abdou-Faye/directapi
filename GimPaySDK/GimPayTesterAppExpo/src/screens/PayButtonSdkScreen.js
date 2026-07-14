import React, { useCallback, useEffect, useState } from 'react';
import {
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
import { loadSettings } from '../store/settings';
import { cleanFieldValue, formatFieldValue } from '../fieldFormat';
import { now } from '../gimpay/now';
import { colors, operationPalette, radius, shadow, spacing } from '../theme';

const AMOUNT_FIELD = { name: 'amount', label: 'Montant', icon: 'cash-outline', keyboardType: 'numeric', format: 'amount' };
const REFERENCE_FIELD = { name: 'reference', label: 'Reference transaction', icon: 'pricetag-outline' };

const CUSTOMER_TYPES = [
  { key: 'mobile', label: 'Mobile', field: { name: 'customerValue', label: 'Numero mobile', icon: 'call-outline', keyboardType: 'phone-pad' } },
  { key: 'email', label: 'Email', field: { name: 'customerValue', label: 'Email client', icon: 'mail-outline', autoCapitalize: 'none' } },
  { key: 'subscribed', label: 'Abonne', field: { name: 'customerValue', label: 'Customer Id', icon: 'person-outline', autoCapitalize: 'none' } },
];

export default function PayButtonSdkScreen() {
  const headerHeight = useHeaderHeight();
  const palette = operationPalette.green;

  const [settings, setSettings] = useState(null);
  const [amount, setAmount] = useState(formatFieldValue(AMOUNT_FIELD, '500'));
  const [reference, setReference] = useState(() => 'SDK_' + now());
  const [customerType, setCustomerType] = useState('mobile');
  const [customerValue, setCustomerValue] = useState('');
  const [activeField, setActiveField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const deactivateField = useCallback(() => setActiveField(null), []);

  const customerTypeConfig = CUSTOMER_TYPES.find(t => t.key === customerType);

  const onSend = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      if (Platform.OS !== 'android') {
        throw new Error("Le SDK PayButton natif n'est documente que pour Android.");
      }
      // Import paresseux : n'atteint le module natif qu'ici, jamais au
      // chargement de l'ecran, pour ne pas casser Expo Go sur le reste de l'app.
      const { startPayment } = require('../../modules/expo-paybutton-sdk');
      const response = await startPayment({
        merchantId: settings.merchantId,
        terminalId: settings.terminalId,
        amount: cleanFieldValue(AMOUNT_FIELD, amount),
        currencyCode: settings.currency,
        secureHash: settings.secretKey,
        transactionReference: reference,
        customer: { type: customerType, value: customerValue },
      });
      setResult(response);
    } catch (e) {
      setError(e.message || 'Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  };

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
        <View style={[styles.intro, { backgroundColor: palette.bg }]}>
          <Ionicons name="phone-portrait-outline" size={20} color={palette.solid} />
          <Text style={[styles.introText, { color: palette.solid }]}>
            Lance l'interface de paiement native du SDK GIM PayButton. Identifiants (Merchant/Terminal/Cle) repris des Reglages.
          </Text>
        </View>

        {Platform.OS !== 'android' && (
          <View style={styles.warning}>
            <Ionicons name="warning" size={18} color="#7A5B00" />
            <Text style={styles.warningText}>
              Ce SDK est documente pour Android uniquement : l'envoi echouera volontairement sur cette plateforme.
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <FieldInput
            name={AMOUNT_FIELD.name}
            field={AMOUNT_FIELD}
            value={amount}
            onChangeText={(_, text) => setAmount(formatFieldValue(AMOUNT_FIELD, text))}
            accentColor={palette.solid}
            active={activeField === AMOUNT_FIELD.name}
            onActivate={() => setActiveField(AMOUNT_FIELD.name)}
            onDeactivate={deactivateField}
          />
          <FieldInput
            name={REFERENCE_FIELD.name}
            field={REFERENCE_FIELD}
            value={reference}
            onChangeText={(_, text) => setReference(text)}
            accentColor={palette.solid}
            isLast
            active={activeField === REFERENCE_FIELD.name}
            onActivate={() => setActiveField(REFERENCE_FIELD.name)}
            onDeactivate={deactivateField}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Type de client</Text>
          <View style={styles.typeRow}>
            {CUSTOMER_TYPES.map(t => (
              <Pressable
                key={t.key}
                style={[styles.typeButton, customerType === t.key && styles.typeButtonActive]}
                onPress={() => {
                  setCustomerType(t.key);
                  setCustomerValue('');
                }}>
                <Text style={[styles.typeButtonText, customerType === t.key && styles.typeButtonTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <FieldInput
            name="customerValue"
            field={customerTypeConfig.field}
            value={customerValue}
            onChangeText={(_, text) => setCustomerValue(text)}
            accentColor={palette.solid}
            isLast
            active={activeField === 'customerValue'}
            onActivate={() => setActiveField('customerValue')}
            onDeactivate={deactivateField}
          />
        </View>

        {!settings && <Text style={styles.hint}>Chargement des reglages...</Text>}

        <Pressable style={styles.sendButton} onPress={onSend} disabled={loading || !settings}>
          <LinearGradient
            colors={loading || !settings ? ['#C8CBDA', '#C8CBDA'] : palette.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sendButtonGradient}>
            <Ionicons name="rocket-outline" size={16} color="#fff" />
            <Text style={styles.sendButtonText}>{loading ? 'Envoi...' : 'Lancer le paiement (SDK natif)'}</Text>
          </LinearGradient>
        </Pressable>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultBox}>
            <View style={[styles.statusBadge, styles.statusSuccess]}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={[styles.statusText, { color: colors.success }]}>
                {result.type === 'card' ? 'Paiement carte reussi' : 'Paiement wallet reussi'}
              </Text>
            </View>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{JSON.stringify(result, null, 2)}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  introText: { fontSize: 13, fontWeight: '600', flex: 1 },
  warning: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.warningBg,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  warningText: { fontSize: 12, color: '#7A5B00', flex: 1, lineHeight: 17 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm, fontWeight: '600' },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  typeButtonActive: { backgroundColor: colors.primary, ...shadow.card },
  typeButtonText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  typeButtonTextActive: { color: '#fff' },
  hint: { fontSize: 12, color: colors.textFaint, marginBottom: spacing.md },
  sendButton: { borderRadius: radius.pill, overflow: 'hidden', ...shadow.card, marginBottom: spacing.lg },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  sendButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  resultBox: { gap: spacing.sm },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  statusSuccess: { backgroundColor: colors.successBg },
  statusText: { fontSize: 14, fontWeight: '700', flex: 1 },
  codeBlock: {
    backgroundColor: colors.codeBg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.codeText,
    lineHeight: 18,
  },
});
