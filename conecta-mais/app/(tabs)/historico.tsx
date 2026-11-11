import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { AppText, Card, NeedsChoice, QualityBadge, Screen, SourceBanner, StateView } from '../../src/components/ui';
import { QUALITY_LABEL } from '../../src/domain/quality';
import { computeShares, dailySummaries, filterRange } from '../../src/domain/history';
import { formatDayMonth, formatDayShort } from '../../src/domain/time';
import type { Quality } from '../../src/domain/types';
import { useClock } from '../../src/state/clock';
import { usePreferences } from '../../src/state/preferences';
import { useService } from '../../src/state/service';
import { useSourceGate } from '../../src/state/sourceChoice';
import { useAsync } from '../../src/state/useAsync';
import { MIN_TOUCH, radius, spacing } from '../../src/theme';

export const RECENT_DAYS = 3;
export const WEEK_DAYS = 7;
const LEVEL: Record<Quality, number> = { boa: 0, regular: 1, instavel: 2 };

/** Tela 6 — Histórico de conexão. */
export default function History() {
  const { palette, fontScale } = usePreferences();
  const service = useService();
  const clock = useClock();
  const [days, setDays] = useState(RECENT_DAYS);
  const now = useMemo(() => clock(), [clock]);
  const { choice, enabled, needsChoice, isApi } = useSourceGate();
  const state = useAsync((s) => service.getHistory(WEEK_DAYS, now, choice, s), [service, now, choice], enabled);

  const view = useMemo(() => {
    if (state.status !== 'ok') return null;
    const all = state.data.data;
    // Se todos os dados são anteriores a hoje (ex.: previsões antigas da API), a janela termina no último dado.
    const latestEnd = all.length ? Math.max(...all.map((o) => Date.parse(o.end))) : null;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const ref = latestEnd !== null && latestEnd <= startOfToday ? new Date(latestEnd - 1) : now;
    const from = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - (days - 1));
    const obs = filterRange(all, from, new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 1));
    return { shares: computeShares(obs), daily: dailySummaries(obs, ref, days), empty: obs.length === 0 };
  }, [state, now, days]);

  const W = 320;
  const H = 150;
  const padL = 56;
  const padR = 16;
  const padT = 14;
  const padB = 30;
  const x = (i: number, n: number) => padL + (n <= 1 ? (W - padL - padR) / 2 : (i * (W - padL - padR)) / (n - 1));
  const y = (q: Quality) => padT + (LEVEL[q] * (H - padT - padB)) / 2;

  const Seg = ({ id, label }: { id: number; label: string }) => (
    <Pressable
      onPress={() => setDays(id)}
      accessibilityRole="tab"
      accessibilityState={{ selected: days === id }}
      accessibilityLabel={label}
      style={{ flex: 1, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: days === id ? palette.primary : 'transparent' }}
    >
      <AppText weight="700" color={days === id ? palette.onPrimary : palette.text}>{label}</AppText>
    </Pressable>
  );

  const points = (view?.daily ?? []).map((d, i, arr) => (d.dominant ? { i, n: arr.length, q: d.dominant } : null)).filter((p): p is { i: number; n: number; q: Quality } => p !== null);

  return (
    <Screen title="Histórico de conexão" back={false}>
      <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: palette.surfaceAlt, borderRadius: radius.pill, padding: 2 }}>
        <Seg id={RECENT_DAYS} label="Últimos dias" />
        <Seg id={WEEK_DAYS} label="Últimos 7 dias" />
      </View>
      {needsChoice ? <NeedsChoice /> : null}
      {state.status === 'loading' && !needsChoice ? <StateView status="loading" loadingLabel="Carregando histórico" /> : null}
      {state.status === 'error' ? <StateView status="error" error={state.error} onRetry={state.reload} /> : null}
      {state.status === 'ok' && view?.empty ? <StateView status="empty" emptyMessage="Ainda não há histórico de conexão para este período." /> : null}
      {state.status === 'ok' && view && !view.empty ? (
        <>
          <SourceBanner source={state.data.source} />
          {isApi ? (
            <AppText size={12} muted testID="nota-historico">
              O serviço não guarda medições passadas. Este histórico usa as previsões do modelo para o período, não o que aconteceu de fato.
            </AppText>
          ) : null}
          <Card>
            <AppText weight="700" accessibilityRole="header">Qualidade predominante por dia</AppText>
            <View
              accessible
              testID="grafico-historico"
              accessibilityRole="image"
              accessibilityLabel={`Gráfico de qualidade por dia. ${view.daily.map((d) => `${formatDayShort(d.day)} ${formatDayMonth(d.day)}: ${d.dominant ? QUALITY_LABEL[d.dominant] : 'sem dados'}`).join('. ')}.`}
            >
              <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
                {(['boa', 'regular', 'instavel'] as Quality[]).map((q) => (
                  <React.Fragment key={q}>
                    <Line x1={padL} x2={W - padR} y1={y(q)} y2={y(q)} stroke={palette.border} strokeWidth={1} />
                    <SvgText x={4} y={y(q) + 4} fontSize={11 * Math.min(fontScale, 1.2)} fill={palette.text}>{QUALITY_LABEL[q]}</SvgText>
                  </React.Fragment>
                ))}
                <Polyline points={points.map((p) => `${x(p.i, p.n)},${y(p.q)}`).join(' ')} fill="none" stroke={palette.primary} strokeWidth={2.5} />
                {points.map((p) => (
                  <Circle key={p.i} cx={x(p.i, p.n)} cy={y(p.q)} r={5} fill={palette.quality[p.q].border} stroke={palette.surface} strokeWidth={1.5} />
                ))}
                {view.daily.map((d, i) => (
                  <SvgText key={d.day} x={x(i, view.daily.length)} y={H - 8} fontSize={10} textAnchor="middle" fill={palette.textMuted}>{formatDayShort(d.day)}</SvgText>
                ))}
              </Svg>
            </View>
          </Card>

          <View style={{ gap: spacing.sm }}>
            <AppText size={18} weight="700" accessibilityRole="header">Resumo do período</AppText>
            {view.shares ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm }} testID="resumo-periodo">
                {(['boa', 'regular', 'instavel'] as Quality[]).map((q) => (
                  <View key={q} accessible accessibilityLabel={`${QUALITY_LABEL[q]}: ${view.shares![q]} por cento do tempo`} style={{ flex: 1, gap: spacing.xs, padding: spacing.sm, borderRadius: radius.md, backgroundColor: palette.quality[q].bg, borderColor: palette.quality[q].border, borderWidth: palette.borderWidth }}>
                    <QualityBadge quality={q} size={12} />
                    <AppText size={22} weight="800" color={palette.quality[q].fg}>{view.shares![q]}%</AppText>
                  </View>
                ))}
              </View>
            ) : null}
            <AppText size={12} muted>Percentuais calculados pela duração de cada intervalo.</AppText>
          </View>

          <View style={{ gap: spacing.xs }}>
            <AppText weight="700" accessibilityRole="header">Detalhe por dia (alternativa em texto ao gráfico)</AppText>
            {view.daily.map((d) => (
              <View key={d.day} accessible accessibilityLabel={`${formatDayShort(d.day)} ${formatDayMonth(d.day)}: ${d.dominant ? `predominou ${QUALITY_LABEL[d.dominant]}` : 'sem dados'}`} style={{ flexDirection: 'row', justifyContent: 'space-between', minHeight: 40, alignItems: 'center' }}>
                <AppText>{formatDayShort(d.day)} {formatDayMonth(d.day)}</AppText>
                {d.dominant ? <QualityBadge quality={d.dominant} size={12} /> : <AppText muted>Sem dados</AppText>}
              </View>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
