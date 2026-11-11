import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Switch, View } from 'react-native';
import { AppText, Card, Screen } from '../src/components/ui';
import { FONT_LABEL, FONT_ORDER, usePreferences, type Preferences } from '../src/state/preferences';
import { MIN_TOUCH, radius, spacing } from '../src/theme';

/** Tela 8 — Acessibilidade. Todas as opções alteram a interface de verdade. */
export default function AccessibilitySettings() {
  const { prefs, palette, update } = usePreferences();

  const Toggle = ({ label, description, field }: { label: string; description: string; field: keyof Pick<Preferences, 'highContrast' | 'simplifiedNavigation' | 'iconDescriptions' | 'plainLanguage'> }) => (
    <View style={{ minHeight: MIN_TOUCH + 8, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
      <View style={{ flex: 1 }}>
        <AppText weight="600">{label}</AppText>
        <AppText size={12} muted>{description}</AppText>
      </View>
      <Switch
        value={prefs[field]}
        onValueChange={(v) => update({ [field]: v })}
        accessibilityLabel={label}
        accessibilityHint={description}
        accessibilityRole="switch"
        accessibilityState={{ checked: prefs[field] }}
        trackColor={{ false: palette.border, true: palette.primary }}
      />
    </View>
  );

  return (
    <Screen title="Acessibilidade">
      <Card>
        <AppText weight="600">Tamanho da fonte</AppText>
        <AppText size={12} muted>Soma-se ao tamanho de texto definido no seu aparelho.</AppText>
        <View accessibilityRole="radiogroup" style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          {FONT_ORDER.map((f) => {
            const on = prefs.fontSize === f;
            return (
              <Pressable
                key={f}
                onPress={() => update({ fontSize: f })}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`Tamanho da fonte: ${FONT_LABEL[f]}`}
                style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: on ? 2 : palette.borderWidth, borderColor: on ? palette.primary : palette.border }}
              >
                <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={palette.primary} importantForAccessibility="no" />
                <AppText>{FONT_LABEL[f]}</AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>
      <Card>
        <Toggle field="highContrast" label="Alto contraste" description="Usa cores mais fortes e bordas mais grossas." />
        <Toggle field="simplifiedNavigation" label="Navegação simplificada" description="Mostra a previsão do dia em lista, uma opção por linha." />
        <Toggle field="iconDescriptions" label="Descrição de ícones" description="Faz o leitor de tela descrever os ícones." />
        <Toggle field="plainLanguage" label="Linguagem simples" description="Mostra explicações curtas junto dos termos técnicos." />
      </Card>
      <Card>
        <AppText weight="600">Leitor de tela (TalkBack / VoiceOver)</AppText>
        <AppText size={13} muted>O aplicativo funciona com o leitor de tela do aparelho. Ative-o nas configurações de acessibilidade do Android ou do iPhone; não é preciso ligar nada aqui.</AppText>
      </Card>
    </Screen>
  );
}
