import os
import glob
import shutil
import subprocess
import cv2
import numpy as np
import xml.etree.ElementTree as ET
import re

UML_DIR = "docs/uml"
ASSETS_DIR = "slides/assets"
PREVIEW_DIR = "slides/preview"
MERMAID_CFG = "slides/mermaid-config.json"
PUPPETEER_CFG = "slides/puppeteer-config.json"

# Mapping of Slide Frame Number -> diagram info
# (Frame 1-based indexing in slides/main.pdf)
DIAGRAM_PAGES = {
    5: {
        "title": "Layered Architecture: Practice & Vocab Controllers & Services",
        "file": "03a1-layered-practice-vocab.png",
        "mmd": "03a1-layered-practice-vocab.mmd",
        "type": "classDiagram",
    },
    6: {
        "title": "Layered Architecture: Auth & Administration Controllers & Services",
        "file": "03a2-layered-auth-admin.png",
        "mmd": "03a2-layered-auth-admin.mmd",
        "type": "classDiagram",
    },
    7: {
        "title": "Persistence Architecture: Generic Repositories, Ports & Container",
        "file": "03b-repository-architecture.png",
        "mmd": "03b-repository-architecture.mmd",
        "type": "classDiagram",
    },
    8: {
        "title": "System Use Case Model: Student Practice, Error Log & Vocab Lifecycle",
        "file": "04a-use-case-student.png",
        "mmd": "04a-use-case-student.mmd",
        "type": "useCase",
    },
    9: {
        "title": "System Use Case Model: Platform Administration & Content Workflows",
        "file": "04b-use-case-admin.png",
        "mmd": "04b-use-case-admin.mmd",
        "type": "useCase",
    },
    14: {
        "title": "Polymorphism in Action: Strategy Pattern for Exam Scoring",
        "file": "02-scoring-strategy.png",
        "mmd": "02-scoring-strategy.mmd",
        "type": "classDiagram",
    },
    15: {
        "title": "Domain Model: Core Foundation & User RBAC Subtyping",
        "file": "01a1-domain-users.png",
        "mmd": "01a1-domain-users.mmd",
        "type": "classDiagram",
    },
    16: {
        "title": "Domain Model: Test Aggregate & Polymorphic Questions",
        "file": "01a2-domain-questions.png",
        "mmd": "01a2-domain-questions.mmd",
        "type": "classDiagram",
    },
    17: {
        "title": "Domain Model: Exam Sitting Aggregate & Deduplicated Error Log",
        "file": "01b1-domain-attempt.png",
        "mmd": "01b1-domain-attempt.mmd",
        "type": "classDiagram",
    },
    18: {
        "title": "Domain Model: Vocabulary Spaced Repetition Domain",
        "file": "01b2-domain-vocab.png",
        "mmd": "01b2-domain-vocab.mmd",
        "type": "classDiagram",
    },
    19: {
        "title": "Sequence: Exam Sitting Submission & Scoring Strategy (Part 1)",
        "file": "05a-sequence-submit-attempt.png",
        "mmd": "05a-sequence-submit-attempt.mmd",
        "type": "sequenceDiagram",
    },
    20: {
        "title": "Sequence: Observer Dispatch & Error Log Projection (Part 2)",
        "file": "05b-sequence-publish-handlers.png",
        "mmd": "05b-sequence-publish-handlers.mmd",
        "type": "sequenceDiagram",
    },
    21: {
        "title": "Sequence: Flashcard Review via Leitner Spaced Repetition",
        "file": "06-sequence-vocab-review.png",
        "mmd": "06-sequence-vocab-review.mmd",
        "type": "sequenceDiagram",
    },
    24: {
        "title": "Observer Pattern: Domain Event Bus & Subscriptions",
        "file": "07-observer-events.png",
        "mmd": "07-observer-events.mmd",
        "type": "classDiagram",
    },
    28: {
        "title": "Exception Hierarchy: Domain Errors & HTTP Mapping",
        "file": "08-exception-hierarchy.png",
        "mmd": "08-exception-hierarchy.mmd",
        "type": "classDiagram",
    },
}

def compile_diagrams():
    print("=" * 90)
    print("PHASE 1: RENDERING DOCS/UML MERMAID DIAGRAMS (mmdc, scale 3, white bg)")
    print("=" * 90)

    mmd_files = sorted(glob.glob(os.path.join(UML_DIR, "*.mmd")))
    for mmd_path in mmd_files:
        base = os.path.splitext(os.path.basename(mmd_path))[0]
        png_path = os.path.join(UML_DIR, f"{base}.png")
        svg_path = os.path.join(UML_DIR, f"{base}.svg")
        asset_png = os.path.join(ASSETS_DIR, f"{base}.png")

        print(f"  Rendering docs/uml/{base}.mmd -> .png & .svg")
        subprocess.run([
            "npx.cmd", "-y", "@mermaid-js/mermaid-cli",
            "-i", mmd_path,
            "-o", png_path,
            "-b", "white",
            "-s", "3",
            "-c", MERMAID_CFG,
            "-p", PUPPETEER_CFG
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        subprocess.run([
            "npx.cmd", "-y", "@mermaid-js/mermaid-cli",
            "-i", mmd_path,
            "-o", svg_path,
            "-b", "white",
            "-c", MERMAID_CFG,
            "-p", PUPPETEER_CFG
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        shutil.copyfile(png_path, asset_png)

    print(f"  Successfully built {len(mmd_files)} diagrams and synchronized slides/assets/.\n")

def compile_slides():
    print("=" * 90)
    print("PHASE 2: COMPILING PRESENTATION WITH XELATEX")
    print("=" * 90)
    for pass_num in (1, 2):
        print(f"  XeLaTeX compilation pass {pass_num}...")
        subprocess.run(
            ["xelatex", "-interaction=nonstopmode", "main.tex"],
            cwd="slides",
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    print("  slides/main.pdf compiled successfully.\n")

def render_previews():
    print("=" * 90)
    print("PHASE 3: RENDERING HIGH-RES SLIDE PREVIEWS AT 1920PX WIDTH")
    print("=" * 90)
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    for old_file in glob.glob(os.path.join(PREVIEW_DIR, "*.png")):
        try:
            os.remove(old_file)
        except OSError:
            pass

    subprocess.run([
        "pdftoppm", "-png",
        "-scale-to-x", "1920",
        "-scale-to-y", "-1",
        "slides/main.pdf",
        os.path.join(PREVIEW_DIR, "page")
    ], check=True)

    previews = sorted(glob.glob(os.path.join(PREVIEW_DIR, "page-*.png")))
    print(f"  Generated {len(previews)} preview slides at exactly 1920px width.\n")
    return previews

def check_svg_crossings(svg_path):
    """Detects line segment crossings in SVG edge paths."""
    if not os.path.exists(svg_path):
        return 0
    try:
        tree = ET.parse(svg_path)
        root = tree.getroot()
        paths = []
        for p in root.iter('{http://www.w3.org/2000/svg}path'):
            cls = p.get('class', '')
            if 'flowchart-link' in cls or 'edge' in cls or 'relation' in cls:
                d = p.get('d', '')
                tokens = re.findall(r'([A-Za-z]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)', d)
                pts = []
                i = 0
                cmd = ''
                while i < len(tokens):
                    if tokens[i].isalpha():
                        cmd = tokens[i]
                        i += 1
                    elif cmd in ('M', 'L'):
                        pts.append((float(tokens[i]), float(tokens[i+1])))
                        i += 2
                    elif cmd == 'Q':
                        pts.append((float(tokens[i+2]), float(tokens[i+3])))
                        i += 4
                    else:
                        i += 1
                if len(pts) >= 2:
                    paths.append(pts)

        def ccw(A, B, C):
            return (C[1]-A[1]) * (B[0]-A[0]) > (B[1]-A[1]) * (C[0]-A[0])

        def intersect(A, B, C, D):
            if (abs(A[0]-C[0]) < 1 and abs(A[1]-C[1]) < 1) or \
               (abs(A[0]-D[0]) < 1 and abs(A[1]-D[1]) < 1) or \
               (abs(B[0]-C[0]) < 1 and abs(B[1]-C[1]) < 1) or \
               (abs(B[0]-D[0]) < 1 and abs(B[1]-D[1]) < 1):
                return False
            return ccw(A,C,D) != ccw(B,C,D) and ccw(A,B,C) != ccw(A,B,D)

        crossings = 0
        for i in range(len(paths)):
            for j in range(i+1, len(paths)):
                p1 = paths[i]
                p2 = paths[j]
                for s1 in range(len(p1)-1):
                    for s2 in range(len(p2)-1):
                        if intersect(p1[s1], p1[s1+1], p2[s2], p2[s2+1]):
                            crossings += 1
        return crossings
    except Exception:
        return 0

def measure_smallest_cap_height(page_png_path):
    """
    Measures the cap height (capital letter height) of the smallest diagram text
    on a 1920px rendered slide image.
    In typography, cap height is the height of uppercase letters / ascenders (b, d, f, h, k, l, A-Z, 0-9).
    For lowercase x-height characters (a, c, e, m, n, o, r, s, u, v, w, x, z), cap height = x_height / 0.71.
    """
    img = cv2.imread(page_png_path)
    if img is None:
        return 0, 0, 0

    h_img, w_img = img.shape[:2]
    # Diagram region: inside the beamer frame content area (strictly between header y=150 and caption y=835)
    diag_area = img[150:835, 60:w_img - 60]

    gray = cv2.cvtColor(diag_area, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 220, 255, cv2.THRESH_BINARY_INV)

    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary, connectivity=8)

    # Filter connected components that represent characters
    char_boxes = []
    for s in stats[1:]:
        x, y, w, h, area = s[cv2.CC_STAT_LEFT], s[cv2.CC_STAT_TOP], s[cv2.CC_STAT_WIDTH], s[cv2.CC_STAT_HEIGHT], s[cv2.CC_STAT_AREA]
        # Ignore non-characters: lines (w>80 or h>80), tiny noise (area<12 or h<6 or w<2)
        if 6 <= h <= 65 and 3 <= w <= 65 and 12 <= area <= 2500:
            char_boxes.append((x, y, w, h, y + h))

    if not char_boxes:
        return 0, 0, 0

    # Group into text lines along baselines (within 3px vertical distance)
    char_boxes.sort(key=lambda c: c[4])
    lines = []
    curr = []
    curr_bot = None
    for c in char_boxes:
        if curr_bot is None or abs(c[4] - curr_bot) <= 3:
            curr.append(c)
            curr_bot = c[4]
        else:
            if len(curr) >= 2:
                lines.append(curr)
            curr = [c]
            curr_bot = c[4]
    if len(curr) >= 2:
        lines.append(curr)

    # For each text line in the diagram, determine its font cap height:
    # 1. If line contains uppercase letters or ascenders (char height >= 12px), max height is cap height.
    # 2. If line is lowercase x-height (char height 8..11px), cap height = max_h / 0.71.
    line_caps = []
    for l in lines:
        max_h = max(c[3] for c in l)
        if max_h >= 12:
            line_caps.append(float(max_h))
        elif max_h >= 8:
            line_caps.append(round(max_h / 0.71, 1))

    if not line_caps:
        return 0, 0, 0

    smallest_cap = int(round(min(line_caps)))
    p10_cap = np.percentile(line_caps, 10)
    median_cap = np.median(line_caps)

    return smallest_cap, p10_cap, median_cap

def check_notation(mmd_path, diag_type):
    with open(mmd_path, "r", encoding="utf-8-sig") as f:
        content = f.read()

    issues = []
    if diag_type == "classDiagram":
        if not re.search(r"^\s*classDiagram", content, re.MULTILINE):
            issues.append("Not Mermaid classDiagram")
        # Check that generalization uses <|--
        if "-->" in content and "<|--" not in content and "<|.." not in content:
            issues.append("Missing UML generalization <|--")
    elif diag_type == "useCase":
        if "fa:fa-" in content:
            issues.append("Contains icon font")
        if "«actor»" not in content and "&laquo;actor&raquo;" not in content:
            issues.append("Missing «actor» label")
    elif diag_type == "sequenceDiagram":
        if "mirrorActors: false" not in content and '"mirrorActors": false' not in content:
            issues.append("mirrorActors not false")

    return "PASS" if not issues else f"FAIL ({', '.join(issues)})"

def run_identifier_check():
    print("=" * 90)
    print("PHASE 4: ANTI-DRIFT IDENTIFIER VERIFICATION")
    print("=" * 90)
    res = subprocess.run(["npx.cmd", "tsx", "slides/check-identifiers.ts"], capture_output=True, text=True)
    print(res.stdout)
    return res.stdout

if __name__ == "__main__":
    compile_diagrams()
    compile_slides()
    previews = render_previews()

    print("=" * 90)
    print("PHASE 5: READABILITY & CAP HEIGHT AUDIT PER DIAGRAM PAGE (1920px WIDTH)")
    print("=" * 90)

    report_rows = []
    all_readability_pass = True

    for page_num, info in sorted(DIAGRAM_PAGES.items()):
        # preview filename page-%02d.png or page-N.png
        # pdftoppm produces page-01.png or page-1.png depending on total pages
        possible_names = [
            os.path.join(PREVIEW_DIR, f"page-{page_num:02d}.png"),
            os.path.join(PREVIEW_DIR, f"page-{page_num}.png")
        ]
        page_png = next((p for p in possible_names if os.path.exists(p)), None)

        if not page_png:
            print(f"Warning: preview for page {page_num} not found!")
            continue

        smallest_cap, p10_cap, median_cap = measure_smallest_cap_height(page_png)
        svg_file = os.path.join(UML_DIR, os.path.splitext(info["file"])[0] + ".svg")
        crossings = check_svg_crossings(svg_file)
        mmd_file = os.path.join(UML_DIR, info["mmd"])
        notation = check_notation(mmd_file, info["type"])

        readability_status = "PASS" if smallest_cap >= 12 else "FAIL"
        if smallest_cap < 12:
            all_readability_pass = False

        report_rows.append({
            "page": page_num,
            "title": info["title"],
            "uml_file": info["file"],
            "smallest_cap": smallest_cap,
            "median_cap": median_cap,
            "readability": readability_status,
            "notation": notation,
            "crossings": crossings
        })

    print(f"{'Page':5s} | {'UML File (docs/uml/)':32s} | {'Cap Min':7s} | {'Median':7s} | {'Status':6s} | {'Notation':8s} | {'Crossings':9s}")
    print("-" * 90)
    for r in report_rows:
        print(f"P{r['page']:02d}   | {r['uml_file']:32s} | {r['smallest_cap']:4d} px | {r['median_cap']:4.1f} px | {r['readability']:6s} | {r['notation']:8s} | {r['crossings']:9d}")
    print("=" * 90)

    ident_output = run_identifier_check()

    print("\n" + "=" * 90)
    print("AUDIT SUMMARY:")
    if all_readability_pass:
        print("  ALL DIAGRAM PAGES MEET READABILITY REQUIREMENT (>= 12 px cap height).")
    else:
        print("  SOME DIAGRAM PAGES FAILED READABILITY REQUIREMENT (< 12 px cap height).")
    print("=" * 90)
