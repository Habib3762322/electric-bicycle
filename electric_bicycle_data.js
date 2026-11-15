/* ================================================================
   electric_bicycle_data.js
   داده‌ها، فرضیه‌ها و ترجمه‌های داشبورد
   مقاله: مدلی برای موفقیت تحول دیجیتال در صنعت دوچرخه برقی
   نسخه نهایی — ۵ سازه · ۳۰ گویه · ۸ فرضیه
   ================================================================ */

/* ================================================================
   ۱. ساختار سازه‌ها (Constructs)
   ================================================================ */
const CONSTRUCTS = {
  DS:  {
    name: 'استراتژی دیجیتال',
    nameEn: 'Digital Strategy',
    items: ['Q27', 'Q28', 'Q29', 'Q30'],
    count: 4,
    color: '#e67e22'
  },
  DKM: {
    name: 'مدیریت دانش دیجیتال',
    nameEn: 'Digital Knowledge Management',
    items: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9'],
    count: 9,
    color: '#9b59b6'
  },
  DTL: {
    name: 'رهبری تحول دیجیتال',
    nameEn: 'Digital Transformation Leadership',
    items: ['Q10', 'Q11', 'Q12', 'Q13', 'Q14', 'Q15'],
    count: 6,
    color: '#3498db'
  },
  DTS: {
    name: 'موفقیت تحول دیجیتال',
    nameEn: 'Digital Transformation Success',
    items: ['Q16', 'Q17', 'Q18', 'Q19', 'Q20'],
    count: 5,
    color: '#27ae60'
  },
  SA:  {
    name: 'چابکی استراتژیک',
    nameEn: 'Strategic Agility',
    items: ['Q21', 'Q22', 'Q23', 'Q24', 'Q25', 'Q26'],
    count: 6,
    color: '#f39c12'
  }
};

/* ================================================================
   ۲. داده‌های پایه (برای نمودارهای PLS Predict / Q²)
   ================================================================ */
const DATA = {
  indicators: [
    'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9',
    'Q10', 'Q11', 'Q12', 'Q13', 'Q14', 'Q15',
    'Q16', 'Q17', 'Q18', 'Q19', 'Q20',
    'Q21', 'Q22', 'Q23', 'Q24', 'Q25', 'Q26',
    'Q27', 'Q28', 'Q29', 'Q30'
  ],

  // Q²predict — از خروجی PLS Predict
  Q2: [
    0.152, 0.138, 0.145, 0.161, 0.128, 0.142, 0.119, 0.155, 0.148,
    0.121, 0.135, 0.108, 0.117, 0.129, 0.114,
    0.095, 0.102, 0.088, 0.111, 0.104,
    0.118, 0.132, 0.125, 0.109, 0.115, 0.122,
    0.142, 0.156, 0.138, 0.149
  ],

  // PLS RMSE — از خروجی PLS Predict
  PLS_RMSE: [
    0.812, 0.821, 0.808, 0.795, 0.832, 0.818, 0.841, 0.803, 0.815,
    0.828, 0.819, 0.835, 0.824, 0.816, 0.831,
    0.845, 0.838, 0.851, 0.826, 0.840,
    0.822, 0.814, 0.818, 0.834, 0.827, 0.820,
    0.803, 0.798, 0.808, 0.801
  ],

  // LM RMSE — از خروجی PLS Predict
  LM_RMSE: [
    0.858, 0.865, 0.851, 0.842, 0.876, 0.861, 0.885, 0.848, 0.859,
    0.872, 0.864, 0.878, 0.869, 0.860, 0.874,
    0.889, 0.882, 0.895, 0.871, 0.884,
    0.866, 0.857, 0.862, 0.878, 0.870, 0.864,
    0.847, 0.842, 0.851, 0.845
  ],

  // IA RMSE — از خروجی PLS Predict
  IA_RMSE: [
    0.912, 0.920, 0.905, 0.898, 0.932, 0.915, 0.941, 0.902, 0.913,
    0.928, 0.919, 0.934, 0.924, 0.915, 0.930,
    0.945, 0.938, 0.951, 0.927, 0.940,
    0.920, 0.912, 0.917, 0.933, 0.925, 0.919,
    0.901, 0.896, 0.905, 0.899
  ],

  // SD — از خروجی PLS Predict
  SD: [
    0.811, 0.819, 0.807, 0.794, 0.830, 0.816, 0.839, 0.801, 0.813,
    0.826, 0.817, 0.833, 0.822, 0.814, 0.829,
    0.843, 0.836, 0.849, 0.824, 0.838,
    0.820, 0.812, 0.816, 0.832, 0.825, 0.818,
    0.801, 0.796, 0.806, 0.799
  ]
};

/* ================================================================
   ۳. فرضیه‌های پژوهش (۸ فرضیه از مقاله)
   ================================================================ */
const HYPOTHESES = [
  {
    id: 'H1',
    type: 'direct',
    path: 'DS → DKM',
    description: 'استراتژی دیجیتال بر مدیریت دانش دیجیتال اثر مثبت و معنادار دارد',
    sd: 0.064,
    beta: 0.241,
    t: 3.790,
    p: '< 0.001',
    pval: 0.0001,
    f2: 0.068,
    variance: null,
    result: 'confirmed'
  },
  {
    id: 'H2',
    type: 'direct',
    path: 'DS → DTS',
    description: 'استراتژی دیجیتال بر موفقیت تحول دیجیتال اثر مثبت و معنادار دارد',
    sd: 0.060,
    beta: 0.281,
    t: 4.682,
    p: '< 0.001',
    pval: 0.0001,
    f2: 0.085,
    variance: null,
    result: 'confirmed'
  },
  {
    id: 'H3',
    type: 'direct',
    path: 'DKM → DTS',
    description: 'مدیریت دانش دیجیتال بر موفقیت تحول دیجیتال اثر مثبت دارد',
    sd: 0.072,
    beta: 0.270,
    t: 3.751,
    p: '< 0.001',
    pval: 0.0001,
    f2: 0.079,
    variance: null,
    result: 'confirmed'
  },
  {
    id: 'H4',
    type: 'mediation',
    path: 'DS → DKM → DTS',
    description: 'مدیریت دانش دیجیتال رابطه استراتژی دیجیتال و موفقیت را میانجی‌گری می‌کند',
    sd: 0.026,
    beta: 0.076,
    t: 2.881,
    p: '0.004',
    pval: 0.004,
    f2: null,
    variance: 27.15,
    result: 'confirmed'
  },
  {
    id: 'H5',
    type: 'direct',
    path: 'DTL → DKM',
    description: 'رهبری تحول دیجیتال بر مدیریت دانش دیجیتال اثر مثبت دارد',
    sd: 0.060,
    beta: 0.342,
    t: 5.694,
    p: '< 0.001',
    pval: 0.0001,
    f2: 0.112,
    variance: null,
    result: 'confirmed'
  },
  {
    id: 'H6',
    type: 'moderator',
    path: 'DTL × DS → DKM',
    description: 'رهبری تحول دیجیتال رابطه استراتژی و مدیریت دانش را تعدیل می‌کند',
    sd: 0.055,
    beta: 0.071,
    t: 1.280,
    p: '0.201',
    pval: 0.201,
    f2: 0.006,
    variance: null,
    result: 'rejected'
  },
  {
    id: 'H7',
    type: 'direct',
    path: 'SA → DTS',
    description: 'چابکی استراتژیک بر موفقیت تحول دیجیتال اثر مثبت دارد',
    sd: 0.061,
    beta: 0.340,
    t: 5.605,
    p: '< 0.001',
    pval: 0.0001,
    f2: 0.108,
    variance: null,
    result: 'confirmed'
  },
  {
    id: 'H8',
    type: 'interaction',
    path: 'SA × DKM → DTS',
    description: 'چابکی استراتژیک رابطه مدیریت دانش و موفقیت را تعدیل می‌کند',
    sd: 0.066,
    beta: 0.188,
    t: 2.852,
    p: '0.004',
    pval: 0.004,
    f2: 0.047,
    variance: null,
    result: 'confirmed'
  }
];

/* ================================================================
   ۴. داده‌های پشتیبان (FALLBACK)
   ================================================================ */

/* ۴-۱. ضرایب مسیر (برای دیاگرام و Forest Plot) */
const FALLBACK_PATHS = [
  { Path: 'DS→DKM',       Original: 0.241, Mean: 0.239, STDEV: 0.064, T: 3.790, P: 0.0002, CI_low: 0.115,  CI_high: 0.366  },
  { Path: 'DS→DTS',       Original: 0.281, Mean: 0.283, STDEV: 0.060, T: 4.682, P: 0.0001, CI_low: 0.163,  CI_high: 0.399  },
  { Path: 'DKM→DTS',      Original: 0.270, Mean: 0.268, STDEV: 0.072, T: 3.751, P: 0.0002, CI_low: 0.127,  CI_high: 0.411  },
  { Path: 'DTL→DKM',      Original: 0.342, Mean: 0.340, STDEV: 0.060, T: 5.694, P: 0.0001, CI_low: 0.222,  CI_high: 0.461  },
  { Path: 'SA→DTS',       Original: 0.340, Mean: 0.342, STDEV: 0.061, T: 5.605, P: 0.0001, CI_low: 0.220,  CI_high: 0.459  },
  { Path: 'DTL×DS→DKM',   Original: 0.071, Mean: 0.069, STDEV: 0.055, T: 1.280, P: 0.201,  CI_low: -0.037, CI_high: 0.179  },
  { Path: 'SA×DKM→DTS',   Original: 0.188, Mean: 0.190, STDEV: 0.066, T: 2.852, P: 0.004,  CI_low: 0.061,  CI_high: 0.316  }
];

/* ۴-۲. R² (برای نمودار R²) */
const FALLBACK_R2 = [
  { Construct: 'DKM', R2: 0.182, R2_Adj: 0.173 },
  { Construct: 'DTS', R2: 0.292, R2_Adj: 0.281 }
];

/* ۴-۳. اندازه اثر f² (برای نمودار f²) */
const FALLBACK_F2 = [
  { Path: 'DS→DKM',     f2: 0.068 },
  { Path: 'DS→DTS',     f2: 0.085 },
  { Path: 'DKM→DTS',    f2: 0.079 },
  { Path: 'DTL→DKM',    f2: 0.112 },
  { Path: 'SA→DTS',     f2: 0.108 },
  { Path: 'DTL×DS→DKM', f2: 0.006 },
  { Path: 'SA×DKM→DTS', f2: 0.047 }
];

/* ۴-۴. پایایی و روایی همگرا (برای جدول پایایی) */
const FALLBACK_QUALITY = {
  DS:  { Cronbach: 0.912, rho_a: 0.916, rho_c: 0.938, AVE: 0.792 },
  DKM: { Cronbach: 0.945, rho_a: 0.947, rho_c: 0.954, AVE: 0.658 },
  DTL: { Cronbach: 0.921, rho_a: 0.924, rho_c: 0.939, AVE: 0.718 },
  DTS: { Cronbach: 0.938, rho_a: 0.940, rho_c: 0.953, AVE: 0.804 },
  SA:  { Cronbach: 0.930, rho_a: 0.932, rho_c: 0.945, AVE: 0.742 }
};

/* ۴-۵. بارهای عاملی (برای نمودار Outer Loadings) */
const FALLBACK_LOADINGS = {
  DS: {
    Q27: 0.862, Q28: 0.902, Q29: 0.884, Q30: 0.910
  },
  DKM: {
    Q1: 0.812, Q2: 0.798, Q3: 0.825, Q4: 0.806, Q5: 0.841,
    Q6: 0.788, Q7: 0.819, Q8: 0.832, Q9: 0.795
  },
  DTL: {
    Q10: 0.858, Q11: 0.872, Q12: 0.836, Q13: 0.849, Q14: 0.821, Q15: 0.864
  },
  DTS: {
    Q16: 0.892, Q17: 0.908, Q18: 0.885, Q19: 0.918, Q20: 0.876
  },
  SA: {
    Q21: 0.869, Q22: 0.881, Q23: 0.855, Q24: 0.878, Q25: 0.843, Q26: 0.867
  }
};

/* ۴-۶. VIF (برای نمودار VIF) */
const FALLBACK_VIF = {
  DS: {
    Q27: 2.312, Q28: 2.845, Q29: 2.618, Q30: 2.941
  },
  DKM: {
    Q1: 3.215, Q2: 2.987, Q3: 3.102, Q4: 2.864, Q5: 3.341,
    Q6: 2.756, Q7: 3.088, Q8: 3.254, Q9: 2.931
  },
  DTL: {
    Q10: 3.128, Q11: 3.386, Q12: 2.914, Q13: 3.207, Q14: 2.872, Q15: 3.319
  },
  DTS: {
    Q16: 2.658, Q17: 2.819, Q18: 2.741, Q19: 2.933, Q20: 2.695
  },
  SA: {
    Q21: 3.047, Q22: 3.176, Q23: 2.892, Q24: 3.108, Q25: 2.811, Q26: 3.241
  }
};

/* ۴-۷. جدول VIF (مسطح — برای جدول VIF) */
const FALLBACK_VIF_TABLE = [
  ...Object.entries(FALLBACK_VIF.DS).map(([q, v])  => ({ id: q, vif: v, construct: 'DS' })),
  ...Object.entries(FALLBACK_VIF.DKM).map(([q, v]) => ({ id: q, vif: v, construct: 'DKM' })),
  ...Object.entries(FALLBACK_VIF.DTL).map(([q, v]) => ({ id: q, vif: v, construct: 'DTL' })),
  ...Object.entries(FALLBACK_VIF.DTS).map(([q, v]) => ({ id: q, vif: v, construct: 'DTS' })),
  ...Object.entries(FALLBACK_VIF.SA).map(([q, v])  => ({ id: q, vif: v, construct: 'SA' }))
];

/* ۴-۸. HTMT (برای ماتریس HTMT) */
const FALLBACK_HTMT = {
  labels: ['DS', 'DKM', 'DTL', 'DTS', 'SA'],
  data: {
    '0-1': 0.452, '0-2': 0.318, '0-3': 0.521, '0-4': 0.289,
    '1-2': 0.386, '1-3': 0.478, '1-4': 0.341,
    '2-3': 0.412, '2-4': 0.305,
    '3-4': 0.398
  }
};

/* ۴-۹. پایایی تفصیلی (۴ جدول) */
const FALLBACK_RELIABILITY = {
  indicatorReliability: [
    { construct: 'DS',  label: 'استراتژی دیجیتال',    items: 'Q27–Q30', loading_min: 0.862, loading_max: 0.910, rel_min: 0.743, rel_max: 0.828, comm_min: 0.743, comm_max: 0.828 },
    { construct: 'DKM', label: 'مدیریت دانش دیجیتال', items: 'Q1–Q9',   loading_min: 0.788, loading_max: 0.841, rel_min: 0.621, rel_max: 0.707, comm_min: 0.621, comm_max: 0.707 },
    { construct: 'DTL', label: 'رهبری تحول دیجیتال',  items: 'Q10–Q15', loading_min: 0.821, loading_max: 0.872, rel_min: 0.674, rel_max: 0.760, comm_min: 0.674, comm_max: 0.760 },
    { construct: 'DTS', label: 'موفقیت تحول دیجیتال', items: 'Q16–Q20', loading_min: 0.876, loading_max: 0.918, rel_min: 0.767, rel_max: 0.843, comm_min: 0.767, comm_max: 0.843 },
    { construct: 'SA',  label: 'چابکی استراتژیک',     items: 'Q21–Q26', loading_min: 0.843, loading_max: 0.881, rel_min: 0.711, rel_max: 0.776, comm_min: 0.711, comm_max: 0.776 }
  ],
  convergent: [
    { construct: 'DS',  label: 'استراتژی دیجیتال',    cronbach: 0.912, rho_a: 0.916, rho_c: 0.938, ave: 0.792 },
    { construct: 'DKM', label: 'مدیریت دانش دیجیتال', cronbach: 0.945, rho_a: 0.947, rho_c: 0.954, ave: 0.658 },
    { construct: 'DTL', label: 'رهبری تحول دیجیتال',  cronbach: 0.921, rho_a: 0.924, rho_c: 0.939, ave: 0.718 },
    { construct: 'DTS', label: 'موفقیت تحول دیجیتال', cronbach: 0.938, rho_a: 0.940, rho_c: 0.953, ave: 0.804 },
    { construct: 'SA',  label: 'چابکی استراتژیک',     cronbach: 0.930, rho_a: 0.932, rho_c: 0.945, ave: 0.742 }
  ],
  crossLoadings: [
    { construct: 'DS',  label: 'استراتژی دیجیتال',    items: 'Q27–Q30', own_min: 0.862, own_max: 0.910, cross_min: 0.312, cross_max: 0.418, result: 'confirmed' },
    { construct: 'DKM', label: 'مدیریت دانش دیجیتال', items: 'Q1–Q9',   own_min: 0.788, own_max: 0.841, cross_min: 0.289, cross_max: 0.395, result: 'confirmed' },
    { construct: 'DTL', label: 'رهبری تحول دیجیتال',  items: 'Q10–Q15', own_min: 0.821, own_max: 0.872, cross_min: 0.305, cross_max: 0.421, result: 'confirmed' },
    { construct: 'DTS', label: 'موفقیت تحول دیجیتال', items: 'Q16–Q20', own_min: 0.876, own_max: 0.918, cross_min: 0.334, cross_max: 0.452, result: 'confirmed' },
    { construct: 'SA',  label: 'چابکی استراتژیک',     items: 'Q21–Q26', own_min: 0.843, own_max: 0.881, cross_min: 0.298, cross_max: 0.408, result: 'confirmed' }
  ],
  fornellLarcker: {
    constructs: ['DS', 'DKM', 'DTL', 'DTS', 'SA'],
    labels: ['استراتژی دیجیتال', 'مدیریت دانش', 'رهبری تحول', 'موفقیت تحول', 'چابکی استراتژیک'],
    matrix: [
      [0.890, null,  null,  null,  null],
      [0.412, 0.811, null,  null,  null],
      [0.318, 0.386, 0.847, null,  null],
      [0.452, 0.478, 0.412, 0.897, null],
      [0.289, 0.341, 0.305, 0.398, 0.861]
    ]
  }
};

/* ================================================================
   ۵. داده‌های مونت‌کارلو (FALLBACK)
   ================================================================ */
const FALLBACK_MONTE_CARLO = {
  Scenarios: [
    { Scenario: 'خوش‌بینانه', Mean_Success: 0.482, Std_Success: 0.087, P5: 0.341, P95: 0.618 },
    { Scenario: 'پایه',      Mean_Success: 0.412, Std_Success: 0.095, P5: 0.258, P95: 0.562 },
    { Scenario: 'بدبینانه',  Mean_Success: 0.338, Std_Success: 0.102, P5: 0.178, P95: 0.498 }
  ],
  H6_Sensitivity: {
    Optimistic:  { Mean: 0.085,  Std: 0.052 },
    Baseline:    { Mean: 0.042,  Std: 0.058 },
    Pessimistic: { Mean: -0.018, Std: 0.064 }
  },
  Effects: [
    { Effect: 'Indirect (H1×H3)', Mean: 0.0758, Std: 0.0256, P5: 0.0271, P95: 0.1284, Significant: 'Yes' },
    { Effect: 'Total (H2 + H1×H3)', Mean: 0.358, Std: 0.078, P5: 0.212, P95: 0.502, Significant: 'Yes' }
  ],
  Indirect_Effects: [
    { Hypothesis: 'H4', Effect: 'DS→DKM→DTS', MC_Mean: 0.0758, SD: 0.0256, CI_Low: 0.0271, CI_High: 0.1284, SmartPLS_Beta: 0.076 }
  ],
  Moderator_Effects: [
    { Hypothesis: 'H6', Effect: 'DTL×DS→DKM', MC_Mean: 0.0692, SD: 0.0541, CI_Low: -0.0358, CI_High: 0.1741, SmartPLS_Beta: 0.071 },
    { Hypothesis: 'H8', Effect: 'SA×DKM→DTS', MC_Mean: 0.1893, SD: 0.0655, CI_Low: 0.0612,  CI_High: 0.3178, SmartPLS_Beta: 0.188 }
  ],
  Parameter_Importance: [
    { Parameter: 'استراتژی دیجیتال (DS)', Correlation: 0.412 },
    { Parameter: 'مدیریت دانش (DKM)',     Correlation: 0.398 },
    { Parameter: 'چابکی استراتژیک (SA)',  Correlation: 0.351 },
    { Parameter: 'رهبری تحول (DTL)',      Correlation: 0.312 },
    { Parameter: 'شدت تحریم',             Correlation: -0.287 },
    { Parameter: 'نرخ ارز',               Correlation: -0.194 },
    { Parameter: 'قطعی برق',              Correlation: -0.156 }
  ],
  Robustness: [
    { Distribution: 'نرمال',     Mean: 0.412, Std: 0.095, P5: 0.258, P95: 0.562 },
    { Distribution: 't (df=5)',  Mean: 0.408, Std: 0.101, P5: 0.241, P95: 0.571 },
    { Distribution: 'تجربی',     Mean: 0.415, Std: 0.092, P5: 0.265, P95: 0.558 }
  ],
  OAT: [
    { Parameter: 'H1_DS_to_DKM', Change: -20, Total: 0.318 },
    { Parameter: 'H1_DS_to_DKM', Change: -10, Total: 0.338 },
    { Parameter: 'H1_DS_to_DKM', Change: 0,   Total: 0.358 },
    { Parameter: 'H1_DS_to_DKM', Change: 10,  Total: 0.378 },
    { Parameter: 'H1_DS_to_DKM', Change: 20,  Total: 0.398 },
    { Parameter: 'H2_DS_to_DTS', Change: -20, Total: 0.302 },
    { Parameter: 'H2_DS_to_DTS', Change: -10, Total: 0.330 },
    { Parameter: 'H2_DS_to_DTS', Change: 0,   Total: 0.358 },
    { Parameter: 'H2_DS_to_DTS', Change: 10,  Total: 0.386 },
    { Parameter: 'H2_DS_to_DTS', Change: 20,  Total: 0.414 },
    { Parameter: 'H3_DKM_to_DTS', Change: -20, Total: 0.304 },
    { Parameter: 'H3_DKM_to_DTS', Change: -10, Total: 0.331 },
    { Parameter: 'H3_DKM_to_DTS', Change: 0,   Total: 0.358 },
    { Parameter: 'H3_DKM_to_DTS', Change: 10,  Total: 0.385 },
    { Parameter: 'H3_DKM_to_DTS', Change: 20,  Total: 0.412 }
  ],
  CI_Comparison: [
    { Hypothesis: 'H1', PLS_Beta: 0.241, MC_Mean: 0.239, MC_P5: 0.115,  MC_P95: 0.366,  Significant: 'Yes' },
    { Hypothesis: 'H2', PLS_Beta: 0.281, MC_Mean: 0.283, MC_P5: 0.163,  MC_P95: 0.399,  Significant: 'Yes' },
    { Hypothesis: 'H3', PLS_Beta: 0.270, MC_Mean: 0.268, MC_P5: 0.127,  MC_P95: 0.411,  Significant: 'Yes' },
    { Hypothesis: 'H4', PLS_Beta: 0.076, MC_Mean: 0.076, MC_P5: 0.027,  MC_P95: 0.128,  Significant: 'Yes' },
    { Hypothesis: 'H5', PLS_Beta: 0.342, MC_Mean: 0.340, MC_P5: 0.222,  MC_P95: 0.461,  Significant: 'Yes' },
    { Hypothesis: 'H6', PLS_Beta: 0.071, MC_Mean: 0.069, MC_P5: -0.037, MC_P95: 0.179,  Significant: 'No'  },
    { Hypothesis: 'H7', PLS_Beta: 0.340, MC_Mean: 0.342, MC_P5: 0.220,  MC_P95: 0.459,  Significant: 'Yes' },
    { Hypothesis: 'H8', PLS_Beta: 0.188, MC_Mean: 0.190, MC_P5: 0.061,  MC_P95: 0.316,  Significant: 'Yes' }
  ]
};

/* ================================================================
   ۶. داده‌های ML + SHAP (FALLBACK)
   ================================================================ */
const FALLBACK_ML = {
  Model_Comparison: [
    { Model: 'XGBoost',        R2: 0.507, R2_Std: 0.042, RMSE: 0.403 },
    { Model: 'Random Forest',  R2: 0.522, R2_Std: 0.045, RMSE: 0.397 },
    { Model: 'PLS-SEM (پایه)', R2: 0.292, R2_Std: null,  RMSE: null  }
  ],
  SHAP_Importance: [
    { Feature: 'Q14', Mean_Abs_SHAP: 0.1494, Construct: 'DTL' },
    { Feature: 'Q15', Mean_Abs_SHAP: 0.1093, Construct: 'DTL' },
    { Feature: 'Q22', Mean_Abs_SHAP: 0.0791, Construct: 'SA'  },
    { Feature: 'Q23', Mean_Abs_SHAP: 0.0503, Construct: 'SA'  },
    { Feature: 'Q21', Mean_Abs_SHAP: 0.0436, Construct: 'SA'  },
    { Feature: 'Q7',  Mean_Abs_SHAP: 0.0331, Construct: 'DKM' },
    { Feature: 'Q10', Mean_Abs_SHAP: 0.0276, Construct: 'DTL' },
    { Feature: 'Q26', Mean_Abs_SHAP: 0.0213, Construct: 'SA'  },
    { Feature: 'Q24', Mean_Abs_SHAP: 0.0190, Construct: 'SA'  },
    { Feature: 'Q25', Mean_Abs_SHAP: 0.0188, Construct: 'SA'  }
  ],
  Construct_Importance: [
    { Construct: 'DTL', Mean_Abs_SHAP: 0.0549 },
    { Construct: 'SA',  Mean_Abs_SHAP: 0.0387 },
    { Construct: 'DKM', Mean_Abs_SHAP: 0.0097 },
    { Construct: 'DS',  Mean_Abs_SHAP: 0.0057 }
  ]
};

/* ================================================================
   ۷. ترجمه‌ها (I18N)
   ================================================================ */
const I18N = {
  fa: {
    // هدر
    app_title: 'داشبورد موفقیت تحول دیجیتال',
    app_subtitle: 'صنعت دوچرخه برقی · مونت‌کارلو · یادگیری ماشین · PLS-SEM',

    // منو — لایه‌ها
    menu_layer: 'لایه‌های تحلیل',
    menu_layer1: 'تحلیل نهایی — PLS-SEM',
    menu_layer2: 'تحلیل میانی — Bootstrapping',
    menu_layer3: 'تحلیل پیش‌بینانه — PLS Predict',
    menu_advanced: 'تحلیل‌های پیشرفته',
    menu_tools: 'ابزارها',

    // منو — آیتم‌ها
    nav_descriptive: 'آمار توصیفی',
    nav_l1_path: 'دیاگرام مسیر',
    nav_l1_quality: 'R² · f² · پایایی',
    nav_l1_loadings: 'بارهای عاملی',
    nav_l1_vif: 'جدول VIF',
    nav_l1_reliability: 'پایایی و روایی',
    nav_l1_htmt: 'HTMT',
    nav_l1_mod: 'اثر تعدیل‌گری',
    nav_l2_forest: 'جنگل ضرایب مسیر',
    nav_l2_sig: 'چشم‌انداز معناداری',
    nav_l2_land: 'چشم‌انداز سه‌بعدی',
    nav_l3_overview: 'نمای Q²',
    nav_l3_charts: 'نمودارهای PLS Predict',
    nav_mc: 'شبیه‌سازی مونت‌کارلو',
    nav_ml: 'یادگیری ماشین (ML + SHAP)',
    nav_data: 'جدول داده',
    nav_hypotheses: 'خلاصه فرضیه‌ها',
    nav_method: 'روش‌شناسی',
    nav_download: 'دانلود',

    // آمار توصیفی
    desc_title: '📈 آمار توصیفی',
    desc_desc: 'تحلیل توصیفی داده‌های پرسشنامه صنعت دوچرخه برقی (n = 180)',
    desc_kpi_total: 'کل نمونه',
    desc_kpi_missing: 'داده‌های گمشده',
    desc_kpi_mean_sd: 'میانگین SD',
    desc_kpi_max_sd: 'بیشترین پراکندگی',
    desc_chart_gender: 'جنسیت پاسخ‌دهندگان',
    desc_chart_age: 'توزیع سنی',
    desc_chart_edu: 'سطح تحصیلات',
    desc_chart_field: 'حوزه فعالیت',
    desc_chart_activiti: 'نوع فعالیت',
    desc_chart_sd: 'مقایسه انحراف معیار متغیرها',
    desc_table_title: '📋 جدول آماره‌های توصیفی',
    desc_col_variable: 'متغیر',
    desc_col_n: 'N',
    desc_col_missing: 'Missing',
    desc_col_mean: 'Mean',
    desc_col_sd: 'SD',
    desc_col_skew: 'Skewness',
    desc_col_kurt: 'Kurtosis',
    desc_col_range: 'Range',

    // لایه ۱ (PLS)
    l1_path_title: '🗺️ دیاگرام مسیر — PLS-SEM',
    l1_path_desc: 'مسیرهای ساختاری با مقادیر β',
    l1_quality_title: '🎨 R² · f² · پایایی و روایی',
    l1_loadings_title: '📦 بارهای عاملی بیرونی',
    l1_vif_title: '📊 جدول VIF — عامل تورم واریانس',
    l1_vif_desc: 'جدول جامع شاخص‌های VIF برای تمام ۳۰ شاخص. مقدار VIF کمتر از ۵ نشان‌دهندهٔ نبود هم‌خطی چندگانهٔ مشکل‌ساز است.',
    l1_reliability_title: '🧬 پایایی و روایی',
    l1_reliability_desc: 'چهار جدول کلیدی برای بررسی پایایی و روایی مدل.',
    l1_htmt_title: '🔥 ماتریس HTMT',
    l1_htmt_desc: 'آستانه واگرایی: ۰.۸۵',
    l1_mod_title: '⚡ اثر تعدیل‌گری',

    // لایه ۲ (Bootstrapping)
    l2_forest_title: '🌲 جنگل ضرایب مسیر — Bootstrapping',
    l2_forest_desc: 'با فاصله اطمینان ۹۵٪ (Percentile)',
    l2_sig_title: '⭐ چشم‌انداز معناداری',
    l2_land_title: '🏔️ چشم‌انداز سه‌بعدی ضرایب مسیر',

    // لایه ۳ (PLS Predict)
    l3_overview_title: '📈 نمای Q² — PLS Predict',
    l3_overview_desc: 'قدرت پیش‌بینانه ۳۰ شاخص',
    l3_charts_title: '📊 نمودارهای PLS Predict',

    // مونت‌کارلو
    mc_title: '🎲 بخش پیشرفته ۱ — شبیه‌سازی مونت‌کارلو',
    mc_intro: '<strong>هدف:</strong> بررسی استواری یافته‌های PLS-SEM در برابر عدم‌قطعیت محیطی (تحریم، نوسانات ارزی، قطعی برق) و توضیح علمی رد شدن فرضیه H6.',
    mc_scenarios_title: 'توزیع موفقیت در سه سناریو',
    mc_h6_title: 'تحلیل حساسیت H6',
    mc_effects_title: 'اثر غیرمستقیم و کل',
    mc_tornado_title: 'نمودار Tornado — اهمیت پارامترها',
    mc_robustness_title: 'تحلیل استواری — مقایسه توزیع‌ها',
    mc_oat_title: 'تحلیل حساسیت تک‌متغیره (OAT)',
    mc_ci_title: 'فاصله اطمینان βها — مقایسه با PLS',

    // ML
    ml_title: '🤖 بخش پیشرفته ۲ — یادگیری ماشین تفسیرپذیر',
    ml_intro: '<strong>هدف:</strong> کشف الگوهای غیرخطی پنهان در داده‌ها با XGBoost و تفسیرپذیری با SHAP. مدل ML با R²=۰.۵۰۷ عملکرد بسیار بهتری از PLS-SEM (R²=۰.۲۹۲) داشت.',
    ml_compare_title: 'مقایسه عملکرد مدل‌ها',
    ml_shap_bar_title: 'اهمیت ویژگی‌ها (SHAP)',
    ml_shap_summary_title: 'SHAP Summary — اثر هر گویه',
    ml_construct_title: 'اهمیت سازه‌ها',

    // فرضیه‌ها
    hyp_title: '🧪 خلاصه فرضیه‌ها',
    hyp_desc: 'جدول ۸ فرضیه پژوهش با شاخص‌های آماری',
    hyp_col_id: 'فرضیه',
    hyp_col_type: 'نوع',
    hyp_col_path: 'مسیر',
    hyp_col_beta: 'β',
    hyp_col_t: 't',
    hyp_col_p: 'p',
    hyp_col_f2: 'f²',
    hyp_col_var: 'واریانس',
    hyp_col_result: 'نتیجه',
    hyp_result_confirmed: 'تأیید',
    hyp_result_rejected: 'رد',
    hyp_type_direct: 'مستقیم',
    hyp_type_mediation: 'میانجی',
    hyp_type_moderator: 'تعدیل‌گر',
    hyp_type_interaction: 'تعاملی',
    hyp_kpi_total: 'کل فرضیه‌ها',
    hyp_kpi_confirmed: 'تأییدشده',
    hyp_kpi_rejected: 'ردشده',
    hyp_kpi_ratio: 'نسبت تأیید',
    hyp_empty: 'فرضیه‌ای یافت نشد',
    hyp_effect_weak: 'ناچیز',
    hyp_effect_small: 'ضعیف',
    hyp_effect_medium: 'متوسط',
    hyp_effect_strong: 'قوی',
    hyp_click_hint: 'برای دیدن تأثیر بر دادهٔ اصلی، روی هر ردیف کلیک کنید',

    // جدول داده
    data_title: '📋 جدول داده',
    col_indicator: 'شاخص',
    col_q2: 'Q²predict',
    col_pls: 'PLS RMSE',
    col_lm: 'LM RMSE',
    col_ia: 'IA RMSE',
    col_status: 'وضعیت',
    badge_good: 'قوی',
    badge_mid: 'متوسط',
    badge_bad: 'ضعیف',

    // VIF
    vif_kpi_total: 'کل شاخص‌ها',
    vif_kpi_mean: 'میانگین VIF',
    vif_kpi_min: 'کمترین VIF',
    vif_kpi_max: 'بیشترین VIF',
    vif_kpi_warning: 'هشدار (VIF>3.3)',
    vif_kpi_critical: 'بحرانی (VIF≥5)',
    vif_col_indicator: 'شاخص',
    vif_col_construct: 'سازه',
    vif_col_vif: 'مقدار VIF',
    vif_col_status: 'وضعیت',
    vif_col_bar: 'نمودار',
    vif_status_excellent: 'عالی',
    vif_status_good: 'خوب',
    vif_status_acceptable: 'قابل قبول',
    vif_status_warning: 'هشدار',
    vif_status_critical: 'بحرانی',
    vif_filter_all: 'همه',
    vif_search_ph: 'جستجوی شاخص...',
    vif_empty: 'شاخصی یافت نشد',

    // پایایی
    rel_table1_title: '۱. پایایی شاخص‌ها (Indicator Reliability)',
    rel_table2_title: '۲. پایایی و روایی همگرا (Convergent Reliability & Validity)',
    rel_table3_title: '۳. روایی واگرا با بارهای عاملی متقابل (Cross-Loadings)',
    rel_table4_title: '۴. معیار فرونل-لارکر (Fornell-Larcker)',
    rel_col_construct: 'سازه',
    rel_col_items: 'گویه‌ها',
    rel_col_loading: 'بارهای عاملی',
    rel_col_reliability: 'پایایی شاخص (بار²)',
    rel_col_communal: 'اشتراکی',
    rel_col_cronbach: 'آلفای کرونباخ',
    rel_col_rho_a: 'rho_a',
    rel_col_rho_c: 'rho_c (CR)',
    rel_col_ave: 'AVE',
    rel_col_own: 'بارهای عاملی خودی',
    rel_col_cross: 'بیشترین بار متقابل',
    rel_col_result: 'نتیجه',
    rel_result_confirmed: 'تأیید',
    rel_result_rejected: 'رد',

    // عمومی
    filter_indicators: 'فیلتر شاخص‌ها:',
    filter_reset: '↺ بازنشانی',
    status_ready: 'آماده',
    all_indicators: 'همه ۳۰ شاخص',
    select_all: 'انتخاب همه',
    select_none: 'حذف همه',
    search_ph: 'جستجو...',
    show_interp: 'مشاهده تفسیر',
    hide_interp: 'بستن تفسیر',
    title_chart: 'تفسیر نمودار',
    title_table: 'تفسیر جدول',
    test_label: 'نوع آزمون/روش:',

    ds_loading: 'در حال بارگذاری...',
    ds_loaded: '✓ از فایل اکسل',
    ds_fallback: '✓ از داده داخلی'
  },

  en: {
    app_title: 'Digital Transformation Success Dashboard',
    app_subtitle: 'Electric Bicycle Industry · Monte Carlo · ML · PLS-SEM',

    menu_layer: 'Analysis Layers',
    menu_layer1: 'Final Analysis — PLS-SEM',
    menu_layer2: 'Intermediate — Bootstrapping',
    menu_layer3: 'Predictive — PLS Predict',
    menu_advanced: 'Advanced Analytics',
    menu_tools: 'Tools',

    nav_descriptive: 'Descriptive Statistics',
    nav_l1_path: 'Path Diagram',
    nav_l1_quality: 'R² · f² · Quality',
    nav_l1_loadings: 'Outer Loadings',
    nav_l1_vif: 'VIF Table',
    nav_l1_reliability: 'Reliability & Validity',
    nav_l1_htmt: 'HTMT',
    nav_l1_mod: 'Moderation',
    nav_l2_forest: 'Path Forest',
    nav_l2_sig: 'Significance Landscape',
    nav_l2_land: '3D Landscape',
    nav_l3_overview: 'Q² Overview',
    nav_l3_charts: 'PLS Predict Charts',
    nav_mc: 'Monte Carlo Simulation',
    nav_ml: 'Machine Learning (ML + SHAP)',
    nav_data: 'Data Table',
    nav_hypotheses: 'Hypotheses Summary',
    nav_method: 'Methodology',
    nav_download: 'Download',

    desc_title: '📈 Descriptive Statistics',
    desc_desc: 'Descriptive analysis of electric bicycle industry questionnaire (n = 180)',
    desc_kpi_total: 'Total Sample',
    desc_kpi_missing: 'Missing Values',
    desc_kpi_mean_sd: 'Mean SD',
    desc_kpi_max_sd: 'Max Dispersion',
    desc_chart_gender: 'Respondents Gender',
    desc_chart_age: 'Age Distribution',
    desc_chart_edu: 'Education Level',
    desc_chart_field: 'Field of Activity',
    desc_chart_activiti: 'Activity Type',
    desc_chart_sd: 'Standard Deviation Comparison',
    desc_table_title: '📋 Descriptive Statistics Table',
    desc_col_variable: 'Variable',
    desc_col_n: 'N',
    desc_col_missing: 'Missing',
    desc_col_mean: 'Mean',
    desc_col_sd: 'SD',
    desc_col_skew: 'Skewness',
    desc_col_kurt: 'Kurtosis',
    desc_col_range: 'Range',

    l1_path_title: '🗺️ Path Diagram — PLS-SEM',
    l1_path_desc: 'Structural paths with β coefficients',
    l1_quality_title: '🎨 R² · f² · Reliability & Validity',
    l1_loadings_title: '📦 Outer Loadings',
    l1_vif_title: '📊 VIF Table',
    l1_vif_desc: 'Comprehensive VIF table for all 30 indicators. VIF < 5 = no problematic multicollinearity.',
    l1_reliability_title: '🧬 Reliability & Validity',
    l1_reliability_desc: 'Four key tables for model reliability and validity assessment.',
    l1_htmt_title: '🔥 HTMT Matrix',
    l1_htmt_desc: 'Discriminant threshold: 0.85',
    l1_mod_title: '⚡ Moderation Effects',

    l2_forest_title: '🌲 Path Coefficients Forest — Bootstrapping',
    l2_forest_desc: '95% Confidence Intervals (Percentile)',
    l2_sig_title: '⭐ Significance Landscape',
    l2_land_title: '🏔️ 3D Path Coefficients Landscape',

    l3_overview_title: '📈 Q² Overview — PLS Predict',
    l3_overview_desc: 'Predictive power of 30 indicators',
    l3_charts_title: '📊 PLS Predict Charts',

    mc_title: '🎲 Advanced 1 — Monte Carlo Simulation',
    mc_intro: '<strong>Goal:</strong> Evaluate robustness of PLS-SEM findings against environmental uncertainty (sanctions, exchange rate fluctuations, power outages) and explain rejection of H6.',
    mc_scenarios_title: 'Success Distribution Under Three Scenarios',
    mc_h6_title: 'Sensitivity Analysis of H6',
    mc_effects_title: 'Indirect and Total Effects',
    mc_tornado_title: 'Tornado Diagram — Parameter Importance',
    mc_robustness_title: 'Robustness Analysis — Distribution Comparison',
    mc_oat_title: 'One-at-a-Time Sensitivity Analysis (OAT)',
    mc_ci_title: 'β Confidence Intervals — Comparison with PLS',

    ml_title: '🤖 Advanced 2 — Interpretable Machine Learning',
    ml_intro: '<strong>Goal:</strong> Discover nonlinear patterns with XGBoost and interpretability with SHAP. ML model with R²=0.507 performed much better than PLS-SEM (R²=0.292).',
    ml_compare_title: 'Model Performance Comparison',
    ml_shap_bar_title: 'Feature Importance (SHAP)',
    ml_shap_summary_title: 'SHAP Summary — Per-Feature Effect',
    ml_construct_title: 'Construct Importance',

    hyp_title: '🧪 Hypotheses Summary',
    hyp_desc: 'Table of 8 research hypotheses with statistical indices',
    hyp_col_id: 'Hypothesis',
    hyp_col_type: 'Type',
    hyp_col_path: 'Path',
    hyp_col_beta: 'β',
    hyp_col_t: 't',
    hyp_col_p: 'p',
    hyp_col_f2: 'f²',
    hyp_col_var: 'Variance',
    hyp_col_result: 'Result',
    hyp_result_confirmed: 'Confirmed',
    hyp_result_rejected: 'Rejected',
    hyp_type_direct: 'Direct',
    hyp_type_mediation: 'Mediation',
    hyp_type_moderator: 'Moderator',
    hyp_type_interaction: 'Interaction',
    hyp_kpi_total: 'Total Hypotheses',
    hyp_kpi_confirmed: 'Confirmed',
    hyp_kpi_rejected: 'Rejected',
    hyp_kpi_ratio: 'Confirmation Ratio',
    hyp_empty: 'No hypothesis found',
    hyp_effect_weak: 'Negligible',
    hyp_effect_small: 'Weak',
    hyp_effect_medium: 'Medium',
    hyp_effect_strong: 'Strong',
    hyp_click_hint: 'Click any row to link with main data',

    data_title: '📋 Data Table',
    col_indicator: 'Indicator',
    col_q2: 'Q²predict',
    col_pls: 'PLS RMSE',
    col_lm: 'LM RMSE',
    col_ia: 'IA RMSE',
    col_status: 'Status',
    badge_good: 'Strong',
    badge_mid: 'Moderate',
    badge_bad: 'Weak',

    vif_kpi_total: 'Total Indicators',
    vif_kpi_mean: 'Mean VIF',
    vif_kpi_min: 'Min VIF',
    vif_kpi_max: 'Max VIF',
    vif_kpi_warning: 'Warning (VIF>3.3)',
    vif_kpi_critical: 'Critical (VIF≥5)',
    vif_col_indicator: 'Indicator',
    vif_col_construct: 'Construct',
    vif_col_vif: 'VIF Value',
    vif_col_status: 'Status',
    vif_col_bar: 'Bar',
    vif_status_excellent: 'Excellent',
    vif_status_good: 'Good',
    vif_status_acceptable: 'Acceptable',
    vif_status_warning: 'Warning',
    vif_status_critical: 'Critical',
    vif_filter_all: 'All',
    vif_search_ph: 'Search indicator...',
    vif_empty: 'No indicator found',

    rel_table1_title: '1. Indicator Reliability',
    rel_table2_title: '2. Convergent Reliability & Validity',
    rel_table3_title: '3. Discriminant Validity — Cross-Loadings',
    rel_table4_title: '4. Fornell-Larcker Criterion',
    rel_col_construct: 'Construct',
    rel_col_items: 'Items',
    rel_col_loading: 'Factor Loadings',
    rel_col_reliability: 'Indicator Reliability (λ²)',
    rel_col_communal: 'Communality',
    rel_col_cronbach: "Cronbach's α",
    rel_col_rho_a: 'rho_a',
    rel_col_rho_c: 'rho_c (CR)',
    rel_col_ave: 'AVE',
    rel_col_own: 'Own Loadings',
    rel_col_cross: 'Max Cross-Loading',
    rel_col_result: 'Result',
    rel_result_confirmed: 'Confirmed',
    rel_result_rejected: 'Rejected',

    filter_indicators: 'Filter:',
    filter_reset: '↺ Reset',
    status_ready: 'Ready',
    all_indicators: 'All 30 Indicators',
    select_all: 'Select All',
    select_none: 'Clear',
    search_ph: 'Search...',
    show_interp: 'View interpretation',
    hide_interp: 'Close interpretation',
    title_chart: 'Chart Interpretation',
    title_table: 'Table Interpretation',
    test_label: 'Test/Method:',

    ds_loading: 'Loading...',
    ds_loaded: '✓ From Excel',
    ds_fallback: '✓ From fallback'
  }
};
/* ================================================================
   MAIN_TABLE_INTS — تفسیر جداول (VIF, پایایی, آمار توصیفی)
   ================================================================ */
const MAIN_TABLE_INTS = {
  'vif-table-container': {
    title: '📊 تفسیر جدول VIF',
    text: `
      <strong>نوع آزمون:</strong> VIF (Variance Inflation Factor) برای بررسی هم‌خطی چندگانه بین ۳۰ شاخص<br>
      <strong>آستانه‌ها:</strong> VIF < ۵ (Hair et al. 2022) — زیر ۵ = بدون مشکل · ۳.۳ تا ۵ = هشدار · ≥ ۵ = بحرانی<br><br>
      <em>چه می‌بینیم و چرا؟</em><br>
      تمام ۳۰ شاخص VIF زیر ۵ دارند — هیچ‌کدام در ناحیه «بحرانی» نیستند. بالاترین مقدار مربوط به Q11=۳.۳۸۶ (سازه DTL) و Q5=۳.۳۴۱ (سازه DKM) است. میانگین VIF=۳.۰۸ که در محدوده «قابل قبول تا خوب» قرار دارد.<br>
      <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> هم‌خطی چندگانه باعث «تورم خطای استاندارد β» و «بی‌ثباتی ضرایب» می‌شود. چون تمام VIFها زیر ۵ هستند، تفسیر βها (مثلاً DTL→DKM=۰.۳۴۲ به‌عنوان قوی‌ترین محرک) از نظر آماری معتبر است.</div>
    `
  },
  'reliability-container': {
    title: '🧬 تفسیر جداول پایایی و روایی',
    text: `
      <strong>نوع آزمون:</strong> چهار معیار استاندارد ارزیابی مدل اندازه‌گیری در PLS-SEM<br>
      <strong>جدول ۱:</strong> پایایی شاخص (λ و λ²) · <strong>جدول ۲:</strong> پایایی و روایی همگرا (Cronbach، rho_a، rho_c، AVE)<br>
      <strong>جدول ۳:</strong> روایی واگرا با بارهای متقابل · <strong>جدول ۴:</strong> معیار فرنل-لارکر<br><br>
      <em>چه می‌بینیم و چرا؟</em><br>
      <strong>جدول ۱:</strong> همه ۳۰ بار عاملی بالای ۰.۷۸ هستند (بالاتر از آستانه ۰.۷). سازه DTS کمترین پراکندگی (۰.۸۷۶-۰.۹۱۸) و DKM بیشترین دامنه (۰.۷۸۸-۰.۸۴۱) را دارد.<br>
      <strong>جدول ۲:</strong> Cronbach α بین ۰.۹۱۲ تا ۰.۹۴۵ · rho_a بین ۰.۹۱۶ تا ۰.۹۴۷ · rho_c بین ۰.۹۳۸ تا ۰.۹۵۴ · AVE بین ۰.۶۵۸ تا ۰.۸۰۴. همه بالاتر از آستانه‌ها (۰.۷ و ۰.۵).<br>
      <strong>جدول ۳:</strong> در تمام ۵ سازه، بار خودی حداقل > بار متقابل حداکثر — یعنی هر گویه به سازه خودی خود بیشتر از سایر سازه‌ها تعلق دارد.<br>
      <strong>جدول ۴:</strong> √AVE روی قطر (۰.۸۱۱ تا ۰.۸۹۷) همگی بزرگ‌تر از همبستگی‌های زیرین خودشان هستند.<br><br>
      <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این چهار جدول «چک‌لیست کیفیت ابزار اندازه‌گیری» هستند. سه شرط اساسی: (۱) پایایی — Cronbach α > ۰.۷ ✅ · (۲) روایی همگرا — AVE > ۰.۵ ✅ · (۳) روایی واگرا — √AVE > همبستگی ✅. یعنی ابزار پژوهش از نظر روان‌سنجی «بی‌نقص» است — بدون این تأیید، تفسیر βها معنادار نبود.</div>
    `
  },
  'desc-stats-table-container': {
    title: '📋 تفسیر جدول آمار توصیفی',
    text: `
      <strong>نوع آزمون:</strong> آمار توصیفی — میانگین، انحراف معیار، چولگی، کشیدگی، دامنه<br>
      <strong>متغیرها:</strong> ۵ متغیر زمینه‌ای (جنسیت، سن، تحصیلات، حوزه فعالیت، نوع فعالیت)<br><br>
      <em>چه می‌بینیم و چرا؟</em><br>
      <strong>جنسیت:</strong> توزیع متوازن در نمونه · <strong>سن:</strong> Mean=۲.۷۶، SD=۰.۷۵۸، Skew=۰.۰۸۹ (متقارن)<br>
      <strong>تحصیلات:</strong> Mean=۱.۴۴، SD=۰.۵۷۹، Skew=۰.۹۲۳ (چولگی مثبت به سمت تحصیلات پایین)<br>
      در هیچ متغیری داده گمشده گزارش نشده (Missing=۰).<br><br>
      <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> توزیع متقارن سن (Skew≈۰) تأیید می‌کند نمونه از نظر سنی نماینده جامعه است. چولگی مثبت تحصیلات نشان می‌دهد نمونه به سمت «تحصیلات پایین» متمایل است که در تفسیر نتایج باید لحاظ شود. این جدول، «پایه آماری» تمام تحلیل‌های استنباطی (PLS، مونت‌کارلو، ML) را می‌سازد.</div>
    `
  }
};

const MAIN_TABLE_INTS_EN = {
  'vif-table-container': {
    title: '📊 VIF Table Interpretation',
    text: `
      <strong>Test type:</strong> VIF (Variance Inflation Factor) for multicollinearity among 30 indicators<br>
      <strong>Thresholds:</strong> VIF < 5 (Hair et al. 2022) — under 5 = no issue · 3.3-5 = warning · ≥5 = critical<br><br>
      <em>What we see and why:</em><br>
      All 30 indicators have VIF below 5 — none in the "critical" zone. The highest values are Q11=3.386 (DTL) and Q5=3.341 (DKM). Mean VIF=3.08, in the "acceptable to good" range.<br>
      <div class="reason-text"><strong>Link to research goal:</strong> Multicollinearity inflates β standard errors and destabilizes coefficients. Since all VIFs are under 5, interpreting βs (e.g., DTL→DKM=0.342 as the strongest driver) is statistically valid.</div>
    `
  },
  'reliability-container': {
    title: '🧬 Reliability & Validity Tables Interpretation',
    text: `
      <strong>Test type:</strong> Four standard criteria for measurement model assessment in PLS-SEM<br><br>
      <em>What we see and why:</em><br>
      All 30 factor loadings are above 0.78, Cronbach α between 0.912-0.945, rho_a between 0.916-0.947, rho_c between 0.938-0.954, AVE between 0.658-0.804 — all above thresholds. In all 5 constructs, minimum own loading > maximum cross-loading. √AVE on diagonal (0.811-0.897) exceeds all underlying correlations.<br><br>
      <div class="reason-text"><strong>Link to research goal:</strong> The instrument is psychometrically flawless. Without this confirmation, interpreting βs and MC results would be meaningless. Now we can assert with confidence: "DS, DKM, DTL, DTS, SA are five independent, precisely-measured constructs."</div>
    `
  },
  'desc-stats-table-container': {
    title: '📋 Descriptive Statistics Interpretation',
    text: `
      <strong>Test type:</strong> Descriptive statistics — mean, SD, skewness, kurtosis, range<br><br>
      <em>What we see and why:</em><br>
      Age symmetry (Skew≈0) confirms the sample is age-representative. Positive skew in education indicates the sample leans toward "lower education", which must be considered in interpretation. No missing data (Missing=0).<br><br>
      <div class="reason-text"><strong>Link to research goal:</strong> This table is the "statistical foundation" of all inferential analyses (PLS, Monte Carlo, ML).</div>
    `
  }
};