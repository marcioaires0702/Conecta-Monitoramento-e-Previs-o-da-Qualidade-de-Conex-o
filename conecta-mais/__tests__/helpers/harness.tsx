import { render } from '@testing-library/react-native';
import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Activities from '../../app/(tabs)/atividades';
import History from '../../app/(tabs)/historico';
import Home from '../../app/(tabs)/index';
import Details from '../../app/detalhes';
import SourcePicker from '../../app/fonte';
import Selection from '../../app/previsao';
import { createDemoService } from '../../src/services/demoService';
import type { ConnectivityService } from '../../src/services';
import { ClockProvider } from '../../src/state/clock';
import { PreferencesProvider } from '../../src/state/preferences';
import { SelectionProvider } from '../../src/state/selection';
import { ServiceProvider } from '../../src/state/service';
import { SourceChoiceProvider } from '../../src/state/sourceChoice';
import type { SourceChoice } from '../../src/domain/types';

/** 13/10/2026 09:41, horário local — relógio determinístico. */
export const FIXED_NOW = () => new Date(2026, 9, 13, 9, 41, 0);

export const routerMock = { setRoute: (_: string) => {} };

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: (p: string) => routerMock.setRoute(p),
    replace: (p: string) => routerMock.setRoute(p),
    back: () => {},
  }),
}));

const SCREENS: Record<string, React.ComponentType> = {
  '/(tabs)': Home,
  '/previsao': Selection,
  '/detalhes': Details,
  '/(tabs)/atividades': Activities,
  '/historico': History,
  '/fonte': SourcePicker,
};

function Navigator({ start }: { start: string }) {
  const [route, setRoute] = useState(start);
  routerMock.setRoute = setRoute;
  const Screen = SCREENS[route] ?? Home;
  return <Screen />;
}

export const TEST_CHOICE: SourceChoice = { modelId: 'model-a', modelName: 'Modelo A', probeId: 900001, countryCode: 'BR', latitude: -23.55, longitude: -46.63 };

/** `choice`: escolha de modelo/ponto já salva (null = nada escolhido). */
export function renderApp(start = '/(tabs)', service: ConnectivityService = createDemoService(FIXED_NOW), choice: SourceChoice | null = null) {
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <PreferencesProvider>
        <ClockProvider now={FIXED_NOW}>
          <ServiceProvider service={service}>
            <SourceChoiceProvider initial={choice}>
              <SelectionProvider>
                <Navigator start={start} />
              </SelectionProvider>
            </SourceChoiceProvider>
          </ServiceProvider>
        </ClockProvider>
      </PreferencesProvider>
    </SafeAreaProvider>,
  );
}
