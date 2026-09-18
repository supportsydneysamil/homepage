from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "app" / "out" / "index.html"
WEEKLY_COMPONENT_PATH = (
    ROOT / "app" / "src" / "components" / "home" / "WeeklyHighlights.tsx"
)


def require(content: str, value: str, source: str) -> None:
    assert value in content, f"{source} is missing {value!r}"


def reject(content: str, value: str, source: str) -> None:
    assert value not in content, f"{source} still contains {value!r}"


html = HTML_PATH.read_text()
assert WEEKLY_COMPONENT_PATH.exists(), "weekly highlights component has not been created"
weekly_source = WEEKLY_COMPONENT_PATH.read_text()

for marker in (
    "home-hero",
    "home-quick-info",
    "home-weekly",
    "home-visit",
    "home-pastor",
    "home-next-steps",
    "/church-bg.png",
):
    require(html, marker, "exported homepage")

require(weekly_source, "weekly-empty", "weekly highlights component")

for removed in (
    "images.unsplash.com",
    "20+",
    "50+",
    "Entry photo placeholder",
    "입구 사진 자리",
    "<form",
):
    reject(html, removed, "exported homepage")

print("Homepage static export checks passed.")
