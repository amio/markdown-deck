# &lt;markdown-deck />

A web component for presenters.

- Customizable with web standard
- Keyboard shortcuts & touch gestures
- Dark mode for all theme
- Inline editor

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

    or set `markdown` attribute on `<markdown-deck />`:

    ```html
    <markdown-deck markdown="# Awesome Presentation" />
    ```

    or load markdown file with `src` attribute:

    ```html
    <markdown-deck src="deck.md" />
    ```

### Attributes

- `markdown="{string}"` the markdown to parse (override contents in `<script type="text/markdown"`)
- `src="{string}"` load markdown file from url
- `index="{number}"` current slide index (starting from 0)
- `hashsync` enable syncing index with location hash
- `hotkey` enable hotkey support
- `invert` invert color
- `editor` toggle editor

### Hotkeys

- __next__: <kbd>Space</kbd>
- __prev / next__: <kbd>⇦</kbd> / <kbd>⇨</kbd> or <kbd>J</kbd> / <kbd>L</kbd>
- __first / last__: <kbd>⇧</kbd> / <kbd>⇩</kbd>
- __invert color (dark theme)__: <kbd>I</kbd> or <kbd>D</kbd>
- __toggle print view__: <kbd>P</kbd>
- __toggle editor__: <kbd>ESC</kbd>

### Customization

- __Custom styles__

    Use `<style />` inside `<markdown-deck />` to apply custom styles:

    ```html
    <markdown-deck>
      <style>
        img[src*="badgen.net"] { height: 40px }
      </style>
    </markdown-deck>
    ```
