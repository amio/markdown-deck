## `<markdown-deck />`

*press <kbd>space</kbd> to start*

---

A __web component__ for __presenters__

---

```html
<markdown-deck markdown="# 🦄" />
```

---

## Meet Shortcuts

---

## prev / next

<kbd>🠜</kbd> / <kbd>🠞</kbd>

---

## first / last

<kbd>🠝</kbd> / <kbd>🠟</kbd>

---

## if you are on mobile

*Guess what?*

swipe **left** and **right**

---

## DARK MODE

★ <kbd>D</kbd> ★

---

## THE EDITOR

★ <kbd>D</kbd> ★

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
  hashsync
  hotkey
  editor
></markdown-deck>
```

---

- `markdown="# Title"` The markdown string
- `index="0"` Control slide index
- `hashsync` Sync location hash with index
- `hotkey` Enable hotkeys

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

# The CLI

*to be announced*

---

# THANKS

<a href="https://github.com/amio/markdown-deck">
  <img src="https://badgen.net/badge/github/amio%2Fmarkdown-deck?icon&label" height="33px" />
</a>
