import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppText, Button, Card, Icon, NeedsChoice, QualityBadge, Screen, SourceBanner, StateView } from '../../src/components/ui';
import { ACTIVITY_LABEL, ACTIVITY_ORDER } from '../../src/domain/activities';
import { formatTime } from '../../src/domain/time';
import type { ActivityId } from '../../src/domain/types';
import { usePreferences } from '../../src/state/preferences';
import { useSelection } from '../../src/state/selection';
import { useActivityAssessments } from '../../src/state/useActivityAssessments';
import { useDayForecasts } from '../../src/state/useDayForecasts';
import { MIN_TOUCH, radius, spacing } from '../../src/theme';

const ICONS: Record<ActivityId, React.ComponentProps<typeof Ionicons>['name']> = {
  videoconferencia: 'videocam',
  streaming: 'play-circle',
  jogos: 'game-controller',
  navegacao: 'globe',
  envio: 'cloud-upload',
};
const ICON_DESC: Record<ActivityId, string> = {
  videoconferencia: 'Ícone de câmera de vídeo',
  streaming: 'Ícone de reprodução',
  jogos: 'Ícone de controle de jogo',
  navegacao: 'Ícone de globo',
  envio: 'Ícone de nuvem com seta para cima',
};

/** Tela 5 — Previsão por atividade (troca de atividade/horário sem sair da tela). */
export default function Activities() {
  const { palette } = usePreferences();
  const sel = useSelection();
  const day = useDayForecasts();
  const router = useRouter();

  const forecast = useMemo(() => {
    if (day.status !== 'ok') return undefined;
    return day.upcoming.find((f) => f.timestamp === sel.timestamp) ?? day.upcoming[0];
  }, [day, sel.timestamp]);

  const assessed = useActivityAssessments(forecast);
  const assessments = assessed.items;
  const chosen = assessments.find((a) => a.activity === sel.activity);

  const nextActivity = () => sel.selectActivity(ACTIVITY_ORDER[(ACTIVITY_ORDER.indexOf(sel.activity) + 1) % ACTIVITY_ORDER.length]);

  return (
    <Screen title="Previsão por atividade" back={false} footer={<Button label="Ver outra atividade" hint="Seleciona a próxima atividade da lista" onPress={nextActivity} />}>
      {day.needsChoice ? <NeedsChoice /> : null}
      {day.status === 'loading' && !day.needsChoice ? <StateView status="loading" loadingLabel="Carregando previsões" /> : null}
      {day.status === 'error' ? <StateView status="error" error={day.error} onRetry={day.reload} /> : null}
      {day.status === 'ok' && !forecast ? <StateView status="empty" emptyMessage="Não há mais horários com previsão para hoje." /> : null}
      {day.status === 'ok' && forecast ? (
        <>
          <SourceBanner source={day.data.source} />
          <AppText weight="700" accessibilityRole="header">Qualidade prevista para</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {day.upcoming.map((f) => {
              const on = f.timestamp === forecast.timestamp;
              return (
                <Pressable
                  key={f.timestamp}
                  onPress={() => sel.selectTime(f.timestamp, f.period)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Horário ${formatTime(f.timestamp)}`}
                  style={{ minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: on ? palette.primary : palette.surface, borderWidth: palette.borderWidth, borderColor: on ? palette.primary : palette.border }}
                >
                  <AppText weight="700" color={on ? palette.onPrimary : palette.text}>{formatTime(f.timestamp)}</AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          {chosen ? (
            <Card testID="resultado-atividade" style={{ gap: spacing.sm }}>
              <AppText size={13} muted>Previsão para {ACTIVITY_LABEL[chosen.activity]} às {formatTime(forecast.timestamp)}</AppText>
              <QualityBadge quality={chosen.quality} size={20} prefix={ACTIVITY_LABEL[chosen.activity]} />
              <AppText>{chosen.message}</AppText>
              <AppText size={12} muted>
                {assessed.fromApi.includes(chosen.activity)
                  ? 'Avaliação feita pelo serviço de previsões.'
                  : 'Estimativa do aplicativo, por regras simples a partir das métricas previstas.'}
              </AppText>
            </Card>
          ) : null}

          {assessments.map((a) => {
            const on = a.activity === sel.activity;
            return (
              <Pressable
                key={a.activity}
                onPress={() => sel.selectActivity(a.activity)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${ACTIVITY_LABEL[a.activity]}. ${a.message}`}
                style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: palette.surface, borderWidth: on ? 2 : palette.borderWidth, borderColor: on ? palette.primary : palette.border }}
              >
                <Icon name={ICONS[a.activity]} size={28} color={palette.primary} description={ICON_DESC[a.activity]} />
                <View style={{ flex: 1 }}>
                  <AppText weight="700">{ACTIVITY_LABEL[a.activity]}</AppText>
                  <AppText size={13} muted>{a.message}</AppText>
                </View>
                <QualityBadge quality={a.quality} size={12} />
              </Pressable>
            );
          })}
          <Pressable onPress={() => router.push('/legenda')} accessibilityRole="link" accessibilityLabel="Entenda as classificações" style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}>
            <AppText color={palette.primary} weight="600">Entenda as classificações</AppText>
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}
