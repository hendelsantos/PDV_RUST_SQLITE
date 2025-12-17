#!/bin/bash
# Script to convert SQLite placeholders (?) to PostgreSQL placeholders ($1, $2, $3...)

# This script converts query placeholders in Rust files from SQLite style (?)
# to PostgreSQL style ($1, $2, $3, etc.)

cd "$(dirname "$0")/backend/src"

echo "Converting query placeholders from ? to \$1, \$2, \$3..."

# Function to convert placeholders in a file
convert_file() {
    local file="$1"
    echo "Processing: $file"
    
    # Use Python for more reliable conversion
    python3 << 'EOF'
import re
import sys

def convert_placeholders(content):
    """Convert ? placeholders to $1, $2, $3, etc. in SQL queries"""
    
    def replace_in_query(match):
        query = match.group(0)
        counter = 1
        result = []
        i = 0
        
        while i < len(query):
            if query[i] == '?':
                result.append(f'${counter}')
                counter += 1
                i += 1
            else:
                result.append(query[i])
                i += 1
        
        return ''.join(result)
    
    # Match SQL query strings (both raw and regular strings)
    # This regex finds strings that likely contain SQL
    patterns = [
        (r'r#"([^"]*\?[^"]*)"#', lambda m: 'r#"' + convert_placeholders_simple(m.group(1)) + '"#'),
        (r'"([^"]*(?:SELECT|INSERT|UPDATE|DELETE|WHERE|VALUES)[^"]*\?[^"]*)"', 
         lambda m: '"' + convert_placeholders_simple(m.group(1)) + '"'),
    ]
    
    for pattern, replacer in patterns:
        content = re.sub(pattern, replacer, content, flags=re.IGNORECASE | re.DOTALL)
    
    return content

def convert_placeholders_simple(query_content):
    """Simple placeholder conversion"""
    counter = 1
    result = []
    for char in query_content:
        if char == '?':
            result.append(f'${counter}')
            counter += 1
        else:
            result.append(char)
    return ''.join(result)

# Read from file
with open(sys.argv[1], 'r') as f:
    content = f.read()

# Convert
new_content = convert_placeholders(content)

# Write back
with open(sys.argv[1], 'w') as f:
    f.write(new_content)

print(f"Converted {sys.argv[1]}")
EOF
}

# Find all Rust files with queries
find . -name "*.rs" -type f | while read file; do
    if grep -q "?" "$file" 2>/dev/null; then
        # Simple sed-based conversion for common patterns
        sed -i 's/VALUES (?, ?, ?, ?, ?)/VALUES ($1, $2, $3, $4, $5)/g' "$file"
        sed -i 's/VALUES (?, ?, ?, ?)/VALUES ($1, $2, $3, $4)/g' "$file"
        sed -i 's/VALUES (?, ?, ?)/VALUES ($1, $2, $3)/g' "$file"
        sed -i 's/VALUES (?, ?)/VALUES ($1, $2)/g' "$file"
        sed -i 's/WHERE id = ?/WHERE id = $1/g' "$file"
        sed -i 's/WHERE email = ?/WHERE email = $1/g' "$file"
        sed -i 's/WHERE role = ?/WHERE role = $1/g' "$file"
        sed -i 's/WHERE tenant_id = ?/WHERE tenant_id = $1/g' "$file"
        sed -i 's/SET password_hash = ?/SET password_hash = $1/g' "$file"
        
        echo "Converted: $file"
    fi
done

echo "Done! Please review the changes with 'git diff'"
