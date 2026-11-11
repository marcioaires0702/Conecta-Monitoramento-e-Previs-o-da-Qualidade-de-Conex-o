import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Button, Icon, Screen, StateView } from '../src/components/ui';
import { usePreferences } from '../src/state/preferences';
import { useService } from '../src/state/service';
import { useSourceChoice } from '../src/state/sourceChoice';
import { useAsync } from '../src/state/useAsync';
import { MIN_TOUCH, radius, spacing } from '../src/theme';

/** Tela de apoio — escolha do modelo de previsão e do ponto de referência (sonda pública). */
export default function SourcePicker() {
  const router = useRouter();
  const { palette } = usePreferences();
  const service = useService();
  const { choice, save } = useSourceChoice();
  const models = useAsync((s) => service.getModels(s), [service]);
  const probes = useAsync((s) => service.getProbes(s), [service]);
  const [modelId, setModelId] = useState<string | null>(choice?.modelId ?? null);
  const [probeId, setProbeId] = useState<number | null>(choice?.probeId ?? null);

  const model = models.status === 'ok' ? models.data.find((m) => m.id === modelId) : undefined;
  const probe = probes.status === 'ok' ? probes.data.find((p) => p.probeId === probeId) : undefined;

  const confirm = () => {
    if (!model || !probe) return;
    save({
      modelId: model.id,
      modelName: model.name,
      probeId: probe.probeId,
      countryCode: probe.countryCode,
      latitude: probe.latitude,
      longitude: probe.longitude,
    });
    router.back();
  };

  const Row = ({ on, title, subtitle, onPress }: { on: boolean; title: string; subtitle?: string; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: palette.surface, borderWidth: on ? 2 : palette.borderWidth, borderColor: on ? palette.primary : palette.border }}
    >
      <Icon name={on ? 'radio-button-on' : 'radio-button-off'} color={palette.primary} />
      <View style={{ flex: 1 }}>
        <AppText weight="700">{title}</AppText>
        {subtitle ? <AppText size={13} muted>{subtitle}</AppText> : null}
      </View>
    </Pressable>
  );

  return (
    <Screen
      title="Modelo e ponto de referência"
      footer={<Button label="Salvar escolha" disabled={!model || !probe} hint={model && probe ? 'Salva e volta' : 'Escolha um modelo e um ponto antes'} onPress={confirm} />}
    >
      <AppText muted>
        As previsões vêm de modelos criados por grupos de estudo. Nenhum modelo é considerado melhor que outro: você pode trocar quando quiser.
      </AppText>

      <AppText size={18} weight="700" accessibilityRole="header">1. Modelo de previsão</AppText>
      {models.status === 'loading' ? <StateView status="loading" loadingLabel="Carregando modelos" /> : null}
      {models.status === 'error' ? <StateView status="error" error={models.error} onRetry={models.reload} /> : null}
      {models.status === 'ok' && models.data.length === 0 ? <StateView status="empty" emptyMessage="Nenhum modelo disponível. Esta tela só funciona com o serviço de previsões configurado." /> : null}
      {models.status === 'ok'
        ? models.data.map((m) => (
            <Row
              key={m.id}
              on={m.id === modelId}
              title={m.name}
              subtitle={[m.groupName, m.algorithm, m.description].filter(Boolean).join(' · ') || undefined}
              onPress={() => setModelId(m.id)}
            />
          ))
        : null}

      <AppText size={18} weight="700" accessibilityRole="header">2. Ponto de referência</AppText>
      <AppText size={13} muted>
        Os pontos são sondas públicas de medição. A localização delas é aproximada e não é a sua localização: a previsão vale para o ponto, não para o seu aparelho.
      </AppText>
      {probes.status === 'loading' ? <StateView status="loading" loadingLabel="Carregando pontos" /> : null}
      {probes.status === 'error' ? <StateView status="error" error={probes.error} onRetry={probes.reload} /> : null}
      {probes.status === 'ok' && probes.data.length === 0 ? <StateView status="empty" emptyMessage="Nenhum ponto de referência disponível no momento." /> : null}
      {probes.status === 'ok'
        ? probes.data.map((p) => (
            <Row
              key={p.probeId}
              on={p.probeId === probeId}
              title={`Ponto nº ${p.probeId} (${p.countryCode})`}
              subtitle={`Posição aproximada: ${p.latitude.toFixed(2)}, ${p.longitude.toFixed(2)}`}
              onPress={() => setProbeId(p.probeId)}
            />
          ))
        : null}
    </Screen>
  );
}
