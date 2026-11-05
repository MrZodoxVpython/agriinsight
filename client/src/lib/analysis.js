const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const safeDiv = (numerator, denominator) => (denominator > 0 ? numerator / denominator : 0);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const sumBy = (rows, key) => rows.reduce((total, row) => total + num(row[key]), 0);

const PERCENT_FORMAT = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });
const percentText = (value) => `${PERCENT_FORMAT.format(value)}%`;

export const ANALYSIS_SCOPES = [
  { value: 'all', label: 'Semua' },
  { value: 'active', label: 'Berjalan' },
  { value: 'completed', label: 'Selesai' },
];

export const SCENARIO_DEFINITIONS = [
  {
    key: 'pessimistic',
    label: 'Pesimis',
    description: 'Harga −10%, hasil −10%, biaya +10%',
    priceFactor: 0.9,
    yieldFactor: 0.9,
    costFactor: 1.1,
    tone: 'danger',
  },
  {
    key: 'base',
    label: 'Realistis',
    description: 'Sesuai input saat ini',
    priceFactor: 1,
    yieldFactor: 1,
    costFactor: 1,
    tone: 'neutral',
  },
  {
    key: 'optimistic',
    label: 'Optimis',
    description: 'Harga +10%, hasil +5%, biaya −5%',
    priceFactor: 1.1,
    yieldFactor: 1.05,
    costFactor: 0.95,
    tone: 'success',
  },
];

const PRICE_STEPS = [-0.2, -0.1, 0, 0.1, 0.2];
const COST_STEPS = [-0.1, 0, 0.1, 0.2];
const YIELD_STEPS = [-0.2, -0.1, 0, 0.1, 0.2];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function monthKey(plan) {
  const raw = plan.expected_harvest_date || plan.planting_date || plan.created_at;
  if (!raw) return null;
  const value = String(raw);
  if (/^\d{4}-\d{2}/.test(value)) return value.slice(0, 7);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [year, month] = key.split('-');
  return `${MONTH_LABELS[Number(month) - 1] || month} ${year}`;
}

function stepLabel(step) {
  if (step === 0) return 'Saat ini';
  return `${step > 0 ? '+' : ''}${Math.round(step * 100)}%`;
}

export function riskFor(metrics) {
  const safety = num(metrics.safetyMarginPercent);
  const breakEvenYield = num(metrics.breakEvenYieldPercent);
  const costRatio = num(metrics.costRatioPercent);

  const priceRisk = clamp(100 - (safety / 25) * 100, 0, 100);
  const yieldRisk = clamp(((breakEvenYield - 40) / 50) * 100, 0, 100);
  const costRisk = clamp(((costRatio - 50) / 40) * 100, 0, 100);

  const score = Math.round(
    clamp(priceRisk * 0.45 + yieldRisk * 0.3 + costRisk * 0.25, 0, 100)
  );

  let level = 'Rendah';
  let tone = 'low';
  if (score >= 65) {
    level = 'Tinggi';
    tone = 'high';
  } else if (score >= 35) {
    level = 'Sedang';
    tone = 'medium';
  }

  const drivers = [
    {
      key: 'price',
      label: 'Bantalan harga tipis',
      score: priceRisk,
      text: `Harga hanya ${percentText(safety)} di atas titik impas.`,
    },
    {
      key: 'yield',
      label: 'Titik impas hasil tinggi',
      score: yieldRisk,
      text: `Butuh ${percentText(breakEvenYield)} dari estimasi hasil untuk menutup biaya.`,
    },
    {
      key: 'cost',
      label: 'Rasio biaya tinggi',
      score: costRisk,
      text: `Biaya menyerap ${percentText(costRatio)} dari omzet.`,
    },
  ]
    .filter((driver) => driver.score >= 20)
    .sort((a, b) => b.score - a.score);

  return { score, level, tone, drivers };
}

export function planEconomics(plan) {
  const area = num(plan.planted_area_ha);
  const yieldKg = num(plan.estimated_yield_kg);
  const cost = num(plan.production_cost);
  const price = num(plan.expected_price);

  const revenue = yieldKg * price;
  const margin = revenue - cost;
  const averagePrice = safeDiv(revenue, yieldKg);
  const breakEvenPrice = safeDiv(cost, yieldKg);
  const breakEvenYieldKg = safeDiv(cost, price);
  const breakEvenYieldPercent = safeDiv(breakEvenYieldKg, yieldKg) * 100;
  const safetyMarginPercent = averagePrice > 0 ? ((averagePrice - breakEvenPrice) / averagePrice) * 100 : 0;
  const costRatioPercent = safeDiv(cost, revenue) * 100;
  const marginPercent = safeDiv(margin, revenue) * 100;
  const roiPercent = cost > 0 ? (margin / cost) * 100 : null;

  const metrics = {
    id: plan.id,
    commodity: plan.commodity,
    location: plan.location,
    status: plan.status,
    planting_date: plan.planting_date,
    expected_harvest_date: plan.expected_harvest_date,
    created_at: plan.created_at,
    area,
    yieldKg,
    cost,
    price,
    averagePrice,
    revenue,
    margin,
    marginPercent,
    roiPercent,
    breakEvenPrice,
    breakEvenYieldKg,
    breakEvenYieldPercent,
    safetyMarginPercent,
    costRatioPercent,
    costPerKg: safeDiv(cost, yieldKg),
    marginPerKg: safeDiv(margin, yieldKg),
    yieldPerHa: safeDiv(yieldKg, area),
    revenuePerHa: safeDiv(revenue, area),
    costPerHa: safeDiv(cost, area),
    marginPerHa: safeDiv(margin, area),
    yieldDropTolerancePercent: marginPercent,
    costIncreaseTolerancePercent: roiPercent,
    priceDropTolerancePercent: safetyMarginPercent,
  };

  return { ...metrics, risk: riskFor(metrics) };
}

function summarize(rows) {
  const planCount = rows.length;
  const area = sumBy(rows, 'area');
  const yieldKg = sumBy(rows, 'yieldKg');
  const revenue = sumBy(rows, 'revenue');
  const cost = sumBy(rows, 'cost');
  const margin = revenue - cost;
  const averagePrice = safeDiv(revenue, yieldKg);
  const breakEvenPrice = safeDiv(cost, yieldKg);
  const breakEvenYieldKg = averagePrice > 0 ? cost / averagePrice : 0;
  const breakEvenYieldPercent = safeDiv(breakEvenYieldKg, yieldKg) * 100;
  const safetyMarginPercent = averagePrice > 0 ? ((averagePrice - breakEvenPrice) / averagePrice) * 100 : 0;
  const costRatioPercent = safeDiv(cost, revenue) * 100;
  const marginPercent = safeDiv(margin, revenue) * 100;
  const roiPercent = cost > 0 ? (margin / cost) * 100 : null;

  const metrics = {
    planCount,
    area,
    yieldKg,
    cost,
    revenue,
    margin,
    averagePrice,
    marginPercent,
    roiPercent,
    breakEvenPrice,
    breakEvenYieldKg,
    breakEvenYieldPercent,
    safetyMarginPercent,
    costRatioPercent,
    costPerKg: safeDiv(cost, yieldKg),
    marginPerKg: safeDiv(margin, yieldKg),
    yieldPerHa: safeDiv(yieldKg, area),
    revenuePerHa: safeDiv(revenue, area),
    costPerHa: safeDiv(cost, area),
    marginPerHa: safeDiv(margin, area),
    yieldDropTolerancePercent: marginPercent,
    costIncreaseTolerancePercent: roiPercent,
    priceDropTolerancePercent: safetyMarginPercent,
    activeCount: rows.filter((row) => row.status !== 'completed').length,
    completedCount: rows.filter((row) => row.status === 'completed').length,
  };

  return { ...metrics, risk: riskFor(metrics) };
}

function buildScenarios(totals) {
  return SCENARIO_DEFINITIONS.map((definition) => {
    const revenue = totals.revenue * definition.priceFactor * definition.yieldFactor;
    const cost = totals.cost * definition.costFactor;
    const margin = revenue - cost;
    return {
      ...definition,
      revenue,
      cost,
      margin,
      marginPercent: safeDiv(margin, revenue) * 100,
      roiPercent: cost > 0 ? (margin / cost) * 100 : null,
      profitable: margin >= 0,
    };
  });
}

function buildSensitivity(totals) {
  return {
    price: PRICE_STEPS.map((step) => {
      const price = totals.averagePrice * (1 + step);
      const revenue = totals.yieldKg * price;
      const margin = revenue - totals.cost;
      return {
        step,
        label: stepLabel(step),
        price,
        revenue,
        margin,
        marginPercent: safeDiv(margin, revenue) * 100,
        profitable: margin >= 0,
      };
    }),
    cost: COST_STEPS.map((step) => {
      const cost = totals.cost * (1 + step);
      const margin = totals.revenue - cost;
      return {
        step,
        label: stepLabel(step),
        cost,
        margin,
        marginPercent: safeDiv(margin, totals.revenue) * 100,
        profitable: margin >= 0,
      };
    }),
    yield: YIELD_STEPS.map((step) => {
      const yieldKg = totals.yieldKg * (1 + step);
      const revenue = yieldKg * totals.averagePrice;
      const margin = revenue - totals.cost;
      return {
        step,
        label: stepLabel(step),
        yieldKg,
        revenue,
        margin,
        marginPercent: safeDiv(margin, revenue) * 100,
        profitable: margin >= 0,
      };
    }),
    breakEvenChangePercent: -totals.safetyMarginPercent,
  };
}

function buildPortfolio(byCommodity, totals) {
  const shares = byCommodity.map((item) => ({
    commodity: item.commodity,
    revenueSharePercent: safeDiv(item.revenue, totals.revenue) * 100,
    marginSharePercent: totals.margin > 0 ? safeDiv(item.margin, totals.margin) * 100 : null,
    revenue: item.revenue,
    margin: item.margin,
  }));

  const hhi = shares.reduce((total, item) => total + item.revenueSharePercent ** 2, 0);
  const top = [...shares].sort((a, b) => b.revenueSharePercent - a.revenueSharePercent)[0] || null;

  let label = 'Belum tersedia';
  let tone = 'neutral';
  if (shares.length > 0) {
    if (hhi < 1500) {
      label = 'Terdisversifikasi';
      tone = 'low';
    } else if (hhi < 2500) {
      label = 'Cukup terkonsentrasi';
      tone = 'medium';
    } else {
      label = 'Sangat terkonsentrasi';
      tone = 'high';
    }
  }

  return {
    hhi: Math.round(hhi),
    label,
    tone,
    effectiveCommodities: hhi > 0 ? 10000 / hhi : 0,
    top,
    shares,
  };
}

function buildPortfolioRisk(economics, totals, portfolio) {
  const sorted = [...economics].sort((a, b) => b.risk.score - a.risk.score);
  const worst = sorted[0] || null;

  const weightedRisk = economics.reduce(
    (total, row) => total + row.risk.score * safeDiv(row.revenue, totals.revenue),
    0
  );
  const concentrationRisk = portfolio.hhi >= 2500 ? 100 : portfolio.hhi >= 1500 ? 50 : 0;

  let score = Math.round(
    clamp(weightedRisk * 0.45 + (worst?.risk.score || 0) * 0.3 + concentrationRisk * 0.25, 0, 100)
  );
  if (portfolio.hhi >= 2500) score = Math.max(score, 35);

  let level = 'Rendah';
  let tone = 'low';
  if (score >= 65) {
    level = 'Tinggi';
    tone = 'high';
  } else if (score >= 35) {
    level = 'Sedang';
    tone = 'medium';
  }

  const drivers = [];
  if (worst && worst.risk.score >= 35) {
    worst.risk.drivers.slice(0, 2).forEach((driver) => {
      drivers.push({
        key: `plan-${driver.key}`,
        text: `${worst.commodity}: ${driver.text}`,
      });
    });
  }
  if (portfolio.hhi >= 1500 && portfolio.top) {
    drivers.push({
      key: 'concentration',
      text: `Omzet ${percentText(portfolio.top.revenueSharePercent)} berasal dari ${portfolio.top.commodity}.`,
    });
  }

  return { score, level, tone, drivers };
}

function buildFindings({ totals, byCommodity, portfolio, plans }) {
  const findings = [];

  const belowBreakEven = byCommodity.filter(
    (item) => item.averagePrice > 0 && item.averagePrice < item.breakEvenPrice
  );
  if (belowBreakEven.length > 0) {
    findings.push({
      tone: 'danger',
      title: 'Harga jual di bawah titik impas',
      text: `${belowBreakEven.map((item) => item.commodity).join(', ')} tidak menutup biaya produksi pada harga yang direncanakan.`,
    });
  }

  const negativeMargin = byCommodity.filter((item) => item.margin < 0);
  if (negativeMargin.length > 0) {
    findings.push({
      tone: 'danger',
      title: 'Komoditas merugi',
      text: `${negativeMargin.map((item) => item.commodity).join(', ')} menghasilkan margin negatif berdasarkan input saat ini.`,
    });
  }

  if (totals.safetyMarginPercent < 15) {
    findings.push({
      tone: 'warning',
      title: 'Bantalan harga tipis',
      text: `Harga hanya ${percentText(totals.safetyMarginPercent)} di atas titik impas. Penurunan harga kecil dapat menghapus margin.`,
    });
  }

  const thinMargin = byCommodity.filter(
    (item) => item.safetyMarginPercent >= 0 && item.safetyMarginPercent < 15
  );
  if (thinMargin.length > 0) {
    findings.push({
      tone: 'warning',
      title: `Bantalan harga tipis pada ${thinMargin.map((item) => item.commodity).join(', ')}`,
      text: `Harga jual hanya ${percentText(
        Math.min(...thinMargin.map((item) => item.safetyMarginPercent))
      )} di atas titik impas untuk komoditas tersebut. Penurunan harga kecil dapat menghapus margin.`,
    });
  }

  if (totals.costRatioPercent > 75) {
    findings.push({
      tone: 'warning',
      title: 'Biaya menyerap sebagian besar omzet',
      text: `Rasio biaya produksi ${percentText(totals.costRatioPercent)}. Evaluasi efisiensi input dan tenaga kerja.`,
    });
  }

  if (portfolio.hhi >= 2500) {
    findings.push({
      tone: 'warning',
      title: 'Pendapatan terlalu terpusat',
      text: `Pangsa omzet terbesar ${percentText(portfolio.top?.revenueSharePercent || 0)}. Pertimbangkan diversifikasi komoditas atau jadwal panen.`,
    });
  }

  const missingHarvest = plans.filter((plan) => !plan.expected_harvest_date).length;
  if (missingHarvest > 0) {
    findings.push({
      tone: 'info',
      title: `${missingHarvest} rencana tanpa tanggal panen`,
      text: 'Proyeksi bulanan memakai tanggal tanam atau tanggal dibuat sebagai perkiraan. Lengkapi tanggal panen agar lebih akurat.',
    });
  }

  if (findings.length === 0) {
    findings.push({
      tone: 'success',
      title: 'Tidak ada risiko utama terdeteksi',
      text: 'Harga, biaya, dan diversifikasi berada dalam batas yang wajar berdasarkan input Anda.',
    });
  }

  return findings.slice(0, 5);
}

export function analyzePlans(plans, { scope = 'all', commodity = 'all' } = {}) {
  const scoped = (plans || []).filter((plan) => {
    if (commodity !== 'all' && plan.commodity !== commodity) return false;
    if (scope === 'active') return plan.status !== 'completed';
    if (scope === 'completed') return plan.status === 'completed';
    return true;
  });

  const economics = scoped.map(planEconomics);

  if (economics.length === 0) {
    return {
      scoped: [],
      economics: [],
      count: 0,
      totals: null,
      byCommodity: [],
      byMonth: [],
      scenarios: [],
      sensitivity: { price: [], cost: [], yield: [], breakEvenChangePercent: 0 },
      portfolio: buildPortfolio([], { revenue: 0, margin: 0 }),
      findings: [],
      confidence: { score: 0, label: 'Belum ada data', tone: 'neutral' },
      best: null,
      worst: null,
    };
  }

  const totals = summarize(economics);

  const commodityMap = new Map();
  for (const row of economics) {
    if (!commodityMap.has(row.commodity)) commodityMap.set(row.commodity, []);
    commodityMap.get(row.commodity).push(row);
  }

  const byCommodity = [...commodityMap.entries()]
    .map(([name, rows]) => {
      const metrics = summarize(rows);
      return {
        commodity: name,
        ...metrics,
        revenueSharePercent: safeDiv(metrics.revenue, totals.revenue) * 100,
        marginSharePercent: totals.margin > 0 ? safeDiv(metrics.margin, totals.margin) * 100 : null,
      };
    })
    .sort((a, b) => b.margin - a.margin);

  const monthMap = new Map();
  for (const row of economics) {
    const key = monthKey(row);
    if (!key) continue;
    if (!monthMap.has(key)) monthMap.set(key, []);
    monthMap.get(key).push(row);
  }

  let cumulativeRevenue = 0;
  let cumulativeCost = 0;
  let cumulativeMargin = 0;
  const byMonth = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, rows]) => {
      const metrics = summarize(rows);
      cumulativeRevenue += metrics.revenue;
      cumulativeCost += metrics.cost;
      cumulativeMargin += metrics.margin;
      return {
        key,
        label: monthLabel(key),
        revenue: metrics.revenue,
        cost: metrics.cost,
        margin: metrics.margin,
        marginPercent: metrics.marginPercent,
        yieldKg: metrics.yieldKg,
        planCount: metrics.planCount,
        cumulativeRevenue,
        cumulativeCost,
        cumulativeMargin,
      };
    });

  const portfolio = buildPortfolio(byCommodity, totals);
  const portfolioRisk = buildPortfolioRisk(economics, totals, portfolio);
  const enrichedTotals = { ...totals, risk: portfolioRisk };

  const scenarios = buildScenarios(totals);
  const sensitivity = buildSensitivity(totals);
  const findings = buildFindings({
    totals: enrichedTotals,
    byCommodity,
    portfolio,
    plans: economics,
  });

  const qualityScores = scoped.map((plan) => {
    const checks = [
      Boolean(plan.location),
      Boolean(plan.planted_area_ha),
      Boolean(plan.planting_date),
      Boolean(plan.expected_harvest_date),
      Boolean(plan.estimated_yield_kg),
      plan.production_cost !== null && plan.production_cost !== undefined,
      Boolean(plan.expected_price),
      Boolean(plan.status),
    ];
    return (checks.filter(Boolean).length / checks.length) * 100;
  });
  const confidenceScore = Math.round(
    qualityScores.reduce((total, value) => total + value, 0) / qualityScores.length
  );

  let confidenceLabel = 'Rendah';
  let confidenceTone = 'low';
  if (confidenceScore >= 85) {
    confidenceLabel = 'Tinggi';
    confidenceTone = 'good';
  } else if (confidenceScore >= 60) {
    confidenceLabel = 'Sedang';
    confidenceTone = 'mid';
  }

  const sortedByMargin = [...economics].sort((a, b) => b.margin - a.margin);

  return {
    scoped,
    economics,
    count: economics.length,
    totals: enrichedTotals,
    byCommodity,
    byMonth,
    scenarios,
    sensitivity,
    portfolio,
    findings,
    confidence: { score: confidenceScore, label: confidenceLabel, tone: confidenceTone },
    best: sortedByMargin[0] || null,
    worst: sortedByMargin[sortedByMargin.length - 1] || null,
  };
}
