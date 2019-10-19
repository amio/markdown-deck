## `<markdown-deck />`

*press <kbd>space</kbd> to start*

---

A __web component__ for __presenters__

```html
<markdown-deck markdown="# 🦄" />
```

---

## Meet Shortcuts

---

prev / next <kbd>left</kbd> / <kbd>right</kbd>

first / last <kbd>up</kbd> / <kbd>down</kbd>

---

## if you are on mobile

*Guess what?*

swipe **left** and **right**

---

## DARK MODE

★ <kbd>D</kbd> ★

---

## THE EDITOR

★ <kbd>ESC</kbd> ★

---

## PRINT VIEW

★ <kbd>P</kbd> ★

then `CMD+P` (save as pdf)

---

# Show me the code

---

*Web Components ABC*

```html
<script src="https://unpkg.com/markdown-deck"></script>

<markdown-deck markdown="# Title">
</markdown-deck>
```

---

*Attributes*

```html
<markdown-deck
  markdown="# Title" 
  index="0"
  hotkey
  hashsync
></markdown-deck>
```

---

*Attributes*

- `markdown="# Title"` The markdown
- `index="0"` Slide index
- `hotkey` Enable hotkeys
- `hashsync` Sync with location hash

---

*Attributes*

- `src="deck.md"` Load external markdown file
- `css="deck.css"` Load css file for customization

---

## Custom Styles

```html
<markdown-deck markdown="# Title">
  <style>
    @import url("https://fonts.googleapis.com/css?family=Roboto");
    .slide { font-family: "Roboto", serif }
    strong { color: #63F }
  </style>
</markdown-deck>
```

---

## Per Slide Styles

```
_write style tag within markdown_

<style>
  .slide { background: url(...) }
  .content { filter: invert() }
  code { opacity: 0.8 }
</style>
```

<style>
.slide {
  background: url(https://el-capitan.now.sh);
  background-size: cover;
}
.content { filter: invert() }
code { opacity: 0.8 }
</style>

---

## More usage

https://github.com/amio/markdown-deck

---

# The CLI

`npm install eloc`

_the eloquence cli_

---

# THANKS

[![badge-src]][badge-link]

[badge-src]: https://badgen.net/badge/github/amio%2Fmarkdown-deck?icon&label
[badge-link]: https://github.com/amio/markdown-deck
