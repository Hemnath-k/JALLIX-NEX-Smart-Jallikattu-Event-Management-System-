# Read the file
with open('app.py', 'r') as f:
    content = f.read()

# Add CORS import back after flask_sqlalchemy
old_line = 'from flask_sqlalchemy import SQLAlchemy'
new_line = 'from flask_sqlalchemy import SQLAlchemy\nfrom flask_cors import CORS'

content = content.replace(old_line, new_line)

# Write back
with open('app.py', 'w') as f:
    f.write(content)

print('CORS import added!')
