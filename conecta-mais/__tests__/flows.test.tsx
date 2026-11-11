import { fireEvent, screen, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIXED_NOW, renderApp, TEST_CHOICE } from './helpers/harness';
import { CHOICE_KEY } from '../src/state/sourceChoice';
import { ApiError } from '../src/services/errors';
import { createDemoService } from '../src/services/demoService';
import type { ConnectivityService } from '../src/services';

const failing: ConnectivityService = {
  kind: 'demo',
  getModels: () => Promise.reject(new ApiError('rede', 'x')),
  getProbes: () => Promise.reject(new ApiError('rede', 'x')),
  getCurrent: () => Promise.reject(new ApiError('rede', 'x')),
  getForecasts: () => Promise.reject(new ApiError('servidor', 'x')),
  getHistory: () => Promise.reject(new ApiError('rede', 'x')),
};

describe('Início', () => {
  it('mostra qualidade em texto, métricas e rotula demonstração', async () => {
    renderApp('/(tabs)');
    expect(screen.getAllByTestId('estado-carregando').length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getAllByTestId('fonte-aviso').length).toBeGreaterThan(0));
    expect(screen.getByLabelText('Conexão atual: Boa')).toBeTruthy();
    expect(screen.getByLabelText(/Latência: 18 milissegundos/)).toBeTruthy();
    expect(screen.getByLabelText(/Download: 87/)).toBeTruthy();
    expect(screen.getAllByLabelText(/Modo demonstração/).length).toBeGreaterThan(0);
    expect(screen.getByText('Valores de exemplo (demonstração).')).toBeTruthy();
  });

  it('rotula dados da API como tal, sem aviso de demonstração', async () => {
    const live: ConnectivityService = {
      ...createDemoService(FIXED_NOW),
      getCurrent: async () => ({ source: 'api', data: { latencyMs: 30, downloadMbps: 20, uploadMbps: 8, quality: 'regular', measuredAt: FIXED_NOW().toISOString() } }),
      getForecasts: async (d) => ({ source: 'api', data: (await createDemoService(FIXED_NOW).getForecasts(d, null)).data }),
    };
    renderApp('/(tabs)', live);
    await waitFor(() => expect(screen.getByLabelText('Conexão atual: Regular')).toBeTruthy());
    expect(screen.queryByTestId('fonte-aviso')).toBeNull();
    expect(screen.getAllByTestId('fonte-api').length).toBeGreaterThan(0);
  });

  it('exibe erro em linguagem simples e permite tentar de novo', async () => {
    renderApp('/(tabs)', failing);
    await waitFor(() => expect(screen.getAllByTestId('estado-erro').length).toBeGreaterThan(0));
    expect(screen.getAllByText(/Verifique sua internet|indisponível/).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Tentar novamente').length).toBeGreaterThan(0);
  });
});

describe('Seleção → Detalhes (horário mantido na navegação)', () => {
  it('só oferece horários a partir de agora e abre os detalhes do horário escolhido', async () => {
    renderApp('/previsao');
    await waitFor(() => expect(screen.getByLabelText(/^Agora \(09:00\)/)).toBeTruthy());
    expect(screen.queryByLabelText(/^08:00/)).toBeNull(); // horário passado não é oferecido
    const verPrevisao = screen.getByLabelText('Ver previsão');
    expect(verPrevisao.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(screen.getByLabelText(/^15:00/));
    expect(screen.getByLabelText(/^15:00/).props.accessibilityState.selected).toBe(true);
    fireEvent.press(screen.getByLabelText('Ver previsão'));

    await waitFor(() => expect(screen.getByTestId('detalhe-hora')).toBeTruthy());
    expect(screen.getByTestId('detalhe-hora').props.children).toBe('15:00');
    expect(screen.getByLabelText('Qualidade prevista: Regular')).toBeTruthy();
    expect(screen.getByText('Valores previstos (não são medições)')).toBeTruthy();
    expect(screen.getByText('Atividades recomendadas')).toBeTruthy();
  });

  it('atualiza os detalhes ao trocar o horário dentro do período', async () => {
    renderApp('/previsao');
    await waitFor(() => screen.getByLabelText(/^15:00/));
    fireEvent.press(screen.getByLabelText(/^15:00/));
    fireEvent.press(screen.getByLabelText('Ver previsão'));
    await waitFor(() => screen.getByTestId('detalhe-hora'));
    fireEvent.press(screen.getByLabelText('17:00, Regular'));
    await waitFor(() => expect(screen.getByTestId('detalhe-hora').props.children).toBe('17:00'));
  });

  it('seleciona por período e usa o primeiro horário disponível', async () => {
    renderApp('/previsao');
    await waitFor(() => screen.getByLabelText(/^15:00/));
    fireEvent.press(screen.getByLabelText('Período'));
    expect(screen.getByLabelText(/^Madrugada.*já passou/).props.accessibilityState.disabled).toBe(true);
    fireEvent.press(screen.getByLabelText(/^Tarde/));
    fireEvent.press(screen.getByLabelText('Ver previsão'));
    await waitFor(() => expect(screen.getByTestId('detalhe-hora').props.children).toBe('12:00'));
  });

  it('detalhes sem horário escolhido mostram estado vazio honesto', async () => {
    renderApp('/detalhes');
    await waitFor(() => expect(screen.getByTestId('estado-vazio')).toBeTruthy());
  });
});

describe('Previsão por atividade', () => {
  it('troca atividade e horário sem sair da tela', async () => {
    renderApp('/(tabs)/atividades');
    await waitFor(() => expect(screen.getByTestId('resultado-atividade')).toBeTruthy());
    expect(screen.getByText(/Previsão para Videoconferência às 09:00/)).toBeTruthy();

    fireEvent.press(screen.getByLabelText(/^Jogos online/));
    expect(screen.getByText(/Previsão para Jogos online às 09:00/)).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Horário 21:00'));
    expect(screen.getByText(/Previsão para Jogos online às 21:00/)).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Ver outra atividade'));
    expect(screen.getByText(/Previsão para Navegação às 21:00/)).toBeTruthy();
  });
});

describe('Histórico', () => {
  it('mostra percentuais ponderados, alternativa em texto e alterna período', async () => {
    renderApp('/historico');
    await waitFor(() => expect(screen.getByTestId('resumo-periodo')).toBeTruthy());
    const rotulos = ['Boa', 'Regular', 'Instável'].map((q) => screen.getByLabelText(new RegExp(`^${q}: \\d+ por cento`)).props.accessibilityLabel as string);
    const soma = rotulos.reduce((s, l) => s + Number(/(\d+) por cento/.exec(l)![1]), 0);
    expect(soma).toBe(100);
    expect(screen.getByTestId('grafico-historico').props.accessibilityLabel).toMatch(/Gráfico de qualidade por dia/);
    expect(screen.getByText(/alternativa em texto/)).toBeTruthy();

    const tres = screen.getAllByLabelText(/predominou/).length;
    fireEvent.press(screen.getByLabelText('Últimos 7 dias'));
    expect(screen.getAllByLabelText(/predominou/).length).toBeGreaterThan(tres);
  });

  it('mostra estado vazio quando não há observações', async () => {
    const vazio: ConnectivityService = { ...createDemoService(FIXED_NOW), getHistory: async () => ({ source: 'api', data: [] }) };
    renderApp('/historico', vazio);
    await waitFor(() => expect(screen.getByTestId('estado-vazio')).toBeTruthy());
    expect(screen.queryByTestId('resumo-periodo')).toBeNull();
  });

  it('mostra erro quando a API falha, sem inventar dados', async () => {
    renderApp('/historico', failing);
    await waitFor(() => expect(screen.getByTestId('estado-erro')).toBeTruthy());
    expect(screen.queryByTestId('grafico-historico')).toBeNull();
  });
});

/** Serviço que imita a API real: só latência e perda de pacotes previstas; precisa de modelo + ponto. */
function apiLike(overrides: Partial<ConnectivityService> = {}): ConnectivityService {
  const demo = createDemoService(FIXED_NOW);
  return {
    ...demo,
    kind: 'api',
    getModels: async () => [{ id: 'model-a', name: 'Modelo A', groupName: 'Grupo 1', algorithm: 'Linear Regression' }],
    getProbes: async () => [{ probeId: 900001, countryCode: 'BR', latitude: -23.55, longitude: -46.63 }],
    getCurrent: async () => ({ source: 'api', data: { latencyMs: 70, packetLossPct: 1.5, quality: 'regular', measuredAt: FIXED_NOW().toISOString(), isForecast: true } }),
    getForecasts: async (d) => ({
      source: 'api',
      data: (await demo.getForecasts(d, null)).data.map(({ downloadMbps: _d, uploadMbps: _u, ...f }) => ({ ...f, packetLossPct: 1 })),
    }),
    getHistory: async (days, now) => ({ source: 'api', data: (await demo.getHistory(days, now, null)).data }),
    ...overrides,
  };
}

describe('Modo API', () => {
  beforeEach(() => AsyncStorage.clear());

  it('sem modelo e ponto escolhidos, pede a escolha e não consulta nem fica carregando para sempre', async () => {
    renderApp('/(tabs)', apiLike(), null);
    await waitFor(() => expect(screen.getByTestId('precisa-escolha')).toBeTruthy());
    expect(screen.queryByTestId('estado-carregando')).toBeNull();
    expect(screen.getByLabelText('Ver previsão completa').props.accessibilityState.disabled).toBe(true);
  });

  it('com a escolha feita, mostra previsão (não medição), latência e perda de pacotes, sem download/upload', async () => {
    renderApp('/(tabs)', apiLike(), TEST_CHOICE);
    await waitFor(() => expect(screen.getByLabelText('Previsão mais próxima: Regular')).toBeTruthy());
    expect(screen.getByLabelText(/Latência: 70 milissegundos/)).toBeTruthy();
    expect(screen.getByLabelText(/Perda de pacotes: 1,5 por cento/)).toBeTruthy();
    expect(screen.queryByLabelText(/Download/)).toBeNull();
    expect(screen.queryByLabelText(/Upload/)).toBeNull();
    expect(screen.queryByTestId('fonte-aviso')).toBeNull();
    expect(screen.getAllByTestId('fonte-referencia')[0].props.children).toMatch(/Modelo A.*nº 900001.*Não é uma medição do seu aparelho/);
  });

  it('avisa que o histórico vem de previsões', async () => {
    renderApp('/historico', apiLike(), TEST_CHOICE);
    await waitFor(() => expect(screen.getByTestId('nota-historico')).toBeTruthy());
  });

  it('previsão por atividade: usa a API onde há valor de enum e identifica a estimativa local nas demais', async () => {
    const checkActivity = jest.fn(async () => ({ suitable: false, quality: 'regular' as const }));
    renderApp('/(tabs)/atividades', apiLike({ checkActivity }), TEST_CHOICE);
    await waitFor(() => expect(screen.getByText('Avaliação feita pelo serviço de previsões.')).toBeTruthy());
    expect(screen.getAllByText('Não recomendada neste horário (avaliação do serviço).').length).toBeGreaterThan(0);
    expect(checkActivity).toHaveBeenCalledTimes(1); // só a atividade com valor de enum conhecido

    fireEvent.press(screen.getByLabelText(/^Streaming/));
    expect(screen.getByText(/Estimativa do aplicativo/)).toBeTruthy();
  });

  it('se a verificação da API falhar, mantém a estimativa local (identificada) em vez de esconder a atividade', async () => {
    const checkActivity = jest.fn(async () => {
      throw new ApiError('servidor', 'x');
    });
    renderApp('/(tabs)/atividades', apiLike({ checkActivity }), TEST_CHOICE);
    await waitFor(() => expect(screen.getByTestId('resultado-atividade')).toBeTruthy());
    await waitFor(() => expect(checkActivity).toHaveBeenCalled());
    expect(screen.getByText(/Estimativa do aplicativo/)).toBeTruthy();
  });

  it('tela de escolha: seleciona modelo e ponto e salva no aparelho', async () => {
    renderApp('/fonte', apiLike(), null);
    await waitFor(() => screen.getByLabelText(/^Modelo A/));
    expect(screen.getByLabelText('Salvar escolha').props.accessibilityState.disabled).toBe(true);
    fireEvent.press(screen.getByLabelText(/^Modelo A/));
    fireEvent.press(screen.getByLabelText(/^Ponto nº 900001/));
    expect(screen.getByLabelText('Salvar escolha').props.accessibilityState.disabled).toBe(false);
    fireEvent.press(screen.getByLabelText('Salvar escolha'));
    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith(CHOICE_KEY, expect.any(String)));
    const saved = JSON.parse((await AsyncStorage.getItem(CHOICE_KEY)) ?? 'null');
    expect(saved).toMatchObject({ modelId: 'model-a', probeId: 900001, countryCode: 'BR' });
  });

  it('tela de escolha: erro de rede aparece em linguagem simples', async () => {
    renderApp('/fonte', apiLike({ getModels: () => Promise.reject(new ApiError('rede', 'x')) }), null);
    await waitFor(() => expect(screen.getAllByTestId('estado-erro').length).toBeGreaterThan(0));
  });
});
