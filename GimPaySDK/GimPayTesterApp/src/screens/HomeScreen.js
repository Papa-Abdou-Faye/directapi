import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { OPERATIONS } from '../operations';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>GimPay Tester</Text>
      <Text style={styles.subtitle}>Choisir une operation a tester</Text>
      <FlatList
        data={OPERATIONS}
        keyExtractor={item => item.key}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() => navigation.navigate('Operation', { operationKey: item.key })}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Text style={styles.itemEndpoint}>{item.endpoint}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    marginBottom: 10,
  },
  itemLabel: { fontSize: 16, fontWeight: '600' },
  itemEndpoint: { fontSize: 12, color: '#888', marginTop: 2 },
});
