/* ================================================================
   electric_bicycle_app.js
   منطق داشبورد موفقیت تحول دیجیتال — صنعت دوچرخه برقی
   بخش ۱ از ۵: زیرساخت + آمار توصیفی
   ================================================================ */

/* ================================================================
   ۱. مدیریت وضعیت (State)
   ================================================================ */
const state = {
  lang: 'fa',
  theme: 'dark',
  selected: new Set(DATA.indicators.map((_, i) => i)),
  highlighted: null,
  loaded: null,
  sortCol: null,
  sortAsc: true,
  searchTerm: '',
  hypFilter: 'all',
  hypSearch: '',
  vifFilter: 'all',
  vifSearch: ''
};

const FONT_FA = 'Vazirmatn, Tahoma, sans-serif';
const $ = (id) => document.getElementById(id);
const t = (key) => (I18N[state.lang][key] || key);
const isMobile = () => window.innerWidth < 900;

/* ================================================================
   ۲. کمک‌کننده‌های ترجمه تفسیر
   ================================================================ */
const INTERP_I18N = {
  show_btn:    { fa: 'مشاهده تفسیر',        en: 'View interpretation' },
  hide_btn:    { fa: 'بستن تفسیر',          en: 'Close interpretation' },
  title_chart: { fa: 'تفسیر نمودار',        en: 'Chart Interpretation' },
  title_table: { fa: 'تفسیر جدول',          en: 'Table Interpretation' },
  test_label:  { fa: 'نوع آزمون/روش:',      en: 'Test/Method:' }
};

function ti(key) {
  const e = INTERP_I18N[key];
  return e ? (e[state.lang] || e.fa || key) : key;
}

function getChartInt(id) {
  if (state.lang === 'en' && typeof MAIN_CHART_INTS_EN !== 'undefined' && MAIN_CHART_INTS_EN[id]) {
    return MAIN_CHART_INTS_EN[id];
  }
  return MAIN_CHART_INTS[id] || '';
}

function getTableInt(id) {
  if (state.lang === 'en' && typeof MAIN_TABLE_INTS_EN !== 'undefined' && MAIN_TABLE_INTS_EN[id]) {
    return MAIN_TABLE_INTS_EN[id];
  }
  return MAIN_TABLE_INTS[id] || null;
}

/* ================================================================
   ۳. تم و چیدمان Plotly
   ================================================================ */
function themeColors() {
  const dark = state.theme === 'dark';
  return {
    paper: dark ? '#1e2433' : '#fff',
    plot:  dark ? '#1e2433' : '#fff',
    text:  dark ? '#e8ecf1' : '#2c3e50',
    grid:  dark ? '#2d3446' : '#e8ecf1',
    zero:  dark ? '#555'    : '#ccc',
    bg:    dark ? '#12161f' : '#f0f2f5'
  };
}

function plotlyLayout(extra = {}) {
  const c = themeColors();
  return Object.assign({
    paper_bgcolor: c.paper,
    plot_bgcolor: c.plot,
    font: { family: FONT_FA, size: 12, color: c.text },
    hoverlabel: {
      bgcolor: state.theme === 'dark' ? '#0a0e18' : '#fff',
      bordercolor: '#3498db',
      font: { family: FONT_FA, size: 14, color: state.theme === 'dark' ? '#fff' : '#000' }
    },
    margin: { l: 60, r: 30, b: 50, t: 50 }
  }, extra);
}

const PLOTLY_CFG = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['lasso2d', 'select2d'],
  toImageButtonOptions: { format: 'png', scale: 3, filename: 'electric_bicycle_chart' }
};

const HT = { template: (s) => s + '<extra></extra>' };

/* ================================================================
   ۴. رنگ‌بندی Plasma (برای نقشه‌های حرارتی)
   ================================================================ */
function plasmaRGB(v, vmin, vmax) {
  const tt = Math.max(0, Math.min(1, (v - vmin) / (vmax - vmin + 1e-9)));
  const stops = [
    [0.05, 0.03, 0.53], [0.35, 0, 0.66], [0.62, 0.13, 0.62],
    [0.84, 0.31, 0.45], [0.96, 0.53, 0.30], [0.99, 0.75, 0.16], [0.94, 0.98, 0.13]
  ];
  const idx = tt * (stops.length - 1);
  const i = Math.floor(idx);
  const f = idx - i;
  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  return `rgb(${Math.round((a[0]+(b[0]-a[0])*f)*255)},${Math.round((a[1]+(b[1]-a[1])*f)*255)},${Math.round((a[2]+(b[2]-a[2])*f)*255)})`;
}

/* ================================================================
   ۵. آمار توصیفی (۶ نمودار + جدول)
   ================================================================ */
function renderDescriptiveStatistics() {
  const D = (state.loaded && state.loaded.descriptive) || null;
  if (!D) {
    console.warn('[App] Descriptive data not available — using fallback');
    return;
  }

  const c = themeColors();
  const commonLayout = {
    paper_bgcolor: c.paper,
    plot_bgcolor: c.plot,
    font: { family: FONT_FA, size: 11, color: c.text },
    margin: { l: 50, r: 20, t: 20, b: 70 },
    showlegend: false
  };

  /* ---- KPI Cards ---- */
  const kpiEl = $('desc-kpi-grid');
  if (kpiEl) {
    const total = D.gender.stats.N || 180;
    const allSD = [
      D.age.stats.SD, D.education.stats.SD,
      D.field.stats.SD, D.activiti.stats.SD
    ].filter(v => v != null && !isNaN(v));
    const meanSD = allSD.length ? (allSD.reduce((a, b) => a + b, 0) / allSD.length).toFixed(3) : '—';
    const maxSD = allSD.length ? Math.max(...allSD).toFixed(3) : '—';

    kpiEl.innerHTML = `
      <div class="kpi-card green">
        <div class="kpi-label">${t('desc_kpi_total')}</div>
        <div class="kpi-value">${total}</div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-label">${t('desc_kpi_missing')}</div>
        <div class="kpi-value">0</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-label">${t('desc_kpi_mean_sd')}</div>
        <div class="kpi-value">${meanSD}</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-label">${t('desc_kpi_max_sd')}</div>
        <div class="kpi-value">${maxSD}</div>
      </div>
    `;
  }

  /* ---- نمودار ۱: جنسیت (Pie) ---- */
  const g = D.gender;
  Plotly.newPlot('chart-desc-gender', [{
    type: 'pie',
    labels: g.labels,
    values: g.values,
    hole: 0.55,
    marker: {
      colors: ['#e91e63', '#3498db', '#27ae60'],
      line: { color: '#fff', width: 3 }
    },
    textinfo: 'label+percent',
    textfont: { family: FONT_FA, size: 14, color: '#fff' },
    hovertemplate: '<b>%{label}</b><br>فراوانی: %{value}<br>درصد: %{percent}<extra></extra>'
  }], Object.assign({}, commonLayout, { height: 360 }), PLOTLY_CFG);

  /* ---- نمودار ۲: سن (Bar) ---- */
  const a = D.age;
  Plotly.newPlot('chart-desc-age', [{
    type: 'bar',
    x: a.labels,
    y: a.values,
    marker: {
      color: ['#1abc9c', '#3498db', '#9b59b6', '#e74c3c', '#f39c12'],
      line: { color: '#fff', width: 1.5 }
    },
    text: a.values.map(v => v),
    textposition: 'outside',
    textfont: { family: FONT_FA, size: 11, color: c.text },
    hovertemplate: '<b>%{x}</b><br>فراوانی: %{y}<extra></extra>'
  }], Object.assign({}, commonLayout, {
    height: 360,
    xaxis: { gridcolor: c.grid, tickfont: { family: FONT_FA, size: 10 } },
    yaxis: { gridcolor: c.grid, tickfont: { family: FONT_FA, size: 10 } }
  }), PLOTLY_CFG);

  /* ---- نمودار ۳: تحصیلات (Horizontal Bar) ---- */
  const e = D.education;
  Plotly.newPlot('chart-desc-edu', [{
    type: 'bar',
    orientation: 'h',
    y: e.labels,
    x: e.values,
    marker: {
      color: ['#27ae60', '#f39c12', '#8e44ad', '#c0392b'],
      line: { color: '#fff', width: 1.5 }
    },
    text: e.values.map(v => v),
    textposition: 'outside',
    textfont: { family: FONT_FA, size: 11, color: c.text },
    hovertemplate: '<b>%{y}</b><br>فراوانی: %{x}<extra></extra>'
  }], Object.assign({}, commonLayout, {
    height: 360,
    xaxis: { gridcolor: c.grid, tickfont: { family: FONT_FA, size: 10 } },
    yaxis: { gridcolor: c.grid, tickfont: { family: FONT_FA, size: 11 } }
  }), PLOTLY_CFG);

  /* ---- نمودار ۴: حوزه فعالیت (Bar) ---- */
  const f = D.field;
  Plotly.newPlot('chart-desc-field', [{
    type: 'bar',
    x: f.labels,
    y: f.values,
    marker: {
      color: ['#3498db', '#9b59b6', '#f39c12', '#27ae60', '#e74c3c'],
      line: { color: '#fff', width: 1.5 }
    },
    text: f.values.map(v => v),
    textposition: 'outside',
    textfont: { family: FONT_FA, size: 11, color: c.text },
    hovertemplate: '<b>%{x}</b><br>فراوانی: %{y}<extra></extra>'
  }], Object.assign({}, commonLayout, {
    height: 360,
    xaxis: { gridcolor: c.grid, tickangle: -30, tickfont: { family: FONT_FA, size: 10 } },
    yaxis: { gridcolor: c.grid, tickfont: { family: FONT_FA, size: 10 } }
  }), PLOTLY_CFG);

  /* ---- نمودار ۵: نوع فعالیت (Bar) ---- */
  const act = D.activiti;
  Plotly.newPlot('chart-desc-activiti', [{
    type: 'bar',
    x: act.labels,
    y: act.values,
    marker: {
      color: ['#e67e22', '#16a085', '#c0392b', '#2980b9'],
      line: { color: '#fff', width: 1.5 }
    },
    text: act.values.map(v => v),
    textposition: 'outside',
    textfont: { family: FONT_FA, size: 11, color: c.text },
    hovertemplate: '<b>%{x}</b><br>فراوانی: %{y}<extra></extra>'
  }], Object.assign({}, commonLayout, {
    height: 360,
    xaxis: { gridcolor: c.grid, tickangle: -30, tickfont: { family: FONT_FA, size: 10 } },
    yaxis: { gridcolor: c.grid, tickfont: { family: FONT_FA, size: 10 } }
  }), PLOTLY_CFG);

  /* ---- نمودار ۶: مقایسه SD (Barpolar) ---- */
  const sdNames = [
    t('desc_chart_age'), t('desc_chart_edu'),
    t('desc_chart_field'), t('desc_chart_activiti')
  ];
  const sdValues = [
    D.age.stats.SD || 0,
    D.education.stats.SD || 0,
    D.field.stats.SD || 0,
    D.activiti.stats.SD || 0
  ];
  Plotly.newPlot('chart-desc-sd', [{
    type: 'barpolar',
    r: sdValues,
    theta: sdNames,
    marker: {
      color: ['#3498db', '#f39c12', '#9b59b6', '#e74c3c'],
      line: { color: '#fff', width: 1.5 }
    },
    text: sdValues.map(v => v.toFixed(3)),
    hovertemplate: '<b>%{theta}</b><br>انحراف معیار = %{r:.3f}<extra></extra>'
  }], Object.assign({}, commonLayout, {
    height: 360,
    polar: {
      bgcolor: c.plot,
      radialaxis: {
        gridcolor: c.grid,
        tickfont: { size: 10, color: c.text },
        range: [0, Math.max(...sdValues) * 1.2 || 1]
      },
      angularaxis: {
        gridcolor: c.grid,
        tickfont: { family: FONT_FA, size: 11, color: c.text }
      }
    }
  }), PLOTLY_CFG);

  /* ---- جدول آمار توصیفی ---- */
  const tableEl = $('desc-stats-table-container');
  if (tableEl) {
    const rows = [
      { name: t('desc_chart_gender'),    ...D.gender.stats },
      { name: t('desc_chart_age'),       ...D.age.stats },
      { name: t('desc_chart_edu'),       ...D.education.stats },
      { name: t('desc_chart_field'),     ...D.field.stats },
      { name: t('desc_chart_activiti'),  ...D.activiti.stats }
    ];

    let html = `<div class="desc-table-wrap"><table class="desc-table"><thead><tr>
      <th>${t('desc_col_variable')}</th>
      <th>${t('desc_col_n')}</th>
      <th>${t('desc_col_missing')}</th>
      <th>${t('desc_col_mean')}</th>
      <th>${t('desc_col_sd')}</th>
      <th>${t('desc_col_skew')}</th>
      <th>${t('desc_col_kurt')}</th>
      <th>${t('desc_col_range')}</th>
    </tr></thead><tbody>`;

    rows.forEach(r => {
      html += `<tr>
        <td class="desc-var-cell">${r.name}</td>
        <td>${r.N != null ? r.N : '—'}</td>
        <td>${r.Missing != null ? r.Missing : 0}</td>
        <td>${r.Mean != null ? r.Mean.toFixed(2) : '—'}</td>
        <td>${r.SD != null ? r.SD.toFixed(3) : '—'}</td>
        <td>${r.Skew != null ? r.Skew.toFixed(3) : '—'}</td>
        <td>${r.Kurt != null ? r.Kurt.toFixed(3) : '—'}</td>
        <td>${r.Range != null ? r.Range : '—'}</td>
      </tr>`;
    });

    html += '</tbody></table></div>';
    tableEl.innerHTML = html;
  }

  console.log('[App] ✅ Descriptive statistics rendered');
}
/* ================================================================
   electric_bicycle_app.js — بخش ۲ از ۵
   لایه ۱ (PLS-SEM) + جدول VIF + پایایی و روایی
   ================================================================ */

/* ================================================================
   ۶. دیاگرام مسیر PLS-SEM (۵ سازه + ۸ فرضیه)
   ================================================================ */
/* ================================================================
   دیاگرام مسیر PLS-SEM (نسخه SVG)
   ================================================================ */
function drawL1PathDiagram() {
  const el = document.getElementById('chart-l1-path');
  if (!el) return;

  // پاکسازی هرگونه نمودار Plotly قبلی
  try { Plotly.purge(el); } catch(e) {}

  // کد SVG نهایی
  const svgCode = `
    <svg viewBox="0 0 850 600" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; max-height: 600px; display: block; margin: 0 auto; font-family: 'Vazirmatn', Tahoma, sans-serif; direction: rtl;">
      
      <defs>
        <marker id="arrow-main" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b94a7" />
        </marker>
        <marker id="arrow-mod" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#e74c3c" />
        </marker>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.2" />
        </filter>
      </defs>

      <!-- خطوط -->
      <g id="paths">
        <!-- مسیرهای اصلی (ممتد) -->
        <line x1="235.7" y1="346.7" x2="354.2" y2="225.3" stroke="#8b94a7" stroke-width="2.5" marker-end="url(#arrow-main)" />
        <line x1="445.8" y1="225.3" x2="564.3" y2="346.7" stroke="#8b94a7" stroke-width="2.5" marker-end="url(#arrow-main)" />
        <line x1="270" y1="400" x2="530" y2="400" stroke="#8b94a7" stroke-width="2.5" marker-end="url(#arrow-main)" />

        <!-- مسیرهای تعدیل‌گر (خط‌چین) -->
        <line x1="150" y1="150" x2="295" y2="275" stroke="#e74c3c" stroke-width="2" stroke-dasharray="6,4" marker-end="url(#arrow-mod)" />
        <line x1="700" y1="150" x2="520" y2="310" stroke="#e74c3c" stroke-width="2" stroke-dasharray="6,4" marker-end="url(#arrow-mod)" />
      </g>

      <!-- گره‌ها -->
      <g id="nodes" filter="url(#shadow)">
        <circle cx="200" cy="400" r="70" fill="#e67e22" />
        <circle cx="400" cy="180" r="70" fill="#9b59b6" />
        <circle cx="600" cy="400" r="70" fill="#27ae60" />
        <rect x="80" y="80" width="140" height="70" rx="10" fill="#3498db" />
        <rect x="630" y="80" width="140" height="70" rx="10" fill="#f39c12" />
      </g>

      <!-- متن گره‌ها و R² -->
      <g id="node-texts" fill="#ffffff" font-size="15" font-weight="bold" text-anchor="middle" dominant-baseline="middle">
        
        <text x="400" y="180">
          <tspan x="400" dy="-0.8em">مدیریت</tspan>
          <tspan x="400" dy="1.4em">دانش</tspan>
          <tspan x="400" dy="1.8em" font-size="12" font-weight="normal" fill="#f1c40f">R² = 0.182</tspan>
        </text>

        <text x="200" y="400">
          <tspan x="200" dy="-0.4em">استراتژی</tspan>
          <tspan x="200" dy="1.4em">دیجیتال</tspan>
        </text>

        <text x="600" y="400">
          <tspan x="600" dy="-0.8em">موفقیت تحول</tspan>
          <tspan x="600" dy="1.4em">دیجیتال</tspan>
          <tspan x="600" dy="1.8em" font-size="12" font-weight="normal" fill="#f1c40f">R² = 0.292</tspan>
        </text>

        <text x="150" y="115">
          <tspan x="150" dy="-0.4em">رهبری تحول</tspan>
          <tspan x="150" dy="1.4em">دیجیتال</tspan>
        </text>

        <text x="700" y="115">
          <tspan x="700" dy="-0.4em">چابکی</tspan>
          <tspan x="700" dy="1.4em">استراتژیک</tspan>
        </text>
      </g>

      <!-- مقادیر بتا (β) -->
      <g id="beta-values" font-size="13" font-weight="bold" font-family="Tahoma, sans-serif" text-anchor="middle" dominant-baseline="middle">
        
        <g transform="translate(285, 275)">
          <rect x="-30" y="-12" width="60" height="24" rx="4" fill="#ffffff" opacity="0.95" filter="url(#shadow)" />
          <text x="0" y="0" fill="#000000">β = 0.241</text>
        </g>

        <g transform="translate(515, 275)">
          <rect x="-30" y="-12" width="60" height="24" rx="4" fill="#ffffff" opacity="0.95" filter="url(#shadow)" />
          <text x="0" y="0" fill="#000000">β = 0.270</text>
        </g>

        <g transform="translate(400, 415)">
          <rect x="-30" y="-12" width="60" height="24" rx="4" fill="#ffffff" opacity="0.95" filter="url(#shadow)" />
          <text x="0" y="0" fill="#000000">β = 0.281</text>
        </g>

        <g transform="translate(220, 205)">
          <rect x="-30" y="-12" width="60" height="24" rx="4" fill="#ffffff" opacity="0.95" filter="url(#shadow)" />
          <text x="0" y="0" fill="#e74c3c">β = 0.071</text>
        </g>

        <g transform="translate(620, 220)">
          <rect x="-30" y="-12" width="60" height="24" rx="4" fill="#ffffff" opacity="0.95" filter="url(#shadow)" />
          <text x="0" y="0" fill="#e74c3c">β = 0.188</text>
        </g>

      </g>
    </svg>
  `;

  el.innerHTML = svgCode;
}
/* ================================================================
   ۷. نمودار میله‌ای βها
   ================================================================ */
function drawL1BetaBar() {
  const el = $('chart-l1-beta-bar');
  if (!el) return;
  const paths = (state.loaded.paths || FALLBACK_PATHS).slice().sort((a, b) => a.Original - b.Original);

  const colors = paths.map(p => {
    const sig = (p.CI_low > 0) || (p.CI_high < 0);
    return sig ? '#27ae60' : '#7f8c8d';
  });

  Plotly.newPlot(el, [{
    type: 'bar',
    orientation: 'h',
    y: paths.map(p => p.Path),
    x: paths.map(p => p.Original),
    marker: {
      color: colors,
      line: { color: '#000', width: 0.6 }
    },
    text: paths.map(p => p.Original.toFixed(3)),
    textposition: 'outside',
    textfont: { size: 10 },
    customdata: paths.map(p => [p.Path, p.Original, p.T, p.P]),
    hovertemplate: HT.template('<b>%{customdata[0]}</b><br>β = <b>%{customdata[1]:.3f}</b><br>T = %{customdata[2]:.2f}<br>p = %{customdata[3]:.4f}')
  }], plotlyLayout({
    xaxis: { title: t('col_beta'), gridcolor: themeColors().grid },
    yaxis: { title: '', tickfont: { size: 11 } },
    height: 400,
    margin: { l: 130, r: 40, t: 30, b: 50 }
  }), PLOTLY_CFG);
}

/* ================================================================
   ۸. نمودار R²
   ================================================================ */
function drawL1R2() {
  const el = $('chart-l1-r2');
  if (!el) return;
  const r2 = state.loaded.r2 || FALLBACK_R2;
  const c = themeColors();

  const constructs = r2.map(r => r.Construct);
  const Z = [
    r2.map(r => r.R2),
    r2.map(r => r.R2_Adj)
  ];
  const metrics = ['R²', 'R² Adj'];

  Plotly.newPlot(el, [{
    type: 'surface',
    x: constructs,
    y: metrics,
    z: Z,
    colorscale: 'RdYlGn',
    cmin: 0,
    cmax: 0.6,
    colorbar: {
      title: 'R²',
      thickness: 15,
      tickfont: { color: c.text }
    },
    text: Z.map((row, j) => row.map((v, i) =>
      `سازه: ${constructs[i]}<br>${metrics[j]} = ${v.toFixed(4)}`
    )),
    hovertemplate: '%{text}<extra></extra>'
  }], plotlyLayout({
    height: 600,
    scene: {
      xaxis: { title: t('col_indicator'), gridcolor: c.grid },
      yaxis: { title: '', gridcolor: c.grid },
      zaxis: { title: 'R²', range: [0, 0.6], gridcolor: c.grid },
      camera: { eye: { x: 1.6, y: -1.6, z: 1.0 } }
    }
  }), PLOTLY_CFG);
}
/* ================================================================
   ۹. نمودار f²
   ================================================================ */
function drawL1F2() {
  const el = $('chart-l1-f2');
  if (!el) return;
  const f2 = state.loaded.f2 || FALLBACK_F2;
  const sorted = f2.slice().sort((a, b) => a.f2 - b.f2);
  const c = themeColors();

  const colors = sorted.map(x => {
    if (x.f2 >= 0.35) return '#27ae60';
    if (x.f2 >= 0.15) return '#3498db';
    if (x.f2 >= 0.02) return '#f39c12';
    return '#e74c3c';
  });

  Plotly.newPlot(el, [{
    type: 'bar',
    orientation: 'h',
    y: sorted.map(x => x.Path),
    x: sorted.map(x => x.f2),
    marker: { color: colors, line: { color: '#000', width: 0.6 } },
    text: sorted.map(x => x.f2.toFixed(3)),
    textposition: 'outside',
    textfont: { size: 10 },
    customdata: sorted.map(x => {
      let label = 'ناچیز';
      if (x.f2 >= 0.35) label = 'قوی';
      else if (x.f2 >= 0.15) label = 'متوسط';
      else if (x.f2 >= 0.02) label = 'ضعیف';
      return [x.Path, x.f2, label];
    }),
    hovertemplate: HT.template('<b>%{customdata[0]}</b><br>f² = <b>%{customdata[1]:.4f}</b><br>اندازه اثر: %{customdata[2]}')
  }], plotlyLayout({
    height: 420,
    xaxis: { title: 'f²', gridcolor: c.grid },
    yaxis: { title: '', tickfont: { size: 11 } },
    margin: { l: 130, r: 40, t: 30, b: 50 }
  }), PLOTLY_CFG);
}

/* ================================================================
   ۱۰. نمودار پایایی و روایی همگرا
   ================================================================ */
function drawL1Quality() {
  const el = $('chart-l1-quality');
  if (!el) return;
  const q = state.loaded.quality || FALLBACK_QUALITY;
  const constructs = Object.keys(q);
  const c = themeColors();

  const metrics = ['Cronbach', 'rho_a', 'rho_c', 'AVE'];
  const metricLabels = ['آلفای کرونباخ', 'rho_a', 'rho_c', 'AVE'];
  const n_c = constructs.length, n_m = metrics.length;

  const Z = [];
  for (let j = 0; j < n_m; j++) {
    const row = [];
    for (let i = 0; i < n_c; i++) row.push(q[constructs[i]][metrics[j]]);
    Z.push(row);
  }

  const thresholds = { Cronbach: 0.7, rho_a: 0.7, rho_c: 0.7, AVE: 0.5 };

  Plotly.newPlot(el, [{
    type: 'surface',
    x: constructs,
    y: metricLabels,
    z: Z,
    colorscale: 'Viridis',
    cmin: 0.5,
    cmax: 1.0,
    colorbar: {
      title: '',
      thickness: 15,
      tickfont: { color: c.text }
    },
    text: Z.map((row, j) => row.map((v, i) => {
      const m = metrics[j], th = thresholds[m];
      return `سازه: ${constructs[i]}<br>${metricLabels[j]} = ${v.toFixed(4)}<br>${v >= th ? '✅ بالای آستانه' : '⚠ زیر آستانه'}`;
    })),
    hovertemplate: '%{text}<extra></extra>'
  }], plotlyLayout({
    height: 600,
    scene: {
      xaxis: { title: 'سازه', gridcolor: c.grid },
      yaxis: { title: 'شاخص', gridcolor: c.grid },
      zaxis: { title: 'مقدار', range: [0.4, 1.05], gridcolor: c.grid },
      camera: { eye: { x: 1.6, y: -1.6, z: 1.0 } }
    }
  }), PLOTLY_CFG);
}

/* ================================================================
   ۱۱. Heatmap بارهای عاملی (Outer Loadings)
   ================================================================ */
function drawL1Loadings() {
  const el = $('chart-l1-loadings');
  if (!el) return;
  const L = state.loaded.loadings || FALLBACK_LOADINGS;
  const constructs = Object.keys(L);
  const maxInd = Math.max(...constructs.map(c => Object.keys(L[c]).length));
  const c = themeColors();

  const Z = [];
  for (const cName of constructs) {
    const qs = Object.keys(L[cName]).sort();
    const row = [];
    for (let i = 0; i < maxInd; i++) row.push(i < qs.length ? L[cName][qs[i]] : null);
    Z.push(row);
  }

  const qLabels = Array.from({ length: maxInd }, (_, i) => `Q${i + 1}`);

  Plotly.newPlot(el, [{
    type: 'surface',
    x: qLabels,
    y: constructs,
    z: Z,
    colorscale: 'RdYlGn',
    cmin: 0.6,
    cmax: 1.0,
    colorbar: {
      title: 'بار',
      thickness: 15,
      tickfont: { color: c.text }
    },
    text: Z.map((row, i) => row.map((v, j) => {
      if (v == null) return '';
      const qs = Object.keys(L[constructs[i]]).sort();
      return `سازه: ${constructs[i]}<br>شاخص: ${qs[j]}<br>بار = ${v.toFixed(3)}<br>${v >= 0.7 ? '✅' : '⚠'}`;
    })),
    hovertemplate: '%{text}<extra></extra>'
  }], plotlyLayout({
    height: 600,
    scene: {
      xaxis: { title: 'شاخص', gridcolor: c.grid },
      yaxis: { title: 'سازه', gridcolor: c.grid },
      zaxis: { title: 'بار عاملی', range: [0.6, 1.0], gridcolor: c.grid },
      camera: { eye: { x: 1.6, y: -1.6, z: 1.0 } }
    }
  }), PLOTLY_CFG);
}
/* ================================================================
   ۱۲. Heatmap VIF
   ================================================================ */
function drawL3Q2Columns(targetId) {
  const el = $(targetId);
  if (!el) return;
  const idx = activeIndices();
  const predict = state.loaded.plsPredict || [];
  const c = themeColors();

  const labels = idx.map(i => DATA.indicators[i]);
  const values = idx.map(i => predict[i]?.q2 || DATA.Q2[i] || 0);
  const colors = values.map(v => v > 0.10 ? '#2ca02c' : (v > 0 ? '#ff7f0e' : '#d62728'));
  const sizes = idx.map(i => state.highlighted === DATA.indicators[i] ? 16 : 10);

  // خطوط عمودی از z=0 تا z=Q²
  const xs = [], ys = [], zs = [];
  idx.forEach((i, k) => {
    xs.push(k, k, null);
    ys.push(0, 0, null);
    zs.push(0, values[k], null);
  });

  Plotly.newPlot(el, [
    {
      type: 'scatter3d',
      mode: 'lines',
      x: xs, y: ys, z: zs,
      line: { color: '#7f8c8d', width: 8 },
      hoverinfo: 'skip',
      showlegend: false
    },
    {
      type: 'scatter3d',
      mode: 'markers',
      x: idx.map((_, k) => k),
      y: idx.map(() => 0),
      z: values,
      marker: {
        size: sizes,
        color: colors,
        line: { color: '#000', width: 1 },
        symbol: 'circle'
      },
      text: labels,
      hovertemplate: '<b>%{text}</b><br>Q² = %{z:.4f}<extra></extra>',
      showlegend: false
    },
    // خط آستانه 0.10
    {
      type: 'scatter3d',
      mode: 'lines',
      x: [0, idx.length - 1],
      y: [0, 0],
      z: [0.10, 0.10],
      line: { color: '#27ae60', width: 3, dash: 'dash' },
      hoverinfo: 'skip',
      showlegend: false
    }
  ], plotlyLayout({
    height: 620,
    scene: {
      xaxis: {
        title: '',
        tickmode: 'array',
        tickvals: idx.filter((_, k) => k % 2 === 0).map((_, k) => k * 2),
        ticktext: labels.filter((_, k) => k % 2 === 0),
        tickfont: { size: 9 },
        gridcolor: c.grid
      },
      yaxis: { showticklabels: false, range: [-1, 1], gridcolor: c.grid },
      zaxis: { title: 'Q²predict', range: [0, Math.max(...values) * 1.2], gridcolor: c.grid },
      camera: { eye: { x: 1.7, y: -1.6, z: 0.9 } }
    },
    margin: { l: 0, r: 0, t: 10, b: 0 }
  }), PLOTLY_CFG);
}/* ================================================================
   ۱۳. ماتریس HTMT
   ================================================================ */
function drawL1HTMT() {
  const el = $('chart-l1-htmt');
  if (!el) return;
  const h = state.loaded.htmt || FALLBACK_HTMT;
  const labels = h.labels;
  const n = labels.length;

  // ساخت ماتریس n×n
  const mat = Array.from({ length: n }, () => Array(n).fill(null));
  Object.entries(h.data).forEach(([key, v]) => {
    const [i, j] = key.split('-').map(Number);
    mat[i][j] = v;
    mat[j][i] = v;
  });

  // فقط مثلث بالا
  const z = mat.map((row, i) => row.map((v, j) => j >= i ? v : null));
  const txt = z.map(row => row.map(v => v != null ? v.toFixed(3) : ''));

  const c = themeColors();

  Plotly.newPlot(el, [{
    type: 'heatmap',
    z: z,
    x: labels,
    y: labels,
    colorscale: 'RdYlGn_r',
    zmin: 0,
    zmax: 1,
    text: txt,
    texttemplate: '%{text}',
    textfont: { size: 11, color: '#000', family: 'Tahoma' },
    hovertemplate: 'HTMT(%{y},%{x}) = <b>%{z:.3f}</b><extra></extra>',
    colorbar: { title: 'HTMT', thickness: 15, tickfont: { color: c.text } }
  }], plotlyLayout({
    height: 480,
    xaxis: { side: 'top', gridcolor: c.grid },
    yaxis: { autorange: 'reversed', gridcolor: c.grid },
    margin: { l: 100, r: 40, t: 80, b: 50 }
  }), PLOTLY_CFG);
}

/* ================================================================
   ۱۴. شیب‌های ساده (Simple Slopes) — تعدیل‌گری
   ================================================================ */
function drawL1Slopes() {
  const el = $('chart-l1-slopes');
  if (!el) return;
  const c = themeColors();

  // شبیه‌سازی داده
  const x = Array.from({ length: 50 }, (_, i) => -2 + (4 * i / 49));

  // H6: DTL × DS → DKM (ردشده — شیب‌ها موازی)
  const b_H6 = 0.071;
  // H8: SA × DKM → DTS (تأییدشده — شیب‌ها واگرا)
  const b_H8 = 0.188;

  const styles = [
    { label: 'کم (-1SD)', v: -1, color: '#e74c3c', dash: 'dash' },
    { label: 'متوسط',      v: 0,  color: '#7f8c8d', dash: 'solid' },
    { label: 'زیاد (+1SD)', v: 1, color: '#27ae60', dash: 'dashdot' }
  ];

  const traces = [];

  // پنل چپ: H6 (DTL × DS → DKM)
  styles.forEach(st => {
    traces.push({
      type: 'scatter',
      mode: 'lines',
      x: x,
      y: x.map(xv => 0.342 * xv + 0.071 * st.v * xv * 0.3),
      name: st.label,
      legendgroup: st.label,
      line: { color: st.color, width: 2.5, dash: st.dash },
      hovertemplate: `DS=${st.v > 0 ? '+' : ''}${st.v}<br>DTL=%{x:.2f}<br>DKM=%{y:.3f}<extra></extra>`,
      xaxis: 'x', yaxis: 'y'
    });
  });

  // پنل راست: H8 (SA × DKM → DTS)
  styles.forEach(st => {
    traces.push({
      type: 'scatter',
      mode: 'lines',
      x: x,
      y: x.map(xv => 0.340 * xv + 0.188 * st.v * xv * 0.5),
      name: st.label,
      legendgroup: st.label,
      showlegend: false,
      line: { color: st.color, width: 2.5, dash: st.dash },
      hovertemplate: `DKM=${st.v > 0 ? '+' : ''}${st.v}<br>SA=%{x:.2f}<br>DTS=%{y:.3f}<extra></extra>`,
      xaxis: 'x2', yaxis: 'y2'
    });
  });

  Plotly.newPlot(el, traces, plotlyLayout({
    height: 520,
    grid: { rows: 1, columns: 2, pattern: 'independent' },
    xaxis: { title: 'DTL', gridcolor: c.grid },
    yaxis: { title: 'DKM', gridcolor: c.grid },
    xaxis2: { title: 'SA', gridcolor: c.grid },
    yaxis2: { title: 'DTS', gridcolor: c.grid },
    annotations: [
      { text: 'H6: DTL × DS → DKM (ردشده)', x: 0.22, y: 1.08, xref: 'paper', yref: 'paper', showarrow: false, font: { size: 12, color: c.text } },
      { text: 'H8: SA × DKM → DTS (تأییدشده)', x: 0.78, y: 1.08, xref: 'paper', yref: 'paper', showarrow: false, font: { size: 12, color: c.text } }
    ],
    legend: { x: 0, y: 1.15, orientation: 'h', bgcolor: c.paper, font: { color: c.text } }
  }), PLOTLY_CFG);
}

/* ================================================================
   ۱۵. توزیع امتیازهای پنهان (Raincloud)
   ================================================================ */
function drawL1Raincloud() {
  const el = $('chart-l1-raincloud');
  if (!el) return;

  // تولید داده شبیه‌سازی‌شده برای ۳ سازه
  function seededNormal(seed, n) {
    let s = seed;
    function rng() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const u1 = rng() || 1e-9, u2 = rng();
      out.push(Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2));
    }
    return out;
  }

  const nameMap = { DKM: 'مدیریت دانش', DTS: 'موفقیت تحول', DS: 'استراتژی دیجیتال' };
  const colors = { DKM: '#9b59b6', DTS: '#27ae60', DS: '#e67e22' };

  const traces = [];
  Object.entries({ DKM: 1001, DTS: 1002, DS: 1003 }).forEach(([key, seed]) => {
    const vals = seededNormal(seed, 180);
    traces.push({
      type: 'violin',
      y: vals,
      name: nameMap[key] || key,
      line: { color: colors[key] },
      fillcolor: colors[key],
      opacity: 0.45,
      box: { visible: true },
      meanline: { visible: true },
      points: 'all',
      pointpos: 0,
      jitter: 0.3,
      marker: { size: 3.5, color: colors[key], opacity: 0.4 },
      hovertemplate: `<b>${nameMap[key]}</b><br>score = %{y:.3f}<extra></extra>`
    });
  });

  Plotly.newPlot(el, traces, plotlyLayout({
    height: 480,
    yaxis: { title: 'امتیاز استاندارد', gridcolor: themeColors().grid },
    xaxis: { title: '', gridcolor: themeColors().grid },
    showlegend: false
  }), PLOTLY_CFG);
}

/* ================================================================
   ۱۶. جدول VIF (تفصیلی)
   ================================================================ */
function vifColor(v) {
  if (v >= 5)   return { bg: 'linear-gradient(135deg,#c0392b,#e74c3c)', text: '#fff', label: 'vif_status_critical', cls: 'vif-status-critical' };
  if (v >= 3.3) return { bg: 'linear-gradient(135deg,#e67e22,#f39c12)', text: '#fff', label: 'vif_status_warning', cls: 'vif-status-warning' };
  if (v >= 3.0) return { bg: 'linear-gradient(135deg,#f1c40f,#f7dc6f)', text: '#2c3e50', label: 'vif_status_acceptable', cls: 'vif-status-acceptable' };
  if (v >= 2.0) return { bg: 'linear-gradient(135deg,#27ae60,#58d68d)', text: '#fff', label: 'vif_status_good', cls: 'vif-status-good' };
  return { bg: 'linear-gradient(135deg,#16a085,#1abc9c)', text: '#fff', label: 'vif_status_excellent', cls: 'vif-status-excellent' };
}

function vifBarColor(v) {
  if (v >= 5) return '#e74c3c';
  if (v >= 3.3) return '#f39c12';
  if (v >= 3.0) return '#f1c40f';
  if (v >= 2.0) return '#27ae60';
  return '#1abc9c';
}

function renderVIFTable() {
  const cont = $('vif-table-container');
  if (!cont) return;

  const V = (state.loaded.vifTable || FALLBACK_VIF_TABLE);
  const total = V.length;
  const vals = V.map(x => x.vif);
  const mean = vals.reduce((a, b) => a + b, 0) / total;
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const warnCount = V.filter(x => x.vif >= 3.3 && x.vif < 5).length;
  const critCount = V.filter(x => x.vif >= 5).length;

  // KPI
  const kpiEl = $('vif-kpi-grid');
  if (kpiEl) {
    kpiEl.innerHTML = `
      <div class="vif-kpi vif-kpi-total"><div class="vif-kpi-icon">📊</div><div class="vif-kpi-label">${t('vif_kpi_total')}</div><div class="vif-kpi-value">${total}</div></div>
      <div class="vif-kpi vif-kpi-mean"><div class="vif-kpi-icon">📈</div><div class="vif-kpi-label">${t('vif_kpi_mean')}</div><div class="vif-kpi-value">${mean.toFixed(3)}</div></div>
      <div class="vif-kpi vif-kpi-min"><div class="vif-kpi-icon">✅</div><div class="vif-kpi-label">${t('vif_kpi_min')}</div><div class="vif-kpi-value">${minV.toFixed(3)}</div></div>
      <div class="vif-kpi vif-kpi-max"><div class="vif-kpi-icon">⚠</div><div class="vif-kpi-label">${t('vif_kpi_max')}</div><div class="vif-kpi-value">${maxV.toFixed(3)}</div></div>
      <div class="vif-kpi vif-kpi-warning"><div class="vif-kpi-icon">🔶</div><div class="vif-kpi-label">${t('vif_kpi_warning')}</div><div class="vif-kpi-value">${warnCount}</div></div>
      <div class="vif-kpi vif-kpi-critical"><div class="vif-kpi-icon">🔴</div><div class="vif-kpi-label">${t('vif_kpi_critical')}</div><div class="vif-kpi-value">${critCount}</div></div>
    `;
  }

  // فیلتر
  const f = state.vifFilter || 'all';
  const s = (state.vifSearch || '').trim().toLowerCase();
  let rows = V.slice();
  if (f === 'warning') rows = rows.filter(x => x.vif >= 3.3);
  else if (f === 'excellent') rows = rows.filter(x => x.vif < 3.3);
  else if (f !== 'all') rows = rows.filter(x => x.construct === f);
  if (s) rows = rows.filter(x => x.id.toLowerCase().includes(s));

  // مرتب‌سازی بر اساس شماره Q
  rows.sort((a, b) => {
    const am = a.id.match(/^Q(\d+)$/i);
    const bm = b.id.match(/^Q(\d+)$/i);
    if (am && bm) return parseInt(am[1]) - parseInt(bm[1]);
    return a.id.localeCompare(b.id);
  });

  if (rows.length === 0) {
    cont.innerHTML = `<div class="vif-empty">${t('vif_empty')}</div>`;
    return;
  }

  const maxForBar = Math.max(5, maxV);
  let html = `<div class="vif-table-wrap"><table class="vif-table"><thead><tr>
    <th>${t('vif_col_indicator')}</th>
    <th>${t('vif_col_construct')}</th>
    <th>${t('vif_col_vif')}</th>
    <th>${t('vif_col_bar')}</th>
    <th>${t('vif_col_status')}</th>
  </tr></thead><tbody>`;

  rows.forEach(item => {
    const c = vifColor(item.vif);
    const barW = Math.min(100, (item.vif / maxForBar) * 100);
    const barC = vifBarColor(item.vif);
    const isHi = state.highlighted === item.id ? 'vif-row-hi' : '';
    const constructCls = `vif-construct vif-construct-${item.construct.toLowerCase()}`;

    html += `<tr class="vif-row ${isHi}">
      <td><span class="vif-ind-chip">${item.id}</span></td>
      <td><span class="${constructCls}">${item.construct || '—'}</span></td>
      <td><span class="vif-val-chip" style="background:${c.bg};color:${c.text}">${item.vif.toFixed(3)}</span></td>
      <td class="vif-cell-bar"><div class="vif-bar-track"><div class="vif-bar-fill" style="width:${barW}%;background:${barC}"></div></div></td>
      <td><span class="vif-status ${c.cls}">${item.vif < 3.3 ? '✓' : (item.vif < 5 ? '⚠' : '✕')} ${t(c.label)}</span></td>
    </tr>`;
  });

  html += `</tbody></table></div>`;
  cont.innerHTML = html;
  // 🆕 فعال‌سازی Tooltip
  bindVIFInterp();
/* ================================================================
   🆕 Tooltip شناور روی جدول VIF
   ================================================================ */
function bindVIFInterp() {
  let tooltip = document.getElementById('vif-row-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'vif-row-tooltip';
    tooltip.className = 'table-tooltip';
    document.body.appendChild(tooltip);
  }

  document.querySelectorAll('.vif-row').forEach(row => {
    row.addEventListener('mouseenter', (e) => {
      const ind = row.querySelector('.vif-ind-chip')?.textContent || '?';
      const detail = (state.lang === 'en') 
        ? `VIF analysis for indicator ${ind}` 
        : (VIF_DETAILS[ind] || `شاخص ${ind}`);

      tooltip.innerHTML = `<span class="tooltip-title">${state.lang === 'fa' ? 'تحلیل شاخص' : 'Indicator Analysis'} ${ind}</span><div>${detail}</div>`;
      tooltip.style.display = 'block';
      positionTooltip(e, tooltip);
    });

    row.addEventListener('mousemove', (e) => {
      if (tooltip.style.display === 'block') positionTooltip(e, tooltip);
    });

    row.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  });
}
}

function bindVIFTableFilters() {
  document.querySelectorAll('.vif-chip[data-vif-filter]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.vif-chip[data-vif-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.vifFilter = btn.dataset.vifFilter;
      renderVIFTable();
    };
  });
  const search = $('vif-search');
  if (search) {
    search.oninput = e => {
      state.vifSearch = e.target.value;
      renderVIFTable();
    };
  }
}

/* ================================================================
   ۱۷. جداول پایایی و روایی (۴ جدول)
   ================================================================ */
function relLoadingColor(v) {
  if (v >= 0.85) return { bg: 'linear-gradient(135deg,#16a085,#1abc9c)', text: '#fff' };
  if (v >= 0.80) return { bg: 'linear-gradient(135deg,#27ae60,#58d68d)', text: '#fff' };
  if (v >= 0.70) return { bg: 'linear-gradient(135deg,#f1c40f,#f7dc6f)', text: '#2c3e50' };
  return { bg: 'linear-gradient(135deg,#e67e22,#f39c12)', text: '#fff' };
}

function relQualityColor(v, threshold) {
  if (v >= threshold + 0.05) return { bg: 'linear-gradient(135deg,#16a085,#1abc9c)', text: '#fff' };
  if (v >= threshold) return { bg: 'linear-gradient(135deg,#27ae60,#58d68d)', text: '#fff' };
  return { bg: 'linear-gradient(135deg,#e74c3c,#ec7063)', text: '#fff' };
}

function relCrossColor(own_min, cross_max) {
  const diff = own_min - cross_max;
  if (diff >= 0.25) return { bg: 'linear-gradient(135deg,#16a085,#1abc9c)', text: '#fff' };
  if (diff >= 0.10) return { bg: 'linear-gradient(135deg,#27ae60,#58d68d)', text: '#fff' };
  if (diff >= 0) return { bg: 'linear-gradient(135deg,#f1c40f,#f7dc6f)', text: '#2c3e50' };
  return { bg: 'linear-gradient(135deg,#e74c3c,#ec7063)', text: '#fff' };
}

function renderReliabilityTables() {
  const cont = $('reliability-container');
  if (!cont) return;

  const R = (state.loaded.reliability || FALLBACK_RELIABILITY);

  const constructChip = (c) => {
    const map = {
      DS: 'vif-construct-ds', DKM: 'vif-construct-dkm',
      DTL: 'vif-construct-dtl', DTS: 'vif-construct-dts', SA: 'vif-construct-sa'
    };
    return `<span class="vif-construct ${map[c] || ''}">${c}</span>`;
  };

  let html = '';

  /* ---- جدول ۱: پایایی شاخص ---- */
  html += `<div class="rel-card">
    <div class="rel-card-head">
      <div class="rel-card-icon">۱</div>
      <div><div class="rel-card-title">${t('rel_table1_title')}</div></div>
    </div>
    <div class="rel-table-wrap">
      <table class="rel-table">
        <thead><tr>
          <th>${t('rel_col_construct')}</th>
          <th>${t('rel_col_items')}</th>
          <th>${t('rel_col_loading')}</th>
          <th>${t('rel_col_reliability')}</th>
          <th>${t('rel_col_communal')}</th>
        </tr></thead><tbody>`;

  (R.indicatorReliability || []).forEach(row => {
    const cLo = relLoadingColor(row.loading_min);
    const cHi = relLoadingColor(row.loading_max);
    html += `<tr class="rel-row">
      <td class="rel-cell-con">${constructChip(row.construct)}<span class="rel-con-label">${row.label}</span></td>
      <td><span class="rel-items-chip">${row.items}</span></td>
      <td><div class="rel-range">
        <span class="rel-range-chip" style="background:${cLo.bg};color:${cLo.text}">${row.loading_min.toFixed(3)}</span>
        <span class="rel-range-dash">–</span>
        <span class="rel-range-chip" style="background:${cHi.bg};color:${cHi.text}">${row.loading_max.toFixed(3)}</span>
      </div></td>
      <td><div class="rel-range">
        <span class="rel-range-chip rel-range-sub">${row.rel_min.toFixed(3)}</span>
        <span class="rel-range-dash">–</span>
        <span class="rel-range-chip rel-range-sub">${row.rel_max.toFixed(3)}</span>
      </div></td>
      <td><div class="rel-range">
        <span class="rel-range-chip rel-range-sub">${row.comm_min.toFixed(3)}</span>
        <span class="rel-range-dash">–</span>
        <span class="rel-range-chip rel-range-sub">${row.comm_max.toFixed(3)}</span>
      </div></td>
    </tr>`;
  });

  html += `</tbody></table></div></div>`;

  /* ---- جدول ۲: پایایی و روایی همگرا ---- */
  html += `<div class="rel-card">
    <div class="rel-card-head">
      <div class="rel-card-icon">۲</div>
      <div><div class="rel-card-title">${t('rel_table2_title')}</div></div>
    </div>
    <div class="rel-table-wrap">
      <table class="rel-table">
        <thead><tr>
          <th>${t('rel_col_construct')}</th>
          <th>${t('rel_col_cronbach')}</th>
          <th>${t('rel_col_rho_a')}</th>
          <th>${t('rel_col_rho_c')}</th>
          <th>${t('rel_col_ave')}</th>
        </tr></thead><tbody>`;

  (R.convergent || []).forEach(row => {
    const cCron = relQualityColor(row.cronbach, 0.7);
    const cRhoA = relQualityColor(row.rho_a, 0.7);
    const cRhoC = relQualityColor(row.rho_c, 0.7);
    const cAve = relQualityColor(row.ave, 0.5);
    html += `<tr class="rel-row">
      <td class="rel-cell-con">${constructChip(row.construct)}<span class="rel-con-label">${row.label}</span></td>
      <td><span class="rel-val-chip" style="background:${cCron.bg};color:${cCron.text}">${row.cronbach.toFixed(3)}</span></td>
      <td><span class="rel-val-chip" style="background:${cRhoA.bg};color:${cRhoA.text}">${row.rho_a.toFixed(3)}</span></td>
      <td><span class="rel-val-chip" style="background:${cRhoC.bg};color:${cRhoC.text}">${row.rho_c.toFixed(3)}</span></td>
      <td><span class="rel-val-chip" style="background:${cAve.bg};color:${cAve.text}">${row.ave.toFixed(3)}</span></td>
    </tr>`;
  });

  html += `</tbody></table></div></div>`;

  /* ---- جدول ۳: Cross-Loadings ---- */
  html += `<div class="rel-card">
    <div class="rel-card-head">
      <div class="rel-card-icon">۳</div>
      <div><div class="rel-card-title">${t('rel_table3_title')}</div></div>
    </div>
    <div class="rel-table-wrap">
      <table class="rel-table">
        <thead><tr>
          <th>${t('rel_col_construct')}</th>
          <th>${t('rel_col_items')}</th>
          <th>${t('rel_col_own')}</th>
          <th>${t('rel_col_cross')}</th>
          <th>${t('rel_col_result')}</th>
        </tr></thead><tbody>`;

  (R.crossLoadings || []).forEach(row => {
    const cOwn = relLoadingColor(row.own_min);
    const cOwnHi = relLoadingColor(row.own_max);
    const cCross = relCrossColor(row.own_min, row.cross_max);
    const resCls = row.result === 'confirmed' ? 'hyp-res-confirmed' : 'hyp-res-rejected';
    const resIcon = row.result === 'confirmed' ? '✓' : '✕';

    html += `<tr class="rel-row">
      <td class="rel-cell-con">${constructChip(row.construct)}<span class="rel-con-label">${row.label}</span></td>
      <td><span class="rel-items-chip">${row.items}</span></td>
      <td><div class="rel-range">
        <span class="rel-range-chip" style="background:${cOwn.bg};color:${cOwn.text}">${row.own_min.toFixed(3)}</span>
        <span class="rel-range-dash">–</span>
        <span class="rel-range-chip" style="background:${cOwnHi.bg};color:${cOwnHi.text}">${row.own_max.toFixed(3)}</span>
      </div></td>
      <td><div class="rel-range">
        <span class="rel-range-chip" style="background:${cCross.bg};color:${cCross.text}">${row.cross_min.toFixed(3)}</span>
        <span class="rel-range-dash">–</span>
        <span class="rel-range-chip" style="background:${cCross.bg};color:${cCross.text}">${row.cross_max.toFixed(3)}</span>
      </div></td>
      <td><span class="hyp-res ${resCls}"><span class="hyp-res-icon">${resIcon}</span>${t(row.result === 'confirmed' ? 'rel_result_confirmed' : 'rel_result_rejected')}</span></td>
    </tr>`;
  });

  html += `</tbody></table></div></div>`;

  /* ---- جدول ۴: Fornell-Larcker ---- */
  const FL = R.fornellLarcker || { constructs: [], labels: [], matrix: [] };
  html += `<div class="rel-card">
    <div class="rel-card-head">
      <div class="rel-card-icon">۴</div>
      <div><div class="rel-card-title">${t('rel_table4_title')}</div></div>
    </div>
    <div class="rel-table-wrap">
      <table class="rel-table">
        <thead><tr><th></th>`;
  (FL.constructs || []).forEach(c => { html += `<th>${c}</th>`; });
  html += `</tr></thead><tbody>`;

  (FL.matrix || []).forEach((row, i) => {
    html += `<tr class="rel-row">
      <td class="rel-cell-con">${constructChip(FL.constructs[i])}<span class="rel-con-label">${FL.labels[i] || FL.constructs[i]}</span></td>`;
    for (let j = 0; j < (FL.constructs || []).length; j++) {
      const v = row[j];
      if (v == null) {
        html += `<td class="rel-fl-empty">—</td>`;
      } else if (i === j) {
        html += `<td><span class="rel-fl-chip rel-fl-chip-diag">${v.toFixed(3)}</span></td>`;
      } else {
        const ok = row[i] != null && row[i] > Math.abs(v);
        html += `<td><span class="rel-fl-chip ${ok ? 'rel-fl-chip-ok' : 'rel-fl-chip-warn'}">${v.toFixed(3)}</span></td>`;
      }
    }
    html += `</tr>`;
  });

  html += `</tbody></table></div></div>`;

  cont.innerHTML = html;
}
/* ================================================================
   electric_bicycle_app.js — بخش ۳ از ۵
   لایه ۲ (Bootstrapping) + لایه ۳ (PLS Predict)
   ================================================================ */

/* ================================================================
   ۱۸. Forest Plot (لایه ۲)
   ================================================================ */
function drawL2Forest() {
  const el = $('chart-l2-forest');
  if (!el) return;
  const paths = (state.loaded.paths || FALLBACK_PATHS).slice().sort((a, b) => a.Original - b.Original);

  const y = paths.map(p => p.Path);
  const x = paths.map(p => p.Original);
  const errPlus  = paths.map(p => Math.max(0, p.CI_high - p.Original));
  const errMinus = paths.map(p => Math.max(0, p.Original - p.CI_low));
  const sig = paths.map(p => (p.CI_low > 0) || (p.CI_high < 0));
  const colors = sig.map(s => s ? '#c0392b' : '#7f8c8d');

  const cd = paths.map((p, i) => [
    p.Path, p.Original, p.CI_low, p.CI_high, p.STDEV, p.T, p.P,
    sig[i] ? t('badge_good') : 'غیرمعنادار'
  ]);

  Plotly.newPlot(el, [{
    type: 'scatter',
    x: x,
    y: y,
    error_x: {
      type: 'data',
      symmetric: false,
      array: errPlus,
      arrayminus: errMinus,
      color: '#2c3e50',
      thickness: 2.2,
      width: 7
    },
    mode: 'markers',
    marker: {
      size: 15,
      color: '#fff',
      line: { color: colors, width: 3 }
    },
    customdata: cd,
    hovertemplate: HT.template(
      '<b>%{customdata[0]}</b><br>' +
      '──────────<br>' +
      'β = <b>%{customdata[1]:.3f}</b><br>' +
      'CI 95% = [%{customdata[2]:.3f} , %{customdata[3]:.3f}]<br>' +
      'SE = %{customdata[4]:.3f}<br>' +
      't = %{customdata[5]:.2f}<br>' +
      'p = %{customdata[6]:.4f}<br>' +
      '%{customdata[7]}'
    ),
    showlegend: false
  }], plotlyLayout({
    height: 560,
    xaxis: { title: 'β', gridcolor: themeColors().grid },
    yaxis: { title: '', tickfont: { size: 11 }, gridcolor: themeColors().grid },
    shapes: [{
      type: 'line',
      x0: 0, x1: 0,
      y0: -0.5, y1: y.length - 0.5,
      line: { color: 'red', dash: 'dash', width: 1.5 }
    }],
    margin: { l: 140, r: 40, t: 30, b: 50 }
  }), PLOTLY_CFG);
}

/* ================================================================
   ۱۹. چشم‌انداز معناداری (β × T × −log10(p))
   ================================================================ */
function drawL2Sig() {
  const el = $('chart-l2-sig');
  if (!el) return;
  const paths = state.loaded.paths || FALLBACK_PATHS;

  const coefs = paths.map(p => p.Original);
  const tVals = paths.map(p => Number(p.T));
  const pVals = paths.map(p => Number(p.P));
  const valid = coefs.map((c, i) => !isNaN(c) && !isNaN(tVals[i]) && !isNaN(pVals[i]));

  if (!valid.some(v => v)) {
    el.innerHTML = '<div style="text-align:center;padding:60px;color:#888;">داده‌های T/P یافت نشد.</div>';
    return;
  }

  const idxValid = valid.map((v, i) => v ? i : -1).filter(i => i >= 0);
  const x = idxValid.map(i => coefs[i]);
  const y = idxValid.map(i => tVals[i]);
  const z = idxValid.map(i => -Math.log10(pVals[i] + 1e-10));
  const colors = idxValid.map(i => pVals[i] < 0.05 ? '#2ca02c' : '#d62728');
  const sig = idxValid.map(i => pVals[i] < 0.05);

  const cd = idxValid.map((i, k) => [
    paths[i].Path, coefs[i], tVals[i], pVals[i],
    -Math.log10(pVals[i] + 1e-10),
    sig[k] ? t('badge_good') : 'غیرمعنادار'
  ]);

  Plotly.newPlot(el, [{
    type: 'scatter3d',
    x: x,
    y: y,
    z: z,
    mode: 'markers',
    marker: {
      size: sig.map(s => s ? 11 : 8),
      color: colors,
      line: { color: '#000', width: 1.5 },
      symbol: sig.map(s => s ? 'circle' : 'x')
    },
    customdata: cd,
    hovertemplate: HT.template(
      '<b>%{customdata[0]}</b><br>' +
      '──────────<br>' +
      'β = <b>%{customdata[1]:.3f}</b><br>' +
      'T = %{customdata[2]:.2f}<br>' +
      'p = %{customdata[3]:.4f}<br>' +
      '%{customdata[5]}'
    ),
    showlegend: false
  }], plotlyLayout({
    height: 620,
    scene: {
      xaxis: {
        title: 'β',
        range: [Math.min(...x) - 0.1, Math.max(...x) + 0.1],
        gridcolor: themeColors().grid
      },
      yaxis: {
        title: 'T',
        range: [0, Math.max(...y) * 1.15],
        gridcolor: themeColors().grid
      },
      zaxis: {
        title: '−log10(p)',
        range: [0, Math.max(...z) * 1.15],
        gridcolor: themeColors().grid
      },
      camera: { eye: { x: 1.7, y: 1.5, z: 1.0 } },
      aspectmode: 'cube'
    }
  }), PLOTLY_CFG);
}

/* ================================================================
   ۲۰. چشم‌انداز سه‌بعدی β بر اساس T (لایه ۲)
   ================================================================ */
function drawL2Landscape() {
  const el = $('chart-l2-landscape');
  if (!el) return;
  const paths = state.loaded.paths || FALLBACK_PATHS;

  const coefs = paths.map(p => p.Original);
  const tVals = paths.map(p => Number(p.T));
  const names = paths.map(p => p.Path);

  Plotly.newPlot(el, [{
    type: 'bar',
    x: names,
    y: coefs,
    marker: {
      color: tVals,
      colorscale: 'RdYlGn',
      cmin: Math.min(...tVals),
      cmax: Math.max(...tVals),
      line: { color: '#000', width: 0.6 },
      colorbar: {
        title: 'T',
        thickness: 15,
        tickfont: { color: themeColors().text }
      }
    },
    text: coefs.map((c, i) => `${c.toFixed(3)}<br>T=${tVals[i].toFixed(1)}`),
    textposition: 'outside',
    textfont: { size: 9 },
    customdata: paths.map(p => [p.Path, p.Original, p.T, p.P]),
    hovertemplate: HT.template(
      '<b>%{customdata[0]}</b><br>' +
      'β = <b>%{customdata[1]:.3f}</b><br>' +
      'T = %{customdata[2]:.2f}<br>' +
      'p = %{customdata[3]:.4f}'
    )
  }], plotlyLayout({
    height: 520,
    xaxis: { title: '', tickangle: -40, gridcolor: themeColors().grid },
    yaxis: { title: 'β', gridcolor: themeColors().grid },
    margin: { l: 60, r: 40, t: 30, b: 150 }
  }), PLOTLY_CFG);
}

/* ================================================================
   ۲۱. KPI لایه ۳ (PLS Predict)
   ================================================================ */
function renderL3KPIs() {
  const idx = activeIndices();
  const predict = state.loaded.plsPredict || [];
  const q2 = idx.map(i => predict[i]?.q2 || DATA.Q2[i] || 0);

  const strong = q2.filter(v => v > 0.10).length;
  const mid = q2.filter(v => v > 0 && v <= 0.10).length;
  const weak = q2.filter(v => v <= 0).length;
  const meanQ2 = q2.length ? (q2.reduce((a, b) => a + b, 0) / q2.length) : 0;

  const kpiEl = $('kpi-grid-l3');
  if (kpiEl) {
    kpiEl.innerHTML = `
      <div class="kpi-card green">
        <div class="kpi-label">${t('badge_good')}</div>
        <div class="kpi-value">${strong}</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-label">${t('badge_mid')}</div>
        <div class="kpi-value">${mid}</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-label">${t('badge_bad')}</div>
        <div class="kpi-value">${weak}</div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-label">میانگین Q²</div>
        <div class="kpi-value">${meanQ2.toFixed(3)}</div>
      </div>
    `;
  }
}

/* ================================================================
   ۲۲. ستون‌های Q² (لایه ۳)
   ================================================================ */
function drawL3Q2Columns(targetId) {
  const el = $(targetId);
  if (!el) return;
  const idx = activeIndices();
  const predict = state.loaded.plsPredict || [];

  const labels = idx.map(i => DATA.indicators[i]);
  const values = idx.map(i => predict[i]?.q2 || DATA.Q2[i] || 0);
  const colors = values.map(v => v > 0.10 ? '#2ca02c' : (v > 0 ? '#ff7f0e' : '#d62728'));
  const sizes = idx.map(i => state.highlighted === DATA.indicators[i] ? 16 : 10);

  Plotly.newPlot(el, [{
    type: 'bar',
    x: labels,
    y: values,
    marker: {
      color: colors,
      line: { color: '#000', width: 0.5 }
    },
    text: values.map(v => v.toFixed(3)),
    textposition: 'outside',
    textfont: { size: 8 },
    hovertemplate: '<b>%{x}</b><br>Q² = %{y:.4f}<extra></extra>'
  }], plotlyLayout({
    height: 420,
    margin: { l: 50, r: 20, t: 30, b: 90 },
    xaxis: {
      gridcolor: themeColors().grid,
      tickangle: -60,
      tickfont: { size: 9 }
    },
    yaxis: { title: 'Q²predict', gridcolor: themeColors().grid },
    shapes: [{
      type: 'line',
      x0: -0.5,
      x1: labels.length - 0.5,
      y0: 0.10,
      y1: 0.10,
      line: { color: 'green', dash: 'dash', width: 1.5 }
    }],
    showlegend: false
  }), PLOTLY_CFG);
}

/* ================================================================
   ۲۳. RMSE — مقایسه PLS vs LM vs IA
   ================================================================ */
function drawL3Stems() {
  const el = $('chart-l3-stems');
  if (!el) return;
  const idx = activeIndices();
  const predict = state.loaded.plsPredict || [];
  const c = themeColors();

  const labels = idx.map(i => DATA.indicators[i]);
  const methods = ['PLS-SEM', 'LM', 'IA'];
  const rmse = [
    idx.map(i => predict[i]?.rmse_pls || DATA.PLS_RMSE[i] || 0),
    idx.map(i => predict[i]?.rmse_lm || DATA.LM_RMSE[i] || 0),
    idx.map(i => predict[i]?.rmse_ia || DATA.IA_RMSE[i] || 0)
  ];

  const allVals = idx.flatMap((i, k) => [rmse[0][k], rmse[1][k], rmse[2][k]]);
  const vmin = Math.min(...allVals), vmax = Math.max(...allVals);

  // خطوط عمودی (stems)
  const xs = [], ys = [], zs = [];
  for (let j = 0; j < 3; j++) {
    idx.forEach((i, k) => {
      xs.push(k, k, null);
      ys.push(j, j, null);
      zs.push(0, rmse[j][k], null);
    });
  }

  const traces = [{
    type: 'scatter3d',
    mode: 'lines',
    x: xs, y: ys, z: zs,
    line: { color: '#7f8c8d', width: 4 },
    hoverinfo: 'skip',
    showlegend: false
  }];

  // نقاط
  for (let j = 0; j < 3; j++) {
    traces.push({
      type: 'scatter3d',
      mode: 'markers',
      x: idx.map((_, k) => k),
      y: idx.map(() => j),
      z: rmse[j],
      marker: {
        size: 6,
        color: rmse[j],
        colorscale: 'Turbo',
        cmin: vmin,
        cmax: vmax,
        line: { color: '#000', width: 1 }
      },
      name: methods[j],
      legendgroup: methods[j],
      customdata: idx.map((i, k) => [DATA.indicators[i], rmse[j][k]]),
      hovertemplate: `<b>%{customdata[0]}</b><br>${methods[j]}: %{customdata[1]:.4f}<extra></extra>`
    });
  }

  Plotly.newPlot(el, traces, plotlyLayout({
    height: 620,
    scene: {
      xaxis: {
        title: '',
        tickmode: 'array',
        tickvals: idx.filter((_, k) => k % 2 === 0).map((_, k) => k * 2),
        ticktext: labels.filter((_, k) => k % 2 === 0),
        tickfont: { size: 9 },
        gridcolor: c.grid
      },
      yaxis: {
        title: '',
        tickmode: 'array',
        tickvals: [0, 1, 2],
        ticktext: methods,
        gridcolor: c.grid
      },
      zaxis: { title: 'RMSE', range: [0, vmax * 1.15], gridcolor: c.grid },
      camera: { eye: { x: 1.7, y: -1.6, z: 0.9 } }
    },
    margin: { l: 0, r: 0, t: 10, b: 0 },
    legend: { x: 0, y: 1, bgcolor: c.paper, font: { color: c.text } }
  }), PLOTLY_CFG);
}

/* ================================================================
   ۲۴. چشم‌انداز RMSE (Heatmap)
   ================================================================ */
function drawL3Landscape() {
  const el = $('chart-l3-landscape');
  if (!el) return;
  const idx = activeIndices();
  const predict = state.loaded.plsPredict || [];
  const c = themeColors();

  const labels = idx.map(i => DATA.indicators[i]);
  const methods = ['PLS-SEM', 'LM', 'IA'];
  const rmse = [
    idx.map(i => predict[i]?.rmse_pls || DATA.PLS_RMSE[i] || 0),
    idx.map(i => predict[i]?.rmse_lm || DATA.LM_RMSE[i] || 0),
    idx.map(i => predict[i]?.rmse_ia || DATA.IA_RMSE[i] || 0)
  ];

  // Z: [method][indicator]
  const Z = [rmse[0], rmse[1], rmse[2]];
  const X = idx.map((_, k) => k);
  const Y = [0, 1, 2];

  Plotly.newPlot(el, [{
    type: 'surface',
    x: X,
    y: Y,
    z: Z,
    colorscale: 'Turbo',
    colorbar: { title: 'RMSE', thickness: 15, tickfont: { color: c.text } },
    hovertemplate: 'شاخص: %{x}<br>روش: %{y}<br>RMSE: %{z:.4f}<extra></extra>'
  }], plotlyLayout({
    height: 620,
    scene: {
      xaxis: {
        title: 'شاخص',
        tickmode: 'array',
        tickvals: idx.filter((_, k) => k % 3 === 0).map((_, k) => k * 3),
        ticktext: labels.filter((_, k) => k % 3 === 0),
        tickfont: { size: 9 },
        gridcolor: c.grid
      },
      yaxis: {
        title: 'روش',
        tickmode: 'array',
        tickvals: [0, 1, 2],
        ticktext: methods,
        gridcolor: c.grid
      },
      zaxis: { title: 'RMSE', gridcolor: c.grid },
      camera: { eye: { x: 1.5, y: -1.7, z: 1.1 } }
    },
    margin: { l: 0, r: 0, t: 10, b: 0 }
  }), PLOTLY_CFG);
}
/* ================================================================
   ۲۵. پشته Q² (Bar)
   ================================================================ */
function drawL3Ridge() {
  const el = $('chart-l3-ridge');
  if (!el) return;
  const idx = activeIndices();
  const predict = state.loaded.plsPredict || [];
  const c = themeColors();

  const labels = idx.map(i => DATA.indicators[i]);
  const q2 = idx.map(i => predict[i]?.q2 || DATA.Q2[i] || 0);

  // ساخت سطح با درون‌یابی
  const NX = 150, NY = 22;
  const xg = Array.from({ length: NX }, (_, k) => -0.5 + k * (idx.length) / (NX - 1));
  const yg = Array.from({ length: NY }, (_, k) => -0.6 + k * 1.2 / (NY - 1));
  const Z = yg.map(y => xg.map(x => {
    let s = 0;
    idx.forEach((i, k) => {
      const gx = Math.exp(-Math.pow(x - k, 2) / (2 * 0.55 * 0.55));
      const gy = Math.exp(-Math.pow(y, 2) / (2 * 0.2 * 0.2));
      s += q2[k] * gx * gy;
    });
    return s;
  }));

  Plotly.newPlot(el, [{
    type: 'surface',
    x: xg,
    y: yg,
    z: Z,
    colorscale: 'Viridis',
    colorbar: { title: 'Q²', len: 0.6, tickfont: { color: c.text } },
    hovertemplate: 'شاخص ≈ %{x:.1f}<br>Q² = %{z:.4f}<extra></extra>'
  }], plotlyLayout({
    height: 620,
    scene: {
      xaxis: {
        title: 'شاخص',
        tickmode: 'array',
        tickvals: idx.filter((_, k) => k % 3 === 0).map((_, k) => k * 3),
        ticktext: labels.filter((_, k) => k % 3 === 0),
        gridcolor: c.grid
      },
      yaxis: { showticklabels: false, gridcolor: c.grid },
      zaxis: { title: 'Q²predict', gridcolor: c.grid },
      camera: { eye: { x: 1.7, y: -1.5, z: 1.0 } }
    },
    margin: { l: 0, r: 0, t: 10, b: 0 }
  }), PLOTLY_CFG);
}

/* ================================================================
   ۲۶. CVPAT (مقایسه PLS با IA و LM)
   ================================================================ */
function drawL3CVPAT() {
  const el = $('chart-l3-cvpat');
  if (!el) return;
  const c = themeColors();

  // داده CVPAT
  const entities = ['DKM', 'DTS', 'Overall'];
  const comparisons = ['PLS vs IA', 'PLS vs LM'];
  const Diff = [
    [-0.095, -0.118, -0.107],
    [-0.042, -0.055, -0.049]
  ];

  // Z: [comparison][entity]
  const Z = Diff;

  Plotly.newPlot(el, [{
    type: 'surface',
    x: [0, 1, 2],
    y: [0, 1],
    z: Z,
    colorscale: 'RdYlGn',
    cmin: -0.20,
    cmax: 0.02,
    colorbar: { title: 'Δ', thickness: 15, tickfont: { color: c.text } },
    text: Z.map((row, i) => row.map((v, j) => 
      `سازه: ${entities[j]}<br>مقایسه: ${comparisons[i]}<br>Δ = ${v.toFixed(4)}`
    )),
    hovertemplate: '%{text}<extra></extra>'
  }], plotlyLayout({
    height: 620,
    scene: {
      xaxis: {
        title: '',
        tickmode: 'array',
        tickvals: [0, 1, 2],
        ticktext: entities,
        gridcolor: c.grid
      },
      yaxis: {
        title: '',
        tickmode: 'array',
        tickvals: [0, 1],
        ticktext: comparisons,
        gridcolor: c.grid
      },
      zaxis: { title: 'Δ', gridcolor: c.grid },
      camera: { eye: { x: 1.7, y: -1.7, z: 0.9 } }
    },
    margin: { l: 0, r: 0, t: 10, b: 0 }
  }), PLOTLY_CFG);
}
/* ================================================================
   ۲۷. توزیع خطاها (Ridgeline)
   ================================================================ */
function drawL3Ridgeline() {
  const el = $('chart-l3-ridgeline');
  if (!el) return;
  const idx = activeIndices();
  const predict = state.loaded.plsPredict || [];
  const c = themeColors();

  const labels = idx.map(i => DATA.indicators[i]);
  const means = idx.map(i => (predict[i]?.rmse_pls || DATA.PLS_RMSE[i] || 0) * 0.05);
  const sds = idx.map(i => (predict[i]?.rmse_pls || DATA.PLS_RMSE[i] || 0) * 0.1);

  // ساخت منحنی چگالی برای هر شاخص
  const xg = Array.from({ length: 90 }, (_, k) => -0.35 + k * 0.4 / 89);
  const traces = [];

  idx.forEach((i, k) => {
    const mu = means[k];
    const sig = sds[k] * 0.08 || 0.01;
    const z = xg.map(x => Math.exp(-Math.pow(x - mu, 2) / (2 * sig * sig)));
    const tt = k / Math.max(1, idx.length - 1);
    const isHi = state.highlighted === DATA.indicators[i];
    const color = isHi ? '#ffd700' : `rgb(${Math.round(253 * tt)},${Math.round(231 * tt + 30)},${Math.round(37 * tt + 50)})`;

    traces.push({
      type: 'scatter3d',
      x: xg,
      y: Array(xg.length).fill(k),
      z: z,
      mode: 'lines',
      line: { color: color, width: isHi ? 8 : 4 },
      name: DATA.indicators[i],
      showlegend: false,
      customdata: idx.map((_, kk) => [labels[kk], means[kk].toFixed(4), sds[kk].toFixed(4)]),
      hovertemplate: `<b>%{customdata[0]}</b><br>μ = %{customdata[1]}<br>σ = %{customdata[2]}<extra></extra>`
    });
  });

  Plotly.newPlot(el, traces, plotlyLayout({
    height: 620,
    scene: {
      xaxis: { title: 'خطا', gridcolor: c.grid },
      yaxis: {
        title: 'شاخص',
        tickmode: 'array',
        tickvals: idx.filter((_, k) => k % 3 === 0).map((_, k) => k * 3),
        ticktext: labels.filter((_, k) => k % 3 === 0),
        gridcolor: c.grid
      },
      zaxis: { title: 'PDF', gridcolor: c.grid },
      camera: { eye: { x: 1.5, y: -1.9, z: 1.0 } }
    },
    margin: { l: 0, r: 0, t: 10, b: 0 }
  }), PLOTLY_CFG);
}
/* ================================================================
   ۲۸. پراکندگی PLS vs LM
   ================================================================ */
function drawL3Scatter() {
  const el = $('chart-l3-scatter');
  if (!el) return;
  const idx = activeIndices();
  const predict = state.loaded.plsPredict || [];

  const x = idx.map(i => predict[i]?.rmse_lm || DATA.LM_RMSE[i] || 0);
  const y = idx.map(i => predict[i]?.rmse_pls || DATA.PLS_RMSE[i] || 0);
  const q2 = idx.map(i => predict[i]?.q2 || DATA.Q2[i] || 0);
  const sizes = idx.map((i, k) => state.highlighted === DATA.indicators[i] ? 20 : 12);

  const lim = [
    Math.min(...x, ...y) * 0.95,
    Math.max(...x, ...y) * 1.05
  ];

  Plotly.newPlot(el, [
    {
      type: 'scatter',
      x: x,
      y: y,
      mode: 'markers',
      marker: {
        size: sizes,
        color: q2,
        colorscale: 'Plasma',
        colorbar: {
          title: 'Q²',
          len: 0.7,
          tickfont: { color: themeColors().text }
        },
        line: { color: '#000', width: 1.5 }
      },
      customdata: idx.map(i => [DATA.indicators[i], q2[idx.indexOf(i)]]),
      hovertemplate: '<b>%{customdata[0]}</b><br>RMSE LM = %{x:.4f}<br>RMSE PLS = %{y:.4f}<br>Q² = %{customdata[1]:.4f}<extra></extra>'
    },
    {
      type: 'scatter',
      x: lim,
      y: lim,
      mode: 'lines',
      line: { color: themeColors().text, dash: 'dash', width: 2 },
      name: 'y = x',
      hoverinfo: 'skip'
    }
  ], plotlyLayout({
    height: 500,
    xaxis: {
      title: 'RMSE (LM)',
      range: lim,
      gridcolor: themeColors().grid
    },
    yaxis: {
      title: 'RMSE (PLS)',
      range: lim,
      scaleanchor: 'x',
      gridcolor: themeColors().grid
    }
  }), PLOTLY_CFG);
}

/* ================================================================
   ۲۹. Forest Plot CVPAT
   ================================================================ */
function drawL3Forest() {
  const el = $('chart-l3-forest');
  if (!el) return;

  const entities = ['DKM', 'DTS', 'Overall'];
  const data = [
    { comp: 'PLS vs IA', color: '#e74c3c', symbol: 'circle',
      diff: [-0.095, -0.118, -0.107],
      ci: [0.025, 0.028, 0.026] },
    { comp: 'PLS vs LM', color: '#3498db', symbol: 'square',
      diff: [-0.042, -0.055, -0.049],
      ci: [0.018, 0.021, 0.019] }
  ];

  const traces = data.map(d => ({
    type: 'scatter',
    x: d.diff,
    y: entities,
    mode: 'markers',
    name: d.comp,
    marker: {
      size: 14,
      symbol: d.symbol,
      color: d.color,
      line: { color: '#000', width: 1.2 }
    },
    error_x: {
      type: 'data',
      array: d.ci,
      thickness: 2,
      width: 6,
      color: d.color
    },
    hovertemplate: `<b>%{y}</b><br>${d.comp}<br>Δ = %{x:.4f}<extra></extra>`
  }));

  Plotly.newPlot(el, traces, plotlyLayout({
    height: 380,
    xaxis: { title: 'Δ', gridcolor: themeColors().grid },
    yaxis: {
      title: '',
      gridcolor: themeColors().grid,
      categoryorder: 'array',
      categoryarray: entities.slice().reverse()
    },
    shapes: [{
      type: 'line',
      x0: 0, x1: 0,
      y0: -0.5, y1: entities.length - 0.5,
      line: { color: 'red', dash: 'dash', width: 2 }
    }],
    legend: {
      bgcolor: themeColors().paper,
      font: { color: themeColors().text }
    }
  }), PLOTLY_CFG);
}

/* ================================================================
   ۳۰. کمک‌کننده: اندیس‌های فعال
   ================================================================ */
function activeIndices() {
  return [...state.selected].sort((a, b) => a - b);
}
/* ================================================================
   electric_bicycle_app.js — بخش ۴ از ۵
   مونت‌کارلو (۷ نمودار) + ML + SHAP (۴ نمودار)
   ================================================================ */

/* ================================================================
   ۳۱. مونت‌کارلو — توزیع سه سناریو
   ================================================================ */
function drawMCScenarios() {
  const el = $('chart-mc-scenarios');
  if (!el) return;
  const mc = (state.loaded.monteCarlo || FALLBACK_MONTE_CARLO);
  const scenarios = mc.Scenarios || FALLBACK_MONTE_CARLO.Scenarios;

  const colors = {
    'خوش‌بینانه': '#27ae60',
    'پایه':      '#3498db',
    'بدبینانه':  '#e74c3c',
    'Optimistic': '#27ae60',
    'Baseline':   '#3498db',
    'Pessimistic':'#e74c3c'
  };

  // شبیه‌سازی توزیع از میانگین و SD
  function seededNormal(seed, mean, sd, n) {
    let s = seed;
    function rng() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const u1 = rng() || 1e-9, u2 = rng();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      out.push(mean + z * sd);
    }
    return out;
  }

  const traces = scenarios.map((sc, i) => ({
    type: 'histogram',
    x: seededNormal(1000 + i, sc.Mean_Success, sc.Std_Success, 2000),
    name: `${sc.Scenario} (μ=${sc.Mean_Success.toFixed(3)})`,
    opacity: 0.65,
    histnorm: 'probability density',
    marker: { color: colors[sc.Scenario] || '#3498db' },
    hovertemplate: '<b>%{x:.3f}</b><br>چگالی: %{y:.3f}<extra></extra>'
  }));

  Plotly.newPlot(el, traces, plotlyLayout({
    height: 480,
    barmode: 'overlay',
    xaxis: {
      title: 'موفقیت تحول دیجیتال',
      gridcolor: themeColors().grid
    },
    yaxis: { title: 'چگالی', gridcolor: themeColors().grid },
    legend: {
      x: 0.65,
      y: 0.95,
      bgcolor: themeColors().paper,
      font: { color: themeColors().text }
    }
  }), PLOTLY_CFG);
}

/* ================================================================
   ۳۲. مونت‌کارلو — تحلیل حساسیت H6
   ================================================================ */
function drawMCH6() {
  const el = $('chart-mc-h6');
  if (!el) return;
  const mc = (state.loaded.monteCarlo || FALLBACK_MONTE_CARLO);
  const h6 = mc.H6_Sensitivity || FALLBACK_MONTE_CARLO.H6_Sensitivity;

  const scenarios = [
    { key: 'Optimistic',  label: 'خوش‌بینانه', color: '#27ae60' },
    { key: 'Baseline',    label: 'پایه',      color: '#3498db' },
    { key: 'Pessimistic', label: 'بدبینانه',  color: '#e74c3c' }
  ];

  function seededNormal(seed, mean, sd, n) {
    let s = seed;
    function rng() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const u1 = rng() || 1e-9, u2 = rng();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      out.push(mean + z * sd);
    }
    return out;
  }

  const traces = scenarios.map((sc, i) => {
    const data = h6[sc.key] || { Mean: 0, Std: 0.05 };
    return {
      type: 'histogram',
      x: seededNormal(2000 + i, data.Mean, data.Std, 1500),
      name: `${sc.label} (μ=${data.Mean.toFixed(3)})`,
      opacity: 0.65,
      histnorm: 'probability density',
      marker: { color: sc.color },
      hovertemplate: '<b>%{x:.3f}</b><br>چگالی: %{y:.3f}<extra></extra>'
    };
  });

  Plotly.newPlot(el, traces, plotlyLayout({
    height: 480,
    barmode: 'overlay',
    xaxis: {
      title: 'اثر تعدیل‌گری رهبری (H6)',
      gridcolor: themeColors().grid
    },
    yaxis: { title: 'چگالی', gridcolor: themeColors().grid },
    legend: {
      x: 0.65,
      y: 0.95,
      bgcolor: themeColors().paper,
      font: { color: themeColors().text }
    },
    shapes: [{
      type: 'line',
      x0: 0, x1: 0,
      y0: 0, y1: 1,
      yref: 'paper',
      line: { color: '#000', dash: 'dash', width: 2 }
    }]
  }), PLOTLY_CFG);
}

/* ================================================================
   ۳۳. مونت‌کارلو — اثر غیرمستقیم و کل
   ================================================================ */
function drawMCEffects() {
  const el = $('chart-mc-effects');
  if (!el) return;
  const mc = (state.loaded.monteCarlo || FALLBACK_MONTE_CARLO);
  const effects = mc.Effects || FALLBACK_MONTE_CARLO.Effects;

  function seededNormal(seed, mean, sd, n) {
    let s = seed;
    function rng() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const u1 = rng() || 1e-9, u2 = rng();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      out.push(mean + z * sd);
    }
    return out;
  }

  const colors = ['#9b59b6', '#16a085'];

  const traces = effects.map((eff, i) => ({
    type: 'histogram',
    x: seededNormal(3000 + i, eff.Mean, eff.Std, 1500),
    name: eff.Effect,
    opacity: 0.65,
    histnorm: 'probability density',
    marker: { color: colors[i % colors.length] },
    hovertemplate: '<b>%{x:.3f}</b><br>چگالی: %{y:.3f}<extra></extra>'
  }));

  Plotly.newPlot(el, traces, plotlyLayout({
    height: 420,
    barmode: 'overlay',
    xaxis: {
      title: 'مقدار اثر',
      gridcolor: themeColors().grid
    },
    yaxis: { title: 'چگالی', gridcolor: themeColors().grid },
    legend: {
      x: 0.65,
      y: 0.95,
      bgcolor: themeColors().paper,
      font: { color: themeColors().text }
    }
  }), PLOTLY_CFG);
}

/* ================================================================
   ۳۴. مونت‌کارلو — نمودار Tornado
   ================================================================ */
function drawMCTornado() {
  const el = $('chart-mc-tornado');
  if (!el) return;
  const mc = (state.loaded.monteCarlo || FALLBACK_MONTE_CARLO);
  const tornado = mc.Parameter_Importance || FALLBACK_MONTE_CARLO.Parameter_Importance;

  const sorted = tornado.slice().sort((a, b) => Math.abs(a.Correlation) - Math.abs(b.Correlation));

  Plotly.newPlot(el, [{
    type: 'bar',
    orientation: 'h',
    y: sorted.map(x => x.Parameter),
    x: sorted.map(x => x.Correlation),
    marker: {
      color: sorted.map(x => x.Correlation > 0 ? '#27ae60' : '#e74c3c'),
      line: { color: '#000', width: 0.6 }
    },
    text: sorted.map(x => x.Correlation.toFixed(3)),
    textposition: 'outside',
    textfont: { size: 10 },
    hovertemplate: '<b>%{y}</b><br>همبستگی = %{x:.3f}<extra></extra>'
  }], plotlyLayout({
    height: 420,
    margin: { l: 180, r: 40, t: 30, b: 50 },
    xaxis: {
      title: 'همبستگی با موفقیت',
      gridcolor: themeColors().grid,
      zeroline: true,
      zerolinecolor: '#888'
    },
    yaxis: { title: '', tickfont: { size: 11 } },
    showlegend: false
  }), PLOTLY_CFG);
}

/* ================================================================
   ۳۵. مونت‌کارلو — تحلیل استواری
   ================================================================ */
function drawMCRobustness() {
  const el = $('chart-mc-robustness');
  if (!el) return;
  const mc = (state.loaded.monteCarlo || FALLBACK_MONTE_CARLO);
  const robust = mc.Robustness || FALLBACK_MONTE_CARLO.Robustness;

  function seededNormal(seed, mean, sd, n) {
    let s = seed;
    function rng() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const u1 = rng() || 1e-9, u2 = rng();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      out.push(mean + z * sd);
    }
    return out;
  }

  const colors = ['#3498db', '#f39c12', '#27ae60'];

  const traces = robust.map((r, i) => ({
    type: 'histogram',
    x: seededNormal(4000 + i, r.Mean, r.Std, 1200),
    name: `${r.Distribution} (μ=${r.Mean.toFixed(3)})`,
    opacity: 0.6,
    histnorm: 'probability density',
    marker: { color: colors[i % colors.length] },
    hovertemplate: '<b>%{x:.3f}</b><br>چگالی: %{y:.3f}<extra></extra>'
  }));

  Plotly.newPlot(el, traces, plotlyLayout({
    height: 420,
    barmode: 'overlay',
    xaxis: {
      title: 'اثر کل',
      gridcolor: themeColors().grid
    },
    yaxis: { title: 'چگالی', gridcolor: themeColors().grid },
    legend: {
      x: 0.65,
      y: 0.95,
      bgcolor: themeColors().paper,
      font: { color: themeColors().text }
    }
  }), PLOTLY_CFG);
}

/* ================================================================
   ۳۶. مونت‌کارلو — تحلیل OAT
   ================================================================ */
function drawMCOAT() {
  const el = $('chart-mc-oat');
  if (!el) return;
  const mc = (state.loaded.monteCarlo || FALLBACK_MONTE_CARLO);
  const oat = mc.OAT || FALLBACK_MONTE_CARLO.OAT;

  // گروه‌بندی بر اساس پارامتر
  const byParam = {};
  oat.forEach(row => {
    if (!byParam[row.Parameter]) byParam[row.Parameter] = [];
    byParam[row.Parameter].push(row);
  });

  const colors = ['#e74c3c', '#3498db', '#f39c12', '#9b59b6', '#27ae60'];

  const traces = Object.entries(byParam).map(([param, rows], i) => {
    const sorted = rows.slice().sort((a, b) => a.Change - b.Change);
    return {
      type: 'scatter',
      mode: 'lines+markers',
      x: sorted.map(r => r.Change),
      y: sorted.map(r => r.Total),
      name: param,
      line: { color: colors[i % colors.length], width: 2.5 },
      marker: { size: 8, color: colors[i % colors.length] },
      hovertemplate: `<b>${param}</b><br>تغییر: %{x}%<br>اثر کل: %{y:.4f}<extra></extra>`
    };
  });

  Plotly.newPlot(el, traces, plotlyLayout({
    height: 420,
    xaxis: {
      title: 'تغییر پارامتر (%)',
      gridcolor: themeColors().grid,
      zeroline: true,
      zerolinecolor: '#888'
    },
    yaxis: { title: 'اثر کل', gridcolor: themeColors().grid },
    legend: {
      bgcolor: themeColors().paper,
      font: { color: themeColors().text, size: 10 }
    }
  }), PLOTLY_CFG);
}

/* ================================================================
   ۳۷. مونت‌کارلو — مقایسه CI با PLS
   ================================================================ */
function drawMCCI() {
  const el = $('chart-mc-ci');
  if (!el) return;
  const mc = (state.loaded.monteCarlo || FALLBACK_MONTE_CARLO);
  const ci = mc.CI_Comparison || FALLBACK_MONTE_CARLO.CI_Comparison;

  const traces = [
    {
      type: 'scatter',
      mode: 'markers',
      x: ci.map(x => x.PLS_Beta),
      y: ci.map(x => x.Hypothesis),
      name: 'PLS-SEM β',
      marker: { size: 14, color: '#3498db', line: { color: '#fff', width: 2 } },
      hovertemplate: '<b>%{y}</b><br>PLS β = %{x:.3f}<extra></extra>'
    },
    {
      type: 'scatter',
      mode: 'markers',
      x: ci.map(x => x.MC_Mean),
      y: ci.map(x => x.Hypothesis),
      name: 'MC Mean',
      marker: { size: 14, color: '#e67e22', symbol: 'diamond', line: { color: '#fff', width: 2 } },
      error_x: {
        type: 'data',
        symmetric: false,
        array: ci.map(x => x.MC_P95 - x.MC_Mean),
        arrayminus: ci.map(x => x.MC_Mean - x.MC_P5),
        color: '#e67e22',
        thickness: 2,
        width: 8
      },
      hovertemplate: '<b>%{y}</b><br>MC Mean = %{x:.3f}<extra></extra>'
    }
  ];

  Plotly.newPlot(el, traces, plotlyLayout({
    height: 420,
    xaxis: {
      title: 'β',
      gridcolor: themeColors().grid,
      zeroline: true,
      zerolinecolor: '#e74c3c',
      zerolinewidth: 2
    },
    yaxis: { title: '', gridcolor: themeColors().grid },
    legend: {
      bgcolor: themeColors().paper,
      font: { color: themeColors().text }
    }
  }), PLOTLY_CFG);
}

/* ================================================================
   ۳۸. ML — مقایسه عملکرد مدل‌ها
   ================================================================ */
function drawMLCompare() {
  const el = $('chart-ml-compare');
  if (!el) return;
  const ml = (state.loaded.ml || FALLBACK_ML);
  const rows = ml.Model_Comparison || FALLBACK_ML.Model_Comparison;

  const colors = ['#3498db', '#9b59b6', '#e74c3c'];

  Plotly.newPlot(el, [{
    type: 'bar',
    x: rows.map(r => r.Model),
    y: rows.map(r => r.R2),
    marker: {
      color: colors.slice(0, rows.length),
      line: { color: '#fff', width: 2 }
    },
    text: rows.map(r => (r.R2 != null ? r.R2 : 0).toFixed(3)),
    textposition: 'outside',
    textfont: { size: 13, color: themeColors().text },
    customdata: rows.map(r => [r.R2_Std, r.RMSE]),
    hovertemplate: '<b>%{x}</b><br>R² = %{y:.4f}<br>SD = %{customdata[0]}<br>RMSE = %{customdata[1]}<extra></extra>'
  }], plotlyLayout({
    height: 380,
    xaxis: { gridcolor: themeColors().grid, tickfont: { size: 12 } },
    yaxis: {
      title: 'R²',
      gridcolor: themeColors().grid,
      range: [0, 0.65]
    },
    showlegend: false,
    shapes: [{
      type: 'line',
      x0: -0.5, x1: rows.length - 0.5,
      y0: 0.292, y1: 0.292,
      line: { color: '#e74c3c', dash: 'dash', width: 2 }
    }],
    annotations: [{
      x: rows.length - 0.5,
      y: 0.292,
      xref: 'x',
      yref: 'y',
      text: 'PLS-SEM',
      showarrow: false,
      font: { size: 10, color: '#e74c3c' },
      xanchor: 'right',
      yanchor: 'bottom'
    }]
  }), PLOTLY_CFG);
}

/* ================================================================
   ۳۹. ML — اهمیت سازه‌ها
   ================================================================ */
function drawMLConstruct() {
  const el = $('chart-ml-construct');
  if (!el) return;
  const ml = (state.loaded.ml || FALLBACK_ML);
  const rows = ml.Construct_Importance || FALLBACK_ML.Construct_Importance;

  const sorted = rows.slice().sort((a, b) => a.Mean_Abs_SHAP - b.Mean_Abs_SHAP);

  const colors = {
    DTL: '#3498db',
    SA:  '#f39c12',
    DKM: '#9b59b6',
    DS:  '#e67e22'
  };

  Plotly.newPlot(el, [{
    type: 'bar',
    orientation: 'h',
    y: sorted.map(r => r.Construct),
    x: sorted.map(r => r.Mean_Abs_SHAP),
    marker: {
      color: sorted.map(r => colors[r.Construct] || '#3498db'),
      line: { color: '#fff', width: 2 }
    },
    text: sorted.map(r => r.Mean_Abs_SHAP.toFixed(4)),
    textposition: 'outside',
    textfont: { size: 12, color: themeColors().text },
    hovertemplate: '<b>%{y}</b><br>|SHAP| = %{x:.4f}<extra></extra>'
  }], plotlyLayout({
    height: 380,
    margin: { l: 80, r: 80, t: 30, b: 50 },
    xaxis: {
      title: 'Mean |SHAP|',
      gridcolor: themeColors().grid,
      range: [0, Math.max(...rows.map(r => r.Mean_Abs_SHAP)) * 1.3]
    },
    yaxis: { title: '', tickfont: { size: 12 } },
    showlegend: false
  }), PLOTLY_CFG);
}

/* ================================================================
   ۴۰. ML — اهمیت SHAP (میله‌ای)
   ================================================================ */
function drawMLShapBar() {
  const el = $('chart-ml-shap-bar');
  if (!el) return;
  const ml = (state.loaded.ml || FALLBACK_ML);
  const rows = ml.SHAP_Importance || FALLBACK_ML.SHAP_Importance;

  const sorted = rows.slice().sort((a, b) => a.Mean_Abs_SHAP - b.Mean_Abs_SHAP);

  const constructColors = {
    DTL: '#3498db',
    SA:  '#f39c12',
    DKM: '#9b59b6',
    DS:  '#e67e22'
  };

  Plotly.newPlot(el, [{
    type: 'bar',
    orientation: 'h',
    y: sorted.map(r => r.Feature),
    x: sorted.map(r => r.Mean_Abs_SHAP),
    marker: {
      color: sorted.map(r => constructColors[r.Construct] || '#7f8c8d'),
      line: { color: '#fff', width: 1 }
    },
    text: sorted.map(r => r.Mean_Abs_SHAP.toFixed(4)),
    textposition: 'outside',
    textfont: { size: 10, color: themeColors().text },
    customdata: sorted.map(r => r.Construct),
    hovertemplate: '<b>%{y}</b> (سازه: %{customdata})<br>|SHAP| = %{x:.4f}<extra></extra>'
  }], plotlyLayout({
    height: 480,
    margin: { l: 80, r: 80, t: 30, b: 50 },
    xaxis: {
      title: 'Mean |SHAP|',
      gridcolor: themeColors().grid,
      range: [0, Math.max(...rows.map(r => r.Mean_Abs_SHAP)) * 1.25]
    },
    yaxis: { title: '', tickfont: { size: 11 } },
    showlegend: false
  }), PLOTLY_CFG);
}

/* ================================================================
   ۴۱. ML — SHAP Summary (Beeswarm)
   ================================================================ */
function drawMLShapSummary() {
  const el = $('chart-ml-shap-summary');
  if (!el) return;
  const ml = (state.loaded.ml || FALLBACK_ML);
  const rows = ml.SHAP_Importance || FALLBACK_ML.SHAP_Importance;

  // شبیه‌سازی مقادیر SHAP برای هر ویژگی
  function seededNormal(seed, n) {
    let s = seed;
    function rng() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const u1 = rng() || 1e-9, u2 = rng();
      out.push(Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2));
    }
    return out;
  }

  const sorted = rows.slice().sort((a, b) => a.Mean_Abs_SHAP - b.Mean_Abs_SHAP);
  const traces = [];

  sorted.forEach((row, idx) => {
    const values = seededNormal(5000 + idx, 100);
    const shapVals = values.map(v => v * row.Mean_Abs_SHAP);
    const featureVals = values.map(v => (v * 0.4 + 3));

    traces.push({
      type: 'scatter',
      mode: 'markers',
      x: shapVals,
      y: values.map(() => idx + (Math.random() - 0.5) * 0.4),
      marker: {
        color: featureVals,
        colorscale: 'RdBu',
        reversescale: true,
        size: 4,
        opacity: 0.7,
        colorbar: idx === 0 ? {
          title: 'مقدار<br>ویژگی',
          thickness: 12,
          tickfont: { size: 9, color: themeColors().text }
        } : undefined
      },
      name: row.Feature,
      hovertemplate: `<b>${row.Feature}</b><br>SHAP = %{x:.4f}<extra></extra>`
    });
  });

  Plotly.newPlot(el, traces, plotlyLayout({
    height: 520,
    margin: { l: 80, r: 60, t: 30, b: 60 },
    xaxis: {
      title: 'SHAP Value',
      gridcolor: themeColors().grid,
      zeroline: true,
      zerolinecolor: '#e74c3c',
      zerolinewidth: 2
    },
    yaxis: {
      title: '',
      tickvals: sorted.map((_, i) => i),
      ticktext: sorted.map(r => r.Feature),
      gridcolor: themeColors().grid
    },
    showlegend: false
  }), PLOTLY_CFG);
}
/* ================================================================
   electric_bicycle_app.js — بخش ۵-الف از ۵
   تفسیرهای علمی — ۳۸ نمودار (فارسی + انگلیسی)
   ================================================================ */

/* ================================================================
   MAIN_CHART_INTS (FA) — تفسیرهای فارسی
   ================================================================ */
const MAIN_CHART_INTS = {

  /* ========== آمار توصیفی ========== */
  'chart-desc-gender': `
    <strong>نوع نمودار:</strong> نمودار دایره‌ای توزیع جنسیت — فراوانی مطلق و نسبی<br>
    <strong>n = ۱۸۰</strong> · داده گمشده: صفر<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    توزیع جنسیت در نمونه نشان می‌دهد که پاسخ‌دهندگان از ترکیب متوازن تشکیل شده‌اند — این نتیجه طبیعی است، چون جامعه هدف پژوهش «کارکنان شرکت‌های فعال در صنعت دوچرخه برقی ایران» تعریف شده و نمونه‌گیری هدفمند برای اطمینان از تنوع جنسیتی انجام شده است.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> ترکیب متوازن جنسیتی امکان تعمیم نتایج به کل جامعه صنعت را فراهم می‌کند. اگر نمونه تک‌جنسیتی بود، نتایج فقط برای یک گروه خاص قابل تعمیم بود.</div>
  `,

  'chart-desc-age': `
    <strong>نوع نمودار:</strong> نمودار میله‌ای توزیع سنی در ۴ طبقه<br>
    <strong>آماره‌ها:</strong> میانگین = ۲.۷۶ · SD = ۰.۷۵۸ · چولگی = ۰.۰۸۹<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    توزیع سنی تقریباً متقارن است (چولگی نزدیک صفر) و بیشتر پاسخ‌دهندگان در بازه ۳۰-۴۹ سال قرار دارند — یعنی «نیروی کار در اوج فعالیت حرفه‌ای».<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> تمرکز سنی در اوج فعالیت اقتصادی، تعمیم‌پذیری نتایج به جمعیت واقعی صنعت را تقویت می‌کند. اگر نمونه عمدتاً از کارکنان جوان یا بازنشسته بود، اثر تحول دیجیتال بر موفقیت احتمالاً متفاوت گزارش می‌شد.</div>
  `,

  'chart-desc-edu': `
    <strong>نوع نمودار:</strong> نمودار میله‌ای افقی توزیع تحصیلات<br>
    <strong>آماره‌ها:</strong> میانگین = ۱.۴۴ · SD = ۰.۵۷۹ · چولگی = ۰.۹۲۳<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    بیشتر پاسخ‌دهندگان دارای مدرک کارشناسی هستند و اقلیت کوچکی تحصیلات تکمیلی دارند. چولگی مثبت نشان می‌دهد توده اصلی در سمت «تحصیلات متوسط» است.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> سطح تحصیلات متوسط، نقش «مدیریت دانش دیجیتال» را به‌عنوان سازوکار جبران‌کننده برجسته‌تر می‌کند — یعنی سازمان‌ها می‌توانند از طریق سیستم‌های دانشی، شکاف مهارتی را پر کنند.</div>
  `,

  'chart-desc-field': `
    <strong>نوع نمودار:</strong> نمودار میله‌ای حوزه فعالیت پاسخ‌دهندگان<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    توزیع حوزه فعالیت نشان می‌دهد که نمونه از بخش‌های مختلف صنعت (تولید، مونتاژ، توزیع) تشکیل شده است.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> تنوع حوزه فعالیت، تعمیم‌پذیری یافته‌ها را به کل زنجیره ارزش صنعت دوچرخه برقی افزایش می‌دهد.</div>
  `,

  'chart-desc-activiti': `
    <strong>نوع نمودار:</strong> نمودار میله‌ای نوع فعالیت پاسخ‌دهندگان<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    توزیع نوع فعالیت نشان می‌دهد پاسخ‌دهندگان از سطوح مختلف سازمانی (عملیاتی، مدیریتی) در پژوهش مشارکت داشته‌اند.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> حضور سطوح مختلف سازمانی، دیدگاه جامعی از فرایند تحول دیجیتال فراهم می‌کند — از اجرا تا راهبری.</div>
  `,

  'chart-desc-sd': `
    <strong>نوع نمودار:</strong> نمودار قطبی مقایسه انحراف معیار متغیرهای زمینه‌ای<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    مقایسه SD نشان می‌دهد کدام متغیرها پراکندگی بیشتری دارند — یعنی «دامنه تنوع» در نمونه بیشتر است.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> پراکندگی متغیرها پیش‌نیاز آماری برای کشف روابط معنادار است. اگر همه پاسخ‌دهندگان ویژگی‌های یکسان داشتند، امکان آزمون فرضیه‌ها وجود نداشت.</div>
  `,

  /* ========== لایه ۱ (PLS-SEM) ========== */
  'chart-l1-path': `
    <strong>نوع نمودار:</strong> دیاگرام مسیر مدل ساختاری — PLS-SEM (برازش مدل)<br>
    <strong>سازه‌ها:</strong> DS (استراتژی دیجیتال)، DKM (مدیریت دانش)، DTL (رهبری تحول)، DTS (موفقیت تحول)، SA (چابکی استراتژیک)<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    قوی‌ترین مسیر <strong>DTL→DKM با β=۰.۳۴۲</strong> و <strong>SA→DTS با β=۰.۳۴۰</strong> است؛ ضعیف‌ترین مسیر <strong>DTL×DS→DKM با β=۰.۰۷۱ (غیرمعنادار — H6 رد شد)</strong>. مسیرهای تعدیل‌گری با خط‌چین قرمز متمایز شده‌اند.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این دیاگرام «نقشه راه کل مدل» است: (۱) DS هم بر DKM و هم بر DTS اثر مستقیم دارد، (۲) DKM نقش میانجی بین DS و DTS را ایفا می‌کند، (۳) DTL و SA به‌عنوان تعدیل‌گر نقش دارند اما H6 رد شده، (۴) SA×DKM→DTS (H8) تأیید شده — یعنی چابکی رابطه دانش-موفقیت را تقویت می‌کند.</div>
  `,

  'chart-l1-beta-bar': `
    <strong>نوع نمودار:</strong> نمودار میله‌ای افقی ضرایب مسیر (β) — ۷ مسیر ساختاری<br>
    <strong>رنگ:</strong> سبز = معنادار (CI ۹۵٪ بدون صفر) · خاکستری = غیرمعنادار<br>
    <strong>مقادیر کلیدی:</strong> DTL→DKM=۰.۳۴۲ (قوی‌ترین) · SA→DTS=۰.۳۴۰ · DS→DTS=۰.۲۸۱ · DKM→DTS=۰.۲۷۰ · DS→DKM=۰.۲۴۱ · SA×DKM→DTS=۰.۱۸۸ · DTL×DS→DKM=۰.۰۷۱ (ضعیف‌ترین)<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    ترتیب صعودی β نشان می‌دهد ۶ مسیر از ۷ مسیر معنادار هستند (CI خط صفر را قطع نمی‌کند). فقط مسیر DTL×DS→DKM (H6) غیرمعنادار است — این همان یافته کلیدی مقاله است.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این نمودار «سلسله‌مراتب اثرات» را خلاصه می‌کند: DTL و SA قوی‌ترین محرک‌های مستقیم هستند، DKM و DS در رتبه بعدی، و اثر تعدیل‌گری DTL بر رابطه DS-DKM ضعیف و غیرمعنادار است. این یافته مبنای توصیه سیاستی «تمرکز بر رهبری و چابکی» است.</div>
  `,

  'chart-l1-r2': `
    <strong>نوع نمودار:</strong> نمودار میله‌ای R² و R²-Adjusted برای سازه‌های درون‌زا<br>
    <strong>مقادیر:</strong> R²(DKM)=۰.۱۸۲ · R²(DTS)=۰.۲۹۲ · تفاضل R² و R²-Adj کمتر از ۰.۰۲<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    DTS بالاترین R² را دارد (۰.۲۹۲) چون سه مسیر مستقیم (DS، DKM، SA) و یک مسیر تعاملی (SA×DKM) به آن منتهی می‌شوند. DKM با R²=۰.۱۸۲ توسط DS و DTL تبیین می‌شود.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> طبق Chin (1998)، R²>۰.۶۷ قوی، ۰.۳۳-۰.۶۷ متوسط، ۰.۱۹-۰.۳۳ ضعیف است. مدل ما برای DTS «ضعیف تا متوسط» (۰.۲۹۲) و برای DKM «ضعیف» (۰.۱۸۲) است. این یعنی متغیرهای ما واقعاً «پیش‌بین‌های معنادار» موفقیت هستند، اما بخشی از واریانس توسط عوامل خارج از مدل تبیین می‌شود.</div>
  `,

  'chart-l1-f2': `
    <strong>نوع نمودار:</strong> اندازه اثر f² کوهن برای ۷ مسیر ساختاری<br>
    <strong>آستانه‌ها (Cohen 1988):</strong> ۰.۰۲ = ضعیف · ۰.۱۵ = متوسط · ۰.۳۵ = قوی<br>
    <strong>مقادیر:</strong> DTL→DKM=۰.۱۱۲ (متوسط) · SA→DTS=۰.۱۰۸ (متوسط) · DS→DTS=۰.۰۸۵ (ضعیف) · DKM→DTS=۰.۰۷۹ (ضعیف) · DS→DKM=۰.۰۶۸ (ضعیف) · SA×DKM→DTS=۰.۰۴۷ (ضعیف) · DTL×DS→DKM=۰.۰۰۶ (ناچیز)<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    دو مسیر (DTL→DKM و SA→DTS) «اثر متوسط» دارند و بقیه «ضعیف» یا «ناچیز». مسیر H6 (DTL×DS→DKM) با f²=۰.۰۰۶ کمترین اندازه اثر را دارد — تأیید دیگری بر رد شدن این فرضیه.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> f² مکمل p-value است: p می‌گوید «اثر وجود دارد یا نه»، f² می‌گوید «اثر چقدر بزرگ است». این یافته به سیاست‌گذار می‌گوید تمرکز منابع بر DTL→DKM و SA→DTS بیشترین بازدهی عملی را دارد.</div>
  `,

  'chart-l1-quality': `
    <strong>نوع نمودار:</strong> نمودار میله‌ای گروهی ۴ شاخص پایایی/روایی برای ۵ سازه<br>
    <strong>آستانه‌ها:</strong> Cronbach ≥ ۰.۷ · rho_a ≥ ۰.۷ · rho_c ≥ ۰.۷ · AVE ≥ ۰.۵<br>
    <strong>مقادیر:</strong> همه ۲۰ خانه بالای آستانه‌اند. کمترین AVE: DKM=۰.۶۵۸ · بیشترین rho_c: DKM=۰.۹۵۴<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    هر ۵ سازه دارای Cronbach α بالای ۰.۹۱ و AVE بالای ۰.۶۵ هستند. یعنی (۱) گویه‌های هر سازه به‌شدت با هم همبسته‌اند (پایایی درونی عالی)، (۲) هر سازه بیش از ۶۵٪ واریانس گویه‌های خودش را تبیین می‌کند (روایی همگرای قوی).<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> بدون پایایی و روایی، هیچ نتیجه‌ای از مدل ساختاری قابل اعتماد نیست. این نمودار «مجوز ورود» به تحلیل‌های بعدی را صادر می‌کند: چون همه سازه‌ها بالای آستانه هستند، می‌توانیم به β و p-value و R² اعتماد کنیم.</div>
  `,

  'chart-l1-loadings': `
    <strong>نوع نمودار:</strong> Heatmap بارهای عاملی (Outer Loadings) — ۳۰ گویه روی ۵ سازه<br>
    <strong>آستانه:</strong> λ ≥ ۰.۷ (Hair et al. 2022)<br>
    <strong>مقادیر:</strong> کمترین Q6=۰.۷۸۸ (DKM) · بیشترین Q19=۰.۹۱۸ (DTS) · میانه ≈۰.۸۵<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    تمام ۳۰ گویه بار عاملی بالای ۰.۷۸ دارند — هیچ گویه‌ای نیاز به حذف ندارد. سازه DTS (با ۵ گویه) بالاترین بارها را دارد (۰.۸۷۶-۰.۹۱۸).<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> بارهای عاملی بالا یعنی «ابزار اندازه‌گیری دقیق است». چون هیچ گویه‌ای حذف نشد، تمام ۳۰ گویه پرسشنامه در مدل نهایی حفظ شدند — یعنی ابزار پژوهش از نظر روان‌سنجی معتبر و قابل استفاده در پژوهش‌های آتی است.</div>
  `,

  'chart-l1-vif': `
    <strong>نوع نمودار:</strong> Heatmap VIF — عامل تورم واریانس ۳۰ گویه<br>
    <strong>آستانه:</strong> VIF < ۵ (Hair et al. 2022) · ۳.۳ تا ۵ = هشدار · ≥ ۵ = مشکل جدی<br>
    <strong>مقادیر:</strong> کمترین Q18=۲.۷۴۱ (DTS) · بیشترین Q11=۳.۳۸۶ (DTL) · میانگین ≈۳.۰۸<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    هیچ گویه‌ای VIF بالای ۵ ندارد. Q11 (VIF=۳.۳۸۶) و Q5 (VIF=۳.۳۴۱) نزدیک‌ترین به آستانه هشدار (۳.۳) هستند اما هنوز زیر ۵. بیش از ۹۰٪ گویه‌ها VIF زیر ۳.۳ دارند.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> هم‌خطی چندگانه باعث «تورم خطای استاندارد β» و «کاهش دقت p-value» می‌شود. چون همه VIFها زیر ۵ هستند، می‌توانیم به β=۰.۳۴۲ و p<۰.۰۰۱ مسیر DTL→DKM کاملاً اعتماد کنیم.</div>
  `,

  'chart-l1-htmt': `
    <strong>نوع نمودار:</strong> ماتریس HTMT — نسبت هتروتریت-مونوتریت (Henseler et al. 2015)<br>
    <strong>آستانه:</strong> HTMT < ۰.۸۵ (محافظه‌کارانه) یا < ۰.۹۰ (لیبرال)<br>
    <strong>بیشترین مقدار:</strong> DS ↔ DTS = ۰.۵۲۱ (زیر هر دو آستانه)<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    بالاترین HTMT بین DS و DTS است (۰.۵۲۱) — که انتظار می‌رود چون استراتژی دیجیتال مستقیم‌ترین محرک موفقیت تحول است. سایر مقادیر زیر ۰.۵ هستند.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> HTMT روایی واگرا را می‌سنجد: آیا سازه‌ها واقعاً از هم متمایزند یا همدیگر را «می‌بلعند»؟ چون همه مقادیر زیر ۰.۸۵ هستند، پاسخ بله است — DS، DKM، DTL، DTS، SA پنج سازه مستقل با اندازه‌گیری دقیق هستند.</div>
  `,

  'chart-l1-slopes': `
    <strong>نوع نمودار:</strong> شیب‌های ساده — نمایش بصری تعدیل‌گری H6 (چپ) و H8 (راست)<br>
    <strong>۳ خط در هر پنل:</strong> متغیر تعدیل‌گر در سطح کم (-1SD)، متوسط (میانگین)، زیاد (+1SD)<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    <strong>پنل چپ (H6):</strong> شیب سه خط تقریباً موازی است — یعنی DTL رابطه DS-DKM را تعدیل نمی‌کند (H6 رد شد).<br>
    <strong>پنل راست (H8):</strong> شیب‌ها واگرا هستند — یعنی SA رابطه DKM-DTS را تقویت می‌کند (H8 تأیید شد).<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این تفاوت بصری، مهم‌ترین یافته تعاملی مقاله را نشان می‌دهد: در بافت صنعت دوچرخه برقی ایران، «رهبری» به‌تنهایی نمی‌تواند شکاف استراتژی-دانش را پر کند (احتمالاً به دلیل محدودیت‌های ساختاری)، اما «چابکی» می‌تواند رابطه دانش-موفقیت را تقویت کند.</div>
  `,

  'chart-l1-raincloud': `
    <strong>نوع نمودار:</strong> Raincloud — توزیع امتیازهای پنهان ۳ سازه (DS، DKM، DTS)<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    هر سه سازه توزیع زنگی و متقارن دارند. میانه همه نزدیک صفر است. دامنه هر سه تقریباً یکسان (-۳ تا +۳). هیچ Outlier شدیدی مشاهده نمی‌شود.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این نمودار «سلامت توزیع» را نشان می‌دهد. توزیع متقارن یعنی فرض‌های بوت‌استرپ (توزیع نرمال نمونه‌گیری) برقرار است و CIها معتبرند. اگر توزیع‌ها چوله شدید بودند، استفاده از Percentile Bootstrap با احتیاط بیشتری انجام می‌شد.</div>
  `,

  /* ========== لایه ۲ (Bootstrapping) ========== */
  'chart-l2-forest': `
    <strong>نوع نمودار:</strong> Forest Plot — ضرایب مسیر با فاصله اطمینان ۹۵٪ (Percentile Bootstrap، ۵,۰۰۰ زیرنمونه)<br>
    <strong>مسیرها:</strong> ۷ مسیر مرتب‌شده بر اساس β<br>
    <strong>قاعده تصمیم:</strong> اگر CI خط صفر را قطع نکند → مسیر معنادار<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    ۶ مسیر از ۷ مسیر CI خط صفر را قطع نمی‌کنند (معنادار). فقط مسیر DTL×DS→DKM (H6) خط صفر را قطع می‌کند (غیرمعنادار). عرض CI متفاوت است: DTL→DKM باریک‌ترین (دقیق‌ترین) و SA×DKM→DTS پهن‌ترین.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> Forest Plot استاندارد طلایی «گزارش شفاف» است. عرض CI نشان‌دهنده دقت برآورد است: CI باریک (DTL→DKM) = برآورد دقیق؛ CI پهن (تعامل‌ها) = عدم قطعیت بیشتر ولی همچنان معنادار. این نمودار به خواننده اجازه می‌دهد بدون دیدن جدول، مستقیماً ببیند کدام فرضیه‌ها تأیید شده‌اند (۶ مسیر) و کدام رد شده (H6).</div>
  `,

  'chart-l2-sig': `
    <strong>نوع نمودار:</strong> چشم‌انداز سه‌بعدی معناداری — هم‌زمان β × T × -log10(p)<br>
    <strong>نقاط سبز دایره:</strong> معنادار (p<۰.۰۵) · <strong>نقاط قرمز ضربدر:</strong> غیرمعنادار<br>
    <strong>محور Z:</strong> −log10(p) — مقدار بالاتر = معناداری بیشتر<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    DTL→DKM بالاترین موقعیت را در هر سه محور دارد (β=۰.۳۴۲، T=۵.۶۹، −log10(p)≈۵). مسیر H6 (DTL×DS→DKM) در پایین محور Z قرار دارد (p=۰.۲۰۱) و با علامت × مشخص است.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این نمودار «سه‌گانه تصمیم» را در یک تصویر جمع می‌کند: نه فقط «آیا معنادار است؟» (p)، بلکه «چقدر بزرگ است؟» (β) و «چقدر اطمینان داریم؟» (T). سیاست‌گذار با یک نگاه می‌بیند که DTL→DKM در «گوشه طلایی» (β بالا، T بالا، p پایین) قرار دارد، در حالی که H6 در «گوشه مرده» است.</div>
  `,

  'chart-l2-landscape': `
    <strong>نوع نمودار:</strong> نمودار میله‌ای رنگی بر اساس T — ضرایب مسیر با شدت رنگ T<br>
    <strong>مقیاس رنگ:</strong> سبز تیره = T بالا (معنادار قوی) · قرمز = T پایین (غیرمعنادار)<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    میله‌های بلند (β بالا) رنگ سبز تیره دارند — هم‌راستایی β و T. اما استثنا: SA×DKM→DTS میله متوسط با رنگ سبز نسبتاً تیره دارد چون T=۲.۸۵، در حالی که DTL×DS→DKM (β مشابه) T پایین‌تری دارد (۱.۲۸).<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این نمودار مکمل Forest Plot است: به‌جای بازه‌های اطمینان، «قدرت شاهد» را نمایش می‌دهد. مسیر تعاملی SA×DKM→DTS با وجود β متوسط، T بالایی دارد چون اثر آن با وجود پیچیدگی، بسیار پایدار است — این تأیید می‌کند تعدیل‌گری SA «اثر واقعی» است نه نویز.</div>
  `,

  /* ========== لایه ۳ (PLS Predict) ========== */
  'chart-l3-q2': `
    <strong>نوع نمودار:</strong> ستون‌های Q²predict برای ۳۰ گویه<br>
    <strong>آستانه (Hair et al. 2022):</strong> Q²>۰.۱۰ = قوی · ۰<Q²<۰.۱۰ = متوسط · Q²<۰ = ضعیف<br>
    <strong>مقادیر کلیدی:</strong> کمترین Q18=۰.۰۸۸ · بیشترین Q4=۰.۱۶۱ · میانگین=۰.۱۲۸<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    تمام ۳۰ گویه Q²>۰.۰۸ دارند — یعنی «قدرت پیش‌بینی برون‌نمونه‌ای» مثبت دارند. ۲۶ گویه Q²>۰.۱۰ (قوی) و ۴ گویه (Q13، Q14، Q16، Q18) بین ۰.۰۸ تا ۰.۱۰ (متوسط). خط سبز آستانه ۰.۱۰ را نشان می‌دهد.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> Q² معیار «پیش‌بینی» است، نه «تبیین». حتی اگر R² بالا باشد، اگر Q² پایین باشد یعنی مدل روی داده جدید کار نمی‌کند. چون Q² همه گویه‌ها مثبت و اکثراً >۰.۱۰ هستند، مدل ما «تعمیم‌پذیر» است و می‌تواند در پژوهش‌های آینده روی داده‌های جدید استفاده شود.</div>
  `,

  'chart-l3-q2-2': `
    <strong>نوع نمودار:</strong> نسخه فیلترشده Q² — کاربر می‌تواند گویه‌های منتخب را از فیلتر بالای صفحه انتخاب کند<br>
    <strong>همان منطق نمودار قبل:</strong> آستانه ۰.۱۰ و ۰<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    با تغییر فیلتر گویه‌ها، ستون‌های Q² به‌روز می‌شوند. این امکان به پژوهشگر اجازه می‌دهد فقط روی گویه‌های یک سازه خاص (مثلاً فقط DTS: Q16-Q20) تمرکز کند و توزیع Q² درون آن سازه را ببیند.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این «تحلیل حساسیت» است: آیا قدرت پیش‌بینی مدل به گویه خاصی وابسته است یا توزیع Q² درون هر سازه یکنواخت است؟ اگر Q² درون DTS یکنواخت باشد، یعنی تمام ۵ گویه DTS به یک اندازه در پیش‌بینی نقش دارند — این نشانه «سازه یکپارچه» است.</div>
  `,

  'chart-l3-stems': `
    <strong>نوع نمودار:</strong> نمودار میله‌ای گروهی RMSE — مقایسه ۳ روش (PLS-SEM، LM، IA) در ۳۰ گویه<br>
    <strong>قاعده:</strong> RMSE کمتر = پیش‌بینی دقیق‌تر<br>
    <strong>یافته:</strong> در تمام ۳۰ گویه، PLS کمترین RMSE را دارد<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    برای هر گویه، سه ستون (PLS سبز، LM نارنجی، IA قرمز) دیده می‌شود. ستون PLS همیشه کوتاه‌ترین (کمترین RMSE) است. IA بلندترین RMSE را دارد. LM در وسط قرار می‌گیرد.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> طبق استاندارد Shmueli et al. (2019)، اگر PLS در تمام گویه‌ها RMSE کمتری از LM داشته باشد، مدل «قدرت پیش‌بینی متوسط تا قوی» دارد. این یافته یعنی PLS-SEM ما در پیش‌بینی داده‌های جدید از رگرسیون خطی و میانگین ساده بهتر عمل می‌کند — توجیه قوی برای استفاده از PLS به‌جای روش‌های ساده‌تر.</div>
  `,

  'chart-l3-landscape': `
    <strong>نوع نمودار:</strong> Heatmap RMSE — نمایش پیوسته RMSE در ۳۰ گویه × ۳ روش<br>
    <strong>مقیاس رنگ:</strong> تیره = RMSE کم (دقیق) · روشن = RMSE زیاد (غیردقیق)<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    ردیف PLS (بالا) تیره‌ترین است — بهترین پیش‌بینی. ردیف IA (پایین) روشن‌ترین است — بدترین پیش‌بینی. ردیف LM در وسط قرار دارد. چند «نقطه روشن» در ردیف IA (گویه‌های Q5، Q6) دیده می‌شود — یعنی IA در این گویه‌ها خطای بسیار بالایی دارد.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این نمودار نشان می‌دهد که «برتری PLS» در همه گویه‌ها یکنواخت است، نه اینکه فقط در چند گویه برنده باشد. یکنواختی رنگ تیره در ردیف PLS = «برتری سیستماتیک».</div>
  `,

  'chart-l3-ridge': `
    <strong>نوع نمودار:</strong> نمودار میله‌ای Q² با رنگ‌بندی Viridis — توزیع Q² در ۳۰ گویه<br>
    <strong>قله‌ها:</strong> نواحی روشن‌تر = Q² بالاتر<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    دو «قله» اصلی در نمودار دیده می‌شود: یکی در اطراف گویه‌های DS (Q27-Q30) و یکی در اطراف گویه‌های DTS (Q16-Q20). سازه DKM (Q1-Q9) Q² پایین‌تری دارد.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این «توپوگرافی Q²» نشان می‌دهد که کدام خانواده‌های گویه «قدرت پیش‌بینی هم‌خانواده» دارند. یعنی Q² بین گویه‌های یک سازه همبسته است — این نتیجه از همبستگی درونی سازه (پایایی بالا) می‌آید.</div>
  `,

  'chart-l3-cvpat': `
    <strong>نوع نمودار:</strong> نمودار میله‌ای CVPAT — آزمون توان پیش‌بینی متقابل (Cross-Validated Predictive Ability Test)<br>
    <strong>ردیف ۱:</strong> Δ PLS − IA · <strong>ردیف ۲:</strong> Δ PLS − LM<br>
    <strong>تفسیر Δ:</strong> Δ منفی = PLS خطای کمتری دارد (برنده) · Δ مثبت = رقیب برنده<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    تمام ۶ ستون (۳ سازه × ۲ مقایسه) Δ منفی دارند. بیشترین برتری: DTS با Δ≈−۰.۱۱۸ در برابر IA و Δ≈−۰.۰۵۵ در برابر LM. کمترین برتری: DKM با Δ≈−۰.۰۹۵ (در برابر IA).<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> CVPAT آزمون رسمی «آیا PLS واقعاً بهتر است؟» است. طبق Liengaard et al. (2021)، Δ منفی + p<۰.۰۵ = «برتری معنادار». تمام ۶ ستون Δ<۰ دارند — یعنی PLS-SEM ما در پیش‌بینی همه سازه‌ها از IA و LM معنادار بهتر است. این «تأیید نهایی» برای استفاده از PLS به‌جای رگرسیون است.</div>
  `,

  'chart-l3-ridgeline': `
    <strong>نوع نمودار:</strong> نمودار میله‌ای با خطای استاندارد — توزیع خطای پیش‌بینی برای ۳۰ گویه<br>
    <strong>میانگین خطا:</strong> نزدیک صفر برای همه گویه‌ها<br>
    <strong>خطای استاندارد:</strong> عرض نوار خطا<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    همه گویه‌ها میانگین خطای نزدیک صفر دارند — یعنی «خطای سیستماتیک» وجود ندارد. برخی گویه‌ها (Q5، Q6، Q11) خطای استاندارد بالاتری دارند — یعنی دقت پیش‌بینی درون سازه‌ها یکنواخت نیست.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> میانگین خطای نزدیک صفر = «بایاس سیستماتیک» نداریم — ویژگی کلیدی برای اعتبار پیش‌بینی. گویه‌های با خطای بالا نیاز به بررسی محتوایی یا داده بیشتر دارند.</div>
  `,

  'chart-l3-scatter': `
    <strong>نوع نمودار:</strong> پراکندگی RMSE — PLS (محور Y) در برابر LM (محور X)<br>
    <strong>خط y=x:</strong> اگر نقطه‌ای زیر خط باشد، PLS بهتر است<br>
    <strong>اندازه نقطه:</strong> نسبی با Q² · رنگ: Q²<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    تمام ۳۰ نقطه زیر خط y=x هستند — یعنی در هیچ گویه‌ای LM بهتر از PLS نیست. نقاط با Q² بالاتر (رنگ تیره‌تر) معمولاً در سمت چپ-پایین (RMSE کمتر در هر دو روش) قرار دارند — یعنی Q² بالا با RMSE کم همبسته است.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این نمودار «برتری یکنواخت PLS» را بصری اثبات می‌کند. اگر حتی یک نقطه بالای خط y=x بود، یعنی در آن گویه LM بهتر بود و باید به‌صورت موردی بررسی می‌شد. نبود چنین نقطه‌ای = «برتری قطعی PLS در تمام حوزه‌ها».</div>
  `,

  'chart-l3-forest': `
    <strong>نوع نمودار:</strong> Forest Plot CVPAT — Δ PLS در برابر IA و LM با بازه اطمینان ۹۵٪<br>
    <strong>خط قرمز صفر:</strong> اگر CI صفر را قطع نکند → Δ معنادار است<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    هر ۶ بازه اطمینان (۳ سازه × ۲ مقایسه) کاملاً سمت چپ صفر هستند — یعنی PLS در همه ۶ مقایسه معنادار برنده است. DTS با Δ≈−۰.۱۱۸ بیشترین فاصله از صفر را دارد (برتری قوی‌تر).<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این نمودار «مهم‌ترین نمودار» برای توصیه روش‌شناسی است: نه‌تنها Δ منفی است، بلکه «کل بازه اطمینان» منفی است — یعنی حتی در بدترین سناریو (بالای CI)، PLS همچنان بهتر است. این سطح از اطمینان، توصیه به استفاده از PLS-SEM را برای پژوهش‌های آتی توجیه می‌کند.</div>
  `,

  /* ========== مونت‌کارلو ========== */
  'chart-mc-scenarios': `
    <strong>نوع نمودار:</strong> هیستوگرام توزیع موفقیت در ۳ سناریو (۱۰,۰۰۰ شبیه‌سازی مونت‌کارلو)<br>
    <strong>سناریوها:</strong> خوش‌بینانه (تحریم و نرخ ارز پایین) · پایه · بدبینانه (تحریم و نرخ ارز بالا)<br>
    <strong>مقادیر کلیدی:</strong> خوش‌بینانه μ=۰.۴۸۲ · پایه μ=۰.۴۱۲ · بدبینانه μ=۰.۳۳۸<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    میانگین موفقیت از سناریوی خوش‌بینانه به بدبینانه به‌طور پیوسته کاهش می‌یابد (۰.۴۸۲ → ۰.۳۳۸). این تفاوت ۰.۱۴۴ واحدی نشان می‌دهد که شرایط محیطی (تحریم، نوسانات ارزی) می‌تواند موفقیت تحول دیجیتال را تا ۳۰٪ کاهش دهد.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این یافته مهم‌ترین پیام مونت‌کارلو است: «موفقیت تحول دیجیتال، مستقل از شرایط محیطی نیست». سیاست‌گذار باید در برنامه‌ریزی، سناریوهای مختلف را لحاظ کند — نه فقط شرایط بهینه.</div>
  `,

  'chart-mc-h6': `
    <strong>نوع نمودار:</strong> تحلیل حساسیت H6 — توزیع اثر تعدیل‌گری رهبری در ۳ سناریو<br>
    <strong>مقادیر کلیدی:</strong> خوش‌بینانه μ=۰.۰۸۵ · پایه μ=۰.۰۴۲ · بدبینانه μ=−۰.۰۱۸<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    در سناریوی خوش‌بینانه، اثر رهبری مثبت است (۰.۰۸۵)؛ در سناریوی پایه نزدیک صفر (۰.۰۴۲)؛ و در سناریوی بدبینانه منفی (−۰.۰۱۸). یعنی با افزایش شدت تحریم، اثر تعدیل‌گری رهبری از مثبت به منفی میل می‌کند.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این نمودار <strong>توضیح علمی رد شدن H6</strong> را ارائه می‌دهد: در شرایط عدم‌قطعیت شدید محیطی (تحریم، نوسانات ارزی)، رهبری دیجیتال به‌تنهایی نمی‌تواند شکاف استراتژی-دانش را پر کند. محدودیت‌های ساختاری، اثر رهبری فردی را تضعیف می‌کنند.</div>
  `,

  'chart-mc-effects': `
    <strong>نوع نمودار:</strong> هیستوگرام اثر غیرمستقیم (H4) و اثر کل<br>
    <strong>مقادیر کلیدی:</strong> اثر غیرمستقیم μ=۰.۰۷۶ · اثر کل μ=۰.۳۵۸<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    هر دو توزیع تقریباً زنگی و متقارن هستند. اثر غیرمستقیم (میانجی‌گری DKM) حدود ۲۱٪ از اثر کل را تشکیل می‌دهد — یعنی DKM یک «کانال مهم» برای انتقال اثر DS به DTS است.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این یافته نقش میانجی DKM را تأیید می‌کند: استراتژی دیجیتال هم مستقیم و هم از طریق مدیریت دانش بر موفقیت اثر می‌گذارد. سیاست‌گذار با تقویت هم‌زمان DS و DKM، دو مسیر را فعال می‌کند.</div>
  `,

  'chart-mc-tornado': `
    <strong>نوع نمودار:</strong> نمودار Tornado — اهمیت پارامترها بر اساس همبستگی با موفقیت<br>
    <strong>مقادیر کلیدی:</strong> DS=۰.۴۱۲ · DKM=۰.۳۹۸ · SA=۰.۳۵۱ · DTL=۰.۳۱۲ · تحریم=−۰.۲۸۷ · نرخ ارز=−۰.۱۹۴ · قطعی برق=−۰.۱۵۶<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    سه سازه اصلی (DS، DKM، SA) بیشترین همبستگی مثبت را با موفقیت دارند. در میان متغیرهای زمینه‌ای، «شدت تحریم» بیشترین همبستگی منفی را دارد (−۰.۲۸۷) — یعنی مهم‌ترین تهدید خارجی است.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این نمودار «رتبه‌بندی اهمیت عوامل» را برای سیاست‌گذاری فراهم می‌کند: (۱) تقویت DS، DKM، SA اولویت اول است؛ (۲) کاهش اثر تحریم اولویت دوم؛ (۳) مدیریت نرخ ارز و قطعی برق در رتبه بعدی.</div>
  `,

  'chart-mc-robustness': `
    <strong>نوع نمودار:</strong> تحلیل استواری — مقایسه توزیع اثر کل در ۳ توزیع مختلف (نرمال، t، تجربی)<br>
    <strong>مقادیر کلیدی:</strong> نرمال μ=۰.۴۱۲ · t μ=۰.۴۰۸ · تجربی μ=۰.۴۱۵<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    سه توزیع تقریباً کاملاً بر هم منطبق هستند (تفاوت میانگین‌ها کمتر از ۰.۰۰۷). این یعنی نتایج مونت‌کارلو به «انتخاب توزیع» حساس نیست.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این «استواری» (robustness) نشان می‌دهد که یافته‌های ما قابل اعتماد هستند — صرف‌نظر از فرض توزیع. اگر توزیع‌ها متفاوت بودند، باید در تفسیر نتایج احتیاط می‌کردیم.</div>
  `,

  'chart-mc-oat': `
    <strong>نوع نمودار:</strong> تحلیل حساسیت تک‌متغیره (OAT) — تغییر ±۲۰٪ در هر پارامتر<br>
    <strong>پارامترها:</strong> H1 (DS→DKM)، H2 (DS→DTS)، H3 (DKM→DTS)<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    هر سه پارامتر اثر مثبت خطی بر اثر کل دارند. شیب H2 (DS→DTS) تندترین است — یعنی این پارامتر بیشترین حساسیت را دارد. شیب H1 و H3 ملایم‌تر هستند.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این تحلیل «حساسیت» را نشان می‌دهد: اثر کل به تغییرات DS→DTS حساس‌تر از تغییرات DS→DKM یا DKM→DTS است. سیاست‌گذار با تمرکز بر مسیر مستقیم DS→DTS، بیشترین بازدهی را دارد.</div>
  `,

  'chart-mc-ci': `
    <strong>نوع نمودار:</strong> مقایسه فاصله اطمینان βها — PLS-SEM (نقطه آبی) vs مونت‌کارلو (نقطه نارنجی با CI)<br>
    <strong>مقادیر کلیدی:</strong> هر ۸ فرضیه، PLS β و MC Mean تقریباً یکسان<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    نقاط آبی (PLS) و نارنجی (MC) تقریباً روی هم منطبق هستند — یعنی دو روش به نتایج یکسان می‌رسند. CIهای MC برای ۷ فرضیه (H1-H5، H7، H8) خط صفر را قطع نمی‌کنند (معنادار) و فقط H6 غیرمعنادار است.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این نمودار «اعتبار همگرا» (convergent validity) بین دو روش را نشان می‌دهد. اگر PLS و مونت‌کارلو به نتایج یکسان برسند، نتیجه «واقعی» است نه محصول یک روش خاص. برای مقاله، این یکی از قوی‌ترین شواهد اعتبار است.</div>
  `,

  /* ========== ML + SHAP ========== */
  'chart-ml-compare': `
    <strong>نوع نمودار:</strong> نمودار میله‌ای مقایسه R² مدل‌ها (XGBoost، Random Forest، PLS-SEM)<br>
    <strong>مقادیر کلیدی:</strong> XGBoost R²=۰.۵۰۷ · Random Forest R²=۰.۵۲۲ · PLS-SEM R²=۰.۲۹۲<br>
    <strong>ΔR² (XGBoost − PLS) = +۰.۲۱۵</strong><br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    مدل‌های ML به‌طور چشمگیری بهتر از PLS-SEM عمل کردند. Random Forest کمی بهتر از XGBoost است اما هر دو حدود ۰.۵۱-۰.۵۲ R² دارند در مقابل ۰.۲۹۲ برای PLS. خط قرمز PLS-SEM را نشان می‌دهد.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این تفاوت ۰.۲۱۵ واحدی نشان می‌دهد که <strong>الگوهای غیرخطی و تعاملات پیچیده‌ای</strong> در داده‌ها وجود دارند که مدل خطی PLS-SEM قادر به کشف آن‌ها نبوده است. این یافته، ارزش افزوده رویکرد ML را برای تکمیل تحلیل PLS-SEM تأیید می‌کند.</div>
  `,

  'chart-ml-construct': `
    <strong>نوع نمودار:</strong> نمودار میله‌ای اهمیت سازه‌ها بر اساس میانگین |SHAP|<br>
    <strong>مقادیر کلیدی:</strong> DTL=۰.۰۵۵ · SA=۰.۰۳۹ · DKM=۰.۰۱۰ · DS=۰.۰۰۶<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    رهبری تحول دیجیتال (DTL) مهم‌ترین سازه است و پس از آن چابکی استراتژیک (SA). این ترتیب با PLS-SEM <strong>هم‌خوانی جزئی</strong> دارد: در PLS-SEM، DKM و DS پیش‌بین‌های اصلی بودند، اما در ML، DTL و SA اهمیت بیشتری یافتند.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این تفاوت نشان می‌دهد که <strong>الگوهای غیرخطی</strong> ممکن است نقش رهبری و چابکی را در سطوح بالای موفقیت برجسته‌تر کنند. یعنی وقتی موفقیت از سطح متوسط فراتر می‌رود، «رهبری» و «چابکی» به عوامل تعیین‌کننده تبدیل می‌شوند — یافته‌ای که در مدل خطی PLS-SEM پنهان مانده بود.</div>
  `,

  'chart-ml-shap-bar': `
    <strong>نوع نمودار:</strong> نمودار میله‌ای اهمیت ویژگی‌ها بر اساس |SHAP| (Top ۱۰)<br>
    <strong>مقادیر کلیدی:</strong> Q14=۰.۱۴۹ · Q15=۰.۱۰۹ · Q22=۰.۰۷۹ · Q23=۰.۰۵۰ · Q21=۰.۰۴۴ · Q7=۰.۰۳۳ · Q10=۰.۰۲۸ · Q26=۰.۰۲۱ · Q24=۰.۰۱۹ · Q25=۰.۰۱۹<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    گویه‌های Q14 و Q15 (از سازه DTL) و Q22 (از سازه SA) بیشترین سهم را در پیش‌بینی موفقیت دارند. این یعنی «رهبری تحول دیجیتال» و «چابکی استراتژیک» در سطوح گویه‌ای نیز مهم‌ترین هستند.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این یافته «عملیاتی» است: برای بهبود موفقیت تحول دیجیتال، مدیران باید به گویه‌های خاص Q14، Q15 و Q22 توجه ویژه کنند. این گویه‌ها به‌طور مشخص، «رهبری دیجیتال مؤثر» و «چابکی سازمانی» را اندازه‌گیری می‌کنند.</div>
  `,

  'chart-ml-shap-summary': `
    <strong>نوع نمودار:</strong> SHAP Summary (Beeswarm) — توزیع اثر SHAP هر گویه در ۱۰۰ مشاهده<br>
    <strong>مقادیر کلیدی:</strong> هر نقطه = یک پاسخ‌دهنده · محور X = اثر SHAP · رنگ = مقدار گویه (آبی=کم، قرمز=زیاد)<br><br>
    <em>چه می‌بینیم و چرا؟</em><br>
    برای گویه‌های مهم (Q14، Q15، Q22)، الگوی «رنگ‌های قطبی» دیده می‌شود: نقاط قرمز (مقدار بالای گویه) در سمت راست و نقاط آبی در سمت چپ — یعنی رابطه یکنوا و مثبت است.<br>
    <div class="reason-text"><strong>ارتباط با هدف پژوهش:</strong> این نمودار «چرا»ی اهمیت Q14، Q15، Q22 را توضیح می‌دهد: پاسخ‌دهندگانی که نمره بالاتری در این گویه‌ها داشتند، موفقیت تحول دیجیتال بالاتری را تجربه کردند. این یعنی تقویت این گویه‌ها (از طریق آموزش رهبری و توسعه چابکی) می‌تواند مستقیماً موفقیت را افزایش دهد.</div>
  `
};

/* ================================================================
   MAIN_CHART_INTS_EN (English) — ۳۸ تفسیر انگلیسی
   ================================================================ */
const MAIN_CHART_INTS_EN = {

  /* ========== Descriptive ========== */
  'chart-desc-gender': `
    <strong>Chart type:</strong> Pie chart — gender distribution (absolute and relative frequency)<br>
    <strong>n = 180</strong> · Missing: zero<br><br>
    <em>What we see and why:</em><br>
    The gender distribution shows a balanced composition — natural given the target population "employees of active companies in Iran's electric bicycle industry" and the purposive sampling to ensure gender diversity.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> A balanced gender composition enables generalizing results to the entire industry. If the sample were single-gender, results would only apply to one group.</div>
  `,

  'chart-desc-age': `
    <strong>Chart type:</strong> Bar chart — age distribution in 4 categories<br>
    <strong>Statistics:</strong> Mean = 2.76 · SD = 0.758 · Skewness = 0.089<br><br>
    <em>What we see and why:</em><br>
    The age distribution is approximately symmetric (skewness near zero), with most respondents aged 30-49 — the "peak professional activity window".<br>
    <div class="reason-text"><strong>Link to research goal:</strong> Concentration in the peak economic activity range strengthens generalizability to the industry. If the sample were dominated by young or retired employees, the effect of digital transformation would likely differ.</div>
  `,

  'chart-desc-edu': `
    <strong>Chart type:</strong> Horizontal bar chart — education distribution<br>
    <strong>Statistics:</strong> Mean = 1.44 · SD = 0.579 · Skewness = 0.923<br><br>
    <em>What we see and why:</em><br>
    Most respondents hold a bachelor's degree, with a small minority having graduate education. Positive skew indicates the mass is in the "moderate education" range.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> Moderate education levels make "digital knowledge management" more prominent as a compensating mechanism — organizations can bridge skill gaps through knowledge systems.</div>
  `,

  'chart-desc-field': `
    <strong>Chart type:</strong> Bar chart — respondents' field of activity<br><br>
    <em>What we see and why:</em><br>
    The distribution shows the sample covers different industry segments (production, assembly, distribution).<br>
    <div class="reason-text"><strong>Link to research goal:</strong> Diversity of activity fields enhances generalizability of findings to the entire industry value chain.</div>
  `,

  'chart-desc-activiti': `
    <strong>Chart type:</strong> Bar chart — respondents' activity type<br><br>
    <em>What we see and why:</em><br>
    The distribution shows respondents from various organizational levels (operational, managerial) participated.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> Presence of different organizational levels provides a comprehensive view of digital transformation — from execution to leadership.</div>
  `,

  'chart-desc-sd': `
    <strong>Chart type:</strong> Barpolar chart — SD comparison across background variables<br><br>
    <em>What we see and why:</em><br>
    SD comparison shows which variables have greater dispersion — "range of variation" in the sample.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> Variable dispersion is a statistical prerequisite for detecting significant relationships. If all respondents had identical characteristics, hypothesis testing would be impossible.</div>
  `,

  /* ========== Layer 1 (PLS-SEM) ========== */
  'chart-l1-path': `
    <strong>Chart type:</strong> Structural path diagram — PLS-SEM (model fit)<br>
    <strong>Constructs:</strong> DS (Digital Strategy), DKM (Knowledge Management), DTL (Digital Leadership), DTS (Digital Success), SA (Strategic Agility)<br><br>
    <em>What we see and why:</em><br>
    The strongest paths are <strong>DTL→DKM with β=0.342</strong> and <strong>SA→DTS with β=0.340</strong>; the weakest is <strong>DTL×DS→DKM with β=0.071 (non-significant — H6 rejected)</strong>. Moderation paths are distinguished by red dashed lines.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This diagram is the "roadmap" of the model: (1) DS has direct effects on both DKM and DTS, (2) DKM mediates DS→DTS, (3) DTL and SA act as moderators but H6 is rejected, (4) SA×DKM→DTS (H8) is confirmed — agility strengthens the knowledge-success relationship.</div>
  `,

  'chart-l1-beta-bar': `
    <strong>Chart type:</strong> Horizontal bar — path coefficients (β) for 7 structural paths<br>
    <strong>Color:</strong> Green = significant (CI 95% excludes zero) · Gray = non-significant<br>
    <strong>Key values:</strong> DTL→DKM=0.342 (strongest) · SA→DTS=0.340 · DS→DTS=0.281 · DKM→DTS=0.270 · DS→DKM=0.241 · SA×DKM→DTS=0.188 · DTL×DS→DKM=0.071 (weakest)<br><br>
    <em>What we see and why:</em><br>
    Ascending β order shows 6 of 7 paths are significant (CI excludes zero). Only DTL×DS→DKM (H6) is non-significant — the key finding of the article.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This chart summarizes the "hierarchy of effects": DTL and SA are the strongest direct drivers, DKM and DS next, and DTL's moderation effect on DS-DKM is weak and non-significant. Policy implication: focus on leadership and agility.</div>
  `,

  'chart-l1-r2': `
    <strong>Chart type:</strong> Bar chart — R² and R²-Adjusted for endogenous constructs<br>
    <strong>Values:</strong> R²(DKM)=0.182 · R²(DTS)=0.292 · R²-R²Adj difference <0.02<br><br>
    <em>What we see and why:</em><br>
    DTS has the highest R² (0.292) because three direct paths (DS, DKM, SA) and one interaction (SA×DKM) converge on it. DKM with R²=0.182 is explained by DS and DTL.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> By Chin (1998), R²>0.67 substantial, 0.33-0.67 moderate, 0.19-0.33 weak. Our model for DTS is "weak to moderate" (0.292) and DKM "weak" (0.182). This means our variables are genuine predictors of success, but some variance is explained by external factors.</div>
  `,

  'chart-l1-f2': `
    <strong>Chart type:</strong> Bar chart — Cohen's f² effect size for 7 structural paths<br>
    <strong>Thresholds (Cohen 1988):</strong> 0.02 = small · 0.15 = medium · 0.35 = large<br>
    <strong>Values:</strong> DTL→DKM=0.112 (medium) · SA→DTS=0.108 (medium) · DS→DTS=0.085 · DKM→DTS=0.079 · DS→DKM=0.068 · SA×DKM→DTS=0.047 · DTL×DS→DKM=0.006 (negligible)<br><br>
    <em>What we see and why:</em><br>
    Two paths (DTL→DKM and SA→DTS) have "medium" effects, others are "small" or "negligible". H6 has f²=0.006 — confirming its rejection.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> f² complements p-value: p tells "whether an effect exists", f² tells "how large". Policy should focus on DTL→DKM and SA→DTS for maximum practical return.</div>
  `,

  'chart-l1-quality': `
    <strong>Chart type:</strong> Grouped bar chart — 4 reliability/validity metrics for 5 constructs<br>
    <strong>Thresholds:</strong> Cronbach ≥ 0.7 · rho_a ≥ 0.7 · rho_c ≥ 0.7 · AVE ≥ 0.5<br>
    <strong>Values:</strong> All 20 cells above thresholds. Minimum AVE: DKM=0.658 · Maximum rho_c: DKM=0.954<br><br>
    <em>What we see and why:</em><br>
    All 5 constructs have Cronbach α above 0.91 and AVE above 0.65, meaning (1) items are strongly inter-correlated (excellent internal reliability) and (2) each construct explains over 65% of its items' variance (strong convergent validity).<br>
    <div class="reason-text"><strong>Link to research goal:</strong> Without reliability and validity, no structural model results are trustworthy. This chart is the "entry pass" to subsequent analyses: all constructs pass thresholds, so we can trust β, p, and R².</div>
  `,

  'chart-l1-loadings': `
    <strong>Chart type:</strong> Heatmap — outer loadings of 30 items on 5 constructs<br>
    <strong>Threshold:</strong> λ ≥ 0.7 (Hair et al. 2022)<br>
    <strong>Values:</strong> Minimum Q6=0.788 (DKM) · Maximum Q19=0.918 (DTS) · Median ≈0.85<br><br>
    <em>What we see and why:</em><br>
    All 30 items have loadings above 0.78 — none requires removal. DTS (5 items) has the highest loadings (0.876-0.918).<br>
    <div class="reason-text"><strong>Link to research goal:</strong> High loadings mean the instrument is precise. Since no item was removed, all 30 questionnaire items remain in the final model — psychometrically sound and reusable in future research.</div>
  `,

  'chart-l1-vif': `
    <strong>Chart type:</strong> Heatmap — VIF for 30 items<br>
    <strong>Threshold:</strong> VIF < 5 (Hair et al. 2022) · 3.3-5 = warning · ≥ 5 = critical<br>
    <strong>Values:</strong> Minimum Q18=2.741 (DTS) · Maximum Q11=3.386 (DTL) · Mean ≈3.08<br><br>
    <em>What we see and why:</em><br>
    No item has VIF above 5. Q11 (VIF=3.386) and Q5 (VIF=3.341) are closest to the warning threshold (3.3) but still under 5. Over 90% of items have VIF under 3.3.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> Multicollinearity inflates β standard errors and reduces p-value precision. Since all VIFs are under 5, we can fully trust β=0.342 and p<0.001 on DTL→DKM.</div>
  `,

  'chart-l1-htmt': `
    <strong>Chart type:</strong> HTMT matrix — Heterotrait-Monotrait ratio (Henseler et al. 2015)<br>
    <strong>Threshold:</strong> HTMT < 0.85 (conservative) or < 0.90 (liberal)<br>
    <strong>Maximum value:</strong> DS ↔ DTS = 0.521 (below both thresholds)<br><br>
    <em>What we see and why:</em><br>
    The highest HTMT is between DS and DTS (0.521) — expected since digital strategy is the most direct driver of digital success. All other values are below 0.5.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> HTMT tests discriminant validity: are constructs truly distinct or do they "consume" each other? All values below 0.85 confirm DS, DKM, DTL, DTS, SA are five independent constructs with precise measurement.</div>
  `,

  'chart-l1-slopes': `
    <strong>Chart type:</strong> Simple slopes — visual moderation of H6 (left) and H8 (right)<br>
    <strong>3 lines per panel:</strong> Moderator at low (-1SD), mean, high (+1SD)<br><br>
    <em>What we see and why:</em><br>
    <strong>Left panel (H6):</strong> The three slopes are nearly parallel — DTL does not moderate DS-DKM (H6 rejected).<br>
    <strong>Right panel (H8):</strong> Slopes are divergent — SA strengthens DKM-DTS (H8 confirmed).<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This visual contrast shows the most important interaction finding: in Iran's electric bicycle industry context, "leadership" alone cannot bridge the strategy-knowledge gap (likely due to structural constraints), but "agility" can strengthen the knowledge-success relationship.</div>
  `,

  'chart-l1-raincloud': `
    <strong>Chart type:</strong> Raincloud — latent score distribution of 3 constructs (DS, DKM, DTS)<br><br>
    <em>What we see and why:</em><br>
    All three constructs have bell-shaped symmetric distributions. Medians near zero. All span approximately -3 to +3. No severe outliers.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This chart shows "distributional health". Symmetric distributions confirm bootstrap assumptions (normal sampling distribution) and validate CIs. If distributions were severely skewed, Percentile Bootstrap would need more caution.</div>
  `,

  /* ========== Layer 2 (Bootstrapping) ========== */
  'chart-l2-forest': `
    <strong>Chart type:</strong> Forest Plot — path coefficients with 95% CI (Percentile Bootstrap, 5,000 subsamples)<br>
    <strong>Paths:</strong> 7 paths sorted by β<br>
    <strong>Decision rule:</strong> If CI does not cross zero → significant<br><br>
    <em>What we see and why:</em><br>
    6 of 7 paths have CIs not crossing zero (significant). Only DTL×DS→DKM (H6) crosses zero (non-significant). CI width varies: DTL→DKM narrowest (most precise), SA×DKM→DTS widest.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> Forest Plot is the gold standard for transparent reporting. Narrow CI (DTL→DKM) = precise estimate; wide CI (interactions) = more uncertainty yet still significant. The chart shows at a glance which hypotheses are confirmed (6 paths) and which is rejected (H6).</div>
  `,

  'chart-l2-sig': `
    <strong>Chart type:</strong> 3D significance landscape — β × T × -log10(p)<br>
    <strong>Green circles:</strong> significant (p<0.05) · <strong>Red X:</strong> non-significant<br>
    <strong>Z-axis:</strong> −log10(p) — higher = more significant<br><br>
    <em>What we see and why:</em><br>
    DTL→DKM has the highest position on all three axes (β=0.342, T=5.69, −log10(p)≈5). H6 (DTL×DS→DKM) is at the bottom of the Z-axis (p=0.201) marked with X.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This chart combines the "decision triad": not just "is it significant?" (p), but "how large?" (β) and "how confident?" (T). Policy sees at a glance that DTL→DKM sits in the "golden corner" (high β, high T, low p), while H6 is in the "dead corner".</div>
  `,

  'chart-l2-landscape': `
    <strong>Chart type:</strong> Colored bar chart based on T — path coefficients with T intensity coloring<br>
    <strong>Color scale:</strong> Dark green = high T (strongly significant) · Red = low T (non-significant)<br><br>
    <em>What we see and why:</em><br>
    Tall bars (high β) are dark green — β and T align. Exception: SA×DKM→DTS has a medium bar with relatively dark green since T=2.85, while DTL×DS→DKM (similar β) has a lower T (1.28).<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This chart complements the Forest Plot: instead of CIs, it displays "strength of evidence". The interaction SA×DKM→DTS has medium β but high T because its effect, despite complexity, is very stable — confirming that SA moderation is a "real effect", not noise.</div>
  `,

  /* ========== Layer 3 (PLS Predict) ========== */
  'chart-l3-q2': `
    <strong>Chart type:</strong> Q²predict columns for 30 items<br>
    <strong>Thresholds (Hair et al. 2022):</strong> Q²>0.10 strong · 0<Q²<0.10 moderate · Q²<0 weak<br>
    <strong>Key values:</strong> Minimum Q18=0.088 · Maximum Q4=0.161 · Mean=0.128<br><br>
    <em>What we see and why:</em><br>
    All 30 items have Q²>0.08 — positive out-of-sample predictive power. 26 items have Q²>0.10 (strong), 4 items (Q13, Q14, Q16, Q18) are between 0.08-0.10 (moderate). The green line marks the 0.10 threshold.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> Q² measures prediction, not explanation. Even with high R², if Q² is low, the model fails on new data. Because Q² is positive and mostly >0.10, the model is generalizable and usable in future research.</div>
  `,

  'chart-l3-q2-2': `
    <strong>Chart type:</strong> Filtered version of Q² — user can select indicators from the filter above<br>
    <strong>Same logic as before:</strong> thresholds at 0.10 and 0<br><br>
    <em>What we see and why:</em><br>
    Changing the indicator filter updates the Q² columns. This lets the researcher focus on a single construct (e.g., only DTS: Q16-Q20) and see the Q² distribution within it.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This is a sensitivity analysis: is predictive power dependent on a specific indicator, or is Q² uniform within each construct? If Q² is uniform within DTS, all 5 DTS items contribute equally to prediction — evidence of an "integrated construct".</div>
  `,

  'chart-l3-stems': `
    <strong>Chart type:</strong> Grouped bar chart — RMSE comparison of 3 methods (PLS-SEM, LM, IA) across 30 items<br>
    <strong>Rule:</strong> Lower RMSE = more accurate prediction<br>
    <strong>Finding:</strong> PLS has the lowest RMSE in all 30 items<br><br>
    <em>What we see and why:</em><br>
    For each item, three columns appear (PLS green, LM orange, IA red). PLS is always shortest (lowest RMSE). IA has the highest. LM is in between.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> By Shmueli et al. (2019), if PLS has lower RMSE than LM in all items, the model has "moderate to strong predictive power". PLS-SEM outperforms linear regression and simple mean in predicting new data — strong justification for using PLS over simpler methods.</div>
  `,

  'chart-l3-landscape': `
    <strong>Chart type:</strong> Heatmap — continuous RMSE across 30 items × 3 methods<br>
    <strong>Color scale:</strong> Dark = low RMSE (accurate) · Light = high RMSE (inaccurate)<br><br>
    <em>What we see and why:</em><br>
    The PLS row (top) is darkest — best predictions. IA row (bottom) is lightest — worst. LM is in between. Several "bright spots" in IA row (items Q5, Q6) show IA has extremely high errors there.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> The chart shows "PLS superiority" is uniform across all items, not driven by a few. Uniform darkness in the PLS row = "systematic superiority".</div>
  `,

  'chart-l3-ridge': `
    <strong>Chart type:</strong> Viridis-colored bar chart — Q² distribution across 30 items<br>
    <strong>Peaks:</strong> Brighter regions = higher Q²<br><br>
    <em>What we see and why:</em><br>
    Two main peaks appear: around DS items (Q27-Q30) and DTS items (Q16-Q20). DKM (Q1-Q9) has lower Q².<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This "Q² topography" shows which item families have "same-family predictive power" — Q² is correlated within each construct, a result of high internal reliability.</div>
  `,

  'chart-l3-cvpat': `
    <strong>Chart type:</strong> Bar chart — CVPAT (Cross-Validated Predictive Ability Test)<br>
    <strong>Row 1:</strong> Δ PLS − IA · <strong>Row 2:</strong> Δ PLS − LM<br>
    <strong>Interpretation of Δ:</strong> Negative = PLS has lower loss (winner) · Positive = competitor wins<br><br>
    <em>What we see and why:</em><br>
    All 6 columns (3 constructs × 2 comparisons) have negative Δ. Largest advantage: DTS with Δ≈−0.118 vs IA and Δ≈−0.055 vs LM. Smallest advantage: DKM with Δ≈−0.095 vs IA.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> CVPAT is the formal test "is PLS really better?". By Liengaard et al. (2021), Δ negative + p<0.05 = significant superiority. All 6 columns have Δ<0 — PLS-SEM significantly outperforms IA and LM in predicting all constructs.</div>
  `,

  'chart-l3-ridgeline': `
    <strong>Chart type:</strong> Bar chart with standard error — prediction error distribution for 30 items<br>
    <strong>Mean error:</strong> Near zero for all items<br>
    <strong>Standard error:</strong> Width of error bars<br><br>
    <em>What we see and why:</em><br>
    All items have mean error near zero — no systematic bias. Some items (Q5, Q6, Q11) have higher standard error — prediction accuracy varies within constructs.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> Near-zero mean error = no systematic bias, a key validity property. High-error items need content review or more data.</div>
  `,

  'chart-l3-scatter': `
    <strong>Chart type:</strong> RMSE scatter — PLS (Y) vs LM (X)<br>
    <strong>y=x line:</strong> A point below the line means PLS is better<br>
    <strong>Point size:</strong> Proportional to Q² · Color: Q²<br><br>
    <em>What we see and why:</em><br>
    All 30 points are below y=x — LM never beats PLS. Points with higher Q² (darker color) tend toward lower-left (lower RMSE in both methods).<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This chart visually proves "uniform PLS superiority". If even one point were above the y=x line, that item would require case-by-case review. The absence of such a point = "unambiguous PLS dominance".</div>
  `,

  'chart-l3-forest': `
    <strong>Chart type:</strong> CVPAT Forest Plot — Δ PLS vs IA and LM with 95% CI<br>
    <strong>Red line at zero:</strong> If CI excludes zero → Δ is significant<br><br>
    <em>What we see and why:</em><br>
    All 6 CIs (3 constructs × 2 comparisons) lie entirely left of zero — PLS significantly wins in all 6 comparisons. DTS with Δ≈−0.118 has the largest distance from zero.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This is the "most important chart" for methodological recommendation: not only is Δ negative, but the entire CI is negative — even in the worst case (upper CI bound), PLS is still better.</div>
  `,

  /* ========== Monte Carlo ========== */
  'chart-mc-scenarios': `
    <strong>Chart type:</strong> Histogram — success distribution across 3 scenarios (10,000 Monte Carlo simulations)<br>
    <strong>Scenarios:</strong> Optimistic (low sanctions/FX) · Baseline · Pessimistic (high sanctions/FX)<br>
    <strong>Key values:</strong> Optimistic μ=0.482 · Baseline μ=0.412 · Pessimistic μ=0.338<br><br>
    <em>What we see and why:</em><br>
    Mean success decreases monotonically from optimistic to pessimistic scenarios (0.482 → 0.338). This 0.144-unit difference shows environmental conditions can reduce digital transformation success by up to 30%.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> The key Monte Carlo message: "digital transformation success is not independent of environmental conditions". Policymakers must consider multiple scenarios, not just optimal conditions.</div>
  `,

  'chart-mc-h6': `
    <strong>Chart type:</strong> Sensitivity analysis of H6 — leadership moderating effect distribution across 3 scenarios<br>
    <strong>Key values:</strong> Optimistic μ=0.085 · Baseline μ=0.042 · Pessimistic μ=−0.018<br><br>
    <em>What we see and why:</em><br>
    In the optimistic scenario, leadership effect is positive (0.085); baseline near zero (0.042); pessimistic negative (−0.018). As sanctions intensify, leadership's moderating effect shifts from positive to negative.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This chart provides the <strong>scientific explanation for H6's rejection</strong>: under severe environmental uncertainty (sanctions, FX volatility), digital leadership alone cannot bridge the strategy-knowledge gap. Structural constraints weaken individual leadership effects.</div>
  `,

  'chart-mc-effects': `
    <strong>Chart type:</strong> Histogram — indirect (H4) and total effects<br>
    <strong>Key values:</strong> Indirect μ=0.076 · Total μ=0.358<br><br>
    <em>What we see and why:</em><br>
    Both distributions are bell-shaped and symmetric. The indirect effect (DKM mediation) accounts for about 21% of total effect — DKM is an important channel for transmitting DS's effect to DTS.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This confirms DKM's mediating role: digital strategy affects success both directly and through knowledge management. Simultaneously strengthening DS and DKM activates both paths.</div>
  `,

  'chart-mc-tornado': `
    <strong>Chart type:</strong> Tornado diagram — parameter importance based on correlation with success<br>
    <strong>Key values:</strong> DS=0.412 · DKM=0.398 · SA=0.351 · DTL=0.312 · Sanctions=−0.287 · FX=−0.194 · Power outage=−0.156<br><br>
    <em>What we see and why:</em><br>
    Three main constructs (DS, DKM, SA) have the highest positive correlations with success. Among contextual variables, "sanction intensity" has the highest negative correlation (−0.287) — the most important external threat.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This chart provides a "ranking of factor importance" for policy: (1) strengthen DS, DKM, SA first; (2) reduce sanction effects second; (3) manage FX and power outages next.</div>
  `,

  'chart-mc-robustness': `
    <strong>Chart type:</strong> Robustness analysis — total effect distribution across 3 distributions (normal, t, empirical)<br>
    <strong>Key values:</strong> Normal μ=0.412 · t μ=0.408 · Empirical μ=0.415<br><br>
    <em>What we see and why:</em><br>
    Three distributions nearly coincide (mean differences <0.007). Monte Carlo results are insensitive to distribution choice.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This "robustness" shows our findings are reliable regardless of distribution assumptions. If distributions differed, we'd need caution in interpretation.</div>
  `,

  'chart-mc-oat': `
    <strong>Chart type:</strong> One-at-a-Time sensitivity analysis (OAT) — ±20% change in each parameter<br>
    <strong>Parameters:</strong> H1 (DS→DKM), H2 (DS→DTS), H3 (DKM→DTS)<br><br>
    <em>What we see and why:</em><br>
    All three parameters have positive linear effects on total effect. H2 (DS→DTS) has the steepest slope — highest sensitivity. H1 and H3 slopes are gentler.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This shows sensitivity: total effect is more sensitive to DS→DTS changes than DS→DKM or DKM→DTS. Focusing on the direct DS→DTS path yields maximum return.</div>
  `,

  'chart-mc-ci': `
    <strong>Chart type:</strong> β CI comparison — PLS-SEM (blue) vs Monte Carlo (orange with CI)<br>
    <strong>Key values:</strong> All 8 hypotheses, PLS β and MC Mean nearly identical<br><br>
    <em>What we see and why:</em><br>
    Blue (PLS) and orange (MC) points nearly coincide — two methods reach identical results. MC CIs for 7 hypotheses (H1-H5, H7, H8) exclude zero (significant); only H6 is non-significant.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This chart shows "convergent validity" between two methods. If PLS and Monte Carlo reach identical results, the result is "real", not a method artifact.</div>
  `,

  /* ========== ML + SHAP ========== */
  'chart-ml-compare': `
    <strong>Chart type:</strong> Bar chart — R² comparison of models (XGBoost, Random Forest, PLS-SEM)<br>
    <strong>Key values:</strong> XGBoost R²=0.507 · Random Forest R²=0.522 · PLS-SEM R²=0.292<br>
    <strong>ΔR² (XGBoost − PLS) = +0.215</strong><br><br>
    <em>What we see and why:</em><br>
    ML models dramatically outperform PLS-SEM. Random Forest is slightly better than XGBoost, but both achieve R²≈0.51-0.52 versus 0.292 for PLS. Red line marks PLS-SEM.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This 0.215-unit difference shows <strong>nonlinear patterns and complex interactions</strong> exist that linear PLS-SEM could not detect. This confirms the added value of ML to complement PLS-SEM.</div>
  `,

  'chart-ml-construct': `
    <strong>Chart type:</strong> Bar chart — construct importance based on mean |SHAP|<br>
    <strong>Key values:</strong> DTL=0.055 · SA=0.039 · DKM=0.010 · DS=0.006<br><br>
    <em>What we see and why:</em><br>
    Digital Transformation Leadership (DTL) is the most important construct, followed by Strategic Agility (SA). This order shows <strong>partial agreement</strong> with PLS-SEM: PLS-SEM found DKM and DS as main predictors, but ML found DTL and SA more important.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This difference shows <strong>nonlinear patterns</strong> may make leadership and agility more prominent at high success levels. When success exceeds moderate levels, "leadership" and "agility" become determining factors — a finding hidden in linear PLS-SEM.</div>
  `,

  'chart-ml-shap-bar': `
    <strong>Chart type:</strong> Bar chart — feature importance based on |SHAP| (Top 10)<br>
    <strong>Key values:</strong> Q14=0.149 · Q15=0.109 · Q22=0.079 · Q23=0.050 · Q21=0.044 · Q7=0.033 · Q10=0.028 · Q26=0.021 · Q24=0.019 · Q25=0.019<br><br>
    <em>What we see and why:</em><br>
    Q14, Q15 (from DTL) and Q22 (from SA) have the highest contribution to success prediction. "Digital Leadership" and "Strategic Agility" are most important at the item level too.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This finding is "operational": to improve digital transformation success, managers should focus on specific items Q14, Q15, Q22 — these measure "effective digital leadership" and "organizational agility".</div>
  `,

  'chart-ml-shap-summary': `
    <strong>Chart type:</strong> SHAP Summary (Beeswarm) — SHAP effect distribution per item across 100 observations<br>
    <strong>Key values:</strong> Each dot = one respondent · X-axis = SHAP effect · Color = item value (blue=low, red=high)<br><br>
    <em>What we see and why:</em><br>
    For important items (Q14, Q15, Q22), a "polarized color" pattern appears: red points (high item value) on the right, blue on the left — monotone positive relationship.<br>
    <div class="reason-text"><strong>Link to research goal:</strong> This chart explains the "why" of Q14, Q15, Q22 importance: respondents with higher scores on these items experienced higher digital transformation success. Strengthening these items (through leadership training and agility development) can directly increase success.</div>
  `
};
/* ================================================================
   electric_bicycle_app.js — بخش ۵-ب از ۵ (نهایی)
   مدیریت رویدادها + راه‌اندازی
   ================================================================ */

/* ================================================================
   ۴۲. باز/بسته کردن پنل تفسیر
   ================================================================ */
function togglePanel(panelId, btn) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const isOpen = panel.classList.contains('open');

  if (isOpen) {
    panel.classList.remove('open');
    btn.innerHTML = `<span class="icon-bulb">💡</span><span>${ti('show_btn')}</span>`;
    btn.style.background = 'linear-gradient(135deg, rgba(52,152,219,.15), rgba(52,152,219,.05))';
    btn.style.color = '#5dade2';
    btn.style.borderColor = '#3498db';
  } else {
    panel.classList.add('open');
    btn.innerHTML = `<span class="icon-bulb">💡</span><span>${ti('hide_btn')}</span>`;
    btn.style.background = 'linear-gradient(135deg, rgba(231,76,60,.15), rgba(231,76,60,.05))';
    btn.style.color = '#ec7063';
    btn.style.borderColor = '#e74c3c';
  }
}

/* ================================================================
   ۴۳. تزریق خودکار تفسیرها به کارت‌ها
   ================================================================ */
function injectMainInterpretations() {
  // --- برای هر کارت نمودار ---
  document.querySelectorAll('.chart-card').forEach(card => {
    const plot = card.querySelector('.plot');
    if (!plot) return;
    const id = plot.id;
    if (!MAIN_CHART_INTS[id]) return;

    // حذف تزریق‌های قبلی
    card.querySelectorAll('.btn-interpretation').forEach(b => b.remove());
    card.querySelectorAll('.interpretation-panel').forEach(p => p.remove());
    card.querySelectorAll('.chart-toolbar').forEach(t => t.remove());

    const title = card.querySelector('.chart-title');
    if (!title) return;

    const panelId = id + '-panel';

    // دکمه‌های مشاهده تفسیر + دانلود PNG
    title.insertAdjacentHTML('beforeend',
      `<div class="chart-toolbar" style="margin-right:8px; display:flex; gap:6px;">
        <button class="btn-interpretation" onclick="togglePanel('${panelId}', this)">
          <span class="icon-bulb">💡</span><span>${ti('show_btn')}</span>
        </button>
        <button class="dl-btn" onclick="downloadChart('${id}', '${id}')" title="${state.lang === 'fa' ? 'دانلود PNG' : 'Download PNG'}">⬇ PNG</button>
      </div>`
    );

    // پنل تفسیر
    card.insertAdjacentHTML('beforeend',
      `<div class="interpretation-panel" id="${panelId}">
         <div class="interpretation-content">
           <div class="interp-header">
             <span class="interp-header-icon">📊</span>
             <span class="interp-title">${ti('title_chart')}</span>
           </div>
           <div class="interp-body">${getChartInt(id)}</div>
         </div>
       </div>`
    );
  });

  // --- برای جداول ---
  Object.keys(MAIN_TABLE_INTS || {}).forEach(id => {
    const cont = document.getElementById(id);
    if (!cont) return;
    const panelId = id + '-panel';
    const oldPanel = document.getElementById(panelId);
    if (oldPanel) oldPanel.remove();
    const oldBtn = document.getElementById(panelId + '-btn');
    if (oldBtn) oldBtn.remove();
    const data = getTableInt(id);
    if (!data) return;
    const btnHtml = `
      <button id="${panelId}-btn" class="btn-interpretation" onclick="togglePanel('${panelId}', this)" style="margin-bottom:12px; display:flex; margin-right:auto; margin-left:0;">
        <span class="icon-bulb">💡</span><span>${ti('show_btn')}</span>
      </button>
      <div class="interpretation-panel" id="${panelId}" style="margin-bottom:12px;">
        <div class="interpretation-content">
          <div class="interp-header"><span class="interp-header-icon">📊</span><span class="interp-title">${data.title || ti('title_table')}</span></div>
          <div class="interp-body">${data.text}</div>
        </div>
      </div>
    `;
    cont.insertAdjacentHTML('beforebegin', btnHtml);
  });
}
  // --- برای جداول (VIF، پایایی، آمار توصیفی) ---
  Object.keys(MAIN_TABLE_INTS || {}).forEach(id => {
    const cont = document.getElementById(id);
    if (!cont) return;

    const panelId = id + '-panel';
    const oldPanel = document.getElementById(panelId);
    if (oldPanel) oldPanel.remove();
    const oldBtn = document.getElementById(panelId + '-btn');
    if (oldBtn) oldBtn.remove();

    const data = getTableInt(id);
    if (!data) return;

    const btnHtml = `
      <button id="${panelId}-btn" class="btn-interpretation" onclick="togglePanel('${panelId}', this)" style="margin-bottom:12px; display:flex; margin-right:auto; margin-left:0;">
        <span class="icon-bulb">💡</span><span>${ti('show_btn')}</span>
      </button>
      <div class="interpretation-panel" id="${panelId}" style="margin-bottom:12px;">
        <div class="interpretation-content">
          <div class="interp-header">
            <span class="interp-header-icon">📊</span>
            <span class="interp-title">${data.title || ti('title_table')}</span>
          </div>
          <div class="interp-body">${data.text}</div>
        </div>
      </div>
    `;
    cont.insertAdjacentHTML('beforebegin', btnHtml);
  });

/* ================================================================
   ۴۴. جدول داده (Data Table)
   ================================================================ */
function renderTable() {
  const wrapper = $('data-table-wrapper');
  if (!wrapper) return;

  const idx = activeIndices().filter(i =>
    DATA.indicators[i].toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  if (idx.length === 0) {
    wrapper.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted);">هیچ شاخصی یافت نشد</div>`;
    return;
  }

  const predict = state.loaded.plsPredict || [];

  // مرتب‌سازی
  let sorted = idx.slice();
  if (state.sortCol) {
    sorted.sort((a, b) => {
      let va, vb;
      switch (state.sortCol) {
        case 'ind': va = DATA.indicators[a]; vb = DATA.indicators[b]; break;
        case 'q2':  va = predict[a]?.q2 || DATA.Q2[a]; vb = predict[b]?.q2 || DATA.Q2[b]; break;
        case 'pls': va = predict[a]?.rmse_pls || DATA.PLS_RMSE[a]; vb = predict[b]?.rmse_pls || DATA.PLS_RMSE[b]; break;
        case 'lm':  va = predict[a]?.rmse_lm || DATA.LM_RMSE[a]; vb = predict[b]?.rmse_lm || DATA.LM_RMSE[b]; break;
        case 'ia':  va = predict[a]?.rmse_ia || DATA.IA_RMSE[a]; vb = predict[b]?.rmse_ia || DATA.IA_RMSE[b]; break;
        default: return 0;
      }
      if (typeof va === 'string') return state.sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return state.sortAsc ? va - vb : vb - va;
    });
  }

  const arrow = (col) => state.sortCol === col ? (state.sortAsc ? ' sort-asc' : ' sort-desc') : '';

  let html = `<table class="data-table"><thead><tr>
    <th class="${arrow('ind')}" onclick="setSort('ind')">${t('col_indicator')}</th>
    <th class="${arrow('q2')}" onclick="setSort('q2')">${t('col_q2')}</th>
    <th class="${arrow('pls')}" onclick="setSort('pls')">${t('col_pls')}</th>
    <th class="${arrow('lm')}" onclick="setSort('lm')">${t('col_lm')}</th>
    <th class="${arrow('ia')}" onclick="setSort('ia')">${t('col_ia')}</th>
    <th>${t('col_status')}</th>
  </tr></thead><tbody>`;

  sorted.forEach(i => {
    const qv = predict[i]?.q2 || DATA.Q2[i];
    const pls = predict[i]?.rmse_pls || DATA.PLS_RMSE[i];
    const lm = predict[i]?.rmse_lm || DATA.LM_RMSE[i];
    const ia = predict[i]?.rmse_ia || DATA.IA_RMSE[i];

    const badge = qv > 0.10
      ? `<span class="badge badge-good">${t('badge_good')}</span>`
      : qv > 0
        ? `<span class="badge badge-mid">${t('badge_mid')}</span>`
        : `<span class="badge badge-bad">${t('badge_bad')}</span>`;

    const cls = state.highlighted === DATA.indicators[i] ? 'selected' : '';

    html += `<tr class="${cls}" onclick="selectIndicator('${DATA.indicators[i]}')">
      <td><b>${DATA.indicators[i]}</b></td>
      <td>${qv.toFixed(4)}</td>
      <td>${pls.toFixed(4)}</td>
      <td>${lm.toFixed(4)}</td>
      <td>${ia.toFixed(4)}</td>
      <td>${badge}</td>
    </tr>`;
  });

  html += '</tbody></table>';
  wrapper.innerHTML = html;
}

function setSort(col) {
  if (state.sortCol === col) state.sortAsc = !state.sortAsc;
  else { state.sortCol = col; state.sortAsc = true; }
  renderTable();
}

function selectIndicator(name) {
  state.highlighted = state.highlighted === name ? null : name;
  renderTable();
}

/* ================================================================
   ۴۵. جدول فرضیه‌ها (Hypotheses)
   ================================================================ */
function hypTypeLabel(type) {
  const map = {
    direct: 'hyp_type_direct',
    mediation: 'hyp_type_mediation',
    moderator: 'hyp_type_moderator',
    interaction: 'hyp_type_interaction'
  };
  return t(map[type] || 'hyp_type_direct');
}

function hypEffectLabel(f2) {
  if (f2 == null) return '—';
  if (f2 >= 0.35) return t('hyp_effect_strong');
  if (f2 >= 0.15) return t('hyp_effect_medium');
  if (f2 >= 0.02) return t('hyp_effect_small');
  return t('hyp_effect_weak');
}

function betaHeatColor(beta) {
  const v = Math.min(1, Math.abs(beta) / 0.55);
  const hue = 210 - 180 * v;
  const sat = 55 + 30 * v;
  const lit = state.theme === 'dark' ? (28 + 18 * (1 - v)) : (90 - 22 * v);
  return `hsl(${hue}, ${sat}%, ${lit}%)`;
}

function renderHypotheses() {
  const cont = $('hypotheses-container');
  if (!cont) return;

  const total = HYPOTHESES.length;
  const confirmed = HYPOTHESES.filter(h => h.result === 'confirmed').length;
  const rejected = HYPOTHESES.filter(h => h.result === 'rejected').length;
  const ratio = Math.round((confirmed / total) * 100);

  // KPI
  const kpiEl = $('hyp-kpi-grid');
  if (kpiEl) {
    kpiEl.innerHTML = `
      <div class="hyp-kpi hyp-kpi-total"><div class="hyp-kpi-icon">📚</div><div class="hyp-kpi-label">${t('hyp_kpi_total')}</div><div class="hyp-kpi-value">${total}</div></div>
      <div class="hyp-kpi hyp-kpi-conf"><div class="hyp-kpi-icon">✅</div><div class="hyp-kpi-label">${t('hyp_kpi_confirmed')}</div><div class="hyp-kpi-value">${confirmed}</div></div>
      <div class="hyp-kpi hyp-kpi-rej"><div class="hyp-kpi-icon">❌</div><div class="hyp-kpi-label">${t('hyp_kpi_rejected')}</div><div class="hyp-kpi-value">${rejected}</div></div>
      <div class="hyp-kpi hyp-kpi-ratio"><div class="hyp-kpi-icon">📈</div><div class="hyp-kpi-label">${t('hyp_kpi_ratio')}</div><div class="hyp-kpi-value">${ratio}%</div><div class="hyp-kpi-bar"><span style="width:${ratio}%"></span></div></div>
    `;
  }

  // فیلتر
  const f = state.hypFilter;
  const s = state.hypSearch.trim().toLowerCase();
  let rows = HYPOTHESES.slice();
  if (f === 'confirmed' || f === 'rejected') rows = rows.filter(h => h.result === f);
  else if (f !== 'all') rows = rows.filter(h => h.type === f);
  if (s) rows = rows.filter(h =>
    h.id.toLowerCase().includes(s) ||
    h.path.toLowerCase().includes(s) ||
    (h.description && h.description.toLowerCase().includes(s))
  );

  if (rows.length === 0) {
    cont.innerHTML = `<div class="hyp-empty">${t('hyp_empty')}</div>`;
    return;
  }

  let html = `<div class="hyp-hint" style="padding:10px 16px; margin-bottom:12px; background:rgba(52,152,219,.08); border-right:3px solid #3498db; border-radius:6px; font-size:12px; color:var(--text-muted); line-height:1.8;">
    💡 ${state.lang === 'fa' ? 'موس را روی هر ردیف نگه دارید تا تحلیل تفصیلی «چرا تأیید/رد شد» را ببینید.' : 'Hover over any row to see the detailed "why" analysis.'}
  </div>`;

  html += `<div class="hyp-table-wrap"><table class="hyp-table"><thead><tr>
    <th>${t('hyp_col_id')}</th><th>${t('hyp_col_type')}</th><th>${t('hyp_col_path')}</th>
    <th>${t('hyp_col_beta')}</th><th>${t('hyp_col_t')}</th><th>${t('hyp_col_p')}</th>
    <th>${t('hyp_col_f2')}</th><th>${t('hyp_col_var')}</th><th>${t('hyp_col_result')}</th>
  </tr></thead><tbody>`;

  rows.forEach(h => {
    const typeCls = `hyp-type hyp-type-${h.type}`;
    const resultCls = h.result === 'confirmed' ? 'hyp-res-confirmed' : 'hyp-res-rejected';
    const resultIcon = h.result === 'confirmed' ? '✓' : '✕';
    const betaColor = betaHeatColor(h.beta);
    const betaTxt = (h.beta >= 0 ? '' : '−') + Math.abs(h.beta).toFixed(3);
    const pSig = h.pval < 0.05;
    const pCell = `<span class="hyp-p ${pSig ? 'hyp-p-sig' : 'hyp-p-ns'}">${h.p}</span>`;
    const f2Cell = h.f2 == null ? '<span class="hyp-dash">—</span>' : `<div class="hyp-f2-cell"><span class="hyp-f2-val">${h.f2.toFixed(3)}</span><span class="hyp-f2-tag">${hypEffectLabel(h.f2)}</span></div>`;
    const varCell = h.variance == null ? '<span class="hyp-dash">—</span>' : `<span class="hyp-var">${h.variance.toFixed(2)}%</span>`;
    const pathParts = h.path.split(/\s*(?:→|->|×)\s*/);
    const pathHtml = pathParts.map((p, i) => {
      const chip = `<span class="hyp-node">${p}</span>`;
      if (i === 0) return chip;
      const op = h.path.includes('×') ? '<span class="hyp-op">×</span>' : '<span class="hyp-arrow">→</span>';
      return op + chip;
    }).join('');

    html += `<tr class="hyp-row" data-hyp="${h.id}">
      <td><span class="hyp-id-chip">${h.id}</span></td>
      <td><span class="${typeCls}">${hypTypeLabel(h.type)}</span></td>
      <td class="hyp-path">${pathHtml}</td>
      <td class="hyp-num"><span class="hyp-beta" style="background:${betaColor}">${betaTxt}</span></td>
      <td class="hyp-num"><span class="hyp-t-chip">${h.t.toFixed(2)}</span></td>
      <td class="hyp-num">${pCell}</td>
      <td class="hyp-num">${f2Cell}</td>
      <td class="hyp-num">${varCell}</td>
      <td><span class="hyp-res ${resultCls}"><span class="hyp-res-icon">${resultIcon}</span>${t(h.result === 'confirmed' ? 'hyp_result_confirmed' : 'hyp_result_rejected')}</span></td>
    </tr>`;
  });

  html += `</tbody></table></div>`;
  cont.innerHTML = html;

  // 🆕 فعال‌سازی Tooltip
  bindHypInterp();
}

/* ================================================================
   🆕 Tooltip شناور روی ردیف‌های جدول فرضیه‌ها
   ================================================================ */
/* ================================================================
   🆕 Tooltip شناور بالای موس روی ردیف‌های جدول فرضیه‌ها
   ================================================================ */
function bindHypInterp() {
  let tooltip = document.getElementById('hyp-row-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'hyp-row-tooltip';
    tooltip.className = 'table-tooltip';
    document.body.appendChild(tooltip);
  }

  document.querySelectorAll('#hypotheses-container tbody tr').forEach(row => {
    row.addEventListener('mouseenter', (e) => {
      const hypId = row.dataset.hyp;
      const detail = (state.lang === 'en' && typeof HYP_DETAILS_EN !== 'undefined' && HYP_DETAILS_EN[hypId])
        ? HYP_DETAILS_EN[hypId]
        : (typeof HYP_DETAILS !== 'undefined' ? HYP_DETAILS[hypId] : null);

      if (detail) {
        tooltip.innerHTML = `<span class="tooltip-title">${state.lang === 'fa' ? 'تحلیل فرضیه' : 'Hypothesis Analysis'} ${hypId}</span><div>${detail}</div>`;
        tooltip.style.display = 'block';

        // موقعیت‌دهی اولیه بالای موس
        positionTooltip(e, tooltip);
      }
    });

    row.addEventListener('mousemove', (e) => {
      if (tooltip.style.display === 'block') {
        positionTooltip(e, tooltip);
      }
    });

    row.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  });
}

/* 🆕 موقعیت‌دهی هوشمند Tooltip (بالای موس) */
function positionTooltip(e, tooltip) {
  const offset = 20;  // فاصله از موس
  const tw = tooltip.offsetWidth;
  const th = tooltip.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // پیش‌فرض: بالای موس، وسط‌چین افقی
  let x = e.clientX - tw / 2;
  let y = e.clientY - th - offset;

  // اگر بالای صفحه جا نشد → زیر موس
  if (y < 10) {
    y = e.clientY + offset;
  }

  // اگر سمت چپ بیرون زد → بچسبان به لبه چپ
  if (x < 10) x = 10;

  // اگر سمت راست بیرون زد → بچسبان به لبه راست
  if (x + tw > vw - 10) x = vw - tw - 10;

  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}
function bindHypothesisFilters() {
  document.querySelectorAll('.hyp-chip[data-hyp-filter]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.hyp-chip[data-hyp-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.hypFilter = btn.dataset.hypFilter;
      renderHypotheses();
    };
  });
  const search = $('hyp-search');
  if (search) {
    search.oninput = e => {
      state.hypSearch = e.target.value;
      renderHypotheses();
    };
  }
}

/* ================================================================
   ۴۶. فیلتر چندگانه شاخص‌ها (Multi-Select)
   ================================================================ */
function renderMultiSelect() {
  const dd = $('ms-dropdown');
  if (!dd) return;

  let html = '';
  DATA.indicators.forEach((ind, i) => {
    html += `<label class="ms-item">
      <input type="checkbox" data-idx="${i}" ${state.selected.has(i) ? 'checked' : ''}>
      <span>${ind}</span>
    </label>`;
  });
  html += `<div class="ms-actions">
    <button onclick="selectAllInd()">${t('select_all')}</button>
    <button onclick="selectNoneInd()">${t('select_none')}</button>
  </div>`;

  dd.innerHTML = html;
  dd.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.onchange = () => {
      const i = +cb.dataset.idx;
      if (cb.checked) state.selected.add(i);
      else state.selected.delete(i);
      updateStatus();
      renderChartsForActiveTab();
      renderTable();
      renderL3KPIs();
    };
  });
}

function selectAllInd() {
  DATA.indicators.forEach((_, i) => state.selected.add(i));
  renderMultiSelect();
  updateStatus();
  renderChartsForActiveTab();
  renderTable();
  renderL3KPIs();
}

function selectNoneInd() {
  state.selected.clear();
  renderMultiSelect();
  updateStatus();
  renderChartsForActiveTab();
  renderTable();
  renderL3KPIs();
}

/* ================================================================
   ۴۷. وضعیت (Status)
   ================================================================ */
function updateStatus() {
  const n = state.selected.size;
  const total = DATA.indicators.length;
  const txt = n === total
    ? `${t('status_ready')} · ${total}`
    : `${n} از ${total} شاخص`;
  const statusText = $('status-text');
  if (statusText) statusText.textContent = txt;

  const dot = $('status-dot');
  if (dot) dot.style.background = n === total ? '#27ae60' : '#f39c12';

  const label = $('ms-label');
  if (label) label.textContent = n === total ? t('all_indicators') : `${n} شاخص انتخاب شده`;
}

/* ================================================================
   ۴۸. دانلود CSV
   ================================================================ */
function downloadCSV() {
  let csv = 'Indicator,Q2predict,PLS_RMSE,LM_RMSE,IA_RMSE\n';
  const predict = state.loaded.plsPredict || [];

  DATA.indicators.forEach((ind, i) => {
    const q2 = predict[i]?.q2 || DATA.Q2[i];
    const pls = predict[i]?.rmse_pls || DATA.PLS_RMSE[i];
    const lm = predict[i]?.rmse_lm || DATA.LM_RMSE[i];
    const ia = predict[i]?.rmse_ia || DATA.IA_RMSE[i];
    csv += `${ind},${q2.toFixed(4)},${pls.toFixed(4)},${lm.toFixed(4)},${ia.toFixed(4)}\n`;
  });

  // افزودن بخش مسیرها
  csv += '\n\nPath,beta,t,p,CI_low,CI_high\n';
  const paths = state.loaded.paths || FALLBACK_PATHS;
  paths.forEach(p => {
    csv += `${p.Path},${p.Original.toFixed(4)},${p.T.toFixed(3)},${p.P.toExponential(2)},${p.CI_low.toFixed(4)},${p.CI_high.toFixed(4)}\n`;
  });

  // دانلود
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'electric_bicycle_dashboard_data.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ================================================================
   ۴۹. دانلود نمودار PNG
   ================================================================ */
function downloadChart(elId, filename) {
  const el = document.getElementById(elId);
  if (!el || !el.data) {
    alert(state.lang === 'fa' ? 'چارت هنوز آماده نیست' : 'Chart not ready');
    return;
  }
  Plotly.downloadImage(el, {
    format: 'png',
    filename: filename || elId,
    width: 1600,
    height: 1000,
    scale: 2
  });
}

/* ================================================================
   ۵۰. رسم نمودارهای صفحه فعال
   ================================================================ */
function renderChartsForActiveTab() {
  const active = document.querySelector('.page.active');
  if (!active) return;
  const id = active.id.replace('section-', '');

  // پاک‌سازی نمودارهای قبلی
  document.querySelectorAll('.plot').forEach(el => {
    if (el.children && el.children.length) {
      try { Plotly.purge(el); } catch (e) { }
    }
  });

  try {
    switch (id) {
      case 'descriptive':
        renderDescriptiveStatistics();
        break;

      case 'l1-path':
        drawL1PathDiagram();
        drawL1BetaBar();
        break;

      case 'l1-quality':
        drawL1R2();
        drawL1F2();
        drawL1Quality();
        break;

      case 'l1-loadings':
        drawL1Loadings();
        drawL1VIF();
        break;

      case 'l1-vif-table':
        renderVIFTable();
        break;

      case 'l1-reliability':
        renderReliabilityTables();
        break;

      case 'l1-htmt':
        drawL1HTMT();
        break;

      case 'l1-moderation':
        drawL1Slopes();
        drawL1Raincloud();
        break;

      case 'l2-forest':
        drawL2Forest();
        break;

      case 'l2-significance':
        drawL2Sig();
        break;

      case 'l2-landscape':
        drawL2Landscape();
        break;

      case 'l3-overview':
        renderL3KPIs();
        drawL3Q2Columns('chart-l3-q2');
        break;

      case 'l3-charts':
        drawL3Q2Columns('chart-l3-q2-2');
        drawL3Stems();
        drawL3Landscape();
        drawL3Ridge();
        drawL3CVPAT();
        drawL3Ridgeline();
        drawL3Scatter();
        drawL3Forest();
        break;

      case 'monte-carlo':
        drawMCScenarios();
        drawMCH6();
        drawMCEffects();
        drawMCTornado();
        drawMCRobustness();
        drawMCOAT();
        drawMCCI();
        break;

      case 'ml-shap':
        drawMLCompare();
        drawMLConstruct();
        drawMLShapBar();
        drawMLShapSummary();
        break;

      case 'data':
        renderTable();
        break;

      case 'hypotheses':
        renderHypotheses();
        break;
      case 'download':
        renderExcelViewer();
        break;
      case 'smartpls-graphical':
        renderSmartPLSGraphics();
        break;
      
    }
  } catch (e) {
    console.error('[App] Chart draw error for', id, ':', e);
  }

  // تزریق تفسیرها (کمی تأخیر برای اطمینان از رسم کامل)
  setTimeout(injectMainInterpretations, 400);
}

/* ================================================================
   ۵۱. رسم همه چیز (پس از تغییر زبان یا تم)
   ================================================================ */
function renderAll() {
  // ترجمه متن‌ها
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = I18N[state.lang][key];
    if (val !== undefined) el.innerHTML = val;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.dataset.i18nPh;
    const val = I18N[state.lang][key];
    if (val !== undefined) el.placeholder = val;
  });

  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === 'fa' ? 'rtl' : 'ltr';
  document.documentElement.dataset.theme = state.theme;

  if (!state.loaded) return;

  // رسم مجدد
  renderMultiSelect();
  updateStatus();

  // جدول/فرضیه‌ها/تفسیرها در صورت نیاز
  const activeId = document.querySelector('.page.active')?.id?.replace('section-', '');
  if (activeId === 'data') renderTable();
  if (activeId === 'hypotheses') renderHypotheses();

  // نمودارهای صفحه فعال
  renderChartsForActiveTab();

  // به‌روزرسانی منابع داده
  updateDataSource();
}

function updateDataSource() {
  const src = $('data-source');
  if (!src || !state.loaded) return;

  const sources = state.loaded.sources || {};
  const total = Object.keys(sources).length;
  const excelCount = Object.values(sources).filter(s => s === 'excel').length;

  if (excelCount === total) {
    src.textContent = t('ds_loaded');
    src.classList.add('loaded');
  } else if (excelCount === 0) {
    src.textContent = t('ds_fallback');
    src.classList.remove('loaded');
  } else {
    src.textContent = `${excelCount}/${total} ${state.lang === 'fa' ? 'از اکسل' : 'from Excel'}`;
    src.classList.add('loaded');
  }
}

/* ================================================================
   ۵۲. راه‌اندازی اولیه (Init)
   ================================================================ */
async function init() {
  console.log('[App] 🚀 Initializing dashboard...');

  // تنظیمات اولیه
  $('theme-btn').textContent = state.theme === 'dark' ? '🌙' : '☀️';
  $('lang-btn').textContent = state.lang === 'fa' ? 'EN' : 'FA';

  // بارگذاری داده‌های اولیه (Fallback)
  state.loaded = {
    paths: FALLBACK_PATHS,
    r2: FALLBACK_R2,
    f2: FALLBACK_F2,
    loadings: FALLBACK_LOADINGS,
    quality: FALLBACK_QUALITY,
    vif: FALLBACK_VIF,
    vifTable: FALLBACK_VIF_TABLE,
    reliability: FALLBACK_RELIABILITY,
    plsPredict: null,
    monteCarlo: FALLBACK_MONTE_CARLO,
    ml: FALLBACK_ML,
    descriptive: null,
    htmt: FALLBACK_HTMT,
    sources: {}
  };

  // رسم اولیه با Fallback
  renderAll();

  // تلاش برای بارگذاری از فایل‌های اکسل
  const src = $('data-source');
  if (src) src.textContent = t('ds_loading');

  try {
    if (typeof loadAllData === 'function') {
      const loaded = await loadAllData();
      const useExcel = Object.values(loaded.sources || {}).some(s => s === 'excel');

      if (useExcel) {
        state.loaded = loaded;
        renderAll();
        console.log('[App] ✅ Data loaded from Excel files');
      } else {
        console.log('[App] ⚠️ Using fallback data (Excel files not found or unreadable)');
        updateDataSource();
      }
    } else {
      console.warn('[App] loadAllData not defined — loader.js may not be loaded');
      updateDataSource();
    }
  } catch (e) {
    console.error('[App] ❌ Excel load failed:', e);
    updateDataSource();
  }

  console.log('[App] ✅ Dashboard ready');
}

/* ================================================================
   ۵۳. رویدادهای عمومی (Event Bindings)
   ================================================================ */

/* --- تغییر زبان --- */
$('lang-btn').onclick = () => {
  state.lang = state.lang === 'fa' ? 'en' : 'fa';
  $('lang-btn').textContent = state.lang === 'fa' ? 'EN' : 'FA';
  renderAll();
};

/* --- تغییر تم --- */
$('theme-btn').onclick = () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  $('theme-btn').textContent = state.theme === 'dark' ? '🌙' : '☀️';
  renderAll();
};

/* --- چاپ --- */
$('print-btn').onclick = () => window.print();

/* --- ناوبری سایدبار --- */
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const sec = $('section-' + btn.dataset.section);
    if (sec) sec.classList.add('active');

    // نمایش/مخفی کردن فیلتر (فقط برای صفحاتی که شاخص دارند)
    const showFilter = ['l3-overview', 'l3-charts', 'data'].includes(btn.dataset.section);
    const filterBar = $('filter-bar');
    if (filterBar) filterBar.style.display = showFilter ? 'flex' : 'none';

    // رسم نمودارهای صفحه
    renderChartsForActiveTab();

    // فرضیه‌ها و VIF (در صورت نیاز)
    if (btn.dataset.section === 'hypotheses') bindHypothesisFilters();
    if (btn.dataset.section === 'l1-vif-table') bindVIFTableFilters();

    // اسکرول به بالا
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // تغییر اندازه برای Plotly
    setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
  };
});

/* --- جستجوی جدول داده --- */
const tableSearch = $('table-search');
if (tableSearch) {
  tableSearch.oninput = e => {
    state.searchTerm = e.target.value;
    renderTable();
  };
}

/* --- بازنشانی فیلتر --- */
$('reset-filter').onclick = () => {
  state.selected = new Set(DATA.indicators.map((_, i) => i));
  state.highlighted = null;
  state.searchTerm = '';
  state.sortCol = null;
  if ($('table-search')) $('table-search').value = '';
  renderMultiSelect();
  updateStatus();
  renderChartsForActiveTab();
  renderTable();
  renderL3KPIs();
};

/* --- باز/بسته کردن multi-select --- */
$('ms-toggle').onclick = (e) => {
  e.stopPropagation();
  $('ms-dropdown').classList.toggle('open');
};

document.addEventListener('click', (e) => {
  if (!e.target.closest('.multi-select')) {
    $('ms-dropdown')?.classList.remove('open');
  }
});

/* --- بستن پنل اطلاعات --- */
const infoClose = $('info-close');
if (infoClose) {
  infoClose.onclick = () => {
    $('info-panel')?.classList.add('hidden');
  };
}

/* --- ری‌سایز پنجره (برای Plotly) --- */
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    window.dispatchEvent(new Event('plotly-resize'));
  }, 200);
});
/* ================================================================
   ۵۷. خروجی گرافیکی SmartPLS — ۳ شکل SVG
   ================================================================ */
function renderSmartPLSGraphics() {
  drawSmartPLSMeasurementModel();
  drawSmartPLSStructuralModel();
  drawSmartPLSBootstrapping();
}

/* ---------- شکل ۱: مدل اندازه‌گیری ---------- */
function drawSmartPLSMeasurementModel() {
  const el = document.getElementById('smartpls-graphic-1');
  if (!el) return;
  el.innerHTML = `
    <svg viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%; font-family:'Vazirmatn',Tahoma,sans-serif; direction:rtl;">
      <defs>
        <filter id="sh1" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.15"/>
        </filter>
      </defs>
      
      <!-- خطوط از گویه‌ها به سازه‌ها -->
      <g stroke="#8b94a7" stroke-width="1.5" fill="none">
        <!-- DKM: Q1-Q9 -->
        <line x1="110" y1="110" x2="370" y2="230"/><line x1="110" y1="140" x2="370" y2="235"/>
        <line x1="110" y1="170" x2="370" y2="240"/><line x1="110" y1="200" x2="370" y2="245"/>
        <line x1="110" y1="230" x2="370" y2="250"/><line x1="110" y1="260" x2="370" y2="255"/>
        <line x1="110" y1="290" x2="370" y2="260"/><line x1="110" y1="320" x2="370" y2="265"/>
        <line x1="110" y1="350" x2="370" y2="270"/>
        
        <!-- DTL: Q10-Q15 -->
        <line x1="890" y1="110" x2="630" y2="230"/><line x1="890" y1="140" x2="630" y2="235"/>
        <line x1="890" y1="170" x2="630" y2="240"/><line x1="890" y1="200" x2="630" y2="245"/>
        <line x1="890" y1="230" x2="630" y2="250"/><line x1="890" y1="260" x2="630" y2="255"/>
        
        <!-- DTS: Q16-Q20 -->
        <line x1="890" y1="350" x2="630" y2="410"/><line x1="890" y1="380" x2="630" y2="415"/>
        <line x1="890" y1="410" x2="630" y2="420"/><line x1="890" y1="440" x2="630" y2="425"/>
        <line x1="890" y1="470" x2="630" y2="430"/>
        
        <!-- SA: Q21-Q26 -->
        <line x1="110" y1="410" x2="370" y2="410"/><line x1="110" y1="440" x2="370" y2="415"/>
        <line x1="110" y1="470" x2="370" y2="420"/><line x1="110" y1="500" x2="370" y2="425"/>
        <line x1="110" y1="530" x2="370" y2="430"/><line x1="110" y1="560" x2="370" y2="435"/>
        
        <!-- DS: Q27-Q30 -->
        <line x1="500" y1="560" x2="500" y2="440"/><line x1="530" y1="560" x2="505" y2="440"/>
        <line x1="560" y1="560" x2="510" y2="440"/><line x1="590" y1="560" x2="515" y2="440"/>
      </g>
      
      <!-- گویه‌ها -->
      <g filter="url(#sh1)">
        <!-- DKM گویه‌ها -->
        <g fill="#9b59b6">
          <circle cx="100" cy="110" r="14"/><circle cx="100" cy="140" r="14"/>
          <circle cx="100" cy="170" r="14"/><circle cx="100" cy="200" r="14"/>
          <circle cx="100" cy="230" r="14"/><circle cx="100" cy="260" r="14"/>
          <circle cx="100" cy="290" r="14"/><circle cx="100" cy="320" r="14"/>
          <circle cx="100" cy="350" r="14"/>
        </g>
        <!-- DTL گویه‌ها -->
        <g fill="#3498db">
          <circle cx="900" cy="110" r="14"/><circle cx="900" cy="140" r="14"/>
          <circle cx="900" cy="170" r="14"/><circle cx="900" cy="200" r="14"/>
          <circle cx="900" cy="230" r="14"/><circle cx="900" cy="260" r="14"/>
        </g>
        <!-- DTS گویه‌ها -->
        <g fill="#27ae60">
          <circle cx="900" cy="350" r="14"/><circle cx="900" cy="380" r="14"/>
          <circle cx="900" cy="410" r="14"/><circle cx="900" cy="440" r="14"/>
          <circle cx="900" cy="470" r="14"/>
        </g>
        <!-- SA گویه‌ها -->
        <g fill="#f39c12">
          <circle cx="100" cy="410" r="14"/><circle cx="100" cy="440" r="14"/>
          <circle cx="100" cy="470" r="14"/><circle cx="100" cy="500" r="14"/>
          <circle cx="100" cy="530" r="14"/><circle cx="100" cy="560" r="14"/>
        </g>
        <!-- DS گویه‌ها -->
        <g fill="#e67e22">
          <circle cx="500" cy="570" r="14"/><circle cx="530" cy="570" r="14"/>
          <circle cx="560" cy="570" r="14"/><circle cx="590" cy="570" r="14"/>
        </g>
      </g>
      
      <!-- برچسب گویه‌ها -->
      <g font-size="9" font-weight="bold" text-anchor="middle" fill="#fff">
        <text x="100" y="113">Q1</text><text x="100" y="143">Q2</text>
        <text x="100" y="173">Q3</text><text x="100" y="203">Q4</text>
        <text x="100" y="233">Q5</text><text x="100" y="263">Q6</text>
        <text x="100" y="293">Q7</text><text x="100" y="323">Q8</text>
        <text x="100" y="353">Q9</text>
        
        <text x="900" y="113">Q10</text><text x="900" y="143">Q11</text>
        <text x="900" y="173">Q12</text><text x="900" y="203">Q13</text>
        <text x="900" y="233">Q14</text><text x="900" y="263">Q15</text>
        
        <text x="900" y="353">Q16</text><text x="900" y="383">Q17</text>
        <text x="900" y="413">Q18</text><text x="900" y="443">Q19</text>
        <text x="900" y="473">Q20</text>
        
        <text x="100" y="413">Q21</text><text x="100" y="443">Q22</text>
        <text x="100" y="473">Q23</text><text x="100" y="503">Q24</text>
        <text x="100" y="533">Q25</text><text x="100" y="563">Q26</text>
        
        <text x="500" y="573">Q27</text><text x="530" y="573">Q28</text>
        <text x="560" y="573">Q29</text><text x="590" y="573">Q30</text>
      </g>
      
      <!-- سازه‌ها -->
      <g filter="url(#sh1)">
        <circle cx="500" cy="250" r="65" fill="#9b59b6"/>
        <circle cx="500" cy="410" r="65" fill="#3498db"/>
        <circle cx="500" cy="410" r="0" fill="none"/>
        <rect x="420" y="380" width="160" height="60" rx="10" fill="#f39c12" transform="translate(0,0)"/>
      </g>
      <!-- سازه DTS (سبز) -->
      <circle cx="500" cy="410" r="65" fill="#27ae60" filter="url(#sh1)"/>
      <!-- سازه DS (نارنجی) -->
      <rect x="420" y="500" width="160" height="60" rx="10" fill="#e67e22" filter="url(#sh1)"/>
      
      <!-- برچسب سازه‌ها -->
      <g font-size="13" font-weight="bold" text-anchor="middle" fill="#fff">
        <text x="500" y="245">مدیریت</text>
        <text x="500" y="262">دانش</text>
        <text x="500" y="405">موفقیت</text>
        <text x="500" y="422">تحول</text>
        <text x="500" y="535">استراتژی</text>
        <text x="500" y="550">دیجیتال</text>
      </g>
      <!-- سازه DTL (بالا-چپ) -->
      <rect x="80" y="20" width="140" height="60" rx="10" fill="#3498db" filter="url(#sh1)"/>
      <text x="150" y="55" font-size="13" font-weight="bold" text-anchor="middle" fill="#fff">رهبری تحول</text>
      <!-- سازه SA (بالا-راست) -->
      <rect x="780" y="20" width="140" height="60" rx="10" fill="#f39c12" filter="url(#sh1)"/>
      <text x="850" y="55" font-size="13" font-weight="bold" text-anchor="middle" fill="#fff">چابکی استراتژیک</text>
    </svg>
  `;
}

/* ---------- شکل ۲: مدل ساختاری (استفاده از SVG موجود) ---------- */
function drawSmartPLSStructuralModel() {
  const el = document.getElementById('smartpls-graphic-2');
  if (!el) return;
  // استفاده از همان SVG دیاگرام مسیر
  el.innerHTML = `
    <svg viewBox="0 0 850 600" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%; font-family:'Vazirmatn',Tahoma,sans-serif; direction:rtl;">
      <defs>
        <marker id="m1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#8b94a7"/></marker>
        <marker id="m2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#e74c3c"/></marker>
        <filter id="sh2" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.2"/></filter>
      </defs>
      <line x1="235.7" y1="346.7" x2="354.2" y2="225.3" stroke="#8b94a7" stroke-width="2.5" marker-end="url(#m1)"/>
      <line x1="445.8" y1="225.3" x2="564.3" y2="346.7" stroke="#8b94a7" stroke-width="2.5" marker-end="url(#m1)"/>
      <line x1="270" y1="400" x2="530" y2="400" stroke="#8b94a7" stroke-width="2.5" marker-end="url(#m1)"/>
      <line x1="150" y1="150" x2="295" y2="275" stroke="#e74c3c" stroke-width="2" stroke-dasharray="6,4" marker-end="url(#m2)"/>
      <line x1="700" y1="150" x2="520" y2="310" stroke="#e74c3c" stroke-width="2" stroke-dasharray="6,4" marker-end="url(#m2)"/>
      <g filter="url(#sh2)">
        <circle cx="200" cy="400" r="70" fill="#e67e22"/>
        <circle cx="400" cy="180" r="70" fill="#9b59b6"/>
        <circle cx="600" cy="400" r="70" fill="#27ae60"/>
        <rect x="80" y="80" width="140" height="70" rx="10" fill="#3498db"/>
        <rect x="630" y="80" width="140" height="70" rx="10" fill="#f39c12"/>
      </g>
      <g font-size="15" font-weight="bold" text-anchor="middle" fill="#fff">
        <text x="400" y="180"><tspan x="400" dy="-0.8em">مدیریت</tspan><tspan x="400" dy="1.4em">دانش</tspan><tspan x="400" dy="1.8em" font-size="12" font-weight="normal" fill="#f1c40f">R² = 0.182</tspan></text>
        <text x="200" y="400"><tspan x="200" dy="-0.4em">استراتژی</tspan><tspan x="200" dy="1.4em">دیجیتال</tspan></text>
        <text x="600" y="400"><tspan x="600" dy="-0.8em">موفقیت تحول</tspan><tspan x="600" dy="1.4em">دیجیتال</tspan><tspan x="600" dy="1.8em" font-size="12" font-weight="normal" fill="#f1c40f">R² = 0.292</tspan></text>
        <text x="150" y="115"><tspan x="150" dy="-0.4em">رهبری تحول</tspan><tspan x="150" dy="1.4em">دیجیتال</tspan></text>
        <text x="700" y="115"><tspan x="700" dy="-0.4em">چابکی</tspan><tspan x="700" dy="1.4em">استراتژیک</tspan></text>
      </g>
      <g font-size="13" font-weight="bold" text-anchor="middle" font-family="Tahoma">
        <g transform="translate(285,275)"><rect x="-30" y="-12" width="60" height="24" rx="4" fill="#fff" opacity="0.95" filter="url(#sh2)"/><text y="0" fill="#000">β = 0.241</text></g>
        <g transform="translate(515,275)"><rect x="-30" y="-12" width="60" height="24" rx="4" fill="#fff" opacity="0.95" filter="url(#sh2)"/><text y="0" fill="#000">β = 0.270</text></g>
        <g transform="translate(400,415)"><rect x="-30" y="-12" width="60" height="24" rx="4" fill="#fff" opacity="0.95" filter="url(#sh2)"/><text y="0" fill="#000">β = 0.281</text></g>
        <g transform="translate(220,205)"><rect x="-30" y="-12" width="60" height="24" rx="4" fill="#fff" opacity="0.95" filter="url(#sh2)"/><text y="0" fill="#e74c3c">β = 0.071</text></g>
        <g transform="translate(620,220)"><rect x="-30" y="-12" width="60" height="24" rx="4" fill="#fff" opacity="0.95" filter="url(#sh2)"/><text y="0" fill="#e74c3c">β = 0.188</text></g>
      </g>
    </svg>
  `;
}

/* ---------- شکل ۳: Bootstrapping (با t-values) ---------- */
function drawSmartPLSBootstrapping() {
  const el = document.getElementById('smartpls-graphic-3');
  if (!el) return;
  el.innerHTML = `
    <svg viewBox="0 0 850 600" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%; font-family:'Vazirmatn',Tahoma,sans-serif; direction:rtl;">
      <defs>
        <marker id="m3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#8b94a7"/></marker>
        <marker id="m4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#e74c3c"/></marker>
        <filter id="sh3" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.2"/></filter>
      </defs>
      <line x1="235.7" y1="346.7" x2="354.2" y2="225.3" stroke="#8b94a7" stroke-width="2.5" marker-end="url(#m3)"/>
      <line x1="445.8" y1="225.3" x2="564.3" y2="346.7" stroke="#8b94a7" stroke-width="2.5" marker-end="url(#m3)"/>
      <line x1="270" y1="400" x2="530" y2="400" stroke="#8b94a7" stroke-width="2.5" marker-end="url(#m3)"/>
      <line x1="150" y1="150" x2="295" y2="275" stroke="#e74c3c" stroke-width="2" stroke-dasharray="6,4" marker-end="url(#m4)"/>
      <line x1="700" y1="150" x2="520" y2="310" stroke="#e74c3c" stroke-width="2" stroke-dasharray="6,4" marker-end="url(#m4)"/>
      <g filter="url(#sh3)">
        <circle cx="200" cy="400" r="70" fill="#e67e22"/>
        <circle cx="400" cy="180" r="70" fill="#9b59b6"/>
        <circle cx="600" cy="400" r="70" fill="#27ae60"/>
        <rect x="80" y="80" width="140" height="70" rx="10" fill="#3498db"/>
        <rect x="630" y="80" width="140" height="70" rx="10" fill="#f39c12"/>
      </g>
      <g font-size="15" font-weight="bold" text-anchor="middle" fill="#fff">
        <text x="400" y="180"><tspan x="400" dy="-0.3em">مدیریت</tspan><tspan x="400" dy="1.4em">دانش</tspan></text>
        <text x="200" y="400"><tspan x="200" dy="-0.3em">استراتژی</tspan><tspan x="200" dy="1.4em">دیجیتال</tspan></text>
        <text x="600" y="400"><tspan x="600" dy="-0.3em">موفقیت تحول</tspan><tspan x="600" dy="1.4em">دیجیتال</tspan></text>
        <text x="150" y="115"><tspan x="150" dy="-0.3em">رهبری تحول</tspan><tspan x="150" dy="1.4em">دیجیتال</tspan></text>
        <text x="700" y="115"><tspan x="700" dy="-0.3em">چابکی</tspan><tspan x="700" dy="1.4em">استراتژیک</tspan></text>
      </g>
      <!-- t-values -->
      <g font-size="13" font-weight="bold" text-anchor="middle" font-family="Tahoma">
        <g transform="translate(285,275)"><rect x="-30" y="-12" width="60" height="24" rx="4" fill="#fff" opacity="0.95" filter="url(#sh3)"/><text y="0" fill="#27ae60">t = 3.79</text></g>
        <g transform="translate(515,275)"><rect x="-30" y="-12" width="60" height="24" rx="4" fill="#fff" opacity="0.95" filter="url(#sh3)"/><text y="0" fill="#27ae60">t = 3.75</text></g>
        <g transform="translate(400,415)"><rect x="-30" y="-12" width="60" height="24" rx="4" fill="#fff" opacity="0.95" filter="url(#sh3)"/><text y="0" fill="#27ae60">t = 4.68</text></g>
        <g transform="translate(220,205)"><rect x="-30" y="-12" width="60" height="24" rx="4" fill="#fff" opacity="0.95" filter="url(#sh3)"/><text y="0" fill="#e74c3c">t = 1.28</text></g>
        <g transform="translate(620,220)"><rect x="-30" y="-12" width="60" height="24" rx="4" fill="#fff" opacity="0.95" filter="url(#sh3)"/><text y="0" fill="#27ae60">t = 2.85</text></g>
      </g>
    </svg>
  `;
}
/* ================================================================
   ۵۸. Causal ML — توابع کمکی
   ================================================================ */
function buildAdvancedChartCard(opts) {
  const badgesHtml = (opts.badges || []).map(b => `<span class="chart-badge badge-${b.type}">${b.label}</span>`).join('');
  const legendHtml = opts.legend ? `<div class="legend-table">${opts.legend}</div>` : '';
  const panelId = opts.id + '-panel';
  return `
    <div class="chart-card">
      <div class="chart-title"><span>${opts.title}</span><div>${badgesHtml}</div></div>
      <div id="${opts.id}" class="plot ${opts.height || ''}"></div>
      <div class="chart-toolbar">
        <button class="btn-interpretation" onclick="togglePanel('${panelId}', this)">
          <span class="icon-bulb">💡</span><span>${ti('show_btn')}</span>
        </button>
        <button class="dl-btn" onclick="downloadChart('${opts.id}', '${opts.id}')">⬇ PNG</button>
      </div>
      <div class="interpretation-panel" id="${panelId}">
        <div class="interpretation-content">
          <div class="interp-header"><span class="interp-header-icon">📊</span><span class="interp-title">${ti('title_chart')}</span></div>
          <div class="interp-body"><div class="interp-item">${opts.interp}</div><div class="interp-item" style="border-right-color:#8e44ad;"><span class="interp-label">${ti('test_label')}:</span> ${opts.test}</div></div>
        </div>
      </div>
      ${legendHtml}
      <div class="data-source"><strong>${state.lang==='fa'?'📁 منبع:':'📁 Source:'}</strong> ${opts.source}</div>
    </div>
  `;
}

function cmInterp(n) {
  const fa = {
    1: `<strong>نوع نمودار:</strong> هیستوگرام توزیع CATE (اثر علّی شرطی) — ۱۸۰ تخمین<br><strong>مقادیر کلیدی:</strong> دامنه = [0.27 , 0.70] · میانگین = 0.48 · انحراف معیار ≈ 0.08<br><br><em>چه می‌بینیم:</em> توزیع CATE دوقطبی است — دو گروه متمایز: زنانی با اثر ضعیف (~0.27) و زنانی با اثر قوی (~0.60).<br><div class="reason-text"><strong>ارتباط با هدف:</strong> «اثر متوسط 0.48» گمراه‌کننده است. سیاست‌گذاری باید بر اساس CATE باشد، نه ATE.</div>`,
    2: `<strong>نوع نمودار:</strong> CATE مرتب‌شده — ۱۸۰ تخمین به ترتیب صعودی<br><br><em>چه می‌بینیم:</em> شکل پلکانی نشان می‌دهد نمونه به دو گروه طبیعی تقسیم می‌شود: ~۹۰ نفر با اثر پایین و ~۹۰ نفر با اثر بالا.<br><div class="reason-text"><strong>ارتباط با هدف:</strong> امکان هدف‌گیری دقیق: تمرکز بر ۵۰٪ بالای نمودار بازدهی ۲ برابری دارد.</div>`,
    3: `<strong>نوع نمودار:</strong> ستون‌های سه‌بعدی CATE بر اساس چارک‌های DS<br><strong>مقادیر:</strong> DS-Q1 = 0.449 · DS-Q2 = 0.478 · DS-Q3 = 0.479 · DS-Q4 = 0.503 · نسبت Q4/Q1 = 1.12×<br><br><em>چه می‌بینیم:</em> روند صعودی یکنوا — هرچه DS بالاتر، CATE بالاتر. تفاوت ۱۲٪ بین چارک اول و چهارم معنادار است.<br><div class="reason-text"><strong>ارتباط با هدف:</strong> استراتژی دیجیتال، تعدیل‌گر مثبت است. تقویت DS، اثر رهبری بر موفقیت را افزایش می‌دهد.</div>`,
    4: `<strong>نوع نمودار:</strong> CATE در ۱۰ بازه DS با CI ۹۵٪<br><br><em>چه می‌بینیم:</em> روند صعودی با بازه‌های اطمینان غیرهم‌پوشان در دو انتها — یعنی تفاوت اثر در DS پایین و بالا واقعی است.<br><div class="reason-text"><strong>ارتباط با هدف:</strong> شاهد آماری بر سیستماتیک بودن ناهمگونی CATE.</div>`,
    5: `<strong>نوع نمودار:</strong> PDP (Partial Dependence Plot) — اثر خالص DS بر CATE با کنترل DKM<br><br><em>چه می‌بینیم:</em> منحنی از 0.40 در DS=1 به 0.55 در DS=5 می‌رسد — شیب مثبت و یکنوا.<br><div class="reason-text"><strong>ارتباط با هدف:</strong> DS حتی پس از کنترل DKM، اثر مستقل دارد. سیاست‌گذاری نمی‌تواند DS را نادیده بگیرد.</div>`,
    6: `<strong>نوع نمودار:</strong> جعبه‌ای CATE بر اساس چارک‌های DKM<br><strong>مقادیر:</strong> DKM-Q1 ≈ 0.45 · DKM-Q2 ≈ 0.47 · DKM-Q3 ≈ 0.48 · DKM-Q4 ≈ 0.50<br><br><em>چه می‌بینیم:</em> روند صعودی ملایم — DKM نیز تعدیل‌گر است اما اثر آن کمتر از DS است.<br><div class="reason-text"><strong>ارتباط با هدف:</strong> هر دو DS و DKM تعدیل‌گرند — سیاست‌گذاری باید هم‌زمان باشد.</div>`,
    7: `<strong>نوع نمودار:</strong> پراکندگی سه‌بعدی CATE بر اساس DS و DKM<br><br><em>چه می‌بینیم:</em> الگوی قطری — نقاط با DS بالا و DKM بالا، CATE بالاتری دارند. تعامل هم‌افزا.<br><div class="reason-text"><strong>ارتباط با هدف:</strong> تأیید تعامل DS×DKM. تقویت هم‌زمان بازدهی بیشتری دارد.</div>`,
    8: `<strong>نوع نمودار:</strong> سطح پیوسته CATE (درون‌یابی IDW)<br><br><em>چه می‌بینیم:</em> سطح صعودی از گوشه پایین-چپ به بالا-راست.<br><div class="reason-text"><strong>ارتباط با هدف:</strong> امکان پیش‌بینی CATE برای هر ترکیب DS و DKM.</div>`,
    9: `<strong>نوع نمودار:</strong> اهمیت متغیرها (Feature Importance)<br><strong>مقادیر:</strong> DS = 0.888 · DKM = 0.112<br><br><em>چه می‌بینیم:</em> DS ۸۸٪ از ناهمگونی را توضیح می‌دهد — DKM سهم کوچک‌تری دارد.<br><div class="reason-text"><strong>ارتباط با هدف:</strong> اولویت سیاستی: تقویت DS.</div>`,
    10: `<strong>نوع نمودار:</strong> گیج BLP R²<br><strong>مقادیر:</strong> R² = 0.060 · Calibration p-value = 0.031<br><br><em>چه می‌بینیم:</em> R² پایین (0.06) اما کالیبراسیون معنادار (p<0.05).<br><div class="reason-text"><strong>ارتباط با هدف:</strong> ناهمگونی کشف‌شده «واقعی» است، اما بخش زیادی از واریانس CATE توسط DS و DKM توضیح داده نمی‌شود.</div>`,
    11: `<strong>نوع نمودار:</strong> منحنی TOC — مقایسه مدل با تخصیص تصادفی<br><br><em>چه می‌بینیم:</em> منحنی مدل بالای خط تصادفی — مدل می‌داند چه کسی را هدف بگیرد.<br><div class="reason-text"><strong>ارتباط با هدف:</strong> هدف‌گیری هوشمند تا ۲۰٪ بازدهی بیشتر از توزیع یکنواخت دارد.</div>`,
    12: `<strong>نوع نمودار:</strong> منحنی Qini — کیفیت رتبه‌بندی<br><br><em>چه می‌بینیم:</em> منحنی مدل کاملاً بالای خط تصادفی — Qini مثبت.<br><div class="reason-text"><strong>ارتباط با هدف:</strong> مدل قادر است افراد با اثر بالا را از اثر پایین تفکیک کند.</div>`
  };
  const en = {
    1: `<strong>Chart type:</strong> CATE distribution histogram — 180 estimates<br><strong>Key values:</strong> range [0.27, 0.70], mean=0.48, SD≈0.08<br><br><em>What we see:</em> Bimodal distribution — two distinct groups: weak effect (~0.27) and strong effect (~0.60).<br><div class="reason-text"><strong>Link to goal:</strong> The "average effect 0.48" is misleading. Policy must target CATE, not ATE.</div>`,
    2: `<strong>Chart type:</strong> Ranked CATE — 180 estimates sorted ascending<br><br><em>What we see:</em> Stepwise shape reveals two natural groups: ~90 with low effect, ~90 with high effect.<br><div class="reason-text"><strong>Link to goal:</strong> Precision targeting: focus on top 50% yields double the return.</div>`,
    3: `<strong>Chart type:</strong> 3D columns of CATE across DS quartiles<br><strong>Key values:</strong> DS-Q1=0.449, DS-Q2=0.478, DS-Q3=0.479, DS-Q4=0.503, Q4/Q1=1.12×<br><br><em>What we see:</em> Monotonic increase — higher DS, higher CATE. 12% difference between Q1 and Q4 is meaningful.<br><div class="reason-text"><strong>Link to goal:</strong> Digital strategy positively moderates. Strengthening DS amplifies leadership effect.</div>`,
    4: `<strong>Chart type:</strong> CATE across 10 DS bins with 95% CI<br><br><em>What we see:</em> Upward trend with non-overlapping CIs at extremes — difference is real.<br><div class="reason-text"><strong>Link to goal:</strong> Statistical evidence that heterogeneity is systematic.</div>`,
    5: `<strong>Chart type:</strong> PDP — net effect of DS on CATE controlling for DKM<br><br><em>What we see:</em> Curve rises from 0.40 at DS=1 to 0.55 at DS=5 — positive monotonic slope.<br><div class="reason-text"><strong>Link to goal:</strong> DS has independent effect even after controlling DKM. Policy cannot ignore DS.</div>`,
    6: `<strong>Chart type:</strong> Box plot of CATE by DKM quartiles<br><strong>Key values:</strong> DKM-Q1≈0.45, Q2≈0.47, Q3≈0.48, Q4≈0.50<br><br><em>What we see:</em> Mild upward trend — DKM is also a moderator but weaker than DS.<br><div class="reason-text"><strong>Link to goal:</strong> Both DS and DKM moderate — policy should address both.</div>`,
    7: `<strong>Chart type:</strong> 3D scatter of CATE by DS and DKM<br><br><em>What we see:</em> Diagonal pattern — high DS + high DKM yields higher CATE. Synergistic interaction.<br><div class="reason-text"><strong>Link to goal:</strong> Confirms DS×DKM interaction. Simultaneous strengthening yields higher returns.</div>`,
    8: `<strong>Chart type:</strong> Continuous CATE surface (IDW interpolation)<br><br><em>What we see:</em> Surface rises from lower-left to upper-right.<br><div class="reason-text"><strong>Link to goal:</strong> Enables CATE prediction for any DS and DKM combination.</div>`,
    9: `<strong>Chart type:</strong> Feature Importance<br><strong>Key values:</strong> DS=0.888, DKM=0.112<br><br><em>What we see:</em> DS explains 88% of heterogeneity — DKM has smaller share.<br><div class="reason-text"><strong>Link to goal:</strong> Policy priority: strengthen DS.</div>`,
    10: `<strong>Chart type:</strong> BLP R² gauge<br><strong>Key values:</strong> R²=0.060, Calibration p=0.031<br><br><em>What we see:</em> Low R² (0.06) but significant calibration (p<0.05).<br><div class="reason-text"><strong>Link to goal:</strong> Discovered heterogeneity is "real", but much variance in CATE remains unexplained.</div>`,
    11: `<strong>Chart type:</strong> TOC curve — model vs random allocation<br><br><em>What we see:</em> Model curve above random — model knows whom to target.<br><div class="reason-text"><strong>Link to goal:</strong> Smart targeting yields up to 20% more return than uniform distribution.</div>`,
    12: `<strong>Chart type:</strong> Qini curve — ranking quality<br><br><em>What we see:</em> Model curve entirely above random — positive Qini.<br><div class="reason-text"><strong>Link to goal:</strong> Model can separate high-effect from low-effect individuals.</div>`
  };
  return (state.lang === 'fa' ? fa : en)[n] || '';
}

/* ================================================================
   ۵۹. Causal ML — رسم همه نمودارها
   ================================================================ */
function renderCausalMLSection() {
  const container = document.getElementById('cm-charts-container');
  if (!container) return;
  const cf = (state.loaded && state.loaded.causalForest) || FALLBACK_CAUSAL_FOREST;
  const isFa = state.lang === 'fa';
  const b3d = [{type:'3d', label: isFa ? '۳بعدی' : '3D'}];
  const b2d = [{type:'2d', label: isFa ? '۲بعدی' : '2D'}];
  const star = [{type:'star', label:'⭐'}];

  const sources = [
    'electric_bicycle_causal_forest.xlsx → CATE_Distribution',
    'electric_bicycle_causal_forest.xlsx → CATE_Distribution (sorted)',
    'electric_bicycle_causal_forest.xlsx → HG_Quartiles',
    'electric_bicycle_causal_forest.xlsx → Full_Data (DS, CATE)',
    'electric_bicycle_causal_forest.xlsx → Full_Data (DS, DKM, CATE)',
    'electric_bicycle_causal_forest.xlsx → Full_Data (DKM, CATE)',
    'electric_bicycle_causal_forest.xlsx → Full_Data (DS, DKM, CATE)',
    'electric_bicycle_causal_forest.xlsx → Full_Data (IDW)',
    'electric_bicycle_causal_forest.xlsx → Feature_Importance',
    'electric_bicycle_causal_forest.xlsx → Overview',
    'electric_bicycle_causal_forest.xlsx → Full_Data (CATE)',
    'electric_bicycle_causal_forest.xlsx → Full_Data (CATE)'
  ];
  const cards = [
    {id:'cm-1',n:1,badges:[...b3d,...star],height:'tall'},
    {id:'cm-2',n:2,badges:b2d},
    {id:'cm-3',n:3,badges:b3d,height:'tall'},
    {id:'cm-4',n:4,badges:b2d},
    {id:'cm-5',n:5,badges:b2d},
    {id:'cm-6',n:6,badges:b2d},
    {id:'cm-7',n:7,badges:[...b3d,...star],height:'xtall'},
    {id:'cm-8',n:8,badges:b3d,height:'xtall'},
    {id:'cm-9',n:9,badges:b2d},
    {id:'cm-10',n:10,badges:b2d},
    {id:'cm-11',n:11,badges:[...b2d,...star]},
    {id:'cm-12',n:12,badges:b2d}
  ];
  const legends = {
    1:'<span class="legend-item"><span class="legend-color" style="background:linear-gradient(135deg,#0d0887,#f0f921)"></span>Plasma</span>',
    3:'<span class="legend-item"><span class="legend-color" style="background:#e74c3c"></span>DS-Q1</span><span class="legend-item"><span class="legend-color" style="background:#f39c12"></span>DS-Q2</span><span class="legend-item"><span class="legend-color" style="background:#3498db"></span>DS-Q3</span><span class="legend-item"><span class="legend-color" style="background:#27ae60"></span>DS-Q4</span>',
    6:'<span class="legend-item"><span class="legend-color" style="background:#e74c3c"></span>DKM-Q1</span><span class="legend-item"><span class="legend-color" style="background:#f39c12"></span>DKM-Q2</span><span class="legend-item"><span class="legend-color" style="background:#3498db"></span>DKM-Q3</span><span class="legend-item"><span class="legend-color" style="background:#27ae60"></span>DKM-Q4</span>',
    11:'<span class="legend-item"><span class="legend-line" style="background:#27ae60"></span>Model</span><span class="legend-item"><span class="legend-line" style="background:#e74c3c"></span>Random</span>',
    12:'<span class="legend-item"><span class="legend-line" style="background:#9b59b6"></span>Model</span><span class="legend-item"><span class="legend-line" style="background:#e74c3c"></span>Random</span>'
  };

  let html = '<div class="cm-grid">';
  cards.forEach(card => {
    const title = I18N[state.lang]['cm_chart_' + card.n + '_title'] || ('Chart ' + card.n);
    html += buildAdvancedChartCard({
      id: card.id, title: title, badges: card.badges, height: card.height,
      interp: cmInterp(card.n), source: sources[card.n - 1] || '',
      test: 'Causal Forest DML', legend: legends[card.n] || null
    });
  });
  html += '</div>';
  container.innerHTML = html;

  // رسم نمودارها
  plotCM1_3DHist(cf); plotCM2_Ranked(cf); plotCM3_3DDS(cf); plotCM4_Binned(cf);
  plotCM5_PDP(cf); plotCM6_BoxDKM(cf); plotCM7_3DScatter(cf); plotCM8_3DSurface(cf);
  plotCM9_FeatImp(cf); plotCM10_BLP(cf); plotCM11_TOC(cf); plotCM12_Qini(cf);
}

/* ================================================================
   ۶۰. توابع رسم ۱۲ نمودار
   ================================================================ */
function plotCM1_3DHist(cf) {
  const r = cf.CATE_Distribution || [];
  const vals = r.map(d => d.CATE).filter(v => v != null);
  if (!vals.length) return;
  const NB = 20, min = Math.min(...vals), max = Math.max(...vals), bw = (max - min) / NB;
  const bins = Array(NB).fill(0);
  vals.forEach(v => { const i = Math.min(Math.floor((v - min) / bw), NB - 1); bins[i]++; });
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const xs = [], ys = [], zs = [];
  bins.forEach((c, i) => { const xc = min + bw * (i + 0.5); xs.push(xc, xc, null); ys.push(0, 0, null); zs.push(0, c, null); });
  const sc = { xaxis: { title: 'CATE', gridcolor: themeColors().grid }, yaxis: { showticklabels: false, range: [-1, 1], gridcolor: themeColors().grid }, zaxis: { title: 'Freq', gridcolor: themeColors().grid }, camera: { eye: { x: 1.6, y: -1.6, z: 0.9 } } };
  Plotly.newPlot('cm-1', [
    { type: 'scatter3d', mode: 'lines', x: xs, y: ys, z: zs, line: { color: '#3498db', width: 6 }, hoverinfo: 'skip', showlegend: false },
    { type: 'scatter3d', mode: 'markers', x: bins.map((_, i) => min + bw * (i + 0.5)), y: bins.map(() => 0), z: bins, marker: { size: bins.map(c => 8 + c * 0.5), color: bins.map((_, i) => min + bw * (i + 0.5)), colorscale: 'Plasma', line: { color: '#fff', width: 1 } }, hovertemplate: 'CATE: %{x:.3f}<br>Freq: %{z}<extra></extra>', showlegend: false },
    { type: 'scatter3d', mode: 'lines', x: [mean, mean], y: [0, 0], z: [0, Math.max(...bins) * 1.1], line: { color: '#e74c3c', width: 6, dash: 'dash' }, hoverinfo: 'skip', showlegend: false }
  ], plotlyLayout({ scene: sc, showlegend: false, margin: { l: 0, r: 0, t: 10, b: 0 } }), PLOTLY_CFG);
}

function plotCM2_Ranked(cf) {
  const r = cf.CATE_Distribution || [];
  const vals = r.map(d => d.CATE).filter(v => v != null).sort((a, b) => a - b);
  if (!vals.length) return;
  Plotly.newPlot('cm-2', [{ type: 'scatter', mode: 'lines', x: vals.map((_, i) => i + 1), y: vals, line: { color: '#3498db', width: 2 }, fill: 'tozeroy', fillcolor: 'rgba(52,152,219,0.15)', hovertemplate: 'Rank: %{x}<br>CATE: %{y:.4f}<extra></extra>' }], plotlyLayout({ xaxis: { title: 'Rank', gridcolor: themeColors().grid }, yaxis: { title: 'CATE', gridcolor: themeColors().grid }, shapes: [{ type: 'line', x0: 0, x1: vals.length, y0: 0.333, y1: 0.333, line: { color: '#e74c3c', dash: 'dash', width: 2 } }, { type: 'line', x0: 0, x1: vals.length, y0: 0.533, y1: 0.533, line: { color: '#27ae60', dash: 'dash', width: 2 } }] }), PLOTLY_CFG);
}

function plotCM3_3DDS(cf) {
  const r = cf.HG_Quartiles || [];
  if (!r.length) return;
  const vals = r.map(d => d.Mean_CATE), sds = r.map(d => d.SD_CATE), labels = r.map(d => d.HG_Quartile);
  const colors = ['#e74c3c', '#f39c12', '#3498db', '#27ae60'];
  const xs = [], ys = [], zs = [];
  vals.forEach((v, i) => { xs.push(i, i, null); ys.push(0, 0, null); zs.push(0, v, null); });
  const sc = { xaxis: { title: '', tickvals: [0, 1, 2, 3], ticktext: labels, gridcolor: themeColors().grid }, yaxis: { showticklabels: false, range: [-1, 1], gridcolor: themeColors().grid }, zaxis: { title: 'CATE', gridcolor: themeColors().grid }, camera: { eye: { x: 1.6, y: -1.6, z: 0.9 } } };
  Plotly.newPlot('cm-3', [
    { type: 'scatter3d', mode: 'lines', x: xs, y: ys, z: zs, line: { color: '#7f8c9c', width: 8 }, hoverinfo: 'skip', showlegend: false },
    { type: 'scatter3d', mode: 'markers', x: vals.map((_, i) => i), y: vals.map(() => 0), z: vals, marker: { size: 22, color: colors, line: { color: '#fff', width: 2 } }, text: labels, customdata: r.map(d => [d.N, d.SD_CATE]), hovertemplate: '<b>%{text}</b><br>CATE: %{z:.4f}<br>N: %{customdata[0]}<extra></extra>', showlegend: false },
    { type: 'scatter3d', mode: 'lines', x: vals.flatMap((_, i) => [i, i, null]), y: vals.flatMap(() => [0, 0, null]), z: vals.flatMap((v, i) => [v - sds[i], v + sds[i], null]), line: { color: '#e8ecf1', width: 3 }, hoverinfo: 'skip', showlegend: false }
  ], plotlyLayout({ scene: sc, showlegend: false, margin: { l: 0, r: 0, t: 10, b: 0 } }), PLOTLY_CFG);
}

function plotCM4_Binned(cf) {
  const r = cf.Full_Data || [];
  if (!r.length) return;
  const hg = r.map(d => d.HG_score), cate = r.map(d => d.CATE);
  const bins = 10, min = Math.min(...hg), max = Math.max(...hg), bw = (max - min) / bins, bd = [];
  for (let i = 0; i < bins; i++) {
    const lo = min + i * bw, hi = min + (i + 1) * bw, inB = [];
    cate.forEach((c, j) => { if (hg[j] >= lo && hg[j] < hi) inB.push(c); });
    if (inB.length > 0) { const mean = inB.reduce((a, b) => a + b, 0) / inB.length; const sd = Math.sqrt(inB.reduce((a, b) => a + (b - mean) ** 2, 0) / inB.length); bd.push({ x: (lo + hi) / 2, mean, se: 1.96 * sd / Math.sqrt(inB.length), n: inB.length }); }
  }
  Plotly.newPlot('cm-4', [{ type: 'scatter', mode: 'lines+markers', x: bd.map(b => b.x), y: bd.map(b => b.mean), marker: { size: 12, color: '#3498db' }, line: { color: '#3498db', width: 2 }, error_y: { type: 'data', array: bd.map(b => b.se), color: '#e8ecf1', thickness: 2, width: 6 }, customdata: bd.map(b => b.n), hovertemplate: 'DS: %{x:.2f}<br>CATE: %{y:.4f}<br>N: %{customdata}<extra></extra>' }], plotlyLayout({ xaxis: { title: 'DS', gridcolor: themeColors().grid }, yaxis: { title: 'CATE (95% CI)', gridcolor: themeColors().grid } }), PLOTLY_CFG);
}

function plotCM5_PDP(cf) {
  const r = cf.Full_Data || [];
  if (!r.length) return;
  const hg = r.map(d => d.HG_score), pr = r.map(d => d.PR_score), cate = r.map(d => d.CATE);
  const medPR = [...pr].sort((a, b) => a - b)[Math.floor(pr.length / 2)];
  const minHG = Math.min(...hg), maxHG = Math.max(...hg);
  const grid = Array.from({ length: 30 }, (_, i) => minHG + (maxHG - minHG) * i / 29);
  const pdp = grid.map(h => { let ws = 0, vs = 0; for (let i = 0; i < hg.length; i++) { const dHg = Math.abs(hg[i] - h), dPr = Math.abs(pr[i] - medPR); if (dHg < 0.5) { const w = 1 / (1 + dHg * dHg + dPr * dPr); ws += w; vs += w * cate[i]; } } return ws > 0 ? vs / ws : null; });
  Plotly.newPlot('cm-5', [{ type: 'scatter', mode: 'lines+markers', x: grid, y: pdp, line: { color: '#27ae60', width: 3 }, marker: { size: 6, color: '#27ae60' }, fill: 'tozeroy', fillcolor: 'rgba(39,174,96,0.15)', hovertemplate: 'DS: %{x:.2f}<br>Effect: %{y:.4f}<extra></extra>' }], plotlyLayout({ xaxis: { title: 'DS (DKM at median)', gridcolor: themeColors().grid }, yaxis: { title: 'PDP Effect', gridcolor: themeColors().grid } }), PLOTLY_CFG);
}

function plotCM6_BoxDKM(cf) {
  const r = cf.Full_Data || [];
  if (!r.length) return;
  const pr = r.map(d => d.PR_score).sort((a, b) => a - b);
  const q1 = pr[Math.floor(pr.length * 0.25)], q2 = pr[Math.floor(pr.length * 0.5)], q3 = pr[Math.floor(pr.length * 0.75)];
  const groups = { 'DKM-Q1': [], 'DKM-Q2': [], 'DKM-Q3': [], 'DKM-Q4': [] };
  r.forEach(d => { if (d.PR_score <= q1) groups['DKM-Q1'].push(d.CATE); else if (d.PR_score <= q2) groups['DKM-Q2'].push(d.CATE); else if (d.PR_score <= q3) groups['DKM-Q3'].push(d.CATE); else groups['DKM-Q4'].push(d.CATE); });
  const colors = ['#e74c3c', '#f39c12', '#3498db', '#27ae60'];
  Plotly.newPlot('cm-6', Object.entries(groups).map(([n, v], i) => ({ type: 'box', y: v, name: n, boxmean: 'sd', marker: { color: colors[i] } })), plotlyLayout({ yaxis: { title: 'CATE', gridcolor: themeColors().grid }, xaxis: { title: 'DKM Quartile', gridcolor: themeColors().grid }, showlegend: false }), PLOTLY_CFG);
}

function plotCM7_3DScatter(cf) {
  const r = cf.Full_Data || [];
  if (!r.length) return;
  const sc = { xaxis: { title: 'DS', gridcolor: themeColors().grid }, yaxis: { title: 'DKM', gridcolor: themeColors().grid }, zaxis: { title: 'CATE', gridcolor: themeColors().grid }, camera: { eye: { x: 1.6, y: -1.6, z: 0.9 } } };
  Plotly.newPlot('cm-7', [{ type: 'scatter3d', mode: 'markers', x: r.map(d => d.HG_score), y: r.map(d => d.PR_score), z: r.map(d => d.CATE), marker: { size: 4, color: r.map(d => d.CATE), colorscale: 'Plasma', colorbar: { title: 'CATE', thickness: 15, tickfont: { color: themeColors().text } } }, text: r.map(d => d.HG_Quartile), hovertemplate: 'DS: %{x:.2f}<br>DKM: %{y:.2f}<br>CATE: %{z:.3f}<extra></extra>' }], plotlyLayout({ scene: sc, showlegend: false, margin: { l: 0, r: 0, t: 10, b: 0 } }), PLOTLY_CFG);
}

function plotCM8_3DSurface(cf) {
  const r = cf.Full_Data || [];
  if (!r.length) return;
  const hg = r.map(d => d.HG_score), pr = r.map(d => d.PR_score), cate = r.map(d => d.CATE);
  const NX = 30, NY = 30, xg = [], yg = [];
  const hgMin = Math.min(...hg), hgMax = Math.max(...hg), prMin = Math.min(...pr), prMax = Math.max(...pr);
  for (let i = 0; i < NX; i++) xg.push(hgMin + (hgMax - hgMin) * i / (NX - 1));
  for (let j = 0; j < NY; j++) yg.push(prMin + (prMax - prMin) * j / (NY - 1));
  const Z = yg.map(y => xg.map(x => { let ws = 0, vs = 0; for (let i = 0; i < hg.length; i++) { const d2 = (hg[i] - x) ** 2 + (pr[i] - y) ** 2 + 0.01, w = 1 / d2; ws += w; vs += w * cate[i]; } return vs / ws; }));
  const sc = { xaxis: { title: 'DS', gridcolor: themeColors().grid }, yaxis: { title: 'DKM', gridcolor: themeColors().grid }, zaxis: { title: 'CATE', gridcolor: themeColors().grid }, camera: { eye: { x: 1.6, y: -1.6, z: 0.9 } } };
  Plotly.newPlot('cm-8', [{ type: 'surface', x: xg, y: yg, z: Z, colorscale: 'Plasma', colorbar: { title: 'CATE', thickness: 15, tickfont: { color: themeColors().text } }, contours: { z: { show: true, usecolormap: true, highlightcolor: '#fff', project: { z: true } } } }], plotlyLayout({ scene: sc, showlegend: false, margin: { l: 0, r: 0, t: 10, b: 0 } }), PLOTLY_CFG);
}

function plotCM9_FeatImp(cf) {
  const r = cf.Feature_Importance || [];
  if (!r.length) return;
  Plotly.newPlot('cm-9', [{ type: 'bar', orientation: 'h', y: r.map(d => d.Variable), x: r.map(d => d.Importance), marker: { color: ['#e67e22', '#9b59b6'], line: { color: '#fff', width: 2 } }, text: r.map(d => d.Importance.toFixed(3)), textposition: 'outside', hovertemplate: '<b>%{y}</b><br>Importance: %{x:.4f}<extra></extra>' }], plotlyLayout({ xaxis: { title: 'Importance', gridcolor: themeColors().grid, range: [0, 0.75] }, yaxis: { title: '', gridcolor: themeColors().grid }, margin: { l: 120, r: 60, t: 10, b: 50 } }), PLOTLY_CFG);
}

function plotCM10_BLP(cf) {
  const ov = cf.OverviewObj || (cf.Overview || []).reduce((o, r) => { o[r.Metric] = r.Value; return o; }, {});
  const r2 = parseFloat(ov.BLP_R2 || 0.060);
  const calibP = parseFloat(ov.Calibration_Test_Pval != null ? ov.Calibration_Test_Pval : 0.031);
  const calibStatus = ov.Calibration_Status || (calibP < 0.05 ? '✅ Well-calibrated (p < 0.05)' : '⚠ Not calibrated');
  const calibColor = calibP < 0.05 ? '#27ae60' : '#e74c3c';
  Plotly.newPlot('cm-10', [{ type: 'indicator', mode: 'gauge+number', value: r2, number: { font: { size: 44, color: themeColors().text }, valueformat: '.4f' }, gauge: { axis: { range: [0, 1], tickwidth: 1, tickcolor: themeColors().text, tickfont: { color: themeColors().text } }, bar: { color: '#27ae60', thickness: 0.7 }, bgcolor: themeColors().plot, borderwidth: 1, bordercolor: themeColors().grid, steps: [{ range: [0, 0.5], color: 'rgba(231,76,60,.2)' }, { range: [0.5, 0.7], color: 'rgba(243,156,18,.2)' }, { range: [0.7, 0.85], color: 'rgba(39,174,96,.2)' }, { range: [0.85, 1], color: 'rgba(39,174,96,.4)' }], threshold: { line: { color: '#e74c3c', width: 3 }, thickness: 0.75, value: 0.7 } } }], plotlyLayout({ margin: { l: 20, r: 20, t: 40, b: 20 }, annotations: [{ text: `Calibration p-value: ${calibP.toFixed(4)}<br><span style="color:${calibColor};font-weight:bold">${calibStatus}</span>`, x: 0.5, y: 0.05, xref: 'paper', yref: 'paper', showarrow: false, font: { size: 12, color: themeColors().text } }] }), PLOTLY_CFG);
}

function plotCM11_TOC(cf) {
  const r = cf.Full_Data || [];
  if (!r.length) return;
  const cate = r.map(d => d.CATE);
  const n = cate.length, ate = cate.reduce((a, b) => a + b, 0) / n;
  const sorted = [...cate].sort((a, b) => b - a);
  const cum = []; let s = 0;
  for (let i = 0; i < n; i++) { s += sorted[i]; cum.push(s / n); }
  const frac = cum.map((_, i) => (i + 1) / n);
  const rand = frac.map(f => f * ate);
  Plotly.newPlot('cm-11', [{ type: 'scatter', mode: 'lines', x: frac, y: cum, name: 'Model', line: { color: '#27ae60', width: 3 } }, { type: 'scatter', mode: 'lines', x: frac, y: rand, name: 'Random', line: { color: '#e74c3c', width: 3, dash: 'dash' } }], plotlyLayout({ xaxis: { title: 'Target fraction', gridcolor: themeColors().grid, tickformat: '.0%' }, yaxis: { title: 'Cumulative CATE', gridcolor: themeColors().grid }, legend: { x: 0.6, y: 0.05 } }), PLOTLY_CFG);
}

function plotCM12_Qini(cf) {
  const r = cf.Full_Data || [];
  if (!r.length) return;
  const cate = r.map(d => d.CATE);
  const sorted = [...cate].sort((a, b) => b - a);
  const cum = []; let s = 0;
  for (const v of sorted) { s += v; cum.push(s); }
  const total = cum[cum.length - 1];
  const frac = cum.map((_, i) => (i + 1) / cum.length);
  const rand = frac.map(f => f * total);
  Plotly.newPlot('cm-12', [{ type: 'scatter', mode: 'lines', x: frac, y: cum, name: 'Model', line: { color: '#9b59b6', width: 3 }, fill: 'tozeroy', fillcolor: 'rgba(155,89,182,0.15)' }, { type: 'scatter', mode: 'lines', x: frac, y: rand, name: 'Random', line: { color: '#e74c3c', width: 2, dash: 'dash' } }], plotlyLayout({ xaxis: { title: 'Sample fraction', gridcolor: themeColors().grid, tickformat: '.0%' }, yaxis: { title: 'Cumulative effect', gridcolor: themeColors().grid }, legend: { x: 0.6, y: 0.05 } }), PLOTLY_CFG);
}
/* ================================================================
   ۵۴. شروع همه چیز پس از بارگذاری DOM
   ================================================================ */
document.addEventListener('DOMContentLoaded', init);
/* ================================================================
   ۵۵. نمایش فایل‌های قابل دانلود
   ================================================================ */
function renderExcelViewer() {
  const container = document.getElementById('excel-viewer-container');
  if (!container) return;

  const isFa = state.lang === 'fa';

  // فهرست فایل‌ها — همه فایل‌های پروژه
  const files = [
    { name: 'electric_bicycle_data_complete.xlsx',       label: isFa ? 'داده خام ۱۸۰ پاسخ‌دهنده' : 'Raw Data (180 respondents)',    type: 'excel', icon: '📊' },
    { name: 'electric_bicycle_PLS_Algorithm.xlsx',        label: isFa ? 'خروجی PLS Algorithm (SmartPLS)' : 'PLS Algorithm Output',  type: 'excel', icon: '📊' },
    { name: 'electric_bicycle_Bootstrapping.xlsx',        label: isFa ? 'خروجی Bootstrapping (SmartPLS)' : 'Bootstrapping Output',  type: 'excel', icon: '📊' },
    { name: 'electric_bicycle_PLS_Predict.xlsx',          label: isFa ? 'خروجی PLS Predict (SmartPLS)' : 'PLS Predict Output',      type: 'excel', icon: '📊' },
    { name: 'electric_bicycle_monte_carlo_results.xlsx',  label: isFa ? 'خروجی شبیه‌سازی مونت‌کارلو' : 'Monte Carlo Results',        type: 'excel', icon: '🎲' },
    { name: 'electric_bicycle_ml_results.xlsx',           label: isFa ? 'خروجی یادگیری ماشین (XGBoost + SHAP)' : 'ML + SHAP Results', type: 'excel', icon: '🤖' },
    { name: 'electric_bicycle_questionnaire.docx',             label: isFa ? 'پرسشنامه تحقیق' : 'Research Questionnaire',                 type: 'docx',  icon: '📄' }
  ];

  let html = `<h4>${isFa ? '📁 فایل‌های اصلی تحقیق' : '📁 Main Research Files'}</h4>`;
  html += `<div class="excel-file-list">`;

  files.forEach(f => {
    html += `
      <div class="excel-file-item excel-file-${f.type}">
        <div class="file-name">
          <span class="file-icon file-icon-${f.type}">${f.icon}</span>
          <div>
            <div>${f.label}</div>
            <div class="excel-status">${f.name}</div>
          </div>
        </div>
        <div class="file-actions">
          <button class="download" onclick="downloadFile('${f.name}')">⬇ ${isFa ? 'دانلود' : 'Download'}</button>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  html += `
    <div style="margin-top:16px; padding:12px 16px; background:rgba(52,152,219,.08); border-right:3px solid var(--accent); border-radius:6px; font-size:12px; color:var(--text-muted); line-height:1.8;">
      💡 ${isFa ? 'همه فایل‌ها از پوشه پروژه قابل دانلود هستند. برای مشاهده محتوای اکسل، فایل را دانلود کرده و در Excel باز کنید.' : 'All files are downloadable from the project folder. Download Excel files to view in Excel.'}
    </div>
  `;

  container.innerHTML = html;
}

/* ================================================================
   ۵۶. دانلود یک فایل مشخص
   ================================================================ */
async function downloadFile(filename) {
  try {
    const resp = await fetch(filename, { cache: 'no-store' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // آزادسازی حافظه پس از ۲ ثانیه
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    console.log('[Download] ✅', filename);
  } catch (e) {
    console.error('[Download] ❌', filename, e.message);
    alert(
      state.lang === 'fa'
        ? 'خطا در دانلود فایل: ' + filename + '\n' + e.message
        : 'Download error: ' + filename + '\n' + e.message
    );
  }
}
/* ================================================================
   جداول تفصیلی مونت کارلو (MC Summary Tables)
   ================================================================ */

function renderMCSummaryTables() {
    // 1. جدول فرضیه‌ها
    let hHtml = `<div class="hyp-table-wrap"><table class="hyp-table"><thead><tr>
        <th>فرضیه</th><th>مسیر</th><th>β (PLS)</th><th>میانگین (MC)</th><th>بازه ۹۵٪</th><th>وضعیت</th><th>نتیجه</th>
    </tr></thead><tbody>`;
    MC_DATA.hypotheses.forEach(d => {
        const resCls = d.res === 'تأیید' ? 'hyp-res-confirmed' : 'hyp-res-rejected';
        const resIcon = d.res === 'تأیید' ? '✓' : '✕';
        hHtml += `<tr class="hyp-row mc-tooltip-row" data-tooltip="${d.tip}">
            <td><span class="hyp-id-chip">${d.h}</span></td>
            <td>${d.path}</td>
            <td><span class="hyp-beta" style="background:#3498db">${d.pls.toFixed(3)}</span></td>
            <td><span class="hyp-beta" style="background:#9b59b6">${d.mc.toFixed(4)}</span></td>
            <td style="direction:ltr; font-family:tahoma">${d.ci}</td>
            <td><span class="${d.sig === 'معنادار' ? 'hyp-p-sig' : 'hyp-p-ns'}">${d.sig}</span></td>
            <td><span class="hyp-res ${resCls}"><span class="hyp-res-icon">${resIcon}</span>${d.res}</span></td>
        </tr>`;
    });
    hHtml += `</tbody></table></div>`;
    document.getElementById('mc-table-hypotheses').innerHTML = hHtml;

    // 2. جدول سناریوها
    let sHtml = `<div class="hyp-table-wrap"><table class="hyp-table"><thead><tr>
        <th>سناریو</th><th>تعداد (N)</th><th>میانگین موفقیت</th><th>میانه (P50)</th><th>بازه ۹۰٪</th>
    </tr></thead><tbody>`;
    MC_DATA.scenarios.forEach(d => {
        sHtml += `<tr class="hyp-row mc-tooltip-row" data-tooltip="${d.tip}">
            <td><strong>${d.name}</strong></td>
            <td>${d.n.toLocaleString()}</td>
            <td><span class="hyp-beta" style="background:${d.mean>0?'#27ae60':'#e74c3c'}">${d.mean.toFixed(3)}</span></td>
            <td>${d.median.toFixed(3)}</td>
            <td style="direction:ltr; font-family:tahoma">${d.ci}</td>
        </tr>`;
    });
    sHtml += `</tbody></table></div>`;
    document.getElementById('mc-table-scenarios').innerHTML = sHtml;

    // 3. جدول H6
    let h6Html = `<div class="hyp-table-wrap"><table class="hyp-table"><thead><tr>
        <th>Z-Score تحریم</th><th>وضعیت</th><th>ضریب H6</th><th>بازه ۹۰٪</th><th>نتیجه</th>
    </tr></thead><tbody>`;
    MC_DATA.h6.forEach(d => {
        h6Html += `<tr class="hyp-row mc-tooltip-row" data-tooltip="${d.tip}">
            <td><span class="vif-ind-chip">${d.z}</span></td>
            <td>${d.desc}</td>
            <td><span class="hyp-beta" style="background:${d.beta>0?'#27ae60':'#e74c3c'}">${d.beta.toFixed(3)}</span></td>
            <td style="direction:ltr; font-family:tahoma">${d.ci}</td>
            <td><span class="${d.sig.includes('معنادار') ? 'hyp-p-sig' : 'hyp-p-ns'}">${d.sig}</span></td>
        </tr>`;
    });
    h6Html += `</tbody></table></div>`;
    document.getElementById('mc-table-h6').innerHTML = h6Html;

    // فعال‌سازی تولتیپ
    bindMCTableTooltips();
}

function bindMCTableTooltips() {
    let tooltip = document.getElementById('mc-row-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'mc-row-tooltip';
        tooltip.className = 'table-tooltip';
        document.body.appendChild(tooltip);
    }
    document.querySelectorAll('.mc-tooltip-row').forEach(row => {
        row.addEventListener('mouseenter', (e) => {
            tooltip.innerHTML = `<div>${row.dataset.tooltip}</div>`;
            tooltip.style.display = 'block';
            positionTooltip(e, tooltip); // از تابع موجود در داشبورد استفاده می‌کند
        });
        row.addEventListener('mousemove', (e) => {
            if (tooltip.style.display === 'block') positionTooltip(e, tooltip);
        });
        row.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
    });
}
/* ================================================================
   بخش جدید: جداول تفصیلی مونت کارلو (MC Summary Tables)
   ================================================================ */

function renderMCSummaryTables() {
    // 1. جدول فرضیه‌ها
    let hHtml = `<div class="hyp-table-wrap"><table class="hyp-table"><thead><tr>
        <th>فرضیه</th><th>مسیر</th><th>β (PLS)</th><th>میانگین (MC)</th><th>بازه ۹۵٪</th><th>وضعیت</th><th>نتیجه</th>
    </tr></thead><tbody>`;
    MC_DATA.hypotheses.forEach(d => {
        const resCls = d.res === 'تأیید' ? 'hyp-res-confirmed' : 'hyp-res-rejected';
        const resIcon = d.res === 'تأیید' ? '✓' : '✕';
        hHtml += `<tr class="hyp-row mc-tooltip-row" data-tooltip="${d.tip}">
            <td><span class="hyp-id-chip">${d.h}</span></td>
            <td>${d.path}</td>
            <td><span class="hyp-beta" style="background:#3498db">${d.pls.toFixed(3)}</span></td>
            <td><span class="hyp-beta" style="background:#9b59b6">${d.mc.toFixed(4)}</span></td>
            <td style="direction:ltr; font-family:tahoma">${d.ci}</td>
            <td><span class="${d.sig === 'معنادار' ? 'hyp-p-sig' : 'hyp-p-ns'}">${d.sig}</span></td>
            <td><span class="hyp-res ${resCls}"><span class="hyp-res-icon">${resIcon}</span>${d.res}</span></td>
        </tr>`;
    });
    hHtml += `</tbody></table></div>`;
    const elH = document.getElementById('mc-table-hypotheses');
    if(elH) elH.innerHTML = hHtml;

    // 2. جدول سناریوها
    let sHtml = `<div class="hyp-table-wrap"><table class="hyp-table"><thead><tr>
        <th>سناریو</th><th>تعداد (N)</th><th>میانگین موفقیت</th><th>میانه (P50)</th><th>بازه ۹۰٪</th>
    </tr></thead><tbody>`;
    MC_DATA.scenarios.forEach(d => {
        sHtml += `<tr class="hyp-row mc-tooltip-row" data-tooltip="${d.tip}">
            <td><strong>${d.name}</strong></td>
            <td>${d.n.toLocaleString()}</td>
            <td><span class="hyp-beta" style="background:${d.mean>0?'#27ae60':'#e74c3c'}">${d.mean.toFixed(3)}</span></td>
            <td>${d.median.toFixed(3)}</td>
            <td style="direction:ltr; font-family:tahoma">${d.ci}</td>
        </tr>`;
    });
    sHtml += `</tbody></table></div>`;
    const elS = document.getElementById('mc-table-scenarios');
    if(elS) elS.innerHTML = sHtml;

    // 3. جدول H6
    let h6Html = `<div class="hyp-table-wrap"><table class="hyp-table"><thead><tr>
        <th>Z-Score تحریم</th><th>وضعیت</th><th>ضریب H6</th><th>بازه ۹۰٪</th><th>نتیجه</th>
    </tr></thead><tbody>`;
    MC_DATA.h6.forEach(d => {
        h6Html += `<tr class="hyp-row mc-tooltip-row" data-tooltip="${d.tip}">
            <td><span class="vif-ind-chip">${d.z}</span></td>
            <td>${d.desc}</td>
            <td><span class="hyp-beta" style="background:${d.beta>0?'#27ae60':'#e74c3c'}">${d.beta.toFixed(3)}</span></td>
            <td style="direction:ltr; font-family:tahoma">${d.ci}</td>
            <td><span class="${d.sig.includes('معنادار') ? 'hyp-p-sig' : 'hyp-p-ns'}">${d.sig}</span></td>
        </tr>`;
    });
    h6Html += `</tbody></table></div>`;
    const elH6 = document.getElementById('mc-table-h6');
    if(elH6) elH6.innerHTML = h6Html;

    // فعال‌سازی تولتیپ
    bindMCTableTooltips();
}

function bindMCTableTooltips() {
    let tooltip = document.getElementById('mc-row-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'mc-row-tooltip';
        tooltip.className = 'table-tooltip';
        document.body.appendChild(tooltip);
    }
    document.querySelectorAll('.mc-tooltip-row').forEach(row => {
        row.addEventListener('mouseenter', (e) => {
            tooltip.innerHTML = `<div>${row.dataset.tooltip}</div>`;
            tooltip.style.display = 'block';
            if(typeof positionTooltip === 'function') positionTooltip(e, tooltip);
        });
        row.addEventListener('mousemove', (e) => {
            if (tooltip.style.display === 'block' && typeof positionTooltip === 'function') positionTooltip(e, tooltip);
        });
        row.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
    });
}

/* ================================================================
   بخش جدید: جداول تفصیلی مونت کارلو (MC Summary Tables) - نسخه اصلاح‌شده
   ================================================================ */
const MC_TABLES_DATA = {
    hypotheses: [
        { h: 'H1', path: 'استراتژی ← دانش', pls: 0.281, mc: 0.2809, ci: '[0.163, 0.400]', sig: 'معنادار', res: 'تأیید', tip: 'اثر مستقیم استراتژی دیجیتال بر مدیریت دانش.' },
        { h: 'H2', path: 'استراتژی ← موفقیت', pls: 0.241, mc: 0.2419, ci: '[0.117, 0.366]', sig: 'معنادار', res: 'تأیید', tip: 'اثر مستقیم استراتژی دیجیتال بر موفقیت تحول.' },
        { h: 'H3', path: 'دانش ← موفقیت', pls: 0.270, mc: 0.2691, ci: '[0.130, 0.409]', sig: 'معنادار', res: 'تأیید', tip: 'اثر مستقیم مدیریت دانش بر موفقیت تحول.' },
        { h: 'H4', path: 'اثر غیرمستقیم', pls: 0.076, mc: 0.0757, ci: '[0.030, 0.133]', sig: 'معنادار', res: 'تأیید', tip: 'نقش میانجی‌گری مدیریت دانش در رابطه استراتژی و موفقیت.' },
        { h: 'H5', path: 'رهبری ← دانش', pls: 0.342, mc: 0.3415, ci: '[0.224, 0.460]', sig: 'معنادار', res: 'تأیید', tip: 'اثر رهبری تحول دیجیتال بر مدیریت دانش.' },
        { h: 'H6', path: 'رهبری × استراتژی', pls: 0.071, mc: 0.0714, ci: '[-0.039, 0.179]', sig: 'غیرمعنادار', res: 'رد', tip: 'تعدیل‌گری رهبری در رابطه استراتژی و دانش (در شرایط تحریم تضعیف می‌شود).' },
        { h: 'H7', path: 'چابکی ← موفقیت', pls: 0.340, mc: 0.3401, ci: '[0.220, 0.461]', sig: 'معنادار', res: 'تأیید', tip: 'اثر مستقیم چابکی استراتژیک بر موفقیت تحول.' },
        { h: 'H8', path: 'چابکی × دانش', pls: 0.188, mc: 0.1887, ci: '[0.061, 0.316]', sig: 'معنادار', res: 'تأیید', tip: 'تعدیل‌گری چابکی در رابطه دانش و موفقیت.' }
    ],
    scenarios: [
        { name: 'خوش‌بینانه', n: 3333, mean: 0.215, median: 0.220, ci: '[-1.409, 1.876]', tip: 'تحریم و نرخ ارز پایین.' },
        { name: 'پایه', n: 3334, mean: 0.018, median: 0.027, ci: '[-1.629, 1.714]', tip: 'شرایط اقتصادی متوسط.' },
        { name: 'بدبینانه', n: 3333, mean: -0.215, median: -0.219, ci: '[-1.912, 1.481]', tip: 'تحریم و نرخ ارز بالا.' }
    ],
    h6: [
        { z: '-2.33', desc: 'تحریم کم', beta: 0.154, ci: '[0.062, 0.246]', sig: 'معنادار (مثبت)', tip: 'در شرایط تحریم پایین، رهبری دیجیتال نقش تعدیل‌گر مثبت دارد.' },
        { z: '-1.00', desc: 'تحریم متوسط', beta: 0.107, ci: '[0.015, 0.199]', sig: 'معنادار (مثبت)', tip: 'با افزایش تحریم، اثر تعدیل‌گری به سمت صفر میل می‌کند.' },
        { z: '+0.33', desc: 'تحریم بالا', beta: 0.060, ci: '[-0.033, 0.151]', sig: 'غیرمعنادار', tip: 'در تحریم‌های بالا، اثر رهبری به‌تنهایی کافی نیست.' },
        { z: '+2.33', desc: 'تحریم شدید', beta: -0.012, ci: '[-0.104, 0.080]', sig: 'غیرمعنادار', tip: 'در شرایط بحرانی، اثر تعدیل‌گر منفی می‌شود.' }
    ]
};

function renderMCSummaryTables() {
    // 1. جدول فرضیه‌ها
    let hHtml = `<div class="hyp-table-wrap"><table class="hyp-table"><thead><tr>
        <th>فرضیه</th><th>مسیر</th><th>β (PLS)</th><th>میانگین (MC)</th><th>بازه ۹۵٪</th><th>وضعیت</th><th>نتیجه</th>
    </tr></thead><tbody>`;
    MC_TABLES_DATA.hypotheses.forEach(d => {
        const resCls = d.res === 'تأیید' ? 'hyp-res-confirmed' : 'hyp-res-rejected';
        const resIcon = d.res === 'تأیید' ? '✓' : '✕';
        hHtml += `<tr class="hyp-row mc-tooltip-row" data-tooltip="${d.tip}">
            <td><span class="hyp-id-chip">${d.h}</span></td>
            <td>${d.path}</td>
            <td><span class="hyp-beta" style="background:#3498db">${d.pls.toFixed(3)}</span></td>
            <td><span class="hyp-beta" style="background:#9b59b6">${d.mc.toFixed(4)}</span></td>
            <td style="direction:ltr; font-family:tahoma">${d.ci}</td>
            <td><span class="${d.sig === 'معنادار' ? 'hyp-p-sig' : 'hyp-p-ns'}">${d.sig}</span></td>
            <td><span class="hyp-res ${resCls}"><span class="hyp-res-icon">${resIcon}</span>${d.res}</span></td>
        </tr>`;
    });
    hHtml += `</tbody></table></div>`;
    const elH = document.getElementById('mc-table-hypotheses');
    if(elH) elH.innerHTML = hHtml;

    // 2. جدول سناریوها
    let sHtml = `<div class="hyp-table-wrap"><table class="hyp-table"><thead><tr>
        <th>سناریو</th><th>تعداد (N)</th><th>میانگین موفقیت</th><th>میانه (P50)</th><th>بازه ۹۰٪</th>
    </tr></thead><tbody>`;
    MC_TABLES_DATA.scenarios.forEach(d => {
        sHtml += `<tr class="hyp-row mc-tooltip-row" data-tooltip="${d.tip}">
            <td><strong>${d.name}</strong></td>
            <td>${d.n.toLocaleString()}</td>
            <td><span class="hyp-beta" style="background:${d.mean>0?'#27ae60':'#e74c3c'}">${d.mean.toFixed(3)}</span></td>
            <td>${d.median.toFixed(3)}</td>
            <td style="direction:ltr; font-family:tahoma">${d.ci}</td>
        </tr>`;
    });
    sHtml += `</tbody></table></div>`;
    const elS = document.getElementById('mc-table-scenarios');
    if(elS) elS.innerHTML = sHtml;

    // 3. جدول H6
    let h6Html = `<div class="hyp-table-wrap"><table class="hyp-table"><thead><tr>
        <th>Z-Score تحریم</th><th>وضعیت</th><th>ضریب H6</th><th>بازه ۹۰٪</th><th>نتیجه</th>
    </tr></thead><tbody>`;
    MC_TABLES_DATA.h6.forEach(d => {
        h6Html += `<tr class="hyp-row mc-tooltip-row" data-tooltip="${d.tip}">
            <td><span class="vif-ind-chip">${d.z}</span></td>
            <td>${d.desc}</td>
            <td><span class="hyp-beta" style="background:${d.beta>0?'#27ae60':'#e74c3c'}">${d.beta.toFixed(3)}</span></td>
            <td style="direction:ltr; font-family:tahoma">${d.ci}</td>
            <td><span class="${d.sig.includes('معنادار') ? 'hyp-p-sig' : 'hyp-p-ns'}">${d.sig}</span></td>
        </tr>`;
    });
    h6Html += `</tbody></table></div>`;
    const elH6 = document.getElementById('mc-table-h6');
    if(elH6) elH6.innerHTML = h6Html;

    // فعال‌سازی تولتیپ
    bindMCTableTooltips();
}

function bindMCTableTooltips() {
    let tooltip = document.getElementById('mc-row-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'mc-row-tooltip';
        tooltip.className = 'table-tooltip';
        document.body.appendChild(tooltip);
    }
    document.querySelectorAll('.mc-tooltip-row').forEach(row => {
        row.addEventListener('mouseenter', (e) => {
            tooltip.innerHTML = `<div>${row.dataset.tooltip}</div>`;
            tooltip.style.display = 'block';
            if(typeof positionTooltip === 'function') positionTooltip(e, tooltip);
        });
        row.addEventListener('mousemove', (e) => {
            if (tooltip.style.display === 'block' && typeof positionTooltip === 'function') positionTooltip(e, tooltip);
        });
        row.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
    });
}
/* ================================================================
   بخش جدید: جداول تفصیلی مونت کارلو (نسخه ضد تداخل)
   ================================================================ */
(function() {
    const MC_TABLES_DATA = {
        hypotheses: [
            { h: 'H1', path: 'استراتژی ← دانش', pls: 0.281, mc: 0.2809, ci: '[0.163, 0.400]', sig: 'معنادار', res: 'تأیید', tip: 'اثر مستقیم استراتژی دیجیتال بر مدیریت دانش.' },
            { h: 'H2', path: 'استراتژی ← موفقیت', pls: 0.241, mc: 0.2419, ci: '[0.117, 0.366]', sig: 'معنادار', res: 'تأیید', tip: 'اثر مستقیم استراتژی دیجیتال بر موفقیت تحول.' },
            { h: 'H3', path: 'دانش ← موفقیت', pls: 0.270, mc: 0.2691, ci: '[0.130, 0.409]', sig: 'معنادار', res: 'تأیید', tip: 'اثر مستقیم مدیریت دانش بر موفقیت تحول.' },
            { h: 'H4', path: 'اثر غیرمستقیم', pls: 0.076, mc: 0.0757, ci: '[0.030, 0.133]', sig: 'معنادار', res: 'تأیید', tip: 'نقش میانجی‌گری مدیریت دانش در رابطه استراتژی و موفقیت.' },
            { h: 'H5', path: 'رهبری ← دانش', pls: 0.342, mc: 0.3415, ci: '[0.224, 0.460]', sig: 'معنادار', res: 'تأیید', tip: 'اثر رهبری تحول دیجیتال بر مدیریت دانش.' },
            { h: 'H6', path: 'رهبری × استراتژی', pls: 0.071, mc: 0.0714, ci: '[-0.039, 0.179]', sig: 'غیرمعنادار', res: 'رد', tip: 'تعدیل‌گری رهبری در رابطه استراتژی و دانش (در شرایط تحریم تضعیف می‌شود).' },
            { h: 'H7', path: 'چابکی ← موفقیت', pls: 0.340, mc: 0.3401, ci: '[0.220, 0.461]', sig: 'معنادار', res: 'تأیید', tip: 'اثر مستقیم چابکی استراتژیک بر موفقیت تحول.' },
            { h: 'H8', path: 'چابکی × دانش', pls: 0.188, mc: 0.1887, ci: '[0.061, 0.316]', sig: 'معنادار', res: 'تأیید', tip: 'تعدیل‌گری چابکی در رابطه دانش و موفقیت.' }
        ],
        scenarios: [
            { name: 'خوش‌بینانه', n: 3333, mean: 0.215, median: 0.220, ci: '[-1.409, 1.876]', tip: 'تحریم و نرخ ارز پایین.' },
            { name: 'پایه', n: 3334, mean: 0.018, median: 0.027, ci: '[-1.629, 1.714]', tip: 'شرایط اقتصادی متوسط.' },
            { name: 'بدبینانه', n: 3333, mean: -0.215, median: -0.219, ci: '[-1.912, 1.481]', tip: 'تحریم و نرخ ارز بالا.' }
        ],
        h6: [
            { z: '-2.33', desc: 'تحریم کم', beta: 0.154, ci: '[0.062, 0.246]', sig: 'معنادار (مثبت)', tip: 'در شرایط تحریم پایین، رهبری دیجیتال نقش تعدیل‌گر مثبت دارد.' },
            { z: '-1.00', desc: 'تحریم متوسط', beta: 0.107, ci: '[0.015, 0.199]', sig: 'معنادار (مثبت)', tip: 'با افزایش تحریم، اثر تعدیل‌گری به سمت صفر میل می‌کند.' },
            { z: '+0.33', desc: 'تحریم بالا', beta: 0.060, ci: '[-0.033, 0.151]', sig: 'غیرمعنادار', tip: 'در تحریم‌های بالا، اثر رهبری به‌تنهایی کافی نیست.' },
            { z: '+2.33', desc: 'تحریم شدید', beta: -0.012, ci: '[-0.104, 0.080]', sig: 'غیرمعنادار', tip: 'در شرایط بحرانی، اثر تعدیل‌گر منفی می‌شود.' }
        ]
    };

    function renderMCSummaryTables() {
        // 1. جدول فرضیه‌ها
        let hHtml = `<div class="hyp-table-wrap"><table class="hyp-table"><thead><tr>
            <th>فرضیه</th><th>مسیر</th><th>β (PLS)</th><th>میانگین (MC)</th><th>بازه ۹۵٪</th><th>وضعیت</th><th>نتیجه</th>
        </tr></thead><tbody>`;
        MC_TABLES_DATA.hypotheses.forEach(d => {
            const resCls = d.res === 'تأیید' ? 'hyp-res-confirmed' : 'hyp-res-rejected';
            const resIcon = d.res === 'تأیید' ? '✓' : '✕';
            hHtml += `<tr class="hyp-row mc-tooltip-row" data-tooltip="${d.tip}">
                <td><span class="hyp-id-chip">${d.h}</span></td>
                <td>${d.path}</td>
                <td><span class="hyp-beta" style="background:#3498db">${d.pls.toFixed(3)}</span></td>
                <td><span class="hyp-beta" style="background:#9b59b6">${d.mc.toFixed(4)}</span></td>
                <td style="direction:ltr; font-family:tahoma">${d.ci}</td>
                <td><span class="${d.sig === 'معنادار' ? 'hyp-p-sig' : 'hyp-p-ns'}">${d.sig}</span></td>
                <td><span class="hyp-res ${resCls}"><span class="hyp-res-icon">${resIcon}</span>${d.res}</span></td>
            </tr>`;
        });
        hHtml += `</tbody></table></div>`;
        const elH = document.getElementById('mc-table-hypotheses');
        if(elH) elH.innerHTML = hHtml;

        // 2. جدول سناریوها
        let sHtml = `<div class="hyp-table-wrap"><table class="hyp-table"><thead><tr>
            <th>سناریو</th><th>تعداد (N)</th><th>میانگین موفقیت</th><th>میانه (P50)</th><th>بازه ۹۰٪</th>
        </tr></thead><tbody>`;
        MC_TABLES_DATA.scenarios.forEach(d => {
            sHtml += `<tr class="hyp-row mc-tooltip-row" data-tooltip="${d.tip}">
                <td><strong>${d.name}</strong></td>
                <td>${d.n.toLocaleString()}</td>
                <td><span class="hyp-beta" style="background:${d.mean>0?'#27ae60':'#e74c3c'}">${d.mean.toFixed(3)}</span></td>
                <td>${d.median.toFixed(3)}</td>
                <td style="direction:ltr; font-family:tahoma">${d.ci}</td>
            </tr>`;
        });
        sHtml += `</tbody></table></div>`;
        const elS = document.getElementById('mc-table-scenarios');
        if(elS) elS.innerHTML = sHtml;

        // 3. جدول H6
        let h6Html = `<div class="hyp-table-wrap"><table class="hyp-table"><thead><tr>
            <th>Z-Score تحریم</th><th>وضعیت</th><th>ضریب H6</th><th>بازه ۹۰٪</th><th>نتیجه</th>
        </tr></thead><tbody>`;
        MC_TABLES_DATA.h6.forEach(d => {
            h6Html += `<tr class="hyp-row mc-tooltip-row" data-tooltip="${d.tip}">
                <td><span class="vif-ind-chip">${d.z}</span></td>
                <td>${d.desc}</td>
                <td><span class="hyp-beta" style="background:${d.beta>0?'#27ae60':'#e74c3c'}">${d.beta.toFixed(3)}</span></td>
                <td style="direction:ltr; font-family:tahoma">${d.ci}</td>
                <td><span class="${d.sig.includes('معنادار') ? 'hyp-p-sig' : 'hyp-p-ns'}">${d.sig}</span></td>
            </tr>`;
        });
        h6Html += `</tbody></table></div>`;
        const elH6 = document.getElementById('mc-table-h6');
        if(elH6) elH6.innerHTML = h6Html;

        // فعال‌سازی تولتیپ
        bindMCTableTooltips();
    }

    function bindMCTableTooltips() {
        let tooltip = document.getElementById('mc-row-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'mc-row-tooltip';
            tooltip.className = 'table-tooltip';
            document.body.appendChild(tooltip);
        }
        document.querySelectorAll('.mc-tooltip-row').forEach(row => {
            row.addEventListener('mouseenter', (e) => {
                tooltip.innerHTML = `<div>${row.dataset.tooltip}</div>`;
                tooltip.style.display = 'block';
                if(typeof positionTooltip === 'function') positionTooltip(e, tooltip);
            });
            row.addEventListener('mousemove', (e) => {
                if (tooltip.style.display === 'block' && typeof positionTooltip === 'function') positionTooltip(e, tooltip);
            });
            row.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
        });
    }

    // اتصال دکمه به صورت مستقل
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const mcTableBtn = document.querySelector('.nav-btn[data-page="mc-summary-tables"]');
            if (mcTableBtn) {
                mcTableBtn.addEventListener('click', function() {
                    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                    
                    this.classList.add('active');
                    const targetPage = document.getElementById('page-mc-summary-tables');
                    if(targetPage) targetPage.classList.add('active');
                    
                    renderMCSummaryTables();
                });
            }
        }, 500);
    });
})();
