import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { AppText } from '../src/components/ui';
import { DEFAULT_PREFERENCES, PreferencesProvider, sanitizePreferences, STORAGE_KEY, usePreferences } from '../src/state/preferences';
import { Pressable, Text } from 'react-native';

function Probe() {
  const { prefs, palette, fontScale, update } = usePreferences();
  return (
    <>
      <AppText testID="texto" size={20}>Olá</AppText>
      <Text testID="bg">{palette.background}</Text>
      <Text testID="escala">{String(fontScale)}</Text>
      <Pressable testID="grande" onPress={() => update({ fontSize: 'grande' })}><Text>g</Text></Pressable>
      <Pressable testID="contraste" onPress={() => update({ highContrast: !prefs.highContrast })}><Text>c</Text></Pressable>
    </>
  );
}

describe('preferências de acessibilidade', () => {
  beforeEach(() => AsyncStorage.clear());

  it('sanitiza dados salvos inválidos', () => {
    expect(sanitizePreferences({ fontSize: 'gigante', highContrast: 'sim', plainLanguage: false })).toEqual({ ...DEFAULT_PREFERENCES, plainLanguage: false });
    expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES);
  });

  it('o tamanho da fonte altera o texto de fato', () => {
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    expect(screen.getByTestId('texto').props.style[0].fontSize).toBe(20);
    fireEvent.press(screen.getByTestId('grande'));
    expect(screen.getByTestId('texto').props.style[0].fontSize).toBe(25);
  });

  it('o alto contraste troca a paleta e persiste localmente', async () => {
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    expect(screen.getByTestId('bg').props.children).toBe('#EEF4FF');
    fireEvent.press(screen.getByTestId('contraste'));
    expect(screen.getByTestId('bg').props.children).toBe('#FFFFFF');
    await waitFor(async () => expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? '{}').highContrast).toBe(true));
  });

  it('restaura preferências salvas ao iniciar', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ fontSize: 'muito-grande' }));
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    await waitFor(() => expect(screen.getByTestId('escala').props.children).toBe('1.5'));
  });
});
