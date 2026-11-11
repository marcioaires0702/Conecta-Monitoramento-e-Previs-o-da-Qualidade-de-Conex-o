import { sanitizeChoice } from '../src/state/sourceChoice';

describe('escolha de modelo e ponto salva no aparelho', () => {
  const ok = { modelId: 'model-a', modelName: 'Modelo A', probeId: 900001, countryCode: 'BR', latitude: -23.55, longitude: -46.63 };
  it('aceita um objeto completo e descarta campos extras', () => {
    expect(sanitizeChoice({ ...ok, extra: 'x' })).toEqual(ok);
  });
  it.each([[null], ['texto'], [{}], [{ ...ok, probeId: '900001' }], [{ ...ok, latitude: undefined }]])('rejeita dados inválidos %#', (v) => {
    expect(sanitizeChoice(v)).toBeNull();
  });
});
