# hooks/hook-playwright.py
"""
PyInstaller hook voor Playwright
"""
import os
import sys
from PyInstaller.utils.hooks import collect_all, collect_data_files, collect_submodules

# Verzamel alle Playwright modules
datas, binaries, hiddenimports = collect_all('playwright')

# Voeg specifieke Playwright binaries toe
if sys.platform == 'win32':
    # Windows specifieke binaries
    playwright_binaries = [
        ('playwright/driver/playwright.cmd', 'playwright/driver'),
        ('playwright/driver/playwright.exe', 'playwright/driver'),
    ]
    
    for src, dest in playwright_binaries:
        if os.path.exists(src):
            binaries.append((src, dest))

# Voeg browser binaries toe
browser_paths = [
    'playwright/browsers',
    'playwright/.local-browsers',
]

for path in browser_paths:
    if os.path.exists(path):
        for root, dirs, files in os.walk(path):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, 'playwright')
                datas.append((full_path, os.path.join('playwright', os.path.dirname(rel_path))))

# Verzamel alle submodules
hiddenimports.extend(collect_submodules('playwright'))

# Debug informatie
print(f"Playwright hook: {len(datas)} data files, {len(binaries)} binaries, {len(hiddenimports)} hidden imports")