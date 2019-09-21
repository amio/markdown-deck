# markdown-deck

The web component for presenters.

## Usage

1. Import script from https://unpkg.com/markdown-deck/dist/index.min.js

    ```html
    <script type="module" src="https://unpkg.com/markdown-deck/dist/index.min.js"></script>
    ```

2. Put markdown content inside `<script type="text/markdown" />` inside `<markdown-deck />`:

    ```html
    <markdown-deck hotkey hashsync>
      <script type="text/markdown">
        # Title
        ---
        ## Hello World!
        ---
        ## The END
      </script>
    </markdown-deck>
    ```

    or use `markdown` attr:

    ```html
    <markdown-deck markdown="# Awesome Presentation" />
    ```

    or load markdown file with `src` attr:

    ```html
    <markdown-deck src="deck.md" />
    ```

### Attributes

- `markdown="{string}"` the markdown to parse (will override contents in `<script type="text/markdown"`)
- `src="{string}"` load markdown file from url
- `index="{number}"` current slide index (starting from 0)
- `hashsync` enable syncing index with location hash
- `hotkey` enable hotkey support

#### Hotkeys

- prev / next
  - <key>🠘</key> / <key>🠚</key>
  - <key>J</key> / <key>L</key>
- first / last
  - <key>🠙</key> / <key>🠛</key>
  - <key>J</key> / <key>L</key>
- invert color (dark theme)
  - <key>I</key> or <key>D</key>

### Custom Styles

Use `<style />` inside `<markdown-deck />` to apply custom styles:

```html
<markdown-deck>
  <style>
    img[src*="badgen.net"] { height: 40px }
  </style>
</markdown-deck>
```
