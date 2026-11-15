import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os

# ============================================================
# ۰. تنظیمات مسیرها (اصلاح‌شده)
# ============================================================
BASE_DIR = r'D:\Article\مقاله دکتر رحمان سرشت'
FILE_PATH = os.path.join(BASE_DIR, 'expand', 'electric_bicycle_data_complete.xlsx')
OUTPUT_DIR = os.path.join(BASE_DIR, 'outputs')
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("=" * 60)
print(f"📁 فایل اکسل: {FILE_PATH}")
print(f"📁 خروجی‌ها: {OUTPUT_DIR}")
print("=" * 60)

# ============================================================
# ۱. خواندن داده‌ها
# ============================================================
df = pd.read_excel(FILE_PATH, engine='openpyxl')
print(f"✅ داده‌ها: {len(df)} پاسخ‌دهنده از {df['company_id'].nunique()} شرکت")

# ============================================================
# ۲. استخراج توزیع‌های تجربی گویه‌ها
# ============================================================
q_columns = [f'Q{i}' for i in range(1, 31)]
empirical_dist = df[q_columns].agg(['mean', 'std']).T
empirical_dist.columns = ['mean', 'std']

# ============================================================
# ۳. پارامترهای مدل (از مقاله)
# ============================================================
paths = {
    'H1_Strategy_to_Knowledge': {'beta': 0.241, 't': 3.790},
    'H2_Strategy_to_Success':   {'beta': 0.281, 't': 4.682},
    'H3_Knowledge_to_Success':  {'beta': 0.270, 't': 3.751},
    'H6_Leadership_Mod':        {'beta': 0.342, 't': 0.694},
    'H7_Agility_Mod':           {'beta': 0.340, 't': 0.605},
    'H8_Agility_Interaction':   {'beta': 0.188, 't': 2.852},
}
for k, v in paths.items():
    paths[k]['se'] = abs(v['beta'] / v['t']) if v['t'] != 0 else 0.1

# ============================================================
# ۴. متغیرهای زمینه‌ای
# ============================================================
context_params = {
    'exchange_rate': {'mean': 550000, 'std': 50000, 'dist': 'lognormal'},
    'sanction_intensity': {'mean': 0.65, 'std': 0.15, 'dist': 'beta'},
    'power_outage_hours': {'mean': 120, 'std': 40, 'dist': 'gamma'}
}

N_SIM = 10000
np.random.seed(42)

def generate_context(params, n=N_SIM):
    dist, mean, std = params['dist'], params['mean'], params['std']
    if dist == 'lognormal':
        mu = np.log(mean**2 / np.sqrt(mean**2 + std**2))
        sigma = np.sqrt(np.log(1 + (std/mean)**2))
        return np.random.lognormal(mu, sigma, n)
    elif dist == 'beta':
        a = mean * ((mean*(1-mean)/std**2) - 1)
        b = (1-mean) * ((mean*(1-mean)/std**2) - 1)
        return np.random.beta(a, b, n)
    elif dist == 'gamma':
        shape = (mean/std)**2
        scale = std**2 / mean
        return np.random.gamma(shape, scale, n)

context_df = pd.DataFrame({
    'exchange_rate': generate_context(context_params['exchange_rate']),
    'sanction_intensity': generate_context(context_params['sanction_intensity']),
    'power_outage_hours': generate_context(context_params['power_outage_hours'])
})

# ============================================================
# ۵. شبیه‌سازی ضرایب مسیر
# ============================================================
sim_paths = {name: np.random.normal(p['beta'], p['se'], N_SIM) 
             for name, p in paths.items()}

# ============================================================
# ۶. محاسبه موفقیت
# ============================================================
indirect = sim_paths['H1_Strategy_to_Knowledge'] * sim_paths['H3_Knowledge_to_Success']
total = sim_paths['H2_Strategy_to_Success'] + indirect
agility_effect = sim_paths['H7_Agility_Mod'] * (1 + 0.3 * context_df['sanction_intensity'].values)
success = total + agility_effect * 0.5 + np.random.normal(0, 0.3, N_SIM)

# ============================================================
# ۷. سه سناریو
# ============================================================
scenarios = {
    'Optimistic': (context_df['sanction_intensity'] < context_df['sanction_intensity'].quantile(0.33)) &
                  (context_df['exchange_rate'] < context_df['exchange_rate'].quantile(0.33)),
    'Baseline':   (context_df['sanction_intensity'] >= context_df['sanction_intensity'].quantile(0.33)) &
                  (context_df['sanction_intensity'] <= context_df['sanction_intensity'].quantile(0.67)),
    'Pessimistic':(context_df['sanction_intensity'] > context_df['sanction_intensity'].quantile(0.67)) &
                  (context_df['exchange_rate'] > context_df['exchange_rate'].quantile(0.67))
}

# ============================================================
# ۸. جدول خلاصه سناریوها
# ============================================================
summary = []
for name, mask in scenarios.items():
    summary.append({
        'Scenario': name, 'N': mask.sum(),
        'Mean_Success': success[mask].mean(), 'Std_Success': success[mask].std(),
        'P5': np.percentile(success[mask], 5), 'P95': np.percentile(success[mask], 95),
    })
summary_df = pd.DataFrame(summary)
print("\nخلاصه سناریوها:")
print(summary_df.round(3).to_string(index=False))

# ============================================================
# ۹. نمودار توزیع سه سناریو
# ============================================================
plt.figure(figsize=(10, 6))
colors = {'Optimistic': 'green', 'Baseline': 'blue', 'Pessimistic': 'red'}
for name, mask in scenarios.items():
    plt.hist(success[mask], bins=50, alpha=0.5, density=True,
             label=f"{name} (μ={success[mask].mean():.3f})", color=colors[name])
plt.xlabel('Digital Transformation Success'); plt.ylabel('Density')
plt.title('Monte Carlo: Success Distribution Under Three Scenarios')
plt.legend(); plt.grid(alpha=0.3); plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig1_scenarios_distribution.png'), dpi=300)
plt.close()

# ============================================================
# ۱۰. تحلیل H6
# ============================================================
leadership_effect = sim_paths.get('H6_Leadership_Mod', np.random.normal(0.342, 0.342/0.694, N_SIM))
leadership_adjusted = leadership_effect * (1 - 0.5 * context_df['sanction_intensity'].values)

plt.figure(figsize=(10, 6))
for name, mask in scenarios.items():
    plt.hist(leadership_adjusted[mask], bins=50, alpha=0.5, density=True,
             label=f"{name} (μ={leadership_adjusted[mask].mean():.3f})", color=colors[name])
plt.axvline(x=0, color='black', linestyle='--', label='Zero effect')
plt.xlabel('Adjusted Leadership Moderating Effect (H6)'); plt.ylabel('Density')
plt.title('Sensitivity Analysis of H6: Leadership Effect Under Uncertainty')
plt.legend(); plt.grid(alpha=0.3); plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig2_h6_sensitivity.png'), dpi=300)
plt.close()

# ============================================================
# ۱۱. اثر غیرمستقیم و کل
# ============================================================
plt.figure(figsize=(12, 5))
plt.subplot(1, 2, 1)
plt.hist(indirect, bins=50, alpha=0.7, color='purple', density=True)
plt.axvline(indirect.mean(), color='red', linestyle='--', label=f'Mean = {indirect.mean():.3f}')
plt.axvline(np.percentile(indirect, 5), color='orange', linestyle=':', label='P5')
plt.axvline(np.percentile(indirect, 95), color='orange', linestyle=':', label='P95')
plt.xlabel('Indirect Effect (H1 × H3)'); plt.ylabel('Density')
plt.title('Indirect Effect Distribution'); plt.legend(); plt.grid(alpha=0.3)

plt.subplot(1, 2, 2)
plt.hist(total, bins=50, alpha=0.7, color='teal', density=True)
plt.axvline(total.mean(), color='red', linestyle='--', label=f'Mean = {total.mean():.3f}')
plt.axvline(np.percentile(total, 5), color='orange', linestyle=':', label='P5')
plt.axvline(np.percentile(total, 95), color='orange', linestyle=':', label='P95')
plt.xlabel('Total Effect (H2 + H1×H3)'); plt.ylabel('Density')
plt.title('Total Effect Distribution'); plt.legend(); plt.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig3_effects.png'), dpi=300)
plt.close()

# جدول اثرها
effect_summary = pd.DataFrame({
    'Effect': ['Indirect (H1×H3)', 'Total (H2+H1×H3)'],
    'Mean': [indirect.mean(), total.mean()],
    'Std': [indirect.std(), total.std()],
    'P5': [np.percentile(indirect, 5), np.percentile(total, 5)],
    'P95': [np.percentile(indirect, 95), np.percentile(total, 95)],
    'Significant': ['Yes' if np.percentile(indirect,5)>0 or np.percentile(indirect,95)<0 else 'No',
                    'Yes' if np.percentile(total,5)>0 or np.percentile(total,95)<0 else 'No']
})

# ============================================================
# ۱۲. Tornado
# ============================================================
parameters = {
    'Strategy (H2)': sim_paths['H2_Strategy_to_Success'],
    'Knowledge (H3)': sim_paths['H3_Knowledge_to_Success'],
    'Agility (H7)': sim_paths['H7_Agility_Mod'],
    'Indirect (H1×H3)': indirect,
    'Sanction': context_df['sanction_intensity'].values,
    'Exchange Rate': context_df['exchange_rate'].values,
    'Power Outage': context_df['power_outage_hours'].values
}
correlations = {name: np.corrcoef(param, success)[0, 1] for name, param in parameters.items()}
corr_df = pd.DataFrame(list(correlations.items()), columns=['Parameter', 'Correlation'])
corr_df['Abs'] = corr_df['Correlation'].abs()
corr_df = corr_df.sort_values('Abs')

plt.figure(figsize=(10, 6))
plt.barh(corr_df['Parameter'], corr_df['Correlation'],
         color=['red' if c<0 else 'green' for c in corr_df['Correlation']], alpha=0.7)
plt.axvline(0, color='black', linewidth=0.8)
plt.xlabel('Correlation with Success'); plt.title('Tornado: Parameter Importance')
plt.grid(alpha=0.3, axis='x'); plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig4_tornado.png'), dpi=300)
plt.close()

# ============================================================
# ۱۳. تحلیل استواری
# ============================================================
def simulate_with_distribution(dist_type, n_sim=5000):
    if dist_type == 'normal':
        sim = {name: np.random.normal(p['beta'], p['se'], n_sim) for name, p in paths.items()}
    elif dist_type == 't':
        sim = {name: p['beta'] + p['se'] * np.random.standard_t(df=5, size=n_sim) for name, p in paths.items()}
    elif dist_type == 'empirical':
        sim = {name: np.random.choice(sim_paths[name], size=n_sim, replace=True) for name in paths.keys()}
    indirect_sim = sim['H1_Strategy_to_Knowledge'] * sim['H3_Knowledge_to_Success']
    total_sim = sim['H2_Strategy_to_Success'] + indirect_sim
    return {'indirect': indirect_sim, 'total': total_sim}

robustness_results = {d: simulate_with_distribution(d) for d in ['normal', 't', 'empirical']}

plt.figure(figsize=(10, 6))
colors_dist = {'normal': 'blue', 't': 'orange', 'empirical': 'green'}
for d, r in robustness_results.items():
    plt.hist(r['total'], bins=50, alpha=0.4, density=True,
             label=f"{d} (μ={r['total'].mean():.3f})", color=colors_dist[d])
plt.xlabel('Total Effect'); plt.ylabel('Density')
plt.title('Robustness: Total Effect Under Different Distributions')
plt.legend(); plt.grid(alpha=0.3); plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig5_robustness.png'), dpi=300)
plt.close()

robustness_df = pd.DataFrame({
    'Distribution': list(robustness_results.keys()),
    'Mean': [r['total'].mean() for r in robustness_results.values()],
    'Std': [r['total'].std() for r in robustness_results.values()],
    'P5': [np.percentile(r['total'], 5) for r in robustness_results.values()],
    'P95': [np.percentile(r['total'], 95) for r in robustness_results.values()]
})

# ============================================================
# ۱۴. OAT
# ============================================================
oat_results = []
for pname, pdata in paths.items():
    base_beta = pdata['beta']
    for change in [-20, -10, 0, 10, 20]:
        new_beta = base_beta * (1 + change/100)
        if pname == 'H1_Strategy_to_Knowledge':
            new_total = paths['H2_Strategy_to_Success']['beta'] + new_beta * paths['H3_Knowledge_to_Success']['beta']
        elif pname == 'H3_Knowledge_to_Success':
            new_total = paths['H2_Strategy_to_Success']['beta'] + paths['H1_Strategy_to_Knowledge']['beta'] * new_beta
        elif pname == 'H2_Strategy_to_Success':
            new_total = new_beta + paths['H1_Strategy_to_Knowledge']['beta'] * paths['H3_Knowledge_to_Success']['beta']
        else:
            new_total = paths['H2_Strategy_to_Success']['beta'] + paths['H1_Strategy_to_Knowledge']['beta'] * paths['H3_Knowledge_to_Success']['beta']
        oat_results.append({'Parameter': pname, 'Change_%': change, 'Total': new_total})
oat_df = pd.DataFrame(oat_results)

plt.figure(figsize=(10, 6))
for p in oat_df['Parameter'].unique():
    s = oat_df[oat_df['Parameter']==p]
    plt.plot(s['Change_%'], s['Total'], marker='o', label=p)
plt.xlabel('Change in Parameter (%)'); plt.ylabel('Total Effect')
plt.title('One-at-a-Time Sensitivity Analysis'); plt.legend(fontsize=9)
plt.grid(alpha=0.3); plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig6_oat.png'), dpi=300)
plt.close()

# ============================================================
# ۱۵. CI βها + مقایسه با PLS-SEM
# ============================================================
ci_results = []
for name, p in paths.items():
    sim_beta = sim_paths[name]
    ci_results.append({
        'Hypothesis': name, 'PLS_Beta': p['beta'], 'PLS_t': p['t'],
        'MC_Mean': sim_beta.mean(), 'MC_Std': sim_beta.std(),
        'MC_P5': np.percentile(sim_beta, 5), 'MC_P95': np.percentile(sim_beta, 95),
        'Significant_MC': 'Yes' if np.percentile(sim_beta,5)>0 or np.percentile(sim_beta,95)<0 else 'No'
    })
ci_df = pd.DataFrame(ci_results)

# ============================================================
# ۱۶. ذخیره همه خروجی‌ها
# ============================================================
output_df = pd.DataFrame({
    'sim_id': range(N_SIM),
    **context_df, **{f'path_{k}': v for k, v in sim_paths.items()},
    'indirect': indirect, 'total': total, 'success': success,
    'scenario': np.select([scenarios['Optimistic'], scenarios['Pessimistic']],
                          ['Optimistic', 'Pessimistic'], default='Baseline')
})

with pd.ExcelWriter(os.path.join(OUTPUT_DIR, 'monte_carlo_results.xlsx'), engine='openpyxl') as writer:
    output_df.to_excel(writer, sheet_name='Simulations', index=False)
    summary_df.to_excel(writer, sheet_name='Scenarios', index=False)
    effect_summary.to_excel(writer, sheet_name='Effects', index=False)
    corr_df.to_excel(writer, sheet_name='Parameter_Importance', index=False)
    robustness_df.to_excel(writer, sheet_name='Robustness', index=False)
    oat_df.to_excel(writer, sheet_name='OAT', index=False)
    ci_df.to_excel(writer, sheet_name='CI_Comparison', index=False)

print("\n" + "=" * 60)
print("✅ همه خروجی‌ها با موفقیت ذخیره شدند!")
print("=" * 60)
print(f"📁 مسیر: {OUTPUT_DIR}")
print("\n📊 شکل‌ها:")
for f in ['fig1_scenarios_distribution.png', 'fig2_h6_sensitivity.png',
          'fig3_effects.png', 'fig4_tornado.png', 'fig5_robustness.png', 'fig6_oat.png']:
    print(f"   ✅ {f}")
print("\n📗 فایل اکسل:")
print("   ✅ monte_carlo_results.xlsx (۷ شیت)")