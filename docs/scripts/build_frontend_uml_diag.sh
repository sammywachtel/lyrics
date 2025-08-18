#!/bin/bash

# Frontend UML Class Diagram Generator
# Generates PlantUML diagrams from TypeScript React frontend codebase
#
# Generated files:
# - docs/diagrams/frontend-classes.puml: PlantUML source code
# - docs/diagrams/frontend-classes.png: PNG image of the diagram
# - docs/diagrams/frontend-classes.svg: SVG image of the diagram
#
# Usage: ./docs/scripts/build_frontend_uml_diag.sh
#
# Prerequisites:
# - Java runtime for PlantUML
# - Internet connection for PlantUML jar download (if needed)

set -e

# Change to project root directory
cd "$(dirname "$0")/../.."

# Ensure diagrams directory exists
mkdir -p docs/diagrams

# Clean up any previous attempts
rm -f docs/diagrams/frontend-classes.* temp_diagram.* 2>/dev/null

echo "Installing dependencies..."
npm i -D node-plantuml

echo "Generating UML diagram from TypeScript files..."

# Dynamic analysis of TypeScript project structure
echo "Analyzing TypeScript project structure..."

# Get list of TypeScript files (excluding test files and node_modules)
COMPONENT_FILES=$(find frontend/src -name "*.tsx" -not -path "*/node_modules*" -not -path "*/test*" -not -name "*.test.*" -not -name "*.spec.*")
INTERFACE_FILES=$(find frontend/src -name "*.ts" -not -path "*/node_modules*" -not -path "*/test*" -not -name "*.test.*" -not -name "*.spec.*" -not -name "*.d.ts")

echo "Found $(echo "$COMPONENT_FILES" | wc -l) component files and $(echo "$INTERFACE_FILES" | wc -l) TypeScript files"

# Create dynamic PlantUML generation script
cat > generate_frontend_plantuml.py << 'EOF'
#!/usr/bin/env python3
import os
import re
import sys
from pathlib import Path

def extract_interfaces(file_path):
    """Extract interface, type alias, and enum definitions from TypeScript files"""
    interfaces = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find interface definitions
        interface_pattern = r'(?:export\s+)?interface\s+(\w+)\s*\{([^}]*)\}'
        for match in re.finditer(interface_pattern, content, re.MULTILINE | re.DOTALL):
            name = match.group(1)
            body = match.group(2).strip()

            # Parse properties
            props = []
            for line in body.split('\n'):
                line = line.strip()
                if line and not line.startswith('//') and not line.startswith('/*'):
                    # Clean up property declarations
                    prop = re.sub(r'\s*:\s*', ': ', line.rstrip(',;'))
                    if prop:
                        props.append(f'+{prop}')

            interfaces.append((name, props))

        # Type aliases: render as simple interfaces with no body
        for match in re.finditer(r'(?:export\s+)?type\s+(\w+)\s*=\s*', content):
            name = match.group(1)
            interfaces.append((name, []))

        # Enums: render as interfaces listing members
        for match in re.finditer(r'(?:export\s+)?enum\s+(\w+)\s*\{([^}]*)\}', content, re.MULTILINE | re.DOTALL):
            name = match.group(1)
            body = match.group(2)
            members = []
            for line in body.split('\n'):
                line = line.strip().rstrip(',')
                if not line or line.startswith('//'):
                    continue
                # Keep just the enum key
                key = re.split(r'\s*=\s*', line)[0]
                if key:
                    members.append(f'+{key}')
            interfaces.append((name, members))
    except Exception as e:
        print(f"Warning: Could not parse {file_path}: {e}", file=sys.stderr)

    return interfaces

def extract_classes(file_path):
    """Extract class and component definitions from TypeScript files"""
    classes = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find React components (function components and class components)
        # Function component pattern
        func_component_pattern = r'(?:export\s+(?:const|function)\s+(\w+)|const\s+(\w+)\s*=.*?(?:React\.)?(?:FC|FunctionComponent))'
        for match in re.finditer(func_component_pattern, content):
            name = match.group(1) or match.group(2)
            if name and name[0].isupper():  # React components start with uppercase
                classes.append((name, ['React.Component'], 'component'))

        # Class component pattern
        class_pattern = r'(?:export\s+)?class\s+(\w+)(?:\s+extends\s+([\w<>.]+))?\s*\{([^}]*)\}'
        for match in re.finditer(class_pattern, content, re.MULTILINE | re.DOTALL):
            name = match.group(1)
            extends = match.group(2) or ''
            body = match.group(3).strip()

            # Parse methods and properties
            methods = []
            for line in body.split('\n'):
                line = line.strip()
                if line and not line.startswith('//'):
                    # Method pattern
                    if '(' in line and ')' in line and not line.startswith('*'):
                        method = re.sub(r'\s*\{.*$', '', line.rstrip(',;'))
                        if method:
                            methods.append(f'+{method}')
                    # Property pattern (simple heuristic)
                    elif ':' in line and not line.startswith('*'):
                        prop = re.sub(r'\s*=.*$', '', line.rstrip(',;'))
                        if prop and not '(' in prop:
                            methods.append(f'-{prop}')

            classes.append((name, methods, 'class'))

    except Exception as e:
        print(f"Warning: Could not parse {file_path}: {e}", file=sys.stderr)

    return classes

def generate_plantuml():
    """Generate PlantUML content dynamically"""

    print("@startuml")
    print("!theme plain")
    print("skinparam classAttributeIconSize 0")
    print("skinparam classFontSize 10")
    print("skinparam packageFontSize 12")
    print("skinparam linetype ortho")
    print("left to right direction")
    print("skinparam nodesep 20")
    print("skinparam ranksep 20")
    print("scale 0.75")
    print("skinparam padding 16")
    print()
    print("title Frontend TypeScript React Application Architecture")
    print()

    # Analyze files by category
    components = {}
    interfaces = {}
    all_defined_names = set()  # Track all names for relationship validation

    # Process all TypeScript files
    for root, dirs, files in os.walk('frontend/src'):
        # Skip node_modules and test directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', '__tests__', 'test', 'tests']]

        for file in files:
            if file.endswith(('.ts', '.tsx')) and not any(x in file for x in ['test', 'spec', '.d.ts']):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, 'frontend/src')

                # Categorize files
                category = 'Components'
                if 'store' in rel_path or 'slice' in file:
                    category = 'Redux Store'
                elif 'service' in rel_path or 'api' in rel_path:
                    category = 'Services'
                elif 'lib' in rel_path:
                    category = 'Libraries'
                elif 'util' in rel_path:
                    category = 'Utilities'
                elif 'hook' in rel_path:
                    category = 'Hooks'
                elif 'lexical' in rel_path:
                    category = 'Lexical Editor'
                elif 'component' in rel_path:
                    category = 'Components'

                # Extract interfaces and classes
                file_interfaces = extract_interfaces(file_path)
                file_classes = extract_classes(file_path)

                for name, props in file_interfaces:
                    if category not in interfaces:
                        interfaces[category] = []
                    interfaces[category].append((name, props))
                    all_defined_names.add(name)

                for name, methods, type_info in file_classes:
                    if category not in components:
                        components[category] = []
                    components[category].append((name, methods, type_info))
                    all_defined_names.add(name)

    # Generate PlantUML packages
    all_categories = set(list(interfaces.keys()) + list(components.keys()))

    for category in sorted(all_categories):
        if category in interfaces or category in components:
            print(f'package "{category}" {{')

            # Add interfaces
            if category in interfaces:
                for name, props in interfaces[category][:8]:  # Limit to avoid clutter
                    print(f'  interface {name} {{')
                    for prop in props[:6]:  # Limit properties
                        print(f'    {prop}')
                    if len(props) > 6:
                        print(f'    +... ({len(props)-6} more)')
                    print(f'  }}')
                    print()

            # Add classes/components
            if category in components:
                for name, methods, type_info in components[category][:8]:  # Limit to avoid clutter
                    print(f'  class {name} {{')
                    for method in methods[:6]:  # Limit methods
                        print(f'    {method}')
                    if len(methods) > 6:
                        print(f'    +... ({len(methods)-6} more)')
                    print(f'  }}')
                    print()

            print('}')
            print()

    # Add key relationships (simplified for frontend)
    print("' Key Frontend Relationships")

    # Look for common React patterns
    if 'App' in all_defined_names:
        main_components = [name for name in all_defined_names if name in ['SongEditor', 'SongList', 'CleanSongEditor']]
        for comp in main_components:
            print(f"App --> {comp} : renders")

    # Props relationships
    for name in all_defined_names:
        if name.endswith('Props'):
            base_name = name.replace('Props', '')
            if base_name in all_defined_names:
                print(f"{base_name} --> {name} : uses")

    print("@enduml")

if __name__ == "__main__":
    generate_plantuml()
EOF

echo "Running dynamic PlantUML generation..."
python3 generate_frontend_plantuml.py > docs/diagrams/frontend-classes.puml

if [ ! -s "docs/diagrams/frontend-classes.puml" ]; then
    echo "⚠️ Dynamic generation failed, creating basic structure..."
    cat > docs/diagrams/frontend-classes.puml << 'EOF'
@startuml
!theme plain
title Frontend TypeScript Project Structure (Basic)

package "Project Files" {
  note "Dynamic analysis failed\nShowing basic structure"
}

@enduml
EOF
fi

echo "✅ Dynamic PlantUML diagram created"
echo "Files analyzed:"
echo "- Components: $(echo "$COMPONENT_FILES" | wc -l)"
echo "- TypeScript files: $(echo "$INTERFACE_FILES" | wc -l)"

# Generate PNG and SVG from PlantUML file
if [ -f "docs/diagrams/frontend-classes.puml" ] && head -1 docs/diagrams/frontend-classes.puml | grep -q "@startuml"; then
  echo "Preview of frontend-classes.puml:"
  head -10 docs/diagrams/frontend-classes.puml
  echo "..."

  # Generate PNG from PlantUML file
  echo "Generating PNG and SVG from PlantUML..."

  # Try official PlantUML jar (download if needed)
  echo "Trying official PlantUML jar..."
  if command -v java >/dev/null 2>&1; then
    # Try to download plantuml.jar if not present
    if [ ! -f "plantuml.jar" ]; then
      echo "Downloading PlantUML jar..."
      if curl -L -o plantuml.jar "https://github.com/plantuml/plantuml/releases/download/v1.2024.8/plantuml-1.2024.8.jar"; then
        echo "PlantUML jar downloaded successfully"
      else
        echo "Could not download PlantUML jar"
      fi
    fi

    if [ -f "plantuml.jar" ]; then
      echo "Running PlantUML jar..."

      # Generate PNG
      if java -DPLANTUML_LIMIT_SIZE=16384 -jar plantuml.jar -tpng docs/diagrams/frontend-classes.puml 2>/dev/null; then
        echo "✅ PNG generated using PlantUML jar"
      fi

      # Generate SVG
      if java -jar plantuml.jar -tsvg docs/diagrams/frontend-classes.puml 2>/dev/null; then
        echo "✅ SVG generated using PlantUML jar"
      fi

      # Check results
      if [ -f "docs/diagrams/frontend-classes.png" ] && [ -s "docs/diagrams/frontend-classes.png" ]; then
        PNG_SIZE=$(wc -c < docs/diagrams/frontend-classes.png)
        echo "✅ Frontend PNG generated (size: $PNG_SIZE bytes)"
      fi

      if [ -f "docs/diagrams/frontend-classes.svg" ] && [ -s "docs/diagrams/frontend-classes.svg" ]; then
        echo "✅ Frontend SVG generated"
      fi
    fi
  else
    echo "⚠️ Java not available for PlantUML jar"
  fi

  # Provide fallback options if generation failed
  if [ ! -f "docs/diagrams/frontend-classes.png" ] || [ ! -s "docs/diagrams/frontend-classes.png" ]; then
    echo "⚠️ PNG generation failed"
    echo "📋 Manual options:"
    echo "1. PlantUML source file: docs/diagrams/frontend-classes.puml"
    echo "2. Visit: http://www.plantuml.com/plantuml/uml/"
    echo "3. Copy and paste the content from frontend-classes.puml"
  fi
else
  echo "❌ PlantUML file generation failed"
fi

echo "Frontend UML diagram generation complete."
echo "Files generated in docs/diagrams/:"
ls -la docs/diagrams/frontend-classes.* 2>/dev/null || echo "No output files found"

# Cleanup temporary files
rm -f generate_frontend_plantuml.py 2>/dev/null

echo ""
echo "✅ Frontend UML diagram generation complete!"
echo "📁 Output location: docs/diagrams/"
echo "📄 PlantUML source: docs/diagrams/frontend-classes.puml"
echo "🖼️  PNG image: docs/diagrams/frontend-classes.png"
echo "🖼️  SVG image: docs/diagrams/frontend-classes.svg"
