import { useRef } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { useGame } from '../store/gameStore';
import { colors, radius, spacing } from '../theme';

export function NamesScreen() {
  const players = useGame((s) => s.players);
  const setPlayerName = useGame((s) => s.setPlayerName);
  const goTo = useGame((s) => s.goTo);

  const inputs = useRef<Array<TextInput | null>>([]);
  const lastIndex = players.length - 1;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenLayout
        title="Player names"
        subtitle="Enter a name for each golfer."
        scroll
        footer={
          <>
            <PrimaryButton label="Next" onPress={() => goTo('holes')} />
            <PrimaryButton label="Back" variant="ghost" onPress={() => goTo('count')} />
          </>
        }
      >
        <View style={styles.list}>
          {players.map((name, i) => (
            <View key={i} style={styles.field}>
              <Text style={styles.label}>Player {i + 1}</Text>
              <TextInput
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={name}
                onChangeText={(t) => setPlayerName(i, t)}
                placeholder={`Player ${i + 1}`}
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                maxLength={20}
                autoFocus={i === 0}
                returnKeyType={i < lastIndex ? 'next' : 'done'}
                blurOnSubmit={i === lastIndex}
                onSubmitEditing={() => {
                  if (i < lastIndex) inputs.current[i + 1]?.focus();
                }}
              />
            </View>
          ))}
        </View>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: spacing.md, marginTop: spacing.sm },
  field: { gap: spacing.xs },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
});
