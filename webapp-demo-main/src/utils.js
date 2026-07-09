/**
 * Calcula el precio final aplicando un descuento porcentual.
 * @param {number} price - Precio original (>= 0).
 * @param {number} discountPercentage - Descuento en porcentaje (0-100).
 * @returns {number} Precio final redondeado a 2 decimales.
 */
export function calculateDiscount(price, discountPercentage) {
  if (typeof price !== 'number' || Number.isNaN(price) || price < 0) {
    throw new Error('El precio debe ser un numero positivo');
  }
  if (
    typeof discountPercentage !== 'number' ||
    Number.isNaN(discountPercentage) ||
    discountPercentage < 0 ||
    discountPercentage > 100
  ) {
    throw new Error('El descuento debe ser un numero entre 0 y 100');
  }

  const finalPrice = price - (price * discountPercentage) / 100;
  return Math.round(finalPrice * 100) / 100;
}

/**
 * Formatea un numero como moneda.
 * @param {number} amount
 * @param {string} currency - Codigo ISO 4217, por defecto EUR.
 * @param {string} locale - Locale para el formato, por defecto es-ES.
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'EUR', locale = 'es-ES') {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    throw new Error('El importe debe ser un numero');
  }
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

/**
 * Valida que un porcentaje de descuento este en un rango aceptable.
 * @param {number} value
 * @returns {boolean}
 */
export function isValidPercentage(value) {
  return typeof value === 'number' && !Number.isNaN(value) && value >= 0 && value <= 100;
}
