import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os
import json
import warnings
warnings.filterwarnings('ignore')

# ============================================================
# ۰. تنظیمات مسیرها
# ============================================================
BASE_DIR = r'D:\Article\مقاله دکتر رحمان سرشت'
FILE_PATH = os.path.join(BASE_DIR, 'expand', 'electric_bicycle_data_complete.xlsx')
OUTPUT_DIR = os.path.join(BASE_DIR, 'outputs')
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("=" * 60)
print("🤖 بخش یادگیری ماشین: XGBoost + SHAP (نسخه سازگار)")
print("=" * 60)

# ============================================================
# ۱. خواندن داده‌ها
# ============================================================
df = pd.read_excel(FILE_PATH, engine='openpyxl')

# ============================================================
# ۲. تعریف ویژگی‌ها (X) و متغیر هدف (y)
# ============================================================
df['success'] = df[[f'Q{i}' for i in range(16, 21)]].mean(axis=1)
feature_cols = [f'Q{i}' for i in range(1, 16)] + [f'Q{i}' for i in range(21, 31)]
X = df[feature_cols].values
y = df['success'].values

print(f"✅ ویژگی‌ها: {X.shape[1]} گویه")
print(f"✅ نمونه‌ها: {X.shape[0]} پاسخ‌دهنده")

# ============================================================
# ۳. آموزش XGBoost و Random Forest
# ============================================================
from xgboost import XGBRegressor
from sklearn.model_selection import cross_val_score, KFold
from sklearn.ensemble import RandomForestRegressor

kf = KFold(n_splits=5, shuffle=True, random_state=42)

xgb_model = XGBRegressor(
    n_estimators=100, max_depth=3, learning_rate=0.1,
    subsample=0.8, colsample_bytree=0.8,
    random_state=42, objective='reg:squarederror'
)
xgb_r2 = cross_val_score(xgb_model, X, y, cv=kf, scoring='r2')
xgb_rmse = np.sqrt(-cross_val_score(xgb_model, X, y, cv=kf, scoring='neg_mean_squared_error'))

rf_model = RandomForestRegressor(n_estimators=100, max_depth=5, random_state=42)
rf_r2 = cross_val_score(rf_model, X, y, cv=kf, scoring='r2')
rf_rmse = np.sqrt(-cross_val_score(rf_model, X, y, cv=kf, scoring='neg_mean_squared_error'))

print("\n" + "=" * 60)
print("📊 نتایج اعتبارسنجی متقابل (۵ تایی):")
print("=" * 60)
print(f"XGBoost       → R² = {xgb_r2.mean():.3f} ± {xgb_r2.std():.3f} | RMSE = {xgb_rmse.mean():.3f}")
print(f"Random Forest → R² = {rf_r2.mean():.3f} ± {rf_r2.std():.3f} | RMSE = {rf_rmse.mean():.3f}")

# ============================================================
# ۴. آموزش نهایی
# ============================================================
xgb_model.fit(X, y)
rf_model.fit(X, y)

# ============================================================
# ۵. محاسبه SHAP با روش سازگار (KernelExplainer)
# ============================================================
import shap

print("\n🔄 محاسبه SHAP با KernelExplainer (سازگار با XGBoost جدید)...")

# استفاده از KernelExplainer به‌جای TreeExplainer
# این روش با هر مدلی کار می‌کند و نیازی به base_score ندارد
explainer = shap.KernelExplainer(xgb_model.predict, X[:100])  # ۱۰۰ نمونه پس‌زمینه
shap_values = explainer.shap_values(X[:100], nsamples=100)    # ۱۰۰ نمونه برای سرعت

# نمودار خلاصه SHAP
plt.figure(figsize=(10, 8))
shap.summary_plot(shap_values, X[:100], feature_names=feature_cols, show=False, max_display=15)
plt.title('SHAP Summary: Feature Importance (KernelExplainer)', fontsize=13)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig7_shap_summary.png'), dpi=300, bbox_inches='tight')
plt.close()

# نمودار میله‌ای
plt.figure(figsize=(10, 8))
shap.summary_plot(shap_values, X[:100], feature_names=feature_cols, plot_type="bar", show=False, max_display=15)
plt.title('SHAP Feature Importance (Mean |SHAP|)', fontsize=13)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig8_shap_bar.png'), dpi=300, bbox_inches='tight')
plt.close()

# ============================================================
# ۶. جدول اهمیت ویژگی‌ها
# ============================================================
shap_importance = pd.DataFrame({
    'Feature': feature_cols,
    'Mean_Abs_SHAP': np.abs(shap_values).mean(axis=0)
}).sort_values('Mean_Abs_SHAP', ascending=False)

print("\n" + "=" * 60)
print("🔝 ۱۰ ویژگی مهم (بر اساس SHAP):")
print("=" * 60)
print(shap_importance.head(10).round(4).to_string(index=False))

# ============================================================
# ۷. اهمیت سازه‌ها
# ============================================================
construct_mapping = {
    'DKM (Q1-Q9)': [f'Q{i}' for i in range(1, 10)],
    'DTL (Q10-Q15)': [f'Q{i}' for i in range(10, 16)],
    'SA (Q21-Q26)': [f'Q{i}' for i in range(21, 27)],
    'DS (Q27-Q30)': [f'Q{i}' for i in range(27, 31)],
}

construct_importance = []
for construct, items in construct_mapping.items():
    construct_shap = shap_importance[shap_importance['Feature'].isin(items)]['Mean_Abs_SHAP'].mean()
    construct_importance.append({'Construct': construct, 'Mean_Abs_SHAP': construct_shap})

construct_df = pd.DataFrame(construct_importance).sort_values('Mean_Abs_SHAP', ascending=False)

print("\n" + "=" * 60)
print("📊 اهمیت سازه‌ها (میانگین SHAP):")
print("=" * 60)
print(construct_df.round(4).to_string(index=False))

# ============================================================
# ۸. مقایسه با PLS-SEM
# ============================================================
pls_r2 = 0.292
print("\n" + "=" * 60)
print("📈 مقایسه ML با PLS-SEM:")
print("=" * 60)
print(f"PLS-SEM R² (از مقاله): {pls_r2:.3f}")
print(f"XGBoost R² (CV):       {xgb_r2.mean():.3f}")
print(f"Random Forest R² (CV): {rf_r2.mean():.3f}")
print(f"ΔR² (XGBoost - PLS):   {xgb_r2.mean() - pls_r2:+.3f}")

# ============================================================
# ۹. ذخیره نتایج
# ============================================================
ml_results = pd.DataFrame({
    'Model': ['XGBoost', 'Random Forest', 'PLS-SEM (baseline)'],
    'R2_Mean': [xgb_r2.mean(), rf_r2.mean(), pls_r2],
    'R2_Std': [xgb_r2.std(), rf_r2.std(), 0],
    'RMSE_Mean': [xgb_rmse.mean(), rf_rmse.mean(), np.nan]
})

with pd.ExcelWriter(os.path.join(OUTPUT_DIR, 'ml_results.xlsx'), engine='openpyxl') as writer:
    ml_results.to_excel(writer, sheet_name='Model_Comparison', index=False)
    shap_importance.to_excel(writer, sheet_name='SHAP_Importance', index=False)
    construct_df.to_excel(writer, sheet_name='Construct_Importance', index=False)

print("\n" + "=" * 60)
print("✅ خروجی‌های ML ذخیره شدند:")
print("=" * 60)
print(f"📁 {OUTPUT_DIR}")
print("   - fig7_shap_summary.png")
print("   - fig8_shap_bar.png")
print("   - fig9_construct_importance.png")
print("   - ml_results.xlsx (۳ شیت)")