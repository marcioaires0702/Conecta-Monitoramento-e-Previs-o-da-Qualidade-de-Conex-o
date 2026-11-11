import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Button, Card, Icon, MetricsRow, NeedsChoice, QualityBadge, Screen, SourceBanner, StateView } from '../../src/components/ui';
import { formatDateLong, formatHourShort, formatTime } from '../../src/domain/time';
import { QUALITY_LABEL } from '../../src/domain/quality';
import type { Forecast, Quality } from '../../src/domain/types';
import { usePreferences } from '../../src/state/preferences';
import { useSelection } from '../../src/state/selection';
import { useService } from '../../src/state/service';
import { useAsync } from '../../src/state/useAsync';
import { useSourceGate } from '../../src/state/sourceChoice';
import { useDayForecasts } from '../../src/state/useDayForecasts';
import { spacing, radius, MIN_TOUCH } from '../../src/theme';

const SUMMARY_STEP_MS = 3 * 60 * 60 * 1000;
const SUMMARY_COUNT = 3;

/** Até 3 previsões, ao menos 3 h depois da anterior (funciona com dados horários ou esparsos). */
export function pickSummary(upcoming: Forecast[]): Forecast[] {
  const out: Forecast[] = [];
  let last = upcoming.length ? Date.parse(upcoming[0].timestamp) : 0;
  for (const f of upcoming.slice(1)) {
    const t = Date.parse(f.timestamp);
    if (t - last >= SUMMARY_STEP_MS) {
      out.push(f);
      last = t;
      if (out.length === SUMMARY_COUNT) break;
    }
  }
  return out;
}

function Chip({ label, quality, latencyMs, onPress, wide }: { label: string; quality: Quality; latencyMs: number; onPress: () => void; wide?: boolean }) {
  const { palette } = usePreferences();
  const c = palette.quality[quality];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: qualidade ${QUALITY_LABEL[quality]}, latência ${latencyMs} milissegundos`}
      accessibilityHint="Abre os detalhes desta previsão"
      style={{
        flex: wide ? undefined : 1,
        minHeight: MIN_TOUCH,
        backgroundColor: c.bg,
        borderColor: c.border,
        borderWidth: palette.borderWidth,
        borderRadius: radius.md,
        padding: spacing.sm,
        alignItems: wide ? 'flex-start' : 'center',
        gap: 2,
      }}
    >
      <AppText size={13} weight="700">{label}</AppText>
      <AppText size={13} weight="700" color={c.fg}>{QUALITY_LABEL[quality]}</AppText>
      <AppText size={12} muted>{latencyMs} ms</AppText>
    </Pressable>
  );
}

/** Tela 2 — Início. */
export default function Home() {
  const router = useRouter();
  const { palette, prefs } = usePreferences();
  const service = useService();
  const { selectTime } = useSelection();
  const { choice, enabled, isApi } = useSourceGate();
  const current = useAsync((s) => service.getCurrent(choice, s), [service, choice], enabled);
  const day = useDayForecasts();

  const summary = day.status === 'ok' ? pickSummary(day.upcoming) : [];
  const open = (f: Forecast) => {
    selectTime(f.timestamp, f.period);
    router.push('/detalhes');
  };
  const currentLabel = isApi ? 'Previsão mais próxima' : 'Conexão atual';
  const nowLabel = current.status === 'ok' && isApi ? formatHourShort(current.data.data.measuredAt) : 'Agora';
  const heading = day.status === 'ok' && !day.isToday && day.upcoming[0] ? `Previsões de ${formatDateLong(day.upcoming[0].timestamp)}` : 'Previsão para hoje';

  return (
    <Screen
      title="Conecta+"
      back={false}
      footer={<Button label="Ver previsão completa" hint="Escolha um horário ou período" onPress={() => router.push('/previsao')} disabled={day.needsChoice} />}
    >
      <View style={{ gap: spacing.xs }}>
        <AppText size={24} weight="800" accessibilityRole="header">Olá!</AppText>
        <AppText muted>Veja como está a sua conexão hoje e confira a previsão para os próximos horários.</AppText>
      </View>

      {day.needsChoice ? <NeedsChoice /> : null}

      {!day.needsChoice && current.status === 'ok' ? <SourceBanner source={current.data.source} /> : null}

      {!day.needsChoice ? (
        <Card>
          <AppText weight="700">{currentLabel}</AppText>
          {current.status === 'loading' ? <StateView status="loading" loadingLabel="Carregando conexão atual" /> : null}
          {current.status === 'error' ? <StateView status="error" error={current.error} onRetry={current.reload} /> : null}
          {current.status === 'ok' ? (
            <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
              <QualityBadge quality={current.data.data.quality} size={20} prefix={currentLabel} />
              <MetricsRow metrics={current.data.data} />
              <AppText size={12} muted>
                {current.data.source === 'demonstracao'
                  ? 'Valores de exemplo (demonstração).'
                  : current.data.data.isForecast
                    ? `Valores previstos para ${formatDateLong(current.data.data.measuredAt)} às ${formatTime(current.data.data.measuredAt)}. O serviço não faz medições do seu aparelho.`
                    : 'Medição informada pelo serviço.'}
              </AppText>
            </View>
          ) : null}
        </Card>
      ) : null}

      {!day.needsChoice ? (
        <View style={{ gap: spacing.sm }}>
          <AppText size={18} weight="700" accessibilityRole="header">{heading}</AppText>
          {day.status === 'loading' ? <StateView status="loading" loadingLabel="Carregando previsões" /> : null}
          {day.status === 'error' ? <StateView status="error" error={day.error} onRetry={day.reload} /> : null}
          {day.status === 'ok' && summary.length === 0 && current.status !== 'ok' ? (
            <StateView status="empty" emptyMessage="Não há mais previsões para hoje." />
          ) : null}
          {day.status === 'ok' && (summary.length > 0 || current.status === 'ok') ? (
            <View style={{ flexDirection: prefs.simplifiedNavigation ? 'column' : 'row', gap: spacing.sm }}>
              {current.status === 'ok' ? (
                <Chip
                  wide={prefs.simplifiedNavigation}
                  label={nowLabel}
                  quality={current.data.data.quality}
                  latencyMs={current.data.data.latencyMs}
                  onPress={() => day.upcoming[0] && open(day.upcoming[0])}
                />
              ) : null}
              {summary.map((f) => (
                <Chip key={f.timestamp} wide={prefs.simplifiedNavigation} label={formatHourShort(f.timestamp)} quality={f.quality} latencyMs={f.latencyMs} onPress={() => open(f)} />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <Pressable
        onPress={() => router.push('/legenda')}
        accessibilityRole="link"
        accessibilityLabel="Entenda as classificações e os termos de redes"
        style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
      >
        <Icon name="help-circle" color={palette.primary} />
        <AppText color={palette.primary} weight="600">Entenda as classificações e os termos</AppText>
      </Pressable>
    </Screen>
  );
}
