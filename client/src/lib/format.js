const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });

export function rupiah(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Rp 0';
  return currencyFormatter.format(number);
}

export function compactRupiah(value) {
  const number = Number(value) || 0;
  const abs = Math.abs(number);
  if (abs >= 1_000_000_000_000) return `Rp ${decimalFormatter.format(number / 1_000_000_000_000)} T`;
  if (abs >= 1_000_000_000) return `Rp ${decimalFormatter.format(number / 1_000_000_000)} M`;
  if (abs >= 1_000_000) return `Rp ${decimalFormatter.format(number / 1_000_000)} jt`;
  if (abs >= 1_000) return `Rp ${decimalFormatter.format(number / 1_000)} rb`;
  return rupiah(number);
}

export function number(value, digits = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '0';
  return digits === 0 ? numberFormatter.format(parsed) : new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: digits,
  }).format(parsed);
}

export function percent(value, digits = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '0%';
  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: digits }).format(parsed)}%`;
}

export function formatDate(value) {
  if (!value) return '—';
  let date;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = value instanceof Date ? value : new Date(value);
  }
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateInput(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayLabel() {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

export function initials(email = '') {
  const name = email.split('@')[0] || 'A';
  return name.slice(0, 2).toUpperCase();
}
