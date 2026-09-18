from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "app" / "out"
WEEKLY_COMPONENT_PATH = (
    ROOT / "app" / "src" / "components" / "home" / "WeeklyHighlights.tsx"
)
PROFILE_SOURCE = ROOT / "app" / "src" / "pages" / "profile.tsx"
SETTINGS_SOURCE = ROOT / "app" / "src" / "pages" / "settings.tsx"
SCROLL_SOURCE = ROOT / "app" / "src" / "components" / "ScrollActivity.tsx"


def require(content: str, value: str, source: str) -> None:
    assert value in content, f"{source} is missing {value!r}"


def reject(content: str, value: str, source: str) -> None:
    assert value not in content, f"{source} still contains {value!r}"


html = (OUT / "index.html").read_text()
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

route_markers = {
    "about.html": "about-page",
    "worship.html": "worship-page",
    "contact.html": "contact-page",
    "events.html": "events-page",
    "sermons.html": "sermons-page",
    "resources.html": "resources-page",
    "login.html": "login-page",
}

for route, marker in route_markers.items():
    require((OUT / route).read_text(), marker, route)

for route in ("events/christmas-service-2025.html", "events/youth-retreat-2025.html"):
    require((OUT / route).read_text(), "event-detail-page", route)

require(PROFILE_SOURCE.read_text(), "profile-page", "profile source")
require(SETTINGS_SOURCE.read_text(), "settings-page", "settings source")
require(SCROLL_SOURCE.read_text(), "is-scrolling", "scroll activity source")

for exported_file in OUT.rglob("*.html"):
    exported = exported_file.read_text()
    reject(exported, "Community Church", str(exported_file))
    reject(exported, 'src="https://example.com', str(exported_file))
    reject(exported, 'src="https://www.youtube.com/watch?v=VIDEO_ID', str(exported_file))
    reject(exported, "Sydney Samil Church | Sydney Samil Church", str(exported_file))

print("Sitewide static export checks passed.")
