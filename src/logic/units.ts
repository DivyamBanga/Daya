export const kgToLb = (kg: number) => kg * 2.2046226
export const lbToKg = (lb: number) => lb / 2.2046226
export const cToF = (c: number) => c * 1.8 + 32
export const fToC = (f: number) => (f - 32) / 1.8

export function fmtWeight(kg: number, unit: 'kg' | 'lb'): string {
  return unit === 'kg' ? `${kg.toFixed(1)} kg` : `${kgToLb(kg).toFixed(1)} lb`
}

export function fmtTemp(c: number, unit: 'c' | 'f'): string {
  return unit === 'c' ? `${c.toFixed(2)} °C` : `${cToF(c).toFixed(2)} °F`
}
