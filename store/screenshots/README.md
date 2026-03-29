# Screenshots

Screenshots are generated from HTML source files and distributed to each platform folder.

## Structure

```
source/         ← HTML generators (edit these)
  marketing.html     — 5 marketing scenes (?state=1-5)
  app-1..5.html      — App UI screenshots (dark/light themes)
  marquee.html       — Chrome Web Store marquee banner

universal/      ← Master renders at 1280×800 (generated, not in git)
  marketing-1..5.png
  app-1..5.png
```

Platform folders (populated from universal/, not in git):
- `store/safari/screenshots/`  — Mac App Store (1280×800 PNG)
- `store/chrome/screenshots/`  — Chrome Web Store (1280×800 PNG)
- `store/firefox/screenshots/` — Firefox Add-ons (1280×800 PNG)

## Regenerating

Screenshots are served via `http://localhost:9878` during generation.
Start the local server first, then run:

```bash
# Capture all marketing scenes
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for n in 1 2 3 4 5; do
  "$CHROME" --headless=new --window-size=1280,800 \
    --screenshot="universal/marketing-${n}.png" --no-sandbox --hide-scrollbars \
    "http://localhost:9878/store/screenshots/source/marketing.html?state=${n}"
done

# Capture all app UI scenes
for n in 1 2 3 4 5; do
  "$CHROME" --headless=new --window-size=1280,800 \
    --screenshot="universal/app-${n}.png" --no-sandbox --hide-scrollbars \
    "http://localhost:9878/store/screenshots/source/app-${n}.html"
done

# Copy to platform folders
cp universal/*.png ../safari/screenshots/
cp universal/*.png ../chrome/screenshots/
cp universal/*.png ../firefox/screenshots/
```
