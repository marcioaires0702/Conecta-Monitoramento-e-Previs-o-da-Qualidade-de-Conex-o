import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Button, Icon, NeedsChoice, QualityBadge, Screen, SourceBanner, StateView } from '../src/components/ui';
import { PERIOD_LABEL, PERIOD_ORDER, PERIOD_RANGE, formatDateLong, formatTime } from '../src/domain/time';
import type { Period } from '../src/domain/types';
import { usePreferences } from '../src/state/preferences';
import { useSelection } from '../src/state/selection';
import { useDayForecasts } from '../src/state/useDayForecasts';
import { MIN_TOUCH, radius, spacing } from '../src/theme';

type Mode = 'horario' | 'periodo';

/** Tela 3 — Seleção de horário ou período. */
export default function ForecastSelection() {
  const router = useRouter();
  const { palette } = usePreferences();
  const sel = useSelection();
  const day = useDayForecasts();
  const [mode, setMode] = useState<Mode>(sel.timestamp && sel.period ? 'horario' : 'horario');
  const [chosen, setChosen] = useState<string | null>(sel.timestamp);

  const byPeriod = (p: Period) => day.upcoming.filter((f) => f.period === p);

  const confirm = () => {
    const f = day.upcoming.find((x) => x.timestamp === chosen);
    if (!f) return;
    sel.selectTime(f.timestamp, f.period);
    router.push('/detalhes');
  };

  const Tab = ({ id, label }: { id: Mode; label: string }) => (
    <Pressable
      onPress={() => {
        setMode(id);
        setChosen(null);
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: mode === id }}
      accessibilityLabel={label}
      style={{ flex: 1, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: mode === id ? palette.primary : 'transparent' }}
    >
      <AppText weight="700" color={mode === id ? palette.onPrimary : palette.text}>{label}</AppText>
    </Pressable>
  );

  const Row = ({ id, title, subtitle, quality, disabled }: { id: string; title: string; subtitle: string; quality?: React.ComponentProps<typeof QualityBadge>['quality']; disabled?: boolean }) => {
    const on = chosen === id;
    return (
      <Pressable
        onPress={() => setChosen(id)}
        disabled={disabled}
        accessibilityRole="radio"
        accessibilityState={{ selected: on, disabled: !!disabled }}
        accessibilityLabel={`${title}. ${subtitle}`}
        style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: palette.surface, borderWidth: on ? 2 : palette.borderWidth, borderColor: on ? palette.primary : palette.border, opacity: disabled ? 0.5 : 1 }}
      >
        <Icon name={on ? 'radio-button-on' : 'radio-button-off'} color={palette.primary} />
        <View style={{ flex: 1 }}>
          <AppText weight="700">{title}</AppText>
          <AppText size={13} muted>{subtitle}</AppText>
        </View>
        {quality ? <QualityBadge quality={quality} size={13} /> : null}
      </Pressable>
    );
  };

  return (
    <Screen
      title="Previsão da conexão"
      footer={<Button label="Ver previsão" disabled={!chosen} hint={chosen ? 'Abre os detalhes da previsão escolhida' : 'Escolha um horário antes'} onPress={confirm} />}
    >
      <AppText muted>Escolha o horário ou período que deseja consultar:</AppText>
      <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: palette.surfaceAlt, borderRadius: radius.pill, padding: 2 }}>
        <Tab id="horario" label="Horário" />
        <Tab id="periodo" label="Período" />
      </View>
      {day.needsChoice ? <NeedsChoice /> : null}
      {day.status === 'ok' ? <SourceBanner source={day.data.source} /> : null}
      {day.status === 'ok' && !day.isToday && day.upcoming[0] ? (
        <AppText size={13} muted>Não há previsões para hoje. Mostrando as de {formatDateLong(day.upcoming[0].timestamp)}.</AppText>
      ) : null}
      {day.status === 'loading' && !day.needsChoice ? <StateView status="loading" loadingLabel="Carregando horários" /> : null}
      {day.status === 'error' ? <StateView status="error" error={day.error} onRetry={day.reload} /> : null}
      {day.status === 'ok' && day.upcoming.length === 0 ? <StateView status="empty" emptyMessage="Não há mais horários com previsão para hoje." /> : null}
      {day.status === 'ok' && mode === 'horario'
        ? day.upcoming.map((f, i) => (
            <Row key={f.timestamp} id={f.timestamp} title={i === 0 && day.isToday ? `Agora (${formatTime(f.timestamp)})` : formatTime(f.timestamp)} subtitle="Previsão do horário" quality={f.quality} />
          ))
        : null}
      {day.status === 'ok' && mode === 'periodo'
        ? PERIOD_ORDER.map((p) => {
            const list = byPeriod(p);
            const first = list[0];
            return (
              <Row
                key={p}
                id={first?.timestamp ?? p}
                title={PERIOD_LABEL[p]}
                subtitle={first ? `${PERIOD_RANGE[p]} · começa em ${formatTime(first.timestamp)}` : `${PERIOD_RANGE[p]} · ${day.isToday ? 'já passou' : 'sem previsão'}`}
                quality={first?.quality}
                disabled={!first}
              />
            );
          })
        : null}
    </Screen>
  );
}
