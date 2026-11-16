with open('docs/uml/03-use-case.svg', 'r', encoding='utf-8') as f:
    svg = f.read()
import re
nodes = re.findall(r'id="([^"]+)"[^>]*transform="translate\(([^,\)]+),\s*([^\)]+)\)"', svg)
for n in nodes:
    if any(k in n[0] for k in ['Student', 'Admin', 'Gemini', 'UC_', 'subgraph', 'Flow', 'Platform']):
        print(f"{n[0]}: x={float(n[1]):.1f}, y={float(n[2]):.1f}")
