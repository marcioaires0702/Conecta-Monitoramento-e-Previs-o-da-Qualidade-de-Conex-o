import React from 'react';
import { View } from 'react-native';
import { AppText, Card, QualityBadge, Screen } from '../src/components/ui';
import { GLOSSARY, QUALITY_DESCRIPTION } from '../src/domain/quality';
import type { Quality } from '../src/domain/types';
import { spacing } from '../src/theme';

const ORDER: Quality[] = ['boa', 'regular', 'instavel'];

/** Tela 9 — Legenda de qualidade e glossário. */
export default function Legend() {
  return (
    <Screen title="Legenda de qualidade">
      {ORDER.map((q) => (
        <Card key={q} style={{ gap: spacing.sm }}>
          <QualityBadge quality={q} size={18} />
          <AppText>{QUALITY_DESCRIPTION[q]}</AppText>
        </Card>
      ))}
      <AppText size={18} weight="700" accessibilityRole="header">Termos de redes (em linguagem simples)</AppText>
      <Card>
        {GLOSSARY.map((g) => (
          <View key={g.term} accessible accessibilityLabel={`${g.term}: ${g.meaning}`} style={{ paddingVertical: spacing.sm, gap: 2 }}>
            <AppText weight="700">{g.term}</AppText>
            <AppText muted>{g.meaning}</AppText>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
