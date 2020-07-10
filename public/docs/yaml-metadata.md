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

title
---
This option will set the note title which prior than content title.

> default: not set

**Example**
```yml
title: meta title
```

description
---
This option will set the note description.

> default: not set

**Example**
```yml
description: meta description
```

image
---
This option will set the html meta tag 'image'.

> default: not set

**Example**
```yml
image: https://raw.githubusercontent.com/hackmdio/codimd/develop/public/screenshot.png
```

tags
---
This option will set the tags which prior than content tags.

> default: not set

**Example**
```yml
tags: features, cool, updated
```

robots
---
This option will give below meta in the note head meta:
```xml
<meta name="robots" content="your_meta">
```
So you can prevent any search engine index your note by set `noindex, nofollow`.

> default: not set

**Example**
```yml
robots: noindex, nofollow
```

lang
---
This option will set the language of the note, that might alter some typography of it.
You can find your the language code in ISO 639-1 standard:
https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes

> default: not set (which will be en)

**Example**
```yml
langs: ja-jp
```

dir
---
This option specifies the direction of the text in this note.
You can only use whether `rtl` or `ltr`.
Look more at here:
http://www.w3.org/International/questions/qa-html-dir

> default: not set (which will be ltr)

**Example**
```yml
dir: rtl
```

breaks
---
This option means the hardbreaks in the note will be parsed or be ignore.
The original markdown syntax breaks only if you put space twice, but CodiMD choose to breaks every time you enter a break.
You can only use whether `true` or `false`.

> default: not set (which will be true)

**Example**
```yml
breaks: false
```

GA
---
This option allows you to enable Google Analytics with your ID.

> default: not set (which won't enable)

**Example**
```yml
GA: UA-12345667-8
```

disqus
---
This option allows you to enable Disqus with your shortname.

> default: not set (which won't enable)

**Example**
```yml
disqus: codimd
```

type
---
This option allows you to switch the document view to the slide preview, to simplify live editing of presentations.

> default: not set

**Example:**
```yml
type: slide
```

slideOptions
---
This option allows you to provide custom options to slide mode.
Please below document for more details:
https://github.com/hakimel/reveal.js/#configuration

You could also set slide theme which named in below css files:
https://github.com/hakimel/reveal.js/tree/master/css/theme

**Notice: always use two spaces as indention in YAML metadata!**

> default: not set (which use default slide options)

**Example**
```yml
slideOptions:
  transition: fade
  theme: white
```
