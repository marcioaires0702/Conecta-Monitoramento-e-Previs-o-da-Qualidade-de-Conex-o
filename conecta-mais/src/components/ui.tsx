import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  findNodeHandle,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QUALITY_LABEL } from '../domain/quality';
import type { DataSource, Metrics, Quality } from '../domain/types';
import { usePreferences } from '../state/preferences';
import { useService } from '../state/service';
import { useSourceChoice } from '../state/sourceChoice';
import { MIN_TOUCH, radius, spacing } from '../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Texto temático: aplica a escala de fonte escolhida (além da escala do sistema). */
export function AppText({
  size = 16,
  weight = '400',
  muted,
  color,
  style,
  ...rest
}: TextProps & { size?: number; weight?: TextStyle['fontWeight']; muted?: boolean; color?: string }) {
  const { palette, fontScale } = usePreferences();
  return (
    <Text
      {...rest}
      style={[{ fontSize: size * fontScale, fontWeight: weight, color: color ?? (muted ? palette.textMuted : palette.text) }, style]}
    />
  );
}

/** Ícone vetorial. Com "descrição de ícones" ativa ele é anunciado; caso contrário é decorativo. */
export function Icon({ name, size = 24, color, description }: { name: IconName; size?: number; color?: string; description?: string }) {
  const { prefs, palette } = usePreferences();
  const describe = prefs.iconDescriptions && !!description;
  return (
    <View
      accessible={describe}
      accessibilityLabel={describe ? description : undefined}
      accessibilityRole={describe ? 'image' : undefined}
      importantForAccessibility={describe ? 'yes' : 'no-hide-descendants'}
      accessibilityElementsHidden={!describe}
    >
      <Ionicons name={name} size={size} color={color ?? palette.text} />
    </View>
  );
}

export function Card({ children, style, testID }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const { palette } = usePreferences();
  return (
    <View
      testID={testID}
      style={[
        { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing.lg, borderColor: palette.border, borderWidth: palette.borderWidth },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  hint,
  disabled,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  hint?: string;
  disabled?: boolean;
  testID?: string;
}) {
  const { palette } = usePreferences();
  const primary = variant === 'primary';
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled }}
      style={{
        minHeight: MIN_TOUCH,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
        backgroundColor: primary ? palette.primary : palette.surface,
        borderWidth: primary ? 0 : palette.borderWidth + 1,
        borderColor: palette.primary,
      }}
    >
      <AppText weight="700" color={primary ? palette.onPrimary : palette.primary} style={{ textAlign: 'center' }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const QUALITY_ICON: Record<Quality, IconName> = {
  boa: 'checkmark-circle',
  regular: 'alert-circle',
  instavel: 'close-circle',
};

/** Qualidade SEMPRE com texto + ícone + cor (RNF03). */
export function QualityBadge({ quality, size = 16, prefix }: { quality: Quality; size?: number; prefix?: string }) {
  const { palette } = usePreferences();
  const c = palette.quality[quality];
  const label = QUALITY_LABEL[quality];
  return (
    <View
      accessible
      accessibilityLabel={prefix ? `${prefix}: ${label}` : `Qualidade ${label}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: spacing.xs,
        backgroundColor: c.bg,
        borderColor: c.border,
        borderWidth: palette.borderWidth,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
      }}
    >
      <Ionicons name={QUALITY_ICON[quality]} size={size * 1.2} color={c.fg} importantForAccessibility="no" />
      <AppText size={size} weight="700" color={c.fg}>
        {label}
      </AppText>
    </View>
  );
}

export const SOURCE_TEXT: Record<DataSource, string> = {
  demonstracao: 'Modo demonstração: estes valores são de exemplo e não são medições nem previsões reais.',
  api: 'Dados recebidos do serviço de previsões.',
  indisponivel: 'Dados indisponíveis no momento.',
};

export function SourceBanner({ source }: { source: DataSource }) {
  const { palette } = usePreferences();
  const { choice } = useSourceChoice();
  if (source === 'api') {
    const note = choice
      ? `Previsão do ${choice.modelName} para o ponto de referência nº ${choice.probeId} (${choice.countryCode}). Não é uma medição do seu aparelho.`
      : null;
    return (
      <View style={{ gap: 2 }}>
        <AppText size={12} muted testID="fonte-api" accessibilityLabel={SOURCE_TEXT.api}>
          {SOURCE_TEXT.api}
        </AppText>
        {note ? (
          <AppText size={12} muted testID="fonte-referencia">
            {note}
          </AppText>
        ) : null}
      </View>
    );
  }
  return (
    <View
      testID="fonte-aviso"
      accessible
      accessibilityLabel={SOURCE_TEXT[source]}
      style={{
        flexDirection: 'row',
        gap: spacing.sm,
        alignItems: 'center',
        backgroundColor: palette.quality.regular.bg,
        borderColor: palette.quality.regular.border,
        borderWidth: palette.borderWidth,
        borderRadius: radius.md,
        padding: spacing.md,
      }}
    >
      <Icon name="information-circle" color={palette.quality.regular.fg} />
      <AppText size={13} color={palette.quality.regular.fg} style={{ flex: 1 }}>
        {SOURCE_TEXT[source]}
      </AppText>
    </View>
  );
}

export function StateView({
  status,
  error,
  onRetry,
  emptyMessage,
  empty,
  loadingLabel = 'Carregando',
}: {
  status: 'loading' | 'error' | 'empty';
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  empty?: boolean;
  loadingLabel?: string;
}) {
  const { palette } = usePreferences();
  const isApi = useService().kind === 'api';
  if (status === 'loading') {
    const slow = 'O serviço pode levar até 1 minuto para responder na primeira vez.';
    return (
      <View testID="estado-carregando" accessible accessibilityLiveRegion="polite" accessibilityLabel={`${loadingLabel}…${isApi ? ` ${slow}` : ''}`} style={styles.state}>
        <ActivityIndicator size="large" color={palette.primary} />
        <AppText muted>{loadingLabel}…</AppText>
        {isApi ? (
          <AppText size={12} muted style={{ textAlign: 'center' }}>
            {slow}
          </AppText>
        ) : null}
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View testID="estado-erro" accessibilityLiveRegion="assertive" style={styles.state}>
        <Icon name="cloud-offline" size={36} color={palette.quality.instavel.fg} />
        <AppText weight="700" style={{ textAlign: 'center' }}>
          Não foi possível obter a previsão
        </AppText>
        <AppText muted style={{ textAlign: 'center' }}>
          {error}
        </AppText>
        {onRetry ? <Button label="Tentar novamente" onPress={onRetry} /> : null}
      </View>
    );
  }
  return (
    <View testID="estado-vazio" accessible accessibilityLabel={emptyMessage} style={styles.state}>
      <Icon name="file-tray-outline" size={36} color={palette.textMuted} />
      <AppText muted style={{ textAlign: 'center' }}>
        {emptyMessage}
      </AppText>
    </View>
  );
}

const UNIT_SPOKEN: Record<string, string> = { ms: 'milissegundos', Mbps: 'megabits por segundo', '%': 'por cento' };

export function MetricTile({ label, value, unit, hint }: { label: string; value: number; unit: string; hint?: string }) {
  const { palette, prefs } = usePreferences();
  const shown = Number.isInteger(value) ? String(value) : value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${shown} ${UNIT_SPOKEN[unit] ?? unit}${prefs.plainLanguage && hint ? `. ${hint}` : ''}`}
      style={{ flex: 1, backgroundColor: palette.surfaceAlt, borderRadius: radius.md, padding: spacing.md, gap: 2, borderColor: palette.border, borderWidth: palette.borderWidth === 2 ? 2 : 0 }}
    >
      <AppText size={12} muted>
        {label}
      </AppText>
      <AppText size={18} weight="700">
        {shown} <AppText size={12} muted>{unit}</AppText>
      </AppText>
      {prefs.plainLanguage && hint ? (
        <AppText size={11} muted>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

/** Mostra só as métricas que existem: a API real traz latência e perda de pacotes; a demo, latência/download/upload. */
export function MetricsRow({ metrics }: { metrics: Metrics }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <MetricTile label="Latência" value={metrics.latencyMs} unit="ms" hint="Tempo de ida e volta dos dados." />
      {metrics.packetLossPct !== undefined ? (
        <MetricTile label="Perda de pacotes" value={metrics.packetLossPct} unit="%" hint="Dados que não chegam ao destino." />
      ) : null}
      {metrics.downloadMbps !== undefined ? (
        <MetricTile label="Download" value={metrics.downloadMbps} unit="Mbps" hint="Velocidade de chegada dos dados." />
      ) : null}
      {metrics.uploadMbps !== undefined ? (
        <MetricTile label="Upload" value={metrics.uploadMbps} unit="Mbps" hint="Velocidade de saída dos dados." />
      ) : null}
    </View>
  );
}

/** Aviso mostrado quando a API está ligada mas o usuário ainda não escolheu modelo e ponto de referência. */
export function NeedsChoice() {
  const router = useRouter();
  return (
    <Card testID="precisa-escolha" style={{ gap: spacing.sm }}>
      <AppText weight="700" accessibilityRole="header">
        Escolha de onde vêm as previsões
      </AppText>
      <AppText muted>
        Para mostrar a previsão, o aplicativo precisa de um modelo de previsão e de um ponto de referência (uma sonda de medição pública, que não é a sua localização).
      </AppText>
      <Button label="Escolher modelo e ponto" hint="Abre a tela de escolha" onPress={() => router.push('/fonte')} />
    </Card>
  );
}

export function Screen({ title, children, back = true, footer }: { title?: string; children: React.ReactNode; back?: boolean; footer?: React.ReactNode }) {
  const { palette } = usePreferences();
  const router = useRouter();
  const titleRef = useRef<Text>(null);

  // RNF08: ao abrir a tela, move o foco do leitor de tela para o título.
  useEffect(() => {
    const t = setTimeout(() => {
      const node = titleRef.current ? findNodeHandle(titleRef.current) : null;
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top', 'left', 'right']}>
      {title ? (
        <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border, borderBottomWidth: palette.borderWidth }]}>
          {back ? (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              accessibilityHint="Volta para a tela anterior"
              style={styles.back}
              hitSlop={4}
            >
              <Ionicons name="arrow-back" size={24} color={palette.text} />
            </Pressable>
          ) : null}
          <Text ref={titleRef} accessibilityRole="header" style={{ fontSize: 18 * usePreferences().fontScale, fontWeight: '700', color: palette.text, flex: 1 }}>
            {title}
          </Text>
        </View>
      ) : null}
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl * 2 }}>{children}</ScrollView>
      {footer ? <View style={{ padding: spacing.lg, backgroundColor: palette.background }}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, minHeight: 56, gap: spacing.xs },
  back: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
});
