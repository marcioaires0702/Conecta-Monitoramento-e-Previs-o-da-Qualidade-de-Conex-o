# Integração com a Internet Quality API (contrato real, v0.2.0)

Base de teste (plano gratuito do Render, **dorme após um tempo parado**; a 1ª chamada pode levar ~1 minuto):
`https://internet-quality-api.onrender.com` → defina em `EXPO_PUBLIC_API_URL`.
Documentação interativa: `/docs` · esquema: `/openapi.json`.

A API **não mede nada e não executa modelos**: lê um catálogo (`data/models.json`) e previsões já calculadas
(`predictions.csv`). Isso muda o que o app pode mostrar:

| O protótipo mostrava | O que a API oferece | O que o app faz |
|---|---|---|
| Conexão atual (medida) | Só **previsões** | Card “Previsão mais próxima”, rotulado como previsão |
| Download / Upload | Só `predictedAvgRttMs` (latência) e `predictedPacketLossPct` | Mostra **Latência** e **Perda de pacotes**; download/upload só existem na demonstração |
| Histórico de medições | Só previsões (`timeline`) | Histórico calculado a partir das previsões, com aviso na tela |
| Localização do usuário | Pontos de referência (sondas RIPE Atlas) | Usuário escolhe modelo + ponto; o app avisa que **não** é a localização dele |

## Endpoints usados

| Uso no app | Requisição |
|---|---|
| Lista de modelos (tela “Modelo e ponto”) | `GET /api/v1/models` → `{ items: [{ id, name, description, groupName, algorithm, version }] }` |
| Lista de pontos | `GET /api/v1/locations` → `{ items: [{ probeId, countryCode, asnV4, location: { latitude, longitude } }] }` |
| Previsão mais próxima (Início) | `GET /api/v1/forecasts/probes/{probeId}?model_id=…` → `prediction.{predictionFor, predictedAvgRttMs, predictedPacketLossPct}`, `assessment.{quality, qualityScore}` |
| Previsões de um dia / histórico | `GET /api/v1/forecasts/probes/{probeId}/timeline?model_id=…&from=…&to=…&limit=100` → `items[]` com `predictionFor`, `predictedAvgRttMs`, `predictedPacketLossPct`, `quality`, `qualityScore` |
| Adequação de atividade | `POST /api/v1/activity/check` com `{ modelId, latitude, longitude, dateTime, activity }` → `suitable`, `forecast.quality` |

Não usados (ainda): `/forecasts/nearby` (exigiria permissão de localização), `/forecasts/probes/{id}/compare`,
`/models/{id}`, `/health`, `recommendation`, `modelConfidence`.

## Decisões de implementação

- **Classes**: `GOOD`→Boa, `MODERATE`→Regular, `UNSTABLE`→Instável. São regras experimentais da API, não do RIPE Atlas.
- **Sem previsões para hoje**: a API devolve a “mais recente” se tudo é passado. O app usa o dia dessa previsão e mostra a data (não escreve “Hoje”).
- **Histórico**: uma requisição por dia (o `limit` máximo é 100 por consulta). Cada previsão vira um intervalo que vale até a próxima (máx. 6 h); os percentuais continuam ponderados pela duração.
- **404** = sem dados (`sem-dados`); outros HTTP ≥ 400 = `servidor`. Resposta fora do contrato = `resposta-invalida`. O app nunca cai para dados de demonstração em caso de erro.
- **Timeout**: 60 s, por causa do “despertar” do servidor gratuito. A tela de carregamento avisa.
- **Atividades**: ver abaixo.

## Atividades — pendência

O schema `ActivityType` do campo `activity` estava recolhido na documentação enviada; só **`VIDEO_CALL`** apareceu
(no exemplo). Por isso:

- `Videoconferência` → avaliada pela API (`VIDEO_CALL`). Inadequada = Instável; adequada herda a classe prevista.
- Streaming, Jogos, Navegação e Envio → **estimativa local** a partir de latência e perda de pacotes
  (`API_ACTIVITY_RULES` em `src/domain/activities.ts`, valores assumidos, sem validação científica). A tela diz isso.

Para ligar as demais à API, preencha `ACTIVITY_API_VALUE` em `src/domain/activities.ts` com os valores do enum
(abra `/openapi.json` e procure `"ActivityType"`). Não adivinhe os nomes: valor fora do enum gera erro 422.

## Privacidade

As coordenadas das sondas são públicas e protegidas pelo RIPE Atlas; **não** representam o usuário. O app guarda no
aparelho só a escolha (modelo + ponto) e não pede permissão de localização.
