import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { OPERATIONS } from '../operations';
import { API_BASE_URL } from '../config';

function buildInitialValues(fields) {
  const values = {};
  for (const f of fields) {
    values[f.name] = typeof f.default === 'function' ? f.default() : f.default ?? '';
  }
  return values;
}

export default function OperationScreen({ route, navigation }) {
  const { operationKey } = route.params;
  const operation = useMemo(
    () => OPERATIONS.find(o => o.key === operationKey),
    [operationKey],
  );

  const [values, setValues] = useState(() => buildInitialValues(operation.fields));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: operation.label });
  }, [navigation, operation]);

  const setField = (name, text) => setValues(prev => ({ ...prev, [name]: text }));

  const send = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}${operation.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await response.json();
      setResult(json);
    } catch (e) {
      setError(e.message || 'Erreur reseau');
    } finally {
      setLoading(false);
    }
  };

  const success = result?.body?.Success;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {operation.fields.map(f => (
        <View key={f.name} style={styles.field}>
          <Text style={styles.label}>{f.label}</Text>
          <TextInput
            style={styles.input}
            value={String(values[f.name] ?? '')}
            onChangeText={text => setField(f.name, text)}
            autoCapitalize="none"
          />
        </View>
      ))}

      <Button title={loading ? 'Envoi...' : 'Envoyer'} onPress={send} disabled={loading} />

      {loading && <ActivityIndicator style={styles.loader} />}

      {error && <Text style={styles.error}>Erreur reseau : {error}</Text>}

      {result && (
        <View style={styles.resultBox}>
          <Text style={success ? styles.successBadge : styles.failBadge}>
            {success ? '✅ Success' : '❌ ' + (result?.body?.Message || 'Echec')}
          </Text>
          <Text style={styles.resultJson}>{JSON.stringify(result, null, 2)}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, color: '#444', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  loader: { marginTop: 16 },
  error: { color: '#c00', marginTop: 16 },
  resultBox: { marginTop: 20, paddingBottom: 40 },
  successBadge: { fontSize: 15, fontWeight: '700', color: '#1a7d1a', marginBottom: 8 },
  failBadge: { fontSize: 15, fontWeight: '700', color: '#c00', marginBottom: 8 },
  resultJson: {
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#f4f4f4',
    padding: 10,
    borderRadius: 6,
  },
});
