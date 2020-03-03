Features
===

Introduction
===
<i class="fa fa-file-text"></i> **CodiMD** is a real-time, multi-platform collaborative markdown note editor.
This means that you can write notes with other people on your **desktop**, **tablet** or even on the **phone**.
You can sign-in via multiple auth providers like **Facebook**, **Twitter**, **GitHub** and many more on the [_homepage_](/).

If you experience any _issues_, feel free to report it on [**GitHub**](https://github.com/hackmdio/codimd/issues).
Or meet us on [**Gitter**](https://gitter.im/hackmdio/hackmd) for dev-talk and interactive help.
**Thank you very much!**

Workspace
===
## Modes
**Desktop & Tablet**

<i class="fa fa-edit fa-fw"></i> Edit: See only the editor.
<i class="fa fa-eye fa-fw"></i> View: See only the result.
<i class="fa fa-columns fa-fw"></i> Both: See both in split view.

**Mobile**

<i class="fa fa-toggle-on fa-fw"></i> View: See only the result.
<i class="fa fa-toggle-off fa-fw"></i> Edit: See only the editor.

## Night Mode:
When you are tired of a white screen and like a night mode, click on the little moon <i class="fa fa-moon-o"></i> and turn on the night view of CodiMD.

The editor view, which is in night mode by default, can also be toggled between night and day view using the the little sun<i class="fa fa-sun-o fa-fw"></i>.

## Image Upload:
You can upload an image simply by clicking on the camera button <i class="fa fa-camera"></i>.
Alternatively, you can **drag-n-drop** an image into the editor. Even **pasting** images is possible!
This will automatically upload the image to **[imgur](http://imgur.com)**, **[Amazon S3](https://aws.amazon.com/s3/)**, **[Minio](https://minio.io)** or **local filesystem**, nothing to worry about. :tada:
![imgur](https://i.imgur.com/9cgQVqD.png)

## Share Notes:
If you want to share an **editable** note, just copy the URL.
If you want to share a **read-only** note, simply press publish button <i class="fa fa-share-square-o"></i> and copy the URL.

## Save a Note:
Currently, you can save to **Dropbox** <i class="fa fa-dropbox"></i> or save an `.md` file <i class="fa fa-file-text"></i> locally.

## Import Notes:
Similarly to the _save_ feature, you can also import an `.md` file from **Dropbox** <i class="fa fa-dropbox"></i>,
or import content from your **clipboard** <i class="fa fa-clipboard"></i>, and that can parse some **html** which might be useful :smiley:

## Permissions:
It is possible to change the access permission to a note through the little button on the top right of the view.
There are four possible options:

|                              |Owner read/write|Signed-in read|Signed-in write|Guest read|Guest write|
|:-----------------------------|:--------------:|:------------:|:-------------:|:--------:|:---------:|
|<span class="text-nowrap"><i class="fa fa-leaf fa-fw"></i> **Freely**</span>               |✔|✔|✔|✔|✔|
|<span class="text-nowrap"><i class="fa fa-pencil fa-fw"></i> **Editable**</span>           |✔|✔|✔|✔|✖|
|<span class="text-nowrap"><i class="fa fa-id-card fa-fw"></i> **Limited**</span>           |✔|✔|✔|✖|✖|
|<span class="text-nowrap"><i class="fa fa-lock fa-fw"></i> **Locked**</span>               |✔|✔|✖|✔|✖|
|<span class="text-nowrap"><i class="fa fa-umbrella fa-fw"></i> **Protected**</span>        |✔|✔|✖|✖|✖|
|<span class="text-nowrap"><i class="fa fa-hand-stop-o fa-fw"></i> **Private**</span>       |✔|✖|✖|✖|✖|


**Only the owner of the note can change the note's permissions.**

## Embed a Note:
Notes can be embedded as follows:

```xml
<iframe width="100%" height="500" src="https://hackmd.io/features" frameborder="0"></iframe>
```

## [Slide Mode](./slide-example):
You can use a special syntax to organize your note into slides.
After that, you can use the **[Slide Mode](./slide-example)** <i class="fa fa-tv"></i> to make a presentation.
Visit the above link for details.

To switch the editor into slide mode, set the [document type](./yaml-metadata#type) to `slide`.

View
===
## Table of Contents:
You can look at the bottom right section of the view area, there is a _ToC_ button <i class="fa fa-bars"></i>.
Pressing that button will show you a current _Table of Contents_, and will highlight which section you're at.
ToCs support up to **three header levels**.

## Permalink
Every header will automatically add a permalink on the right side.
You can hover and click <i class="fa fa-chain"></i> to anchor on it.

Edit:
===
## Editor Modes:
You can look in the bottom right section of the editor area, there you'll find a button with `sublime` on it.
When you click it, you can select 3 editor modes:

- sublime (default)
- emacs
- vim

## Shortcut Keys:
The shortcut keys depend on your selected editor mode. By default they are just like Sublime text, which is pretty quick and convenient.
> For more information, see [here](https://codemirror.net/demo/sublime.html).

For emacs:
> For more information, see [here](https://codemirror.net/demo/emacs.html).

For vim:
> For more information, see [here](https://codemirror.net/demo/vim.html).

## Auto-Complete:
This editor provides full auto-complete hints in markdown.
- Emojis: type `:` to show hints.
- Code blocks: type ` ``` ` and plus a character to show hint. <i hidden>```</i>
- Headers: type `#` to show hint.
- Referrals: type `[]` to show hint.
- Externals: type `{}` to show hint.
- Images: type `!` to show hint.

## Title:
This will take the first **level 1 header** as the note title.

## Tags:
Using tags as follows, the specified tags will show in your **history**.
###### tags: `features` `cool` `updated`

## [YAML Metadata](./yaml-metadata)
You can provide advanced note information to set the browser behavior (visit above link for details):
- robots: set web robots meta
- lang: set browser language
- dir: set text direction
- breaks: set to use line breaks
- GA: set to use Google Analytics
- disqus: set to use Disqus
- slideOptions: setup slide mode options

## ToC:
Use the syntax `[TOC]` to embed table of content into your note.

[TOC]

## Emoji
You can type any emoji like this :smile: :smiley: :cry: :wink:
> See full emoji list [here](http://www.emoji-cheat-sheet.com/).

## ToDo List:
- [ ] ToDos
  - [x] Buy some salad
  - [ ] Brush teeth
  - [x] Drink some water

## Code Block:
We support many programming languages, use the auto complete function to see the entire list.
```javascript=
var s = "JavaScript syntax highlighting";
alert(s);
function $initHighlight(block, cls) {
  try {
    if (cls.search(/\bno\-highlight\b/) != -1)
      return process(block, true, 0x0F) +
             ' class=""';
  } catch (e) {
    /* handle exception */
  }
  for (var i = 0 / 2; i < classes.length; i++) {
    if (checkCondition(classes[i]) === undefined)
      return /\d+[\s/]/g;
  }
}
```
> If you want **line numbers**, type `=` after specifying the code block languagues.
> Also, you can specify the start line number.
> Like below, the line number starts from 101:
```javascript=101
var s = "JavaScript syntax highlighting";
alert(s);
function $initHighlight(block, cls) {
  try {
    if (cls.search(/\bno\-highlight\b/) != -1)
      return process(block, true, 0x0F) +
             ' class=""';
  } catch (e) {
    /* handle exception */
  }
  for (var i = 0 / 2; i < classes.length; i++) {
    if (checkCondition(classes[i]) === undefined)
      return /\d+[\s/]/g;
  }
}
```

> Or you might want to continue the previous code block's line number, use `=+`

```javascript=+
var s = "JavaScript syntax highlighting";
alert(s);
```

> Somtimes you have a super long text without breaks. It's time to use `!` to wrap your code.

```!
When you’re a carpenter making a beautiful chest of drawers, you’re not going to use a piece of plywood on the back.
```

### Blockquote Tags:
> Using the syntax below to specifiy your **name, time and color** to vary the blockquotes.
> [name=ChengHan Wu] [time=Sun, Jun 28, 2015 9:59 PM] [color=#907bf7]
> > Even support the nest blockquotes!
> > [name=ChengHan Wu] [time=Sun, Jun 28, 2015 10:00 PM] [color=red]

## Externals

### YouTube
{%youtube aqz-KE-bpKQ %}

### Vimeo
{%vimeo 124148255 %}

### Gist
{%gist schacon/4277%}

### SlideShare
{%slideshare briansolis/26-disruptive-technology-trends-2016-2018-56796196 %}

### PDF
**Caution: this might be blocked by your browser if not using an `https` URL.**
{%pdf https://papers.nips.cc/paper/5346-sequence-to-sequence-learning-with-neural-networks.pdf %}

## MathJax

You can render *LaTeX* mathematical expressions using **MathJax**, as on [math.stackexchange.com](http://math.stackexchange.com/):

The *Gamma function* satisfying $\Gamma(n) = (n-1)!\quad\forall n\in\mathbb N$ is via the Euler integral

$$
x = {-b \pm \sqrt{b^2-4ac} \over 2a}.
$$

$$
\Gamma(z) = \int_0^\infty t^{z-1}e^{-t}dt\,.
$$

> More information about **LaTeX** mathematical expressions [here](http://meta.math.stackexchange.com/questions/5020/mathjax-basic-tutorial-and-quick-reference).

## UML Diagrams

### Sequence Diagrams

You can render sequence diagrams like this:

```sequence
Alice->Bob: Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!
Note left of Alice: Alice responds
Alice->Bob: Where have you been?
```

### Flow Charts

Flow charts can be specified like this:
```flow
st=>start: Start
e=>end: End
op=>operation: My Operation
op2=>operation: lalala
cond=>condition: Yes or No?

st->op->op2->cond
cond(yes)->e
cond(no)->op2
```

### Graphviz
```graphviz
digraph hierarchy {

                nodesep=1.0 // increases the separation between nodes

                node [color=Red,fontname=Courier,shape=box] //All nodes will this shape and colour
                edge [color=Blue, style=dashed] //All the lines look like this

                Headteacher->{Deputy1 Deputy2 BusinessManager}
                Deputy1->{Teacher1 Teacher2}
                BusinessManager->ITManager
                {rank=same;ITManager Teacher1 Teacher2}  // Put them on the same level
}
```

### Mermaid
```mermaid
gantt
    title A Gantt Diagram

    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    anther task      : 24d
```

### Abc
```abc
X:1
T:Speed the Plough
M:4/4
C:Trad.
K:G
|:GABc dedB|dedB dedB|c2ec B2dB|c2A2 A2BA|
GABc dedB|dedB dedB|c2ec B2dB|A2F2 G4:|
|:g2gf gdBd|g2f2 e2d2|c2ec B2dB|c2A2 A2df|
g2gf g2Bd|g2f2 e2d2|c2ec B2dB|A2F2 G4:|
```

### PlantUML
```plantuml
start
if (condition A) then (yes)
  :Text 1;
elseif (condition B) then (yes)
  :Text 2;
  stop
elseif (condition C) then (yes)
  :Text 3;
elseif (condition D) then (yes)
  :Text 4;
else (nothing)
  :Text else;
endif
stop
```

### Vega-Lite
```vega
{
  "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
  "data": {"url": "https://vega.github.io/editor/data/barley.json"},
  "mark": "bar",
  "encoding": {
    "x": {"aggregate": "sum", "field": "yield", "type": "quantitative"},
    "y": {"field": "variety", "type": "nominal"},
    "color": {"field": "site", "type": "nominal"}
  }
}
```

> More information about **sequence diagrams** syntax [here](http://bramp.github.io/js-sequence-diagrams/).
> More information about **flow charts** syntax [here](http://adrai.github.io/flowchart.js/).
> More information about **graphviz** syntax [here](http://www.tonyballantyne.com/graphs.html)
> More information about **mermaid** syntax [here](http://mermaid-js.github.io/mermaid)
> More information about **abc** syntax [here](http://abcnotation.com/learn)
> More information about **plantuml** syntax [here](http://plantuml.com/index)
> More information about **vega** syntax [here](https://vega.github.io/vega-lite/docs)

Alert Area
---
:::success
Yes :tada:
:::

:::info
This is a message :mega:
:::

:::warning
Watch out :zap:
:::

:::danger
Oh No! :fire:
:::

:::spoiler Click to show details
You found me :stuck_out_tongue_winking_eye:
:::

## Typography

### Headers

```
# h1 Heading
## h2 Heading
### h3 Heading
#### h4 Heading
##### h5 Heading
###### h6 Heading
```

### Horizontal Rules

___

---

***


### Typographic Replacements

Enable typographer option to see result.

(c) (C) (r) (R) (tm) (TM) (p) (P) +-

test.. test... test..... test?..... test!....

!!!!!! ???? ,,

Remarkable -- awesome

"Smartypants, double quotes"

'Smartypants, single quotes'

### Emphasis

**This is bold text**

__This is bold text__

*This is italic text*

_This is italic text_

~~Deleted text~~

lu~lala~

Superscript: 19^th^

Subscript: H~2~O

++Inserted text++

==Marked text==

{ruby base|rubytext}

### Blockquotes


> Blockquotes can also be nested...
>> ...by using additional greater-than signs right next to each other...
> > > ...or with spaces between arrows.


### Lists

#### Unordered

+ Create a list by starting a line with `+`, `-`, or `*`
+ Sub-lists are made by indenting 2 spaces:
  - Marker character change forces new list start:
    * Ac tristique libero volutpat at
    + Facilisis in pretium nisl aliquet
    - Nulla volutpat aliquam velit
+ Very easy!

#### Ordered

1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
3. Integer molestie lorem at massa


1. You can use sequential numbers...
1. ...or keep all the numbers as `1.`
1. feafw
2. 332
3. 242
4. 2552
1. e2

Start numbering with offset:

57. foo
1. bar

### Code

Inline `code`

Indented code

    // Some comments
    line 1 of code
    line 2 of code
    line 3 of code


Block code "fences"

```
Sample text here...
```

Syntax highlighting

``` js
var foo = function (bar) {
  return bar++;
};

console.log(foo(5));
```

### Tables

| Option | Description |
| ------ | ----------- |
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |

Right aligned columns

| Option | Description |
| ------:| -----------:|
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |

Left aligned columns

| Option | Description |
|:------ |:----------- |
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |

Center aligned columns

| Option | Description |
|:------:|:-----------:|
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |


### Links
[link text](http://dev.nodeca.com)
[link with title](http://nodeca.github.io/pica/demo/ "title text!")
Autoconverted link https://github.com/nodeca/pica


### Images
![Minion](https://octodex.github.com/images/minion.png)
![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")
Like links, Images also have a footnote style syntax
![Alt text][id]
With a reference later in the document defining the URL location:

[id]: https://octodex.github.com/images/dojocat.jpg  "The Dojocat"

![Minion](https://octodex.github.com/images/minion.png =200x200)
Show the image with given size

### Footnotes

Footnote 1 link[^first].
Footnote 2 link[^second].
Inline footnote^[Text of inline footnote] definition.
Duplicated footnote reference[^second].

[^first]: Footnote **can have markup**
    and multiple paragraphs.
[^second]: Footnote text.

### Definition Lists

Term 1

:   Definition 1
with lazy continuation.

Term 2 with *inline markup*

:   Definition 2

        { some code, part of Definition 2 }

    Third paragraph of definition 2.

_Compact style:_

Term 1
  ~ Definition 1

Term 2
  ~ Definition 2a
  ~ Definition 2b

### Abbreviations

This is an HTML abbreviation example.
It converts "HTML", but keeps intact partial entries like "xxxHTMLyyy" and so on.

*[HTML]: Hyper Text Markup Language
