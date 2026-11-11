# Matriz de rastreabilidade de requisitos

Status: ✅ implementado e testado automaticamente · 🟡 implementado, verificação manual/dispositivo pendente · ⛔ depende de recurso externo

| Req. | Implementação | Testes | Status |
|---|---|---|---|
| RQ01 Condição atual | `app/(tabs)/index.tsx`, `src/services/*` | `flows.test.tsx` (Início, Modo API) | ✅ demo · na API real é “previsão mais próxima” (a API não mede) |
| RQ02 Previsão do dia | `useDayForecasts.ts`, Início (chips) | `flows.test.tsx` | ✅ demo · ⛔ modelo real |
| RQ03 Selecionar horário/período | `app/previsao.tsx` | `flows.test.tsx` (Seleção) | ✅ |
| RQ04 Detalhes da previsão | `app/detalhes.tsx` | `flows.test.tsx` | ✅ |
| RQ05 Atividades adequadas | `src/domain/activities.ts`, `detalhes.tsx` | `domain.test.ts`, `flows.test.tsx` | ✅ (limiares assumidos) |
| RQ06 Previsão por atividade | `app/(tabs)/atividades.tsx` | `flows.test.tsx` | ✅ |
| RQ07 Histórico e % por categoria | `app/(tabs)/historico.tsx`, `src/domain/history.ts` | `domain.test.ts`, `flows.test.tsx` | ✅ demo |
| RQ08 Legenda e glossário | `app/legenda.tsx`, `src/domain/quality.ts` | `domain.test.ts` | ✅ |
| RQ09 Acessibilidade configurável | `app/acessibilidade.tsx`, `src/state/preferences.tsx` | `preferences.test.tsx` | ✅ (leitor de tela: ver RNF02) |
| RQ10 Integração com a API | `src/services/apiService.ts`, `validation.ts`, `app/fonte.tsx`, `docs/API.md` | `api.test.ts`, `sourceChoice.test.ts`, `flows.test.tsx` (Modo API) | ✅ cliente no contrato real · 🟡 não testado contra o servidor real · ⛔ enum `ActivityType` (só `VIDEO_CALL` confirmado) |
| RNF01 ABNT NBR 17060 / WCAG 2.2 AA | tokens em `src/theme`, componentes | — | 🟡 sem auditoria formal |
| RNF02 TalkBack/VoiceOver | roles/labels/estados em todos os controles | consultas por rótulo nos testes | 🟡 teste em dispositivo pendente |
| RNF03 Nunca só cor | `QualityBadge` (texto+ícone+cor) | `flows.test.tsx` | ✅ |
| RNF04 Contraste | paletas padrão e alto contraste | — | 🟡 cores escolhidas para ≥ 4,5:1; sem medição automatizada |
| RNF05 Fonte do sistema | `allowFontScaling` padrão do RN + escala do app | `preferences.test.tsx` | 🟡 layout com fonte grande sem teste visual |
| RNF06 Sem gestos complexos | só toques simples | — | ✅ (revisão) |
| RNF07 Linguagem simples/termos | `MetricTile`, legenda | `flows.test.tsx` | ✅ |
| RNF08 Foco e ordem | foco no título (`Screen`), anúncio em Detalhes | — | 🟡 verificar em leitor de tela |
| RNF09 Alvo ≥ 48 dp | `MIN_TOUCH` em botões/linhas/abas | — | ✅ (revisão de código) |
| RNF10 Sem rastreio/dados pessoais | sem SDKs de análise; só preferências locais | — | ✅ |
| RNF11 RN + Expo, Android/iOS | Expo SDK 57 | export Android e iOS | ✅ bundle · 🟡 execução em dispositivo |
| RNF12 Carregando/erros | `StateView`, `useAsync`, `errors.ts` | `flows.test.tsx`, `api.test.ts` | ✅ |
