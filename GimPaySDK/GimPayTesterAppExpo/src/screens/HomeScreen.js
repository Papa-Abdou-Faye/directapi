import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { CATEGORIES, OPERATIONS } from '../operations';
import { getEnvironmentLabel, isConfigured, loadSettings } from '../store/settings';
import { colors, operationPalette, radius, shadow, spacing } from '../theme';

const ENV_BADGE_STYLE = {
  UAT: { bg: 'rgba(255,255,255,0.22)', text: '#fff' },
  Production: { bg: colors.danger, text: '#fff' },
  Custom: { bg: 'rgba(255,255,255,0.22)', text: '#fff' },
};

function SettingsHeaderButton({ navigation }) {
  return (
    <Pressable
      style={styles.settingsButton}
      onPress={() => navigation.navigate('Settings')}
      hitSlop={10}>
      <Ionicons name="settings-sharp" size={18} color="#fff" />
    </Pressable>
  );
}

function OperationCard({ item, onPress }) {
  const palette = operationPalette[item.color] ?? operationPalette.indigo;
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = value => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(0.97)}
      onPressOut={() => animateTo(1)}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={[styles.iconBadge, { backgroundColor: palette.bg }]}>
          <Ionicons name={item.icon} size={22} color={palette.solid} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.label}</Text>
          <Text style={styles.cardSubtitle}>{item.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
      </Animated.View>
    </Pressable>
  );
}

function buildSections(query) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? OPERATIONS.filter(
        o => o.label.toLowerCase().includes(q) || o.description.toLowerCase().includes(q),
      )
    : OPERATIONS;

  return Object.keys(CATEGORIES)
    .map(key => ({ title: CATEGORIES[key], data: filtered.filter(o => o.category === key) }))
    .filter(section => section.data.length > 0);
}

export default function HomeScreen({ navigation }) {
  const [configured, setConfigured] = useState(true);
  const [envLabel, setEnvLabel] = useState('UAT');
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadSettings().then(s => {
        setConfigured(isConfigured(s));
        setEnvLabel(getEnvironmentLabel(s));
      });
    }, []),
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const sections = useMemo(() => buildSections(query), [query]);
  const envBadge = ENV_BADGE_STYLE[envLabel] ?? ENV_BADGE_STYLE.Custom;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <View style={styles.decorCircleLarge} />
        <View style={styles.decorCircleSmall} />

        <View style={styles.headerTop}>
          <View style={styles.logoBadge}>
            <Ionicons name="wallet" size={20} color="#fff" />
          </View>
          <SettingsHeaderButton navigation={navigation} />
        </View>
        <Text style={styles.title}>Directe API</Text>
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitle}>Choisir une operation a tester</Text>
          <View style={[styles.envBadge, { backgroundColor: envBadge.bg }]}>
            <View style={styles.envDot} />
            <Text style={[styles.envBadgeText, { color: envBadge.text }]}>{envLabel}</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.textFaint} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une operation..."
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.textFaint} />
            </Pressable>
          )}
        </View>
      </LinearGradient>

      {!configured && (
        <Pressable style={styles.banner} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="warning" size={18} color="#7A5B00" />
          <Text style={styles.bannerText}>
            Identifiants non configures — touche ici pour ouvrir les Reglages.
          </Text>
        </Pressable>
      )}

      <SectionList
        sections={sections}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <OperationCard
            item={item}
            onPress={() => navigation.navigate('Operation', { operationKey: item.key })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search" size={28} color={colors.textFaint} />
            <Text style={styles.emptyText}>Aucune operation ne correspond a "{query}"</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  decorCircleLarge: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircleSmall: {
    position: 'absolute',
    top: 70,
    right: 50,
    width: 70,
    height: 70,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  envBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  envDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  envBadgeText: { fontSize: 11, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 42,
    ...shadow.card,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, height: '100%' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  bannerText: { color: '#7A5B00', fontSize: 13, flex: 1 },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadow.card,
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  emptyState: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xxl },
  emptyText: { fontSize: 13, color: colors.textFaint, textAlign: 'center' },
});
