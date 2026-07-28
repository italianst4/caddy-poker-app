import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useGame, type Step } from './src/store/gameStore';
import { initEntitlements, useHasAccess } from './src/entitlements';
import { StackHost } from './src/components/StackHost';
import { BackgroundMusic } from './src/components/BackgroundMusic';
import { LiveActivityController } from './src/components/LiveActivityController';
import { colors } from './src/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import { MenuScreen } from './src/screens/MenuScreen';
import { CardPacksScreen } from './src/screens/CardPacksScreen';
import { GameHistoryScreen } from './src/screens/GameHistoryScreen';
import { OpenPackScreen } from './src/screens/OpenPackScreen';
import { HowToPlayScreen } from './src/screens/HowToPlayScreen';
import { PaywallScreen } from './src/screens/PaywallScreen';
import { PlayerCountScreen } from './src/screens/PlayerCountScreen';
import { NamesScreen } from './src/screens/NamesScreen';
import { HolesScreen } from './src/screens/HolesScreen';
import { OverviewScreen } from './src/screens/OverviewScreen';
import { RoundScreen } from './src/screens/RoundScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { PokerRoundScreen } from './src/screens/PokerRoundScreen';
import { Scorecard } from './src/components/Scorecard';

export default function App() {
  const step = useGame((s) => s.step);
  const transition = useGame((s) => s.transition);
  const goTo = useGame((s) => s.goTo);
  const hasAccess = useHasAccess();
  const [hydrated, setHydrated] = useState(useGame.persist.hasHydrated());
  const [entReady, setEntReady] = useState(false);
  // Baloo 2 (card typography), bundled for offline use and loaded before first paint.
  const [fontsLoaded] = useFonts({
    'Baloo2-Regular': require('./assets/fonts/Baloo2-Regular.ttf'),
    'Baloo2-Medium': require('./assets/fonts/Baloo2-Medium.ttf'),
    'Baloo2-SemiBold': require('./assets/fonts/Baloo2-SemiBold.ttf'),
    'Baloo2-Bold': require('./assets/fonts/Baloo2-Bold.ttf'),
    'Baloo2-ExtraBold': require('./assets/fonts/Baloo2-ExtraBold.ttf'),
  });

  useEffect(() => {
    // Wait for persisted round state to load before rendering (so we resume correctly).
    const unsub = useGame.persist.onFinishHydration(() => setHydrated(true));
    if (useGame.persist.hasHydrated()) setHydrated(true);
    // Resolve trial/purchase status before first paint so we never flash a paywall.
    initEntitlements().finally(() => setEntReady(true));
    return unsub;
  }, []);

  // A backgrounded round could resume past the gate after the trial expired — if access has
  // lapsed and we're on a gameplay step, force the paywall.
  const UNGATED: Step[] = ['home', 'menu', 'howToPlay', 'paywall', 'packs', 'openPack', 'history'];
  const GATED = !UNGATED.includes(step);
  const routeKey: Step = !hasAccess && GATED ? 'paywall' : step;

  if (!hydrated || !entReady || !fontsLoaded) {
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
      <LiveActivityController />
      <StackHost
        routeKey={routeKey}
        transition={transition}
        backKey={routeKey === 'menu' ? 'home' : null}
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
    case 'packs':
      return <CardPacksScreen />;
    case 'history':
      return <GameHistoryScreen />;
    case 'openPack':
      return <OpenPackScreen />;
    case 'howToPlay':
      return <HowToPlayScreen />;
    case 'paywall':
      return <PaywallScreen />;
    case 'count':
      return <PlayerCountScreen />;
    case 'names':
      return <NamesScreen />;
    case 'holes':
      return <HolesScreen />;
    case 'overview':
      return <OverviewScreen />;
    case 'round':
      return <RoundScreen />;
    case 'scorecard':
      return <Scorecard />;
    case 'results':
      return <ResultsScreen />;
    case 'poker':
      return <PokerRoundScreen />;
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
