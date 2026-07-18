import { useEffect, useState } from 'react';
import {
  Image,
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { PrimaryButton } from '../components/PrimaryButton';
import { SlideUpFooter } from '../components/SlideUpFooter';
import { LandscapeBackground } from '../components/LandscapeBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { Carousel } from '../components/Carousel';
import { GOLFERS, MAX_GOLFER_RATIO } from '../data/golfers';
import { useGame } from '../store/gameStore';
import { colors, radius, spacing } from '../theme';

type Golfer = { golfer: number; name: string };

export function PlayerCountScreen() {
  const { width, height } = useWindowDimensions();
  const players = useGame((s) => s.players);
  const avatars = useGame((s) => s.avatars);
  const setPlayers = useGame((s) => s.setPlayers);
  const goTo = useGame((s) => s.goTo);
  const editGolferSlot = useGame((s) => s.editGolferSlot);
  const clearEditGolfer = useGame((s) => s.clearEditGolfer);

  const [added, setAdded] = useState<Golfer[]>(() =>
    players.filter((p) => p.trim() !== '').map((name, i) => ({ golfer: avatars[i] ?? i, name }))
  );

  // Edit state. editingSlot == added.length → adding a new golfer; < length → editing one.
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [carouselStart, setCarouselStart] = useState(0);
  const [selectedGolfer, setSelectedGolfer] = useState(0);
  // True when this edit was launched from the Overview (return there when the overlay closes).
  const [fromOverview, setFromOverview] = useState(false);

  const gap = spacing.md;
  const columnWidth = (width - spacing.lg * 2 - gap) / 2;
  const cellH = Math.min(columnWidth / MAX_GOLFER_RATIO, height * 0.26);
  const addD = Math.min(columnWidth, cellH) * 0.6;
  const addHint = added.length === 0 ? 'Add a golfer' : added.length === 1 ? 'Add another golfer' : null;

  // Carousel layout (upper area, above the keyboard).
  const carouselSize = Math.min(width * 0.52, height * 0.34);
  const carouselTop = height * 0.16;
  const inputTop = carouselTop + carouselSize + 28;

  // Start centered on a not-yet-used color (varies the default; all 8 are still shown).
  const unusedColorStart = () => {
    const usedColors = new Set(added.map((a) => GOLFERS[a.golfer].color));
    const unused = GOLFERS.reduce<number[]>((acc, g, i) => {
      if (!usedColors.has(g.color)) acc.push(i);
      return acc;
    }, []);
    return unused.length ? unused[Math.floor(Math.random() * unused.length)] : 0;
  };

  const openAdd = () => {
    const start = unusedColorStart();
    setCarouselStart(start);
    setSelectedGolfer(start);
    setEditValue('');
    setEditingSlot(added.length);
  };

  const openEdit = (i: number) => {
    setCarouselStart(added[i].golfer);
    setSelectedGolfer(added[i].golfer);
    setEditValue(added[i].name);
    setEditingSlot(i);
  };

  const closeEdit = (save: boolean) => {
    let next = added;
    if (save && editValue.trim() !== '' && editingSlot != null) {
      const entry = { golfer: selectedGolfer, name: editValue.trim() };
      const slot = editingSlot;
      next = slot >= added.length ? [...added, entry] : added.map((a, j) => (j === slot ? entry : a));
      setAdded(next);
    }
    Keyboard.dismiss();
    setEditingSlot(null);
    setEditValue('');
    // Launched from the Overview → persist and hop straight back there.
    if (fromOverview) {
      setFromOverview(false);
      setPlayers(next.map((a) => a.name), next.map((a) => a.golfer));
      goTo('overview', 'pop');
    }
  };

  // Arriving from the Overview to edit a specific golfer: open that slot's overlay immediately.
  useEffect(() => {
    if (editGolferSlot != null && editGolferSlot < added.length) {
      setFromOverview(true);
      openEdit(editGolferSlot);
      clearEditGolfer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editGolferSlot]);

  const onContinue = () => {
    setPlayers(
      added.map((a) => a.name),
      added.map((a) => a.golfer)
    );
    goTo('holes');
  };

  return (
    <View style={styles.root}>
      <LandscapeBackground />

      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Who's playing?" onBack={() => goTo('home')} />

        {/* Fixed 2×2 grid: golfers fill slots in order; the add-tile sits in the next slot. */}
        <View style={[styles.grid, { width: columnWidth * 2 + gap, gap }]}>
          {[0, 1, 2, 3].map((pos) => {
            if (pos < added.length) {
              const a = added[pos];
              const g = GOLFERS[a.golfer];
              // Tap an added golfer to re-open the edit experience (change image/name).
              return (
                <Pressable key={`g-${pos}`} onPress={() => openEdit(pos)} style={[styles.cell, { width: columnWidth }]}>
                  <Image source={g.source} resizeMode="contain" style={{ width: cellH * g.ratio, height: cellH }} />
                  <Text style={styles.cellName} numberOfLines={1}>
                    {a.name}
                  </Text>
                </Pressable>
              );
            }
            if (pos === added.length) {
              return (
                <Animated.View
                  key={`add-${pos}`}
                  entering={ZoomIn.duration(350).delay(pos === 0 ? 350 : 0)}
                  style={[styles.cell, { width: columnWidth }]}
                >
                  <View style={[styles.addArea, { width: columnWidth, height: cellH, opacity: editingSlot != null ? 0 : 1 }]}>
                    <Pressable
                      onPress={openAdd}
                      style={({ pressed }) => [
                        styles.addCircle,
                        { width: addD, height: addD },
                        pressed && styles.backPressed,
                      ]}
                    >
                      <Svg width={addD} height={addD}>
                        <Circle
                          cx={addD / 2}
                          cy={addD / 2}
                          r={addD / 2 - 3}
                          stroke="rgba(255,255,255,0.9)"
                          strokeWidth={3}
                          strokeDasharray="10 8"
                          fill="rgba(0,0,0,0.18)"
                        />
                      </Svg>
                      <Text style={[styles.addPlus, { fontSize: addD * 0.5 }]}>+</Text>
                    </Pressable>
                  </View>
                </Animated.View>
              );
            }
            return <View key={`e-${pos}`} style={[styles.cell, { width: columnWidth, height: cellH }]} />;
          })}
        </View>
      </SafeAreaView>

      {addHint && editingSlot == null ? (
        // Bounces in after the "circle +" tile lands (its ZoomIn is delayed 350ms on first load).
        <Animated.View
          key={`hint-${added.length}`}
          pointerEvents="none"
          entering={ZoomIn.springify().delay(added.length === 0 ? 750 : 400)}
          style={[styles.hintWrap, { top: height * 0.52 }]}
        >
          <Image
            source={require('../../assets/up-arrow.png')}
            resizeMode="contain"
            style={[styles.hintArrow, added.length === 1 && styles.hintArrowFlipped]}
          />
          <Text style={styles.addHint}>{addHint}</Text>
        </Animated.View>
      ) : null}

      {/* Naming overlay: swipe the carousel to pick a golfer, type the name. */}
      {editingSlot != null ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeEdit(true)} />
          <View style={[styles.carouselWrap, { top: carouselTop }]}>
            <Carousel
              items={GOLFERS.map((g, i) => ({ id: String(i), source: g.source }))}
              size={carouselSize}
              initialIndex={carouselStart}
              onSelect={(pos) => setSelectedGolfer(pos)}
            />
          </View>
          <View style={[styles.inputWrap, { top: inputTop }]}>
            <TextInput
              value={editValue}
              onChangeText={setEditValue}
              placeholder="Enter name"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              autoFocus
              maxLength={20}
              returnKeyType="done"
              onSubmitEditing={() => closeEdit(true)}
            />
          </View>
        </Animated.View>
      ) : null}

      <SlideUpFooter visible={added.length >= 2 && editingSlot == null}>
        <PrimaryButton label="Next" onPress={onContinue} />
      </SlideUpFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: spacing.lg },
  backPressed: { opacity: 0.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'center', paddingTop: spacing.xl },
  cell: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  cellName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    maxWidth: '100%',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  hintWrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center' },
  hintArrow: { width: 56, height: 56, marginBottom: spacing.sm },
  hintArrowFlipped: { transform: [{ scaleX: -1 }] },
  addHint: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  addArea: { alignItems: 'center', justifyContent: 'center' },
  addCircle: { alignItems: 'center', justifyContent: 'center' },
  addPlus: {
    position: 'absolute',
    color: colors.white,
    fontWeight: '300',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6,18,12,0.92)',
    zIndex: 30,
  },
  carouselWrap: { position: 'absolute', left: 0, right: 0 },
  inputWrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center' },
  input: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 240,
  },
});
