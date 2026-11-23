#!/usr/bin/env python3
"""Replace every page footer with the luxury visit-CTA footer. Bodies untouched."""
from __future__ import annotations

import importlib.util
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_chrome():
    spec = importlib.util.spec_from_file_location(
        "apply_info_chrome", ROOT / "scripts" / "apply-info-chrome.py"
    )
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(mod)
    return mod


def main() -> None:
    mod = load_chrome()
    for path in ROOT.rglob("*.html"):
        rel = str(path.relative_to(ROOT))
        if rel.startswith(("node_modules/", "tests/", "scripts/")):
            continue
        html = path.read_text()
        prefix = mod.prefix_for(rel)
        new_footer = mod.footer(prefix)
        updated, n = re.subn(
            r'<footer class="site-footer">[\s\S]*?</footer>\s*(?:<a class="whatsapp-float"[\s\S]*?</a>)?',
            new_footer,
            html,
            count=1,
        )
        if not n:
            print("skip", rel)
            continue
        updated = re.sub(r"(assets/css/info\.css)\?v=\d+", r"\1?v=15", updated)
        path.write_text(updated)
        print("footer", rel)


if __name__ == "__main__":
    main()
