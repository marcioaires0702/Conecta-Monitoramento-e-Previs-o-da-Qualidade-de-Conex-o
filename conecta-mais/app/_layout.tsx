import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PreferencesProvider } from '../src/state/preferences';
import { SelectionProvider } from '../src/state/selection';
import { ServiceProvider } from '../src/state/service';
import { SourceChoiceProvider } from '../src/state/sourceChoice';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <ServiceProvider>
          <SourceChoiceProvider>
            <SelectionProvider>
              <StatusBar style="auto" />
              <Stack screenOptions={{ headerShown: false }} />
            </SelectionProvider>
          </SourceChoiceProvider>
        </ServiceProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
