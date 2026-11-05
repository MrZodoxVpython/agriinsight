export const COMMODITIES = [
  'Cabai',
  'Padi',
  'Jagung',
  'Tomat',
  'Bawang merah',
  'Kentang',
  'Sayuran',
  'Lainnya',
];

export const PLAN_STATUSES = [
  { value: 'planned', label: 'Direncanakan', tone: 'neutral' },
  { value: 'planting', label: 'Masa tanam', tone: 'info' },
  { value: 'harvest', label: 'Menuju panen', tone: 'warning' },
  { value: 'completed', label: 'Selesai', tone: 'success' },
];

export function statusMeta(value) {
  return PLAN_STATUSES.find((status) => status.value === value) || PLAN_STATUSES[0];
}

export function planMetrics(plan) {
  const area = Number(plan?.planted_area_ha) || 0;
  const yieldKg = Number(plan?.estimated_yield_kg) || 0;
  const cost = Number(plan?.production_cost) || 0;
  const price = Number(plan?.expected_price) || 0;
  const revenue = yieldKg * price;
  const margin = revenue - cost;
  return {
    area,
    yieldKg,
    cost,
    price,
    revenue,
    margin,
    marginPercent: revenue > 0 ? (margin / revenue) * 100 : 0,
    roiPercent: cost > 0 ? (margin / cost) * 100 : null,
    breakEvenPrice: yieldKg > 0 ? cost / yieldKg : 0,
    yieldPerHa: area > 0 ? yieldKg / area : 0,
    marginPerKg: yieldKg > 0 ? margin / yieldKg : 0,
  };
}

export function planQuality(plan) {
  const checks = [
    ['Lokasi lahan', Boolean(plan?.location)],
    ['Luas lahan', Boolean(plan?.planted_area_ha)],
    ['Tanggal tanam', Boolean(plan?.planting_date)],
    ['Estimasi panen', Boolean(plan?.expected_harvest_date)],
    ['Estimasi hasil', Boolean(plan?.estimated_yield_kg)],
    ['Biaya produksi', plan?.production_cost !== null && plan?.production_cost !== undefined],
    ['Target harga', Boolean(plan?.expected_price)],
    ['Status rencana', Boolean(plan?.status)],
  ];
  const missing = checks.filter(([, ok]) => !ok).map(([label]) => label);
  return { score: Math.round(((checks.length - missing.length) / checks.length) * 100), missing };
}

export function exportPlansToCsv(plans) {
  const headers = [
    'Komoditas',
    'Status',
    'Lokasi',
    'Luas (ha)',
    'Tanggal tanam',
    'Estimasi panen',
    'Estimasi hasil (kg)',
    'Biaya produksi (Rp)',
    'Target harga (Rp/kg)',
    'Estimasi omzet (Rp)',
    'Estimasi margin (Rp)',
    'Harga impas (Rp/kg)',
  ];

  const rows = plans.map((plan) => {
    const metrics = planMetrics(plan);
    return [
      plan.commodity,
      statusMeta(plan.status).label,
      plan.location,
      metrics.area,
      plan.planting_date ? String(plan.planting_date).slice(0, 10) : '',
      plan.expected_harvest_date ? String(plan.expected_harvest_date).slice(0, 10) : '',
      metrics.yieldKg,
      metrics.cost,
      metrics.price,
      metrics.revenue,
      metrics.margin,
      metrics.breakEvenPrice,
    ];
  });

  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rencana-tanam-agriinsight-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
