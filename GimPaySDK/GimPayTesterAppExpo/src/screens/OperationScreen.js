import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import * as Clipboard from 'expo-clipboard';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import FieldInput from '../components/FieldInput';
import { OPERATIONS } from '../operations';
import { OPS } from '../gimpay/client';
import { loadSettings } from '../store/settings';
import { cleanFieldValue, formatFieldValue } from '../fieldFormat';
import { colors, operationPalette, radius, shadow, spacing } from '../theme';

function buildInitialValues(fields) {
  const values = {};
  for (const f of fields) {
    const raw = typeof f.default === 'function' ? f.default() : f.default ?? '';
    values[f.name] = formatFieldValue(f, String(raw));
  }
  return values;
}

export default function OperationScreen({ route, navigation }) {
  const headerHeight = useHeaderHeight();
  const { operationKey } = route.params;
  const operation = useMemo(
    () => OPERATIONS.find(o => o.key === operationKey),
    [operationKey],
  );
  const palette = operationPalette[operation.color] ?? operationPalette.indigo;

  const [values, setValues] = useState(() => buildInitialValues(operation.fields));
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeField, setActiveField] = useState(null);

  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ['45%', '90%'], []);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: operation.label,
      headerStyle: { backgroundColor: palette.solid },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '700' },
    });
  }, [navigation, operation, palette]);

  useEffect(() => {
    if (result || error) {
      setCopied(false);
      sheetRef.current?.snapToIndex(0);
    }
  }, [result, error]);

  const onCopy = async text => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.45} />
    ),
    [],
  );

  const setField = useCallback(
    (name, text) => {
      const field = operation.fields.find(f => f.name === name);
      const formatted = formatFieldValue(field, text);
      setValues(prev => ({ ...prev, [name]: formatted }));
    },
    [operation],
  );

  const deactivateField = useCallback(() => setActiveField(null), []);

  const onReset = () => {
    setValues(buildInitialValues(operation.fields));
    setResult(null);
    setError(null);
    sheetRef.current?.close();
  };

  const send = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const cleaned = {};
      for (const f of operation.fields) {
        cleaned[f.name] = cleanFieldValue(f, values[f.name]);
      }
      const run = OPS[operation.op];
      const json = await run(settings, cleaned);
      setResult(json);
    } catch (e) {
      setError(e.message || 'Erreur reseau');
    } finally {
      setLoading(false);
    }
  };

  const success = result?.body?.Success;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.scroll}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View style={[styles.intro, { backgroundColor: palette.bg }]}>
            <Ionicons name={operation.icon} size={20} color={palette.solid} />
            <Text style={[styles.introText, { color: palette.solid }]}>{operation.description}</Text>
          </View>

          <View style={styles.card}>
            {operation.fields.map((f, i) => (
              <FieldInput
                key={f.name}
                name={f.name}
                field={f}
                value={String(values[f.name] ?? '')}
                onChangeText={setField}
                accentColor={palette.solid}
                isLast={i === operation.fields.length - 1}
                active={activeField === f.name}
                onActivate={() => setActiveField(f.name)}
                onDeactivate={deactivateField}
              />
            ))}
          </View>

          {!settings && <Text style={styles.hint}>Chargement des reglages...</Text>}

          <View style={styles.actions}>
            <Pressable
              style={styles.sendButton}
              onPress={send}
              disabled={loading || !settings}>
              <LinearGradient
                colors={loading || !settings ? ['#C8CBDA', '#C8CBDA'] : palette.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendButtonGradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="send" size={16} color="#fff" />
                )}
                <Text style={styles.sendButtonText}>{loading ? 'Envoi...' : 'Envoyer'}</Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.resetButton} onPress={onReset} disabled={loading}>
              <Ionicons name="refresh" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}>
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.copyIconButton} onPress={() => onCopy(error)} hitSlop={8}>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={16}
                  color={copied ? colors.success : colors.danger}
                />
              </Pressable>
            </View>
          )}

          {result && (
            <>
              <View style={[styles.statusBadge, success ? styles.statusSuccess : styles.statusFail]}>
                <Ionicons
                  name={success ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={success ? colors.success : colors.danger}
                />
                <Text style={[styles.statusText, { color: success ? colors.success : colors.danger }]}>
                  {success ? 'Success' : result?.body?.Message || 'Echec'}
                </Text>
                <Text style={styles.httpCode}>HTTP {result.http}</Text>
              </View>

              <View style={styles.codeHeader}>
                <Text style={styles.codeHeaderText}>Reponse JSON</Text>
                <Pressable
                  style={[styles.copyButton, copied && styles.copyButtonActive]}
                  onPress={() => onCopy(JSON.stringify(result, null, 2))}>
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={14}
                    color={copied ? colors.success : colors.codeText}
                  />
                  <Text style={[styles.copyButtonText, copied && styles.copyButtonTextActive]}>
                    {copied ? 'Copie' : 'Copier'}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>{JSON.stringify(result, null, 2)}</Text>
              </View>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  hint: { fontSize: 12, color: colors.textFaint, marginBottom: spacing.md },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  sendButton: { flex: 1, borderRadius: radius.pill, overflow: 'hidden', ...shadow.card },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  sendButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  resetButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBackground: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  sheetHandle: { backgroundColor: colors.border, width: 40 },
  sheetContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  copyIconButton: { padding: spacing.xs },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  codeHeaderText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
  },
  copyButtonActive: { backgroundColor: colors.successBg },
  copyButtonText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  copyButtonTextActive: { color: colors.success },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statusSuccess: { backgroundColor: colors.successBg },
  statusFail: { backgroundColor: colors.dangerBg },
  statusText: { fontSize: 14, fontWeight: '700', flex: 1 },
  httpCode: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
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
