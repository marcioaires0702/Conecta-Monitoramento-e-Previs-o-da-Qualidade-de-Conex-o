import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { AccessibilityInfo, Pressable, View } from 'react-native';
import { AppText, Button, Card, Icon, MetricsRow, NeedsChoice, QualityBadge, Screen, SourceBanner, StateView } from '../src/components/ui';
import { ACTIVITY_LABEL } from '../src/domain/activities';
import { QUALITY_DESCRIPTION, QUALITY_LABEL } from '../src/domain/quality';
import { PERIOD_LABEL, formatDateLong, formatTime } from '../src/domain/time';
import { usePreferences } from '../src/state/preferences';
import { useSelection } from '../src/state/selection';
import { useActivityAssessments } from '../src/state/useActivityAssessments';
import { useDayForecasts } from '../src/state/useDayForecasts';
import { MIN_TOUCH, radius, spacing } from '../src/theme';

/** Tela 4 — Detalhes da previsão (valores PREVISTOS, não medidos). */
export default function ForecastDetails() {
  const router = useRouter();
  const { palette } = usePreferences();
  const sel = useSelection();
  const day = useDayForecasts();
  const forecast = day.status === 'ok' ? day.data.data.find((f) => f.timestamp === sel.timestamp) : undefined;

  // RNF08: anuncia a atualização quando o usuário troca o horário.
  useEffect(() => {
    if (forecast) {
      AccessibilityInfo.announceForAccessibility(`Previsão das ${formatTime(forecast.timestamp)}: ${QUALITY_LABEL[forecast.quality]}`);
    }
  }, [forecast]);

  const periodHours = forecast ? day.upcoming.filter((f) => f.period === forecast.period) : [];
  const assessed = useActivityAssessments(forecast);
  const activities = assessed.items;
  const allFromApi = activities.length > 0 && assessed.fromApi.length === activities.length;

  return (
    <Screen title="Detalhes da previsão" footer={<Button label="Ver por atividade" hint="Abre a previsão por tipo de atividade" onPress={() => router.push('/(tabs)/atividades')} />}>
      {day.needsChoice ? <NeedsChoice /> : null}
      {day.status === 'loading' && !day.needsChoice ? <StateView status="loading" loadingLabel="Carregando previsão" /> : null}
      {day.status === 'error' ? <StateView status="error" error={day.error} onRetry={day.reload} /> : null}
      {day.status === 'ok' && !forecast ? (
        <>
          <StateView status="empty" emptyMessage="Nenhum horário foi escolhido ou a previsão não está disponível." />
          <Button label="Escolher horário" onPress={() => router.replace('/previsao')} />
        </>
      ) : null}
      {day.status === 'ok' && forecast ? (
        <>
          <SourceBanner source={day.data.source} />
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
              <View accessible accessibilityLabel={`Previsão para ${formatDateLong(forecast.timestamp)} às ${formatTime(forecast.timestamp)}, ${PERIOD_LABEL[forecast.period]}`}>
                <AppText size={28} weight="800" testID="detalhe-hora">{formatTime(forecast.timestamp)}</AppText>
                <AppText size={13} muted>{day.isToday ? 'Hoje, ' : ''}{formatDateLong(forecast.timestamp)} · {PERIOD_LABEL[forecast.period]}</AppText>
              </View>
              <QualityBadge quality={forecast.quality} size={20} prefix="Qualidade prevista" />
            </View>
            <AppText size={13} muted style={{ marginTop: spacing.sm }}>{QUALITY_DESCRIPTION[forecast.quality]}</AppText>
            <AppText size={12} weight="700" style={{ marginTop: spacing.md }}>Valores previstos (não são medições)</AppText>
            <View style={{ marginTop: spacing.xs }}>
              <MetricsRow metrics={forecast} />
            </View>
          </Card>

          {periodHours.length > 1 ? (
            <View style={{ gap: spacing.sm }}>
              <AppText weight="700" accessibilityRole="header">Outros horários da {PERIOD_LABEL[forecast.period].toLowerCase()}</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {periodHours.map((f) => {
                  const on = f.timestamp === forecast.timestamp;
                  return (
                    <Pressable
                      key={f.timestamp}
                      onPress={() => sel.selectTime(f.timestamp, f.period)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${formatTime(f.timestamp)}, ${QUALITY_LABEL[f.quality]}`}
                      style={{ minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, paddingHorizontal: spacing.md, justifyContent: 'center', borderRadius: radius.pill, borderWidth: on ? 2 : 1, borderColor: on ? palette.primary : palette.border, backgroundColor: palette.surface }}
                    >
                      <AppText size={14} weight={on ? '700' : '400'}>{formatTime(f.timestamp)} · {QUALITY_LABEL[f.quality]}</AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={{ gap: spacing.sm }}>
            <AppText size={18} weight="700" accessibilityRole="header">Atividades recomendadas</AppText>
            {activities.map((a) => (
              <Card key={a.activity} style={{ padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <AppText weight="700">{ACTIVITY_LABEL[a.activity]}</AppText>
                  <AppText size={13} muted>{a.message}</AppText>
                </View>
                <QualityBadge quality={a.quality} size={12} />
              </Card>
            ))}
            {allFromApi ? (
              <AppText size={12} muted>Avaliação feita pelo serviço de previsões.</AppText>
            ) : (
              <AppText size={12} muted testID="nota-estimativa">
                {assessed.fromApi.length > 0
                  ? `Avaliada pelo serviço: ${assessed.fromApi.map((a) => ACTIVITY_LABEL[a]).join(', ')}. As demais são estimativas por regras simples do aplicativo, a partir das métricas previstas.`
                  : 'Avaliação estimada por regras simples do aplicativo, a partir das métricas previstas. Aplicativos, servidores e aparelhos diferentes podem ter resultados diferentes.'}
              </AppText>
            )}
          </View>

          <View accessible style={{ flexDirection: 'row', gap: spacing.sm, backgroundColor: palette.info, borderRadius: radius.md, padding: spacing.md, borderColor: palette.border, borderWidth: palette.borderWidth === 2 ? 2 : 0 }}>
            <Icon name="information-circle" color={palette.primary} />
            <AppText size={13} style={{ flex: 1 }}>A previsão considera o histórico de qualidade da conexão e o comportamento da rede. Ela é uma estimativa e pode mudar.</AppText>
          </View>
        </>
      ) : null}
    </Screen>
  );
}
