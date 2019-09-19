# markdown-deck

The web component for presenters.

## Usage

Basically, just put markdown inside `<script type="text/markdown" />` inside `<markdown-deck />`:

```html
<script type="module" src="https://unpkg.com/markdown-deck/dist/index.min.js"></script>

<markdown-deck>
  <script type="text/markdown">
    # Title
    ---
    ## Hello World!
    ---
    ## The END
  </script>
</markdown-deck>
```

### Custom Styles

```html
<script type="module" src="https://unpkg.com/markdown-deck/dist/index.min.js"></script>

<markdown-deck>
  <style>
    img[src*="badgen.net"] { height: 40px }
  </style>
</markdown-deck>
```
