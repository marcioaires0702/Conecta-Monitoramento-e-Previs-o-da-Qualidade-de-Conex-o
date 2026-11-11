import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Icon, Screen } from '../../src/components/ui';
import { usePreferences } from '../../src/state/preferences';
import { useService } from '../../src/state/service';
import { useSourceChoice } from '../../src/state/sourceChoice';
import { MIN_TOUCH, radius, spacing } from '../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Tela 7 — Configurações. Cada linha faz o que anuncia. */
export default function Settings() {
  const router = useRouter();
  const { palette } = usePreferences();
  const isApi = useService().kind === 'api';
  const { choice } = useSourceChoice();

  const Row = ({ icon, label, onPress, hint, disabled, status }: { icon: IconName; label: string; onPress?: () => void; hint?: string; disabled?: boolean; status?: string }) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={disabled ? 'text' : 'button'}
      accessibilityLabel={status ? `${label}. ${status}` : label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled }}
      style={{ minHeight: MIN_TOUCH + 8, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: palette.surface, borderRadius: radius.md, borderWidth: palette.borderWidth, borderColor: palette.border }}
    >
      <Icon name={icon} size={26} color={disabled ? palette.textMuted : palette.text} />
      <View style={{ flex: 1 }}>
        <AppText weight="600" muted={disabled}>{label}</AppText>
        {status ? <AppText size={12} muted>{status}</AppText> : null}
      </View>
      {!disabled ? <Ionicons name="chevron-forward" size={20} color={palette.textMuted} importantForAccessibility="no" /> : null}
    </Pressable>
  );

  return (
    <Screen title="Configurações" back={false}>
      <Row icon="notifications-outline" label="Notificações" disabled status="Indisponível nesta versão" />
      <Row
        icon="location-outline"
        label="Modelo e ponto de referência"
        hint="Escolhe de onde vêm as previsões"
        disabled={!isApi}
        status={!isApi ? 'Disponível só com o serviço de previsões configurado' : choice ? `${choice.modelName} · ponto nº ${choice.probeId}` : 'Nada escolhido ainda'}
        onPress={() => router.push('/fonte')}
      />
      <Row icon="accessibility-outline" label="Acessibilidade" hint="Ajusta fonte, contraste e navegação" onPress={() => router.push('/acessibilidade')} />
      <Row icon="help-circle-outline" label="Legenda e glossário" hint="Explica as classificações e os termos de redes" onPress={() => router.push('/legenda')} />
      <Row icon="information-circle-outline" label="Sobre o aplicativo" onPress={() => router.push('/sobre')} />
    </Screen>
  );
}
