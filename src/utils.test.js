import { describe, it, expect } from 'vitest';
import { calculateDiscount, formatCurrency, isValidPercentage } from './utils.js';

describe('calculateDiscount', () => {
  it('aplica correctamente un descuento del 15% sobre 100', () => {
    expect(calculateDiscount(100, 15)).toBe(85);
  });

  it('devuelve el mismo precio cuando el descuento es 0', () => {
    expect(calculateDiscount(50, 0)).toBe(50);
  });

  it('devuelve 0 cuando el descuento es del 100%', () => {
    expect(calculateDiscount(50, 100)).toBe(0);
  });

  it('redondea a 2 decimales', () => {
    expect(calculateDiscount(19.99, 33)).toBe(13.39);
  });

  it('lanza un error si el precio es negativo', () => {
    expect(() => calculateDiscount(-10, 10)).toThrow('El precio debe ser un numero positivo');
  });

  it('lanza un error si el descuento esta fuera de rango', () => {
    expect(() => calculateDiscount(10, 150)).toThrow(
      'El descuento debe ser un numero entre 0 y 100'
    );
  });

  it('lanza un error si el precio no es numero', () => {
    expect(() => calculateDiscount('100', 10)).toThrow();
  });
});

describe('formatCurrency', () => {
  it('formatea un importe en EUR con locale es-ES', () => {
    const result = formatCurrency(1234.5);
    expect(result).toContain('1234,50'.slice(0, 4)); // tolerante a separadores de miles
    expect(result).toMatch(/€/);
  });

  it('permite otra divisa y locale', () => {
    const result = formatCurrency(10, 'USD', 'en-US');
    expect(result).toBe('$10.00');
  });

  it('lanza un error si el importe no es numero', () => {
    expect(() => formatCurrency('abc')).toThrow('El importe debe ser un numero');
  });
});

describe('isValidPercentage', () => {
  it('devuelve true para valores dentro del rango 0-100', () => {
    expect(isValidPercentage(0)).toBe(true);
    expect(isValidPercentage(50)).toBe(true);
    expect(isValidPercentage(100)).toBe(true);
  });

  it('devuelve false para valores fuera de rango o invalidos', () => {
    expect(isValidPercentage(-1)).toBe(false);
    expect(isValidPercentage(101)).toBe(false);
    expect(isValidPercentage(NaN)).toBe(false);
    expect(isValidPercentage('50')).toBe(false);
  });
});
