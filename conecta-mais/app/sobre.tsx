import React from 'react';
import { AppText, Card, Screen } from '../src/components/ui';

export default function About() {
  const url = process.env.EXPO_PUBLIC_API_URL;
  return (
    <Screen title="Sobre o aplicativo">
      <Card>
        <AppText size={20} weight="800">Conecta+</AppText>
        <AppText muted>Sua internet, mais previsível.</AppText>
        <AppText style={{ marginTop: 12 }}>
          O Conecta+ ajuda você a entender a sua conexão e a ver a qualidade esperada antes de uma atividade.
        </AppText>
      </Card>
      <Card>
        <AppText weight="700">Origem dos dados</AppText>
        <AppText muted>
          {url
            ? 'Este aplicativo está configurado para receber as previsões de um serviço externo.'
            : 'Este aplicativo está em modo demonstração: os valores são de exemplo e não vêm de medições nem de um modelo de previsão real.'}
        </AppText>
      </Card>
      <Card>
        <AppText weight="700">Privacidade</AppText>
        <AppText muted>O aplicativo não exige cadastro, não rastreia você e não coleta dados pessoais. Suas preferências de acessibilidade ficam apenas neste aparelho.</AppText>
      </Card>
    </Screen>
  );
}
