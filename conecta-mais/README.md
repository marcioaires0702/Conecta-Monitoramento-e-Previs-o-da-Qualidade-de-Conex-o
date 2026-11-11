# Conecta+ — Sua internet, mais previsível

Aplicativo móvel (React Native + Expo + TypeScript) para acompanhar a qualidade da conexão de internet e ver a
qualidade **prevista** para um horário antes de realizar uma atividade. Interface 100% em português do Brasil.

## ⚠️ Estado atual (leia primeiro)

- **Modo demonstração.** A API real (Internet Quality API) só é usada se a variável abaixo for definida. Sem `EXPO_PUBLIC_API_URL`, o app usa dados
  **determinísticos de exemplo** (`src/fixtures/demo.ts`). Eles **não** são medições nem previsões de um modelo, e a
  interface avisa isso em cada tela com dados.
- Com `EXPO_PUBLIC_API_URL` definida, o app consome a Internet Quality API conforme `docs/API.md` (contrato real v0.2.0). Nesse modo ele só mostra latência e perda de pacotes **previstas**, e o usuário escolhe modelo e ponto de referência na primeira vez.
  Em caso de falha, mostra erro em linguagem simples — nunca troca por dados falsos.
- Notificações **não** estão implementadas; a tela de Configurações informa isso honestamente.
- Não é "pronto para produção": falta teste com a API real em aparelho, teste em dispositivos/leitores de tela e auditoria de acessibilidade.

## Telas (protótipo de 9 telas)
Splash · Início · Seleção de horário/período · Detalhes da previsão · Previsão por atividade · Histórico ·
Configurações · Acessibilidade · Legenda e glossário (+ "Sobre", adicionada por exigir um destino real no menu).

## Requisitos
- Node.js 20 ou superior (testado com 22) e npm
- Para celular: app **Expo Go** (Android/iOS) na mesma rede Wi‑Fi, ou emulador

## Instalação e execução no Windows
```powershell
# 1) Instale o Node.js LTS em https://nodejs.org (marque a opção de adicionar ao PATH)
node -v
npm -v

# 2) Na pasta do projeto
npm install
npx expo start
```
- **Android (celular):** instale o Expo Go e leia o QR Code do terminal.
- **Android (emulador):** instale o Android Studio + um AVD, deixe-o aberto e pressione `a` no terminal.
- **iOS:** o simulador exige macOS. No Windows, use o Expo Go em um iPhone (QR Code) — ou gere um build na nuvem (abaixo).
- Se o celular não conectar na rede local: `npx expo start --tunnel`.
- Se o PowerShell bloquear scripts: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Variáveis de ambiente
Copie `.env.example` para `.env`:

| Variável | Descrição |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL base da API de previsão. Vazia = modo demonstração. **É pública** (vai no pacote do app): nunca coloque segredos. |

## Verificações
```powershell
npm test            # Jest (domínio, API, escolha de modelo/ponto, fluxos de tela, preferências)
npm run typecheck   # TypeScript estrito
npx expo export --platform android   # valida o bundle (também: --platform ios)
```

## Development build (quando o Expo Go não bastar)
```powershell
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform android   # ou ios (requer conta Apple Developer)
```

## Arquitetura
```
app/                 rotas (Expo Router): splash, abas, previsão, detalhes, acessibilidade, legenda, sobre
src/domain/          regras puras: qualidade, atividades (regras configuráveis), histórico ponderado, tempo
src/services/        ConnectivityService → serviço de API (timeout, cancelamento, validação) e serviço demo
src/state/           preferências (persistidas), seleção, relógio injetável, useAsync (ignora respostas obsoletas)
src/components/      componentes acessíveis (alvo ≥ 48 dp, qualidade sempre com texto + ícone + cor)
src/theme/           tokens e paletas (padrão e alto contraste)
```
Decisões: Context em vez de bibliotecas de estado (app pequeno); validação manual em vez de dependência extra;
gráfico com `react-native-svg` + alternativa em texto; relógio e serviço injetáveis para testes determinísticos.

## Premissas e decisões (não vêm do documento de requisitos)
- **Limiares de qualidade e de atividades são ASSUMIDOS**, não validados cientificamente (`src/domain/quality.ts`,
  `activities.ts`). Quando a API informar a classe/atividades, elas têm prioridade. Apps, codecs, servidores e
  aparelhos diferentes mudam a adequação real de uma conexão.
- Saudação "Olá!" sem nome (o protótipo mostra um nome; o app não tem cadastro nem coleta dados pessoais).
- "Últimos dias" = 3 dias; histórico de 7 dias usa o mesmo conjunto de dados.
- Seleção por período usa o primeiro horário ainda disponível dentro do período; horários passados não são oferecidos.
- IDs de pacote `br.edu.conectamais` são provisórios.
- Sem ESLint configurado nesta entrega.

## Privacidade
Sem cadastro, sem rastreamento, sem SDKs de análise/publicidade, sem permissões especiais. Só as preferências de
acessibilidade são salvas, localmente no aparelho.

Documentos: `docs/API.md` (contrato real) · `docs/RASTREABILIDADE.md` (requisitos × código × testes).
