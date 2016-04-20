---
robots: index, follow
lang: en
dir: ltr
breaks: true
---

Supported YAML metadata
===

First you need to insert syntax like this at the **start** of the note:
```
---
YAML metas
---
```

Replace the "YAML metas" in this section with any YAML options as below.
You can also refer to this note's source code.

robots
---
This option will give below meta in the note head meta:
```xml
<meta name="robots" content="your_meta">
```
So you can prevent any search engine index your note by set `noindex, nofollow`.

> default: not 

**Example**
```xml
robots: noindex, nofollow
```

lang
---
This option will set the language of the note, that might alter some typography of it.
You can find your the language code in ISO 639-1 standard:
https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes

> default: not set (which will be en)

**Example**
```xml
langs: ja-jp
```

dir
---
This option provide to describe the direction of the text in this note.
You can only use whether `rtl` or `ltr`.
Look more at here:
http://www.w3.org/International/questions/qa-html-dir

> default: not set (which will be ltr)

**Example**
```xml
dir: rtl
```

breaks
---
This option means the hardbreaks in the note will be parsed or be ignore.
The original markdown syntax breaks only if you put space twice, but HackMD choose to breaks every time you enter a break.
You can only use whether `true` or `false`.

> default: not set (which will be true)

**Example**
```xml
breaks: false
```

mathjax
---
This option let you to choose to parse mathjax syntax or not.

> default: not set (which will be true)

**Example**
```xml
mathjax: false
```

spellcheck
---
**Warning: Experimental feature!**
This option let you to choose to enable spell checking feature or not.

> default: not set (which will be false)

**Example**
```xml
spellcheck: true
```