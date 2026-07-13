import React, { memo, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing } from '../theme';

// React Native's New Architecture has a known bug where several sibling
// TextInputs mounted at once can cross-wire native focus/keystroke routing
// on Android. Keeping at most one real TextInput mounted on screen (the
// active one) sidesteps it entirely: inactive fields render as plain
// Pressable+Text and only become a TextInput once tapped.
function FieldInput({
  field,
  value,
  name,
  onChangeText,
  accentColor = colors.primary,
  secureVisible,
  onToggleSecureVisible,
  isLast,
  active,
  onActivate,
  onDeactivate,
}) {
  const masked = Boolean(field.secure) && !secureVisible;
  const displayValue = masked && value ? '•'.repeat(value.length) : value;
  const inputRef = useRef(null);

  // autoFocus alone is unreliable on Android right after a TextInput mounts:
  // the soft keyboard often doesn't rise because the view isn't fully
  // attached yet. A short delayed explicit focus() call fixes it.
  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, [active]);

  return (
    <View style={[styles.field, isLast && styles.fieldLast]}>
      <Text style={styles.label}>{field.label}</Text>
      <View style={[styles.inputRow, active && { borderColor: accentColor, ...shadow.card }]}>
        <Ionicons
          name={field.icon ?? 'create-outline'}
          size={18}
          color={active ? accentColor : colors.textFaint}
          style={styles.inputIcon}
        />
        {active ? (
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={value}
            onChangeText={text => onChangeText(name, text)}
            onBlur={onDeactivate}
            autoCapitalize={field.autoCapitalize ?? 'none'}
            autoCorrect={false}
            autoComplete="off"
            importantForAutofill="no"
            textContentType="none"
            keyboardType={field.keyboardType ?? 'default'}
            secureTextEntry={masked}
            placeholderTextColor={colors.textFaint}
          />
        ) : (
          <Pressable style={styles.inputPressable} onPress={onActivate}>
            <Text style={styles.input} numberOfLines={1}>
              {displayValue}
            </Text>
          </Pressable>
        )}
        {field.secure && (
          <Pressable onPress={onToggleSecureVisible} hitSlop={8}>
            <Ionicons
              name={secureVisible ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default memo(FieldInput);

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  fieldLast: { marginBottom: 0 },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.xs, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg,
  },
  inputIcon: { marginRight: spacing.sm },
  inputPressable: { flex: 1, justifyContent: 'center' },
  input: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    fontSize: 14,
    color: colors.text,
  },
});
