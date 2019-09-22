## `<markdown-deck />`

*press <kbd>space</kbd> to start*

---

A __web component__ for __presenters__

---

*Web Components ABC*

```html
<script src="https://unpkg.com/markdown-deck"></script>

<markdown-deck markdown="# Title">
</markdown-deck>
```

---

```html
<markdown-deck markdown="# Title" index="0" hash-sync hotkey>
  <style>
    strong { color: red } /* custom styles */
  </style>
</markdown-deck>
```
---

# Meet Shortcuts

---

## prev / next

<kbd>🠜</kbd> / <kbd>🠞</kbd>

---

## first / last

<kbd>🠝</kbd> / <kbd>🠟</kbd>

---

## if you are on mobile

*Guess what?*

swipe **left** and **right** 👋

---

# DARK MODE

<kbd>D</kbd>

---

## Custom Styles

```
<markdown-deck markdown="# Title">
  <style>
    @import url("https://fonts.googleapis.com/css?family=Roboto+Slab:400,400i")
    .slide { font-family: "Roboto Slab", serif }
  </style>
</markdown-deck>
```

---

## Try the Editor

https://markdown-deck.now.sh/editor.html

---

# Thanks

```html
<markdown-deck markdown="🦄" />
```
