import os

# Read the file
with open('app.py', 'r') as f:
    content = f.read()

# Replace duplicate import
content = content.replace('import os\nimport os', 'import os')

# Add PROJECT_ROOT after functools import
old_line = 'from functools import wraps'
new_line = '''from functools import wraps

# Get the parent directory (project root)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))'''
content = content.replace(old_line, new_line)

# Add frontend routes before the main block
old_main = '''# ==================== MAIN ====================
if __name__ == '__main__':'''

new_main = '''# ==================== FRONTEND ROUTES ====================
@app.route('/')
def serve_index():
    return send_from_directory(PROJECT_ROOT, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(PROJECT_ROOT, filename)

# ==================== MAIN ====================
if __name__ == '__main__':'''

content = content.replace(old_main, new_main)

# Write back
with open('app.py', 'w') as f:
    f.write(content)

print('File updated successfully!')
