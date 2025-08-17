#!/bin/bash

# Backend UML Class Diagram Generator
# Generates PlantUML diagrams from Python backend codebase structure
#
# Generated files:
# - docs/diagrams/backend-classes.puml: PlantUML source code
# - docs/diagrams/backend-classes.png: PNG image of the diagram
# - docs/diagrams/backend-classes.svg: SVG image of the diagram
#
# Usage: ./docs/scripts/build_backend_uml_diag.sh
#
# Prerequisites:
# - Java runtime for PlantUML
# - Internet connection for PlantUML jar download (if needed)

set -e

# Change to project root directory
cd "$(dirname "$0")/../.."

# Ensure diagrams directory exists
mkdir -p docs/diagrams

# Check if plantuml.jar exists, download if needed
if [ ! -f "plantuml.jar" ]; then
    echo "Downloading PlantUML jar..."
    if curl -L -o plantuml.jar "https://github.com/plantuml/plantuml/releases/download/v1.2024.8/plantuml-1.2024.8.jar"; then
        echo "PlantUML jar downloaded successfully"
    else
        echo "Error: Could not download PlantUML jar"
        echo "Please download PlantUML manually from https://plantuml.com/download"
        exit 1
    fi
fi

echo "🔍 Analyzing Python backend codebase structure..."

# Create temporary file for class analysis
TEMP_ANALYSIS="/tmp/backend_class_analysis.txt"
rm -f "$TEMP_ANALYSIS"

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
                properties = []

                for item in node.body:
                    if isinstance(item, ast.FunctionDef):
                        # Categorize methods
                        if item.name.startswith('_'):
                            if item.name.startswith('__'):
                                methods.append(f'#{item.name}')  # Private/magic methods
                            else:
                                methods.append(f'-{item.name}')  # Protected methods
                        else:
                            methods.append(f'+{item.name}')  # Public methods
                    elif isinstance(item, ast.AnnAssign) and isinstance(item.target, ast.Name):
                        # Type annotated attributes
                        properties.append(f'-{item.target.id}')

                # Get base classes
                bases = []
                for base in node.bases:
                    if isinstance(base, ast.Name):
                        bases.append(base.id)
                    elif isinstance(base, ast.Attribute):
                        if hasattr(base.value, 'id'):
                            bases.append(f'{base.value.id}.{base.attr}')
                        else:
                            bases.append(base.attr)

                classes.append({
                    'name': node.name,
                    'methods': methods,
                    'properties': properties,
                    'bases': bases,
                    'file': filename
                })

        return classes
    except Exception as e:
        print(f'Error processing {filename}: {e}', file=sys.stderr)
        return []

classes = analyze_file('$file')
for cls in classes:
    print(f'CLASS:{cls[\"name\"]}:{cls[\"file\"]}:{\"|\".join(cls[\"methods\"])}:{\"|\".join(cls[\"properties\"])}:{\"|\".join(cls[\"bases\"])}')
"
done > "$TEMP_ANALYSIS"

echo "📝 Generating PlantUML diagram..."

# Generate PlantUML source
cat > docs/diagrams/backend-classes.puml << 'EOF'
@startuml backend-classes
!theme plain
skinparam classAttributeIconSize 0
skinparam classFontSize 10
skinparam packageFontSize 12
skinparam linetype ortho
left to right direction

title Backend Python FastAPI Application Architecture

EOF

# Process classes and generate PlantUML content
echo "package \"Backend Application\" {" >> docs/diagrams/backend-classes.puml

while IFS=':' read -r prefix class_name file_path methods properties bases; do
    if [ "$prefix" = "CLASS" ]; then
        echo "  class $class_name {" >> docs/diagrams/backend-classes.puml

        # Add properties
        if [ -n "$properties" ]; then
            echo "$properties" | tr '|' '\n' | while read -r prop; do
                if [ -n "$prop" ]; then
                    echo "    $prop" >> docs/diagrams/backend-classes.puml
                fi
            done
        fi

        # Add methods (limit to avoid clutter)
        if [ -n "$methods" ]; then
            echo "$methods" | tr '|' '\n' | head -8 | while read -r method; do
                if [ -n "$method" ]; then
                    echo "    $method()" >> docs/diagrams/backend-classes.puml
                fi
            done
            method_count=$(echo "$methods" | tr '|' '\n' | wc -l)
            if [ "$method_count" -gt 8 ]; then
                echo "    +... ($((method_count - 8)) more methods)" >> docs/diagrams/backend-classes.puml
            fi
        fi

        echo "  }" >> docs/diagrams/backend-classes.puml
        echo "" >> docs/diagrams/backend-classes.puml
    fi
done < "$TEMP_ANALYSIS"

echo "}" >> docs/diagrams/backend-classes.puml

# Add inheritance relationships
echo "' Inheritance relationships" >> docs/diagrams/backend-classes.puml
while IFS=':' read -r prefix class_name file_path methods properties bases; do
    if [ "$prefix" = "CLASS" ] && [ -n "$bases" ]; then
        echo "$bases" | tr '|' '\n' | while read -r base; do
            if [ -n "$base" ] && [ "$base" != "object" ] && [ "$base" != "BaseModel" ]; then
                echo "$base <|-- $class_name" >> docs/diagrams/backend-classes.puml
            fi
        done
    fi
done < "$TEMP_ANALYSIS"

# Add common FastAPI relationships
echo "" >> docs/diagrams/backend-classes.puml
echo "' Common FastAPI patterns" >> docs/diagrams/backend-classes.puml
echo "note top of FastAPI : \"Main Application\\nRoutes and Middleware\"" >> docs/diagrams/backend-classes.puml

echo "@enduml" >> docs/diagrams/backend-classes.puml

echo "🎨 Generating diagram images..."

# Generate PNG
if java -jar plantuml.jar -tpng docs/diagrams/backend-classes.puml 2>/dev/null; then
    echo "✅ PNG generated successfully"
else
    echo "⚠️ PNG generation failed"
fi

# Generate SVG
if java -jar plantuml.jar -tsvg docs/diagrams/backend-classes.puml 2>/dev/null; then
    echo "✅ SVG generated successfully"
else
    echo "⚠️ SVG generation failed"
fi

echo "✅ Backend UML diagrams generated successfully:"
echo "   📄 docs/diagrams/backend-classes.puml - PlantUML source code"

if [ -f "docs/diagrams/backend-classes.png" ]; then
    echo "   🖼️  docs/diagrams/backend-classes.png - PNG image"
fi

if [ -f "docs/diagrams/backend-classes.svg" ]; then
    echo "   🖼️  docs/diagrams/backend-classes.svg - SVG image"
fi

echo ""
echo "⚠️  Note: Generated diagram files should NOT be committed to git"
echo "   Add these patterns to .gitignore if not already present:"
echo "   docs/diagrams/*.png"
echo "   docs/diagrams/*.svg"
echo "   docs/diagrams/*.puml"

# Cleanup
rm -f "$TEMP_ANALYSIS"

echo ""
echo "✅ Backend UML diagram generation complete!"
echo "📁 Output location: docs/diagrams/"
echo "📄 PlantUML source: docs/diagrams/backend-classes.puml"
echo "🖼️  PNG image: docs/diagrams/backend-classes.png"
echo "🖼️  SVG image: docs/diagrams/backend-classes.svg"
