import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button } from '../src/components/ui';
import { standardPalette } from '../src/theme';

/** Tela 1 — Splash. Tem uma ação explícita "Começar" (sem atraso artificial). */
export default function Splash() {
  const router = useRouter();
  const p = standardPalette;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.navy, padding: 24 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Ionicons name="wifi" size={96} color="#38BDF8" importantForAccessibility="no" accessibilityElementsHidden />
        <AppText size={40} weight="800" color="#FFFFFF" accessibilityRole="header">
          Conecta+
        </AppText>
        <AppText size={20} color="#FFFFFF" style={{ textAlign: 'center' }}>
          Sua internet,{'\n'}mais previsível.
        </AppText>
        <AppText size={14} color="#E2E8F0" style={{ textAlign: 'center', marginTop: 24 }}>
          Monitore e visualize a qualidade da sua conexão e veja a previsão para os próximos horários.
        </AppText>
      </View>
      <Button label="Começar" hint="Abre a tela inicial" onPress={() => router.replace('/(tabs)')} />
    </SafeAreaView>
  );
}
