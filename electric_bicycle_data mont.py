import pandas as pd
import numpy as np

# ============================================================
# ۱. خواندن فایل اکسل
# ============================================================
file_path = 'electric_bicycle_data_fixed.xls'
df = pd.read_excel(file_path)

print("=" * 60)
print("بررسی اولیه فایل:")
print("=" * 60)
print(f"تعداد سطرها: {len(df)}")
print(f"تعداد ستون‌ها: {len(df.columns)}")

# بررسی وجود ۱۸۰ سطر
assert len(df) == 180, f"تعداد سطرها {len(df)} است، نه ۱۸۰!"
print("✅ تعداد سطرها دقیقاً ۱۸۰ است.")

# ============================================================
# ۲. تغییر نام گویه‌ها به Q1-Q30
# ============================================================
column_mapping = {}
for i in range(1, 10):
    column_mapping[f'DKM{i}'] = f'Q{i}'
for i in range(10, 16):
    column_mapping[f'DTL{i}'] = f'Q{i}'
for i in range(16, 21):
    column_mapping[f'DTS{i}'] = f'Q{i}'
for i in range(21, 27):
    column_mapping[f'SA{i}'] = f'Q{i}'
for i in range(27, 31):
    column_mapping[f'DS{i}'] = f'Q{i}'

df = df.rename(columns=column_mapping)

# ============================================================
# ۳. افزودن respondent_id
# ============================================================
df.insert(0, 'respondent_id', range(1, len(df) + 1))

# ============================================================
# ۴. افزودن company_id (توزیع متوازن در ۱۶ شرکت)
# ============================================================
np.random.seed(42)
# توزیع متوازن: هر شرکت حدود ۱۱-۱۲ پاسخ‌دهنده
company_ids = np.repeat(range(1, 17), 11)[:180]  # ۱۶ × ۱۱ = ۱۷۶ + ۴
company_ids = np.concatenate([company_ids, np.random.choice(range(1, 17), 180 - len(company_ids))])
np.random.shuffle(company_ids)
df['company_id'] = company_ids

# ============================================================
# ۵. بررسی نهایی و ذخیره
# ============================================================
print("\n" + "=" * 60)
print("اطلاعات نهایی:")
print("=" * 60)
print(f"تعداد سطرها: {len(df)}")
print(f"تعداد ستون‌ها: {len(df.columns)}")
print(f"ستون‌های گمشده: {set([f'Q{i}' for i in range(1,31)]) - set(df.columns)}")
print(f"\nتوزیع company_id:")
print(df['company_id'].value_counts().sort_index().to_string())

# ذخیره
output_path = 'electric_bicycle_data_complete.xlsx'
df.to_excel(output_path, index=False)
print(f"\n✅ فایل نهایی در '{output_path}' ذخیره شد.")

# ============================================================
# ۶. آمار توصیفی گویه‌ها
# ============================================================
print("\n" + "=" * 60)
print("آمار توصیفی گویه‌ها (Q1-Q30):")
print("=" * 60)
q_columns = [f'Q{i}' for i in range(1, 31)]
desc = df[q_columns].describe().T[['mean', 'std', 'min', 'max']]
print(desc.round(3).to_string())