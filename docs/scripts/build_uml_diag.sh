#!/bin/bash
# UML Class Diagram Generator
# Generates PlantUML diagrams from Python codebase structure
# 
# Generated files:
# - classes.puml: PlantUML source code
# - classes.png: PNG image of the diagram  
# - classes.svg: SVG image of the diagram
#
# Usage: ./build_uml_diag.sh
# 
# Prerequisites:
# - plantuml.jar in project root
# - Java runtime

# NOTE: This script generates temporary files that should NOT be committed to git.
# Add these patterns to .gitignore:
# classes.png
# classes.puml  
# classes.svg
# classes_orphans.*

set -e

# Change to project root directory
cd "$(dirname "$0")/../.."

# Check if plantuml.jar exists
if [ ! -f "plantuml.jar" ]; then
    echo "Error: plantuml.jar not found in project root"
    echo "Please download PlantUML from https://plantuml.com/download"
    exit 1
fi

echo "🔍 Analyzing Python codebase structure..."

# Find all Python files and extract class definitions
find backend/app -name "*.py" -type f | while read -r file; do
    echo "Processing: $file"
    
    # Extract class definitions and their methods
    python3 -c "
import ast
import sys

def analyze_file(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        tree = ast.parse(content)
        classes = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                methods = []
                for item in node.body:
                    if isinstance(item, ast.FunctionDef):
                        methods.append(item.name)
                
                # Get base classes
                bases = []
                for base in node.bases:
                    if isinstance(base, ast.Name):
                        bases.append(base.id)
                    elif isinstance(base, ast.Attribute):
                        bases.append(f'{base.value.id}.{base.attr}' if hasattr(base.value, 'id') else base.attr)
                
                classes.append({
                    'name': node.name,
                    'methods': methods,
                    'bases': bases,
                    'file': filename
                })
        
        return classes
    except Exception as e:
        print(f'Error processing {filename}: {e}', file=sys.stderr)
        return []

classes = analyze_file('$file')
for cls in classes:
    print(f'CLASS:{cls[\"name\"]}:{cls[\"file\"]}:{\"|\".join(cls[\"methods\"])}:{\"|\".join(cls[\"bases\"])}')
"
done > /tmp/class_analysis.txt

echo "📝 Generating PlantUML diagram..."

# Generate PlantUML source
cat > classes.puml << 'EOF'
@startuml classes
!theme plain
skinparam classAttributeIconSize 0
skinparam classFontSize 10
skinparam packageFontSize 12

package "Backend Application" {
EOF

# Process class analysis and generate PlantUML classes
while IFS=':' read -r prefix class_name file_path methods bases; do
    if [ "$prefix" = "CLASS" ]; then
        echo "  class $class_name {" >> classes.puml
        
        # Add methods
        if [ -n "$methods" ]; then
            echo "$methods" | tr '|' '\n' | while read -r method; do
                if [ -n "$method" ]; then
                    echo "    +$method()" >> classes.puml
                fi
            done
        fi
        
        echo "  }" >> classes.puml
        
        # Add inheritance relationships
        if [ -n "$bases" ]; then
            echo "$bases" | tr '|' '\n' | while read -r base; do
                if [ -n "$base" ] && [ "$base" != "object" ]; then
                    echo "  $base <|-- $class_name" >> classes.puml
                fi
            done
        fi
        
        echo "" >> classes.puml
    fi
done < /tmp/class_analysis.txt

echo "}" >> classes.puml
echo "@enduml" >> classes.puml

echo "🎨 Generating diagram images..."

# Generate PNG
java -jar plantuml.jar -tpng classes.puml

# Generate SVG  
java -jar plantuml.jar -tsvg classes.puml

echo "✅ UML diagrams generated successfully:"
echo "   📄 classes.puml - PlantUML source code"
echo "   🖼️  classes.png - PNG image"
echo "   🖼️  classes.svg - SVG image"
echo ""
echo "⚠️  Note: Generated files should NOT be committed to git"
echo "   Add these patterns to .gitignore:"
echo "   classes.png"
echo "   classes.puml"
echo "   classes.svg"

# Cleanup
rm -f /tmp/class_analysis.txt