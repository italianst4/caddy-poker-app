import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useGame, type Step } from './src/store/gameStore';
import { StackHost } from './src/components/StackHost';
import { BackgroundMusic } from './src/components/BackgroundMusic';
import { colors } from './src/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import { MenuScreen } from './src/screens/MenuScreen';
import { HowToPlayScreen } from './src/screens/HowToPlayScreen';
import { PlayerCountScreen } from './src/screens/PlayerCountScreen';
import { CaddyDrawScreen } from './src/screens/CaddyDrawScreen';
import { CaddyResultsScreen } from './src/screens/CaddyResultsScreen';
import { NamesScreen } from './src/screens/NamesScreen';
import { HolesScreen } from './src/screens/HolesScreen';
import { ModeScreen } from './src/screens/ModeScreen';
import { OverviewScreen } from './src/screens/OverviewScreen';
import { RoundScreen } from './src/screens/RoundScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { Scorecard } from './src/components/Scorecard';

export default function App() {
  const step = useGame((s) => s.step);
  const transition = useGame((s) => s.transition);
  const goTo = useGame((s) => s.goTo);
  const [hydrated, setHydrated] = useState(useGame.persist.hasHydrated());

  useEffect(() => {
    // Wait for persisted round state to load before rendering (so we resume correctly).
    const unsub = useGame.persist.onFinishHydration(() => setHydrated(true));
    if (useGame.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <BackgroundMusic />
      <StackHost
        routeKey={step}
        transition={transition}
        backKey={step === 'menu' ? 'home' : null}
        onSwipeBack={() => goTo('home')}
        render={(key) => renderStep(key as Step)}
      />
    </View>
  );
}

function renderStep(step: Step) {
  switch (step) {
    case 'home':
      return <HomeScreen />;
    case 'menu':
      return <MenuScreen />;
    case 'howToPlay':
      return <HowToPlayScreen />;
    case 'count':
      return <PlayerCountScreen />;
    case 'names':
      return <NamesScreen />;
    case 'holes':
      return <HolesScreen />;
    case 'mode':
      return <ModeScreen />;
    case 'overview':
      return <OverviewScreen />;
    case 'round':
      return <RoundScreen />;
    case 'scorecard':
      return <Scorecard />;
    case 'results':
      return <ResultsScreen />;
    case 'caddy':
      return <CaddyDrawScreen />;
    case 'caddyResults':
      return <CaddyResultsScreen />;
    default:
      return <HomeScreen />;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
