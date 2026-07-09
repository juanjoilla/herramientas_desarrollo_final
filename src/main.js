import { calculateDiscount, formatCurrency } from './utils.js';
import './style.css';

function setupCalculator() {
  const priceInput = document.getElementById('price');
  const discountInput = document.getElementById('discount');
  const button = document.getElementById('calc-btn');
  const result = document.getElementById('result');

  if (!priceInput || !discountInput || !button || !result) {
    return;
  }

  button.addEventListener('click', () => {
    try {
      const price = parseFloat(priceInput.value);
      const discount = parseFloat(discountInput.value);
      const finalPrice = calculateDiscount(price, discount);
      result.textContent = `Precio final: ${formatCurrency(finalPrice)}`;
      result.style.color = '#4ade80';
    } catch (error) {
      result.textContent = `Error: ${error.message}`;
      result.style.color = '#f87171';
    }
  });
}

function setBuildInfo() {
  const el = document.getElementById('build-info');
  if (el) {
    el.textContent = `Build: ${new Date().toISOString()}`;
  }
}

setupCalculator();
setBuildInfo();
