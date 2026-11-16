/* ================================================================
   electric_bicycle_loader.js — نسخه نهایی (کامل و تمیز)
   سازگار با SmartPLS report + Retry + ML Normalization
   ================================================================ */

/* ============ ۰. نگاشت نام سازه‌ها ============ */
const CONSTRUCT_MAP = {
  'مدیریت دانش': 'DKM',
  'مدیریت دانش دیجیتال': 'DKM',
  'Digital Knowledge Management': 'DKM',
  'رهبری تحول دیجیتال': 'DTL',
  'Digital Transformation Leadership': 'DTL',
  'موفقیت تحول دیجیتال': 'DTS',
  'Digital Transformation Success': 'DTS',
  'چابکی استراتژی': 'SA',
  'چابکی استراتژیک': 'SA',
  'Strategic Agility': 'SA',
  'استراتژی دیجیتال': 'DS',
  'Digital Strategy': 'DS'
};

function normalizeName(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (CONSTRUCT_MAP[s]) return CONSTRUCT_MAP[s];
  const low = s.toLowerCase();
  // ترتیب مهم: چابکی قبل از استراتژی
  if (low.includes('dkm') || low.includes('دانش')) return 'DKM';
  if (low.includes('dtl') || low.includes('رهبری')) return 'DTL';
  if (low.includes('dts') || low.includes('موفقیت')) return 'DTS';
  if (low.includes('sa') || low.includes('چابکی')) return 'SA';
  if (low.includes('ds') || low.includes('استراتژی')) return 'DS';
  return s;
}

function safeFloat(x) {
  if (x == null || x === '') return NaN;
  const v = parseFloat(String(x).trim().replace(/,/g, '.'));
  return isNaN(v) ? NaN : v;
}

function detectConstructFromIndicator(ind) {
  const m = String(ind || '').match(/^Q(\d+)$/i);
  if (!m) return '';
  const n = parseInt(m[1]);
  if (n >= 1 && n <= 9)   return 'DKM';
  if (n >= 10 && n <= 15) return 'DTL';
  if (n >= 16 && n <= 20) return 'DTS';
  if (n >= 21 && n <= 26) return 'SA';
  if (n >= 27 && n <= 30) return 'DS';
  return '';
}

/* ============ ۱. کش + Retry ============ */
const _wbCache = new Map();

async function readExcel(path, attempt = 1) {
  if (_wbCache.has(path)) {
    try { return await _wbCache.get(path); }
    catch (e) { _wbCache.delete(path); }
  }
  const promise = (async () => {
    try {
      const resp = await fetch(path, { cache: 'no-store' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const buf = await resp.arrayBuffer();
      const u8 = new Uint8Array(buf);
      if (u8.length < 4 || u8[0] !== 0x50 || u8[1] !== 0x4B) {
        throw new Error('Not a valid XLSX');
      }
      return XLSX.read(buf, { type: 'array' });
    } catch (err) {
      if (attempt < 3 && (
        err.message.includes('Failed to fetch') ||
        err.message.includes('REFUSED') ||
        err.message.includes('HTTP')
      )) {
        console.warn(`[Loader] Retry ${attempt}/3 for ${path} in ${attempt * 500}ms...`);
        _wbCache.delete(path);
        await new Promise(r => setTimeout(r, attempt * 500));
        return readExcel(path, attempt + 1);
      }
      throw err;
    }
  })();
  _wbCache.set(path, promise);
  return promise;
}

async function readComplete(file) {
  const wb = await readExcel(file);
  let sn = 'complete';
  if (!wb.Sheets[sn]) {
    const found = wb.SheetNames.find(n => n.toLowerCase() === 'complete');
    sn = found || wb.SheetNames[wb.SheetNames.length - 1];
  }
  return XLSX.utils.sheet_to_json(wb.Sheets[sn], {
    header: 1, defval: null, blankrows: false
  });
}

/* ============ ۲. استخراج جدول ============ */
const TABLE_TYPES = [
  'matrix', 'overview', 'list',
  'mean, stdev, t values, p values',
  'confidence intervals',
  'confidence intervals bias corrected'
];

function extractTable(rows, sectionName) {
  const target = sectionName.toLowerCase().trim();
  let sectionRow = -1;
  for (let i = 0; i < rows.length; i++) {
    const cell = String((rows[i] && rows[i][0]) || '').trim().toLowerCase();
    if (cell === target) { sectionRow = i; break; }
  }
  if (sectionRow < 0) return null;

  let headerRow = sectionRow + 1;
  const nextCell = String((rows[headerRow] && rows[headerRow][0]) || '').trim().toLowerCase();
  if (TABLE_TYPES.includes(nextCell)) headerRow = sectionRow + 2;

  while (headerRow < rows.length) {
    const r = rows[headerRow];
    const ne = r ? r.filter(v => v != null && String(v).trim() !== '').length : 0;
    if (ne > 0) break;
    headerRow++;
  }
  if (headerRow >= rows.length) return null;

  const headers = rows[headerRow] || [];
  const data = [];
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) break;
    const ne = row.filter(v => v != null && String(v).trim() !== '');
    if (ne.length < 2) break;
    data.push(row);
  }
  return { headers, data, sectionRow, headerRow };
}

function findCol(headers, ...keywords) {
  const h = headers.map(x => String(x || '').toLowerCase());
  for (const kw of keywords) {
    const kwl = kw.toLowerCase();
    for (let j = 0; j < h.length; j++) {
      if (h[j].includes(kwl)) return j;
    }
  }
  return -1;
}

function parseMatrix(table) {
  const colLabels = table.headers.slice(1).map(h => String(h || '').trim());
  const rows = table.data.map(r => ({
    label: String(r[0] || '').trim(),
    values: r.slice(1)
  }));
  return { colLabels, rows };
}

/* ================================================================
   ۳. Bootstrapping → Paths
   ================================================================ */
async function loadPaths() {
  try {
    const rows = await readComplete('electric_bicycle_Bootstrapping.xlsx');
    const main = extractTable(rows, 'Path coefficients');
    if (!main) throw new Error('Path coefficients not found');

    const iOrig = findCol(main.headers, 'original sample');
    const iMean = findCol(main.headers, 'sample mean');
    const iStd  = findCol(main.headers, 'standard deviation');
    const iT    = findCol(main.headers, 't statistics');
    const iP    = findCol(main.headers, 'p values');

    const paths = [];
    for (const row of main.data) {
      const raw = String(row[0] || '').trim();
      if (!raw.includes('->') && !raw.includes('→')) continue;
      const [a, b] = raw.includes('->') ? raw.split('->') : raw.split('→');
      paths.push({
        Path: normalizeName(a.trim()) + '→' + normalizeName(b.trim()),
        Original: iOrig >= 0 ? safeFloat(row[iOrig]) : NaN,
        Mean:     iMean >= 0 ? safeFloat(row[iMean]) : NaN,
        STDEV:    iStd  >= 0 ? safeFloat(row[iStd])  : NaN,
        T:        iT    >= 0 ? safeFloat(row[iT])    : NaN,
        P:        iP    >= 0 ? safeFloat(row[iP])    : NaN,
        CI_low: NaN, CI_high: NaN
      });
    }
    if (paths.length === 0) throw new Error('No paths');

    const ci = extractTable(rows, 'Confidence intervals');
    if (ci) {
      const cLo = findCol(ci.headers, '2.5%');
      const cHi = findCol(ci.headers, '97.5%');
      for (const row of ci.data) {
        const raw = String(row[0] || '').trim();
        if (!raw.includes('->') && !raw.includes('→')) continue;
        const [a, b] = raw.includes('->') ? raw.split('->') : raw.split('→');
        const pStr = normalizeName(a.trim()) + '→' + normalizeName(b.trim());
        const found = paths.find(p => p.Path === pStr);
        if (found) {
          if (cLo >= 0) found.CI_low = safeFloat(row[cLo]);
          if (cHi >= 0) found.CI_high = safeFloat(row[cHi]);
        }
      }
    }

    paths.forEach(p => {
      const fb = FALLBACK_PATHS.find(x => x.Path === p.Path);
      if (fb) {
        if (isNaN(p.Original)) p.Original = fb.Original;
        if (isNaN(p.Mean))     p.Mean     = fb.Mean;
        if (isNaN(p.STDEV))    p.STDEV    = fb.STDEV;
        if (isNaN(p.T))        p.T        = fb.T;
        if (isNaN(p.P))        p.P        = fb.P;
        if (isNaN(p.CI_low))   p.CI_low   = fb.CI_low;
        if (isNaN(p.CI_high))  p.CI_high  = fb.CI_high;
      }
    });

    console.log('[Loader] ✅ Paths:', paths.length);
    return { data: paths, source: 'excel' };
  } catch (e) {
    console.warn('[Loader] Paths fallback:', e.message);
    return { data: FALLBACK_PATHS.map(p => ({ ...p })), source: 'fallback' };
  }
}

/* ================================================================
   ۴. R²
   ================================================================ */
async function loadR2() {
  try {
    const rows = await readComplete('electric_bicycle_PLS_Algorithm.xlsx');
    const table = extractTable(rows, 'R-square');
    if (!table) throw new Error('R-square not found');

    const iR2  = findCol(table.headers, 'r-square', 'r square', 'r²');
    const iAdj = findCol(table.headers, 'adjusted');

    const out = [];
    for (const row of table.data) {
      const c = normalizeName(row[0]);
      if (!['DS','DKM','DTL','DTS','SA'].includes(c)) continue;
      out.push({
        Construct: c,
        R2:     iR2  >= 0 ? safeFloat(row[iR2])  : NaN,
        R2_Adj: iAdj >= 0 ? safeFloat(row[iAdj]) : NaN
      });
    }
    if (out.length < 1) throw new Error('No constructs');
    console.log('[Loader] ✅ R²:', out.length);
    return { data: out, source: 'excel' };
  } catch (e) {
    console.warn('[Loader] R² fallback:', e.message);
    return { data: FALLBACK_R2, source: 'fallback' };
  }
}

/* ================================================================
   ۵. f²
   ================================================================ */
async function loadF2() {
  try {
    const rows = await readComplete('electric_bicycle_PLS_Algorithm.xlsx');
    const table = extractTable(rows, 'f-square');
    if (!table) throw new Error('f-square not found');

    const matrix = parseMatrix(table);
    const out = [];
    for (const row of matrix.rows) {
      const src = normalizeName(row.label);
      for (let j = 0; j < matrix.colLabels.length; j++) {
        const dst = normalizeName(matrix.colLabels[j]);
        const v = safeFloat(row.values[j]);
        if (!isNaN(v) && src && dst && src !== dst) {
          out.push({ Path: src + '→' + dst, f2: v });
        }
      }
    }
    if (out.length < 1) throw new Error('No f2');
    console.log('[Loader] ✅ f²:', out.length);
    return { data: out, source: 'excel' };
  } catch (e) {
    console.warn('[Loader] f² fallback:', e.message);
    return { data: FALLBACK_F2, source: 'fallback' };
  }
}

/* ================================================================
   ۶. Outer Loadings
   ================================================================ */
async function loadLoadings() {
  try {
    const rows = await readComplete('electric_bicycle_PLS_Algorithm.xlsx');
    const table = extractTable(rows, 'Outer loadings');
    if (!table) throw new Error('Outer loadings not found');

    const matrix = parseMatrix(table);
    const result = {};
    for (const row of matrix.rows) {
      if (!/^Q\d+$/i.test(row.label)) continue;
      for (let j = 0; j < matrix.colLabels.length; j++) {
        const v = safeFloat(row.values[j]);
        if (!isNaN(v)) {
          const c = normalizeName(matrix.colLabels[j]);
          if (c) {
            result[c] = result[c] || {};
            result[c][row.label] = v;
            break;
          }
        }
      }
    }
    if (Object.keys(result).length < 1) throw new Error('No loadings');
    console.log('[Loader] ✅ Loadings:', Object.keys(result).length, 'constructs');
    return { data: result, source: 'excel' };
  } catch (e) {
    console.warn('[Loader] Loadings fallback:', e.message);
    return { data: FALLBACK_LOADINGS, source: 'fallback' };
  }
}

/* ================================================================
   ۷. Quality
   ================================================================ */
async function loadQuality() {
  try {
    const rows = await readComplete('electric_bicycle_PLS_Algorithm.xlsx');
    const table = extractTable(rows, 'Construct reliability and validity');
    if (!table) throw new Error('Reliability not found');

    const iCron = findCol(table.headers, 'cronbach');
    const iRhoA = findCol(table.headers, 'rho_a');
    const iRhoC = findCol(table.headers, 'composite reliability', 'rho_c');
    const iAve  = findCol(table.headers, 'average variance extracted', 'ave');

    const result = {};
    for (const row of table.data) {
      const c = normalizeName(row[0]);
      if (!['DS','DKM','DTL','DTS','SA'].includes(c)) continue;
      result[c] = {
        Cronbach: iCron >= 0 ? safeFloat(row[iCron]) : NaN,
        rho_a:    iRhoA >= 0 ? safeFloat(row[iRhoA]) : NaN,
        rho_c:    iRhoC >= 0 ? safeFloat(row[iRhoC]) : NaN,
        AVE:      iAve  >= 0 ? safeFloat(row[iAve])  : NaN
      };
    }
    if (Object.keys(result).length < 1) throw new Error('No constructs');
    console.log('[Loader] ✅ Quality:', Object.keys(result).length, 'constructs');
    return { data: result, source: 'excel' };
  } catch (e) {
    console.warn('[Loader] Quality fallback:', e.message);
    return { data: FALLBACK_QUALITY, source: 'fallback' };
  }
}

/* ================================================================
   ۸. VIF Table
   ================================================================ */
async function loadVIFTable() {
  try {
    const rows = await readComplete('electric_bicycle_PLS_Algorithm.xlsx');
    let table = extractTable(rows, 'Outer model - List');
    if (!table) table = extractTable(rows, 'Collinearity statistics (VIF)');
    if (!table) throw new Error('VIF not found');

    const iVif = findCol(table.headers, 'vif');
    if (iVif < 0) throw new Error('VIF column not found');

    const out = [];
    for (const row of table.data) {
      const ind = String(row[0] || '').trim();
      if (!/^Q\d+$/i.test(ind)) continue;
      const v = safeFloat(row[iVif]);
      if (isNaN(v)) continue;
      out.push({ id: ind, vif: v, construct: detectConstructFromIndicator(ind) });
    }
    if (out.length < 5) throw new Error('Not enough rows: ' + out.length);
    console.log('[Loader] ✅ VIF:', out.length);
    return { data: out, source: 'excel' };
  } catch (e) {
    console.warn('[Loader] VIF fallback:', e.message);
    return { data: FALLBACK_VIF_TABLE.map(x => ({ ...x })), source: 'fallback' };
  }
}

/* ================================================================
   ۹. Reliability Tables
   ================================================================ */
function parseCrossLoadings(t) {
  const byInd = {};
  for (const row of t.data) {
    const ind = String(row[0] || '').trim();
    if (!/^Q\d+$/i.test(ind)) continue;
    byInd[ind] = byInd[ind] || {};
    for (let j = 1; j < t.headers.length; j++) {
      const c = normalizeName(t.headers[j]);
      const v = safeFloat(row[j]);
      if (c && !isNaN(v)) byInd[ind][c] = v;
    }
  }

  const groups = { DS: {own:[],cross:[]}, DKM: {own:[],cross:[]}, DTL: {own:[],cross:[]}, DTS: {own:[],cross:[]}, SA: {own:[],cross:[]} };
  for (const [ind, loadings] of Object.entries(byInd)) {
    const parent = detectConstructFromIndicator(ind);
    if (!parent) continue;
    for (const [c, v] of Object.entries(loadings)) {
      if (c === parent) groups[parent].own.push(v);
      else if (groups[parent]) groups[parent].cross.push(v);
    }
  }

  const meta = {
    DS: {label:'استراتژی دیجیتال',items:'Q27–Q30'},
    DKM:{label:'مدیریت دانش دیجیتال',items:'Q1–Q9'},
    DTL:{label:'رهبری تحول دیجیتال',items:'Q10–Q15'},
    DTS:{label:'موفقیت تحول دیجیتال',items:'Q16–Q20'},
    SA: {label:'چابکی استراتژیک',items:'Q21–Q26'}
  };
  const out = [];
  for (const k of ['DS','DKM','DTL','DTS','SA']) {
    const g = groups[k];
    if (g.own.length < 2) continue;
    const oMin = Math.min(...g.own), oMax = Math.max(...g.own);
    const cMin = g.cross.length ? Math.min(...g.cross) : 0;
    const cMax = g.cross.length ? Math.max(...g.cross) : 0;
    out.push({
      construct: k, label: meta[k].label, items: meta[k].items,
      own_min: +oMin.toFixed(3), own_max: +oMax.toFixed(3),
      cross_min: +cMin.toFixed(3), cross_max: +cMax.toFixed(3),
      result: oMin > cMax ? 'confirmed' : 'rejected'
    });
  }
  return out.length >= 4 ? out : null;
}

function parseFornellLarcker(t) {
  const constructs = t.headers.slice(1).map(h => normalizeName(h)).filter(c => c && c.length <= 5);
  if (constructs.length < 4) return null;

  const labelMap = {
    DS: 'استراتژی دیجیتال', DKM: 'مدیریت دانش',
    DTL: 'رهبری تحول', DTS: 'موفقیت تحول', SA: 'چابکی استراتژیک'
  };
  const matrix = [];
  for (const row of t.data) {
    const cName = normalizeName(row[0]);
    if (!constructs.includes(cName)) continue;
    const r = [];
    for (let j = 1; j <= constructs.length; j++) {
      const v = safeFloat(row[j]);
      r.push(isNaN(v) ? null : +v.toFixed(3));
    }
    matrix.push(r);
    if (matrix.length === constructs.length) break;
  }
  return matrix.length >= 4 ? { constructs, labels: constructs.map(c=>labelMap[c]||c), matrix } : null;
}

async function loadReliabilityTables() {
  try {
    const rows = await readComplete('electric_bicycle_PLS_Algorithm.xlsx');
    const result = { indicatorReliability: null, convergent: null, crossLoadings: null, fornellLarcker: null };
    let anyFound = false;

    try {
      const t = extractTable(rows, 'Outer loadings');
      if (t) {
        const m = parseMatrix(t);
        const groups = { DS: [], DKM: [], DTL: [], DTS: [], SA: [] };
        for (const row of m.rows) {
          if (!/^Q\d+$/i.test(row.label)) continue;
          for (let j = 0; j < m.colLabels.length; j++) {
            const v = safeFloat(row.values[j]);
            if (!isNaN(v)) {
              const c = normalizeName(m.colLabels[j]);
              if (groups[c]) groups[c].push(v);
              break;
            }
          }
        }
        const meta = {
          DS:  { label: 'استراتژی دیجیتال',    items: 'Q27–Q30' },
          DKM: { label: 'مدیریت دانش دیجیتال', items: 'Q1–Q9' },
          DTL: { label: 'رهبری تحول دیجیتال',  items: 'Q10–Q15' },
          DTS: { label: 'موفقیت تحول دیجیتال', items: 'Q16–Q20' },
          SA:  { label: 'چابکی استراتژیک',     items: 'Q21–Q26' }
        };
        const out = [];
        for (const k of ['DS','DKM','DTL','DTS','SA']) {
          if (groups[k].length < 2) continue;
          const mn = Math.min(...groups[k]), mx = Math.max(...groups[k]);
          out.push({
            construct: k, label: meta[k].label, items: meta[k].items,
            loading_min: +mn.toFixed(3), loading_max: +mx.toFixed(3),
            rel_min: +(mn*mn).toFixed(3), rel_max: +(mx*mx).toFixed(3),
            comm_min: +(mn*mn).toFixed(3), comm_max: +(mx*mx).toFixed(3)
          });
        }
        if (out.length >= 2) { result.indicatorReliability = out; anyFound = true; }
      }
    } catch (e) {}

    try {
      const t = extractTable(rows, 'Construct reliability and validity');
      if (t) {
        const iCron = findCol(t.headers, 'cronbach');
        const iRhoA = findCol(t.headers, 'rho_a');
        const iRhoC = findCol(t.headers, 'composite reliability', 'rho_c');
        const iAve  = findCol(t.headers, 'average variance extracted', 'ave');
        const labelMap = {
          DS: 'استراتژی دیجیتال', DKM: 'مدیریت دانش دیجیتال',
          DTL: 'رهبری تحول دیجیتال', DTS: 'موفقیت تحول دیجیتال', SA: 'چابکی استراتژیک'
        };
        const out = [];
        for (const row of t.data) {
          const c = normalizeName(row[0]);
          if (!['DS','DKM','DTL','DTS','SA'].includes(c)) continue;
          out.push({
            construct: c, label: labelMap[c],
            cronbach: iCron >= 0 ? safeFloat(row[iCron]) : NaN,
            rho_a: iRhoA >= 0 ? safeFloat(row[iRhoA]) : NaN,
            rho_c: iRhoC >= 0 ? safeFloat(row[iRhoC]) : NaN,
            ave: iAve >= 0 ? safeFloat(row[iAve]) : NaN
          });
        }
        if (out.length >= 2) { result.convergent = out; anyFound = true; }
      }
    } catch (e) {}

    try {
      const t = extractTable(rows, 'Cross loadings');
      if (t) {
        result.crossLoadings = parseCrossLoadings(t);
        if (result.crossLoadings) anyFound = true;
      }
    } catch (e) {}

    try {
      const t = extractTable(rows, 'Fornell-Larcker criterion');
      if (t) {
        result.fornellLarcker = parseFornellLarcker(t);
        if (result.fornellLarcker) anyFound = true;
      }
    } catch (e) {}

    if (!anyFound) throw new Error('No reliability tables');
    if (!result.indicatorReliability) result.indicatorReliability = FALLBACK_RELIABILITY.indicatorReliability;
    if (!result.convergent)           result.convergent           = FALLBACK_RELIABILITY.convergent;
    if (!result.crossLoadings)        result.crossLoadings        = FALLBACK_RELIABILITY.crossLoadings;
    if (!result.fornellLarcker)       result.fornellLarcker       = FALLBACK_RELIABILITY.fornellLarcker;
    console.log('[Loader] ✅ Reliability loaded');
    return { data: result, source: 'excel' };
  } catch (e) {
    console.warn('[Loader] Reliability fallback:', e.message);
    return {
      data: {
        indicatorReliability: FALLBACK_RELIABILITY.indicatorReliability,
        convergent: FALLBACK_RELIABILITY.convergent,
        crossLoadings: FALLBACK_RELIABILITY.crossLoadings,
        fornellLarcker: FALLBACK_RELIABILITY.fornellLarcker
      }, source: 'fallback'
    };
  }
}

/* ================================================================
   ۱۰. PLS Predict
   ================================================================ */
async function loadPLSPredict() {
  try {
    const rows = await readComplete('electric_bicycle_PLS_Predict.xlsx');
    const table = extractTable(rows, 'PLSpredict MV summary');
    if (!table) throw new Error('PLSpredict MV summary not found');

    const h = table.headers.map(x => String(x || '').toLowerCase());
    let iQ2 = -1, iPLS = -1, iLM = -1, iIA = -1;
    for (let j = 0; j < h.length; j++) {
      if (h[j].includes('q²predict') || h[j].includes('q2predict')) iQ2 = j;
      if (h[j].includes('pls') && h[j].includes('rmse')) iPLS = j;
      if ((h[j].includes('lm') || h[j].includes('linear')) && h[j].includes('rmse')) iLM = j;
      if (h[j].includes('ia') && h[j].includes('rmse')) iIA = j;
    }

    const result = {};
    for (const row of table.data) {
      const ind = String(row[0] || '').trim();
      if (!/^Q\d+$/i.test(ind)) continue;
      result[ind] = {
        q2: iQ2 >= 0 ? safeFloat(row[iQ2]) : 0,
        rmse_pls: iPLS >= 0 ? safeFloat(row[iPLS]) : 0,
        rmse_lm: iLM >= 0 ? safeFloat(row[iLM]) : 0,
        rmse_ia: iIA >= 0 ? safeFloat(row[iIA]) : 0
      };
    }

    const out = DATA.indicators.map(q => {
      const r = result[q] || {};
      return {
        q,
        q2: isNaN(r.q2) ? 0 : r.q2,
        rmse_pls: isNaN(r.rmse_pls) ? 0 : r.rmse_pls,
        rmse_lm: isNaN(r.rmse_lm) ? 0 : r.rmse_lm,
        rmse_ia: isNaN(r.rmse_ia) ? 0 : r.rmse_ia
      };
    });

    const realCount = out.filter(x => x.q2 > 0).length;
    if (realCount === 0) throw new Error('No real data');
    console.log('[Loader] ✅ PLS Predict:', realCount, 'items with real data (of 30)');
    return { data: out, source: 'excel' };
  } catch (e) {
    console.warn('[Loader] PLS Predict fallback:', e.message);
    const out = DATA.indicators.map((q, i) => ({
      q, q2: DATA.Q2[i], rmse_pls: DATA.PLS_RMSE[i],
      rmse_lm: DATA.LM_RMSE[i], rmse_ia: DATA.IA_RMSE[i]
    }));
    return { data: out, source: 'fallback' };
  }
}

/* ================================================================
   ۱۱. Monte Carlo
   ================================================================ */
async function loadMonteCarlo() {
  try {
    const wb = await readExcel('electric_bicycle_monte_carlo_results.xlsx');
    const result = {};
    const sheets = ['Scenarios','Effects','Parameter_Importance','Robustness','OAT','CI_Comparison','Simulations'];
    let anyFound = false;
    for (const sn of sheets) {
      if (wb.Sheets[sn]) {
        result[sn] = XLSX.utils.sheet_to_json(wb.Sheets[sn], { defval: null });
        anyFound = true;
      }
    }
    if (!anyFound) throw new Error('No sheets');
    console.log('[Loader] ✅ Monte Carlo:', Object.keys(result).length, 'sheets');
    return { data: result, source: 'excel' };
  } catch (e) {
    console.warn('[Loader] Monte Carlo fallback:', e.message);
    return { data: FALLBACK_MONTE_CARLO, source: 'fallback' };
  }
}

/* ================================================================
   ۱۲. ML + SHAP (با Normalization)
   ================================================================ */
async function loadML() {
  try {
    const wb = await readExcel('electric_bicycle_ml_results.xlsx');
    const result = {};
    const sheets = ['Model_Comparison', 'SHAP_Importance', 'Construct_Importance'];
    let anyFound = false;
    for (const sn of sheets) {
      if (wb.Sheets[sn]) {
        result[sn] = XLSX.utils.sheet_to_json(wb.Sheets[sn], { defval: null });
        anyFound = true;
      }
    }
    if (!anyFound) throw new Error('No sheets');

    if (result.Model_Comparison) {
      result.Model_Comparison = result.Model_Comparison.map(r => ({
        Model: r.Model || r[''] || 'Unknown',
        R2:     r.R2 != null     ? r.R2     : (r.R2_Mean != null     ? r.R2_Mean     : 0),
        R2_Std: r.R2_Std != null ? r.R2_Std : 0,
        RMSE:   r.RMSE != null   ? r.RMSE   : (r.RMSE_Mean != null   ? r.RMSE_Mean   : 0)
      }));
    }

    if (result.SHAP_Importance) {
      result.SHAP_Importance = result.SHAP_Importance.map(r => ({
        Feature: r.Feature || r[''] || '',
        Mean_Abs_SHAP: r.Mean_Abs_SHAP != null ? r.Mean_Abs_SHAP : 0,
        Construct: r.Construct || detectConstructFromIndicator(r.Feature || '')
      }));
    }

    if (result.Construct_Importance) {
      result.Construct_Importance = result.Construct_Importance.map(r => ({
        Construct: r.Construct || r[''] || '',
        Mean_Abs_SHAP: r.Mean_Abs_SHAP != null ? r.Mean_Abs_SHAP : 0
      }));
    }

    console.log('[Loader] ✅ ML:', Object.keys(result).length, 'sheets');
    return { data: result, source: 'excel' };
  } catch (e) {
    console.warn('[Loader] ML fallback:', e.message);
    return { data: FALLBACK_ML, source: 'fallback' };
  }
}

/* ================================================================
   ۱۳. Descriptive — آمار توصیفی
   ================================================================ */
async function loadDescriptive() {
  try {
    const wb = await readExcel('electric_bicycle_data_complete.xlsx');
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null, blankrows: false });
    const hdr = rows[0];
    const dataRows = rows.slice(1).filter(r => r && r.length > 0);

    const genderIdx   = hdr.indexOf('Gender');
    const ageIdx      = hdr.indexOf('age');
    const eduIdx      = hdr.indexOf('Education');
    const fieldIdx    = hdr.indexOf('Field');
    const activitiIdx = hdr.indexOf('Activiti');

    function countBy(idx) {
      const counts = {};
      dataRows.forEach(r => { const v = r[idx]; if (v != null) counts[v] = (counts[v] || 0) + 1; });
      return counts;
    }

    function statsBy(idx) {
      const vals = dataRows.map(r => Number(r[idx])).filter(v => !isNaN(v));
      const n = vals.length;
      if (n === 0) return { N: 0, Missing: 0, Mean: null, SD: null, Skew: null, Kurt: null, Range: 0 };
      const mean = vals.reduce((a, b) => a + b, 0) / n;
      const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
      const skew = sd > 0 ? vals.reduce((a, b) => a + ((b - mean) / sd) ** 3, 0) / n : null;
      const kurt = sd > 0 ? vals.reduce((a, b) => a + ((b - mean) / sd) ** 4, 0) / n - 3 : null;
      return {
        N: n, Missing: dataRows.length - n,
        Mean: +mean.toFixed(2), SD: +sd.toFixed(3),
        Skew: skew != null ? +skew.toFixed(3) : null,
        Kurt: kurt != null ? +kurt.toFixed(3) : null,
        Range: Math.max(...vals) - Math.min(...vals)
      };
    }

    const genderLabels    = { 1: 'زن', 2: 'مرد' };
    const ageLabels       = { 1: 'زیر ۳۰', 2: '۳۰-۳۹', 3: '۴۰-۴۹', 4: 'بالای ۵۰' };
    const eduLabels       = { 1: 'کاردانی', 2: 'کارشناسی', 3: 'ارشد+' };
    const fieldLabels     = { 1: 'تولید', 2: 'مونتاژ', 3: 'توزیع', 4: 'تولید+توزیع', 5: 'سایر' };
    const activitiLabels  = { 1: 'تمام‌وقت', 2: 'پاره‌وقت', 3: 'مدیریتی' };

    const gender   = countBy(genderIdx);
    const age      = countBy(ageIdx);
    const edu      = countBy(eduIdx);
    const field    = countBy(fieldIdx);
    const activiti = countBy(activitiIdx);

    console.log('[Loader] ✅ Descriptive loaded');
    return {
      data: {
        gender: {
          labels: Object.keys(gender).map(k => genderLabels[k] || k),
          values: Object.values(gender),
          stats: { N: dataRows.length, Missing: 0, Mean: null, SD: 0, Skew: null, Kurt: null, Range: 0 }
        },
        age: {
          labels: Object.keys(age).map(k => ageLabels[k] || k),
          values: Object.values(age),
          stats: statsBy(ageIdx)
        },
        education: {
          labels: Object.keys(edu).map(k => eduLabels[k] || k),
          values: Object.values(edu),
          stats: statsBy(eduIdx)
        },
        field: {
          labels: Object.keys(field).map(k => fieldLabels[k] || k),
          values: Object.values(field),
          stats: statsBy(fieldIdx)
        },
        activiti: {
          labels: Object.keys(activiti).map(k => activitiLabels[k] || k),
          values: Object.values(activiti),
          stats: statsBy(activitiIdx)
        }
      }, source: 'excel'
    };
  } catch (e) {
    console.warn('[Loader] Descriptive fallback:', e.message);
    return { data: null, source: 'fallback' };
  }
}

/* ================================================================
   ۱۴. تابع اصلی
   ================================================================ */
async function loadAllData() {
  // دانلود ترتیبی (یکی‌یکی) برای جلوگیری از قطع شدن ارتباط در شبکه‌های ناپایدار
  console.log('[Loader] Starting sequential data load...');
  
  const paths = await loadPaths();
  const r2 = await loadR2();
  const f2 = await loadF2();
  const loadings = await loadLoadings();
  const quality = await loadQuality();
  const vifTable = await loadVIFTable();
  const reliability = await loadReliabilityTables();
  const plsPredict = await loadPLSPredict();
  const monteCarlo = await loadMonteCarlo();
  const ml = await loadML();
  const descriptive = await loadDescriptive();
  const causalForest = await loadCausalForest();

  const sources = {
    paths: paths.source, r2: r2.source, f2: f2.source,
    loadings: loadings.source, quality: quality.source, vifTable: vifTable.source,
    reliability: reliability.source, plsPredict: plsPredict.source,
    monteCarlo: monteCarlo.source, ml: ml.source, descriptive: descriptive.source,
    causalForest: causalForest.source
  };

  const excelCount = Object.values(sources).filter(s => s === 'excel').length;
  console.log(`[Loader] ${excelCount}/${Object.keys(sources).length} منبع از فایل اکسل بارگذاری شد.`);
  console.log('[Loader] Sources:', sources);

  return {
    paths: paths.data, r2: r2.data, f2: f2.data,
    loadings: loadings.data, quality: quality.data, vifTable: vifTable.data,
    reliability: reliability.data, plsPredict: plsPredict.data,
    monteCarlo: monteCarlo.data, ml: ml.data, descriptive: descriptive.data,
    causalForest: causalForest.data,
    htmt: FALLBACK_HTMT, sources
  };
}
/* ================================================================
   ۱۹. Causal Forest — خواندن فایل اکسل
   ================================================================ */
async function loadCausalForest() {
  try {
    const wb = await readExcel('electric_bicycle_causal_forest.xlsx');
    const result = {};
    const sheets = ['Overview', 'CATE_Distribution', 'HG_Quartiles', 'Feature_Importance', 'Full_Data'];
    let anyFound = false;
    for (const sn of sheets) {
      if (wb.Sheets[sn]) {
        result[sn] = XLSX.utils.sheet_to_json(wb.Sheets[sn], { defval: null });
        anyFound = true;
      }
    }
    if (!anyFound) throw new Error('No sheets');

    // تبدیل Overview از [{Metric, Value}] به آبجکت
    if (result.Overview) {
      const ovObj = {};
      result.Overview.forEach(row => { if (row.Metric) ovObj[row.Metric] = row.Value; });
      result.OverviewObj = ovObj;
    }

    console.log('[Loader] ✅ Causal Forest:', Object.keys(result).length, 'sheets');
    return { data: result, source: 'excel' };
  } catch (e) {
    console.warn('[Loader] Causal Forest fallback:', e.message);
    return { data: FALLBACK_CAUSAL_FOREST, source: 'fallback' };
  }
}