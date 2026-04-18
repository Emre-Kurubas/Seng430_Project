import os
import re
import glob

components_path = r'c:\Users\user\Desktop\projects\Seng430\version7\src\components\*.jsx'
app_path = r'c:\Users\user\Desktop\projects\Seng430\version7\src\App.jsx'
index_html_path = r'c:\Users\user\Desktop\projects\Seng430\version7\index.html'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # 1. Remove style={!isDarkMode ? { background: ... } : {}}
    # Matches various linear-gradient inline styles we added.
    content = re.sub(r'\s*style=\{!isDarkMode \? \{ background: \'linear-gradient[^\}]+\} : \{\}\}', '', content)
    
    # 2. Fix the missing bg-white and add shadow-md / border-slate-200 
    # Example target: : 'border border-indigo-200 shadow-sm')}
    # We want to replace all 'border border-(color)-200 shadow-sm' with 'bg-white border border-slate-200 shadow-md'
    # Wait, some are 'border border-emerald-200' etc without shadow. Let's just catch them all.
    content = re.sub(r'border border-(?:indigo|emerald|violet|sky|amber|slate)-200(?: shadow-sm| hover:shadow-lg| hover:shadow-md| shadow-md)?', 
                     'bg-white border border-slate-200 shadow-md', content)
    
    # Also catch cases like 'hover:shadow-lg border border-indigo-200'
    content = re.sub(r'hover:shadow-lg border border-indigo-200', 'bg-white border border-slate-200 shadow-md', content)
    
    # Also catch App.jsx sidebar/stepper backgrounds
    # App.jsx: style={!isDarkMode ? { background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' } : {}}
    content = re.sub(r'\s*style=\{!isDarkMode \? \{ background: \'linear-gradient[^\}]+\} : \{\}\}', '', content)

    # 3. For Header.jsx
    if 'Header.jsx' in filepath:
        content = re.sub(r'style=\{\{!isDarkMode \? \{ background: [^\}]+\} : \{\}\}\}', '', content)
        content = re.sub(r'style=\{!isDarkMode \? \{ background: [^\}]+\} : \{\}\}', '', content)

    # Update app background in App.jsx
    if 'App.jsx' in filepath:
        content = content.replace('bg-[#e2e8f0]', 'bg-slate-100')
        content = content.replace('#e2e8f0', '#f1f5f9')
        # Fix App.jsx stepper / header replacing pure colors
        content = content.replace('border-indigo-200', 'bg-white border border-slate-200 shadow-md')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for f in glob.glob(components_path):
    process_file(f)
process_file(app_path)

# Quick fix for index.html
with open(index_html_path, 'r', encoding='utf-8') as f:
    html = f.read()
html = html.replace('bg-[#e2e8f0]', 'bg-slate-100')
with open(index_html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated index.html")
