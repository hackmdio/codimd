---
type: slide
slideOptions:
  transition: slide
---

# Slide example

This feature still in beta, may have some issues.

For details please visit:
https://github.com/hakimel/reveal.js/

You can use `URL query` or `slideOptions` of the YAML metadata to customize your slides.

---

## First slide

`---`

Is the divider of slides

----

### First branch of first the slide

`----`

Is the divider of branches

Use the _Space_ key to navigate through all slides.

----

### Second branch of first the slide

Nested slides are useful for adding additional detail underneath a high-level horizontal slide.

---

## Point of View

Press **ESC** to enter the slide overview.

---

## Touch Optimized

Presentations look great on touch devices, like mobile phones and tablets. Simply swipe through your slides.

---

## Fragments

`<!-- .element: class="fragment" data-fragment-index="1" -->`

Is the fragment syntax

Hit the next arrow...

... to step through ...

<span>... a<!-- .element: class="fragment" data-fragment-index="1" --></span> <span>fragmented<!-- .element: class="fragment" data-fragment-index="2" --></span> <span>slide.<!-- .element: class="fragment" data-fragment-index="3" --></span>

Note:
  This slide has fragments which are also stepped through in the notes window.

---

## Fragment Styles

There are different types of fragments, like:

grow

shrink

fade-out

fade-up (also down, left and right!)

current-visible

Highlight <span><!-- .element: class="fragment highlight-red" -->red</span> <span><!-- .element: class="fragment highlight-blue" -->blue</span> <span><!-- .element: class="fragment highlight-green"-->green</span>

---

<!-- .slide: data-transition="zoom" -->

## Transition Styles
Different background transitions are available via the transition option. This one's called "zoom".

`<!-- .slide: data-transition="zoom" -->`

Is the transition syntax

You can use:

none/fade/slide/convex/concave/zoom

---

<!-- .slide: data-transition="fade-in convex-out" -->

`<!-- .slide: data-transition="fade-in convex-out" -->`

Also, you can set different in/out transition

You can use:

none/fade/slide/convex/concave/zoom

postfix with `-in` or `-out`

---

<!-- .slide: data-transition-speed="fast" -->

`<!-- .slide: data-transition-speed="fast" -->`

Custom the transition speed!

You can use:

default/fast/slow

---

## Themes

reveal.js comes with a few themes built in:

Black (default) - White - League - Sky - Beige - Simple

Serif - Blood - Night - Moon - Solarized

It can be set in YAML slideOptions

---

<!-- .slide: data-background="#1A237E" -->

`<!-- .slide: data-background="#1A237E" -->`

Is the background syntax

---

<!-- .slide: data-background="https://s3.amazonaws.com/hakim-static/reveal-js/image-placeholder.png" data-background-color="#005" -->

<div style="color: #fff;">

## Image Backgrounds

`<!-- .slide: data-background="image.png"-->`

</div>

----

<!-- .slide: data-background="https://s3.amazonaws.com/hakim-static/reveal-js/image-placeholder.png" data-background-repeat="repeat" data-background-size="100px" data-background-color="#005" -->

<div style="color: #fff;">

## Tiled Backgrounds

`<!-- .slide: data-background="image.png" data-background-repeat="repeat" data-background-size="100px" -->`

</div>

----

<!-- .slide: data-background-video="https://s3.amazonaws.com/static.slid.es/site/homepage/v1/homepage-video-editor.mp4,https://s3.amazonaws.com/static.slid.es/site/homepage/v1/homepage-video-editor.webm" data-background-color="#000000" -->

<div style="background-color: rgba(0, 0, 0, 0.9); color: #fff; padding: 20px;">

## Video Backgrounds

`<!-- .slide: data-background-video="video.mp4,video.webm" -->`

</div>

----

<!-- .slide: data-background="http://i.giphy.com/90F8aUepslB84.gif" -->

## ... and GIFs!

---

## Pretty Code

``` javascript
function linkify( selector ) {
  if( supports3DTransforms ) {

    const nodes = document.querySelectorAll( selector );

    for( const i = 0, len = nodes.length; i < len; i++ ) {
      var node = nodes[i];

      if( !node.className ) {
        node.className += ' roll';
      }
    }
  }
}
```
Code syntax highlighting courtesy of [highlight.js](http://softwaremaniacs.org/soft/highlight/en/description/).

---

## Marvelous List

- No order here
- Or here
- Or here
- Or here

---

## Fantastic Ordered List

1. One is smaller than...
2. Two is smaller than...
3. Three!

---

## Tabular Tables

| Item     | Value | Quantity |
| ----     | ----- | -------- |
| Apples   | $1    | 7        |
| Lemonade | $2    | 18       |
| Bread    | $3    | 2        |

---

## Clever Quotes

> “For years there has been a theory that millions of monkeys typing at random on millions of typewriters would reproduce the entire works of Shakespeare. The Internet has proven this theory to be untrue.”

---

## Intergalactic Interconnections

You can link between slides internally, [like this](#/1/3).

---

## Speaker

There's a [speaker view](https://github.com/hakimel/reveal.js#speaker-notes). It includes a timer, preview of the upcoming slide as well as your speaker notes.

Press the _S_ key to try it out.

Note:
  Oh hey, these are some notes. They'll be hidden in your presentation, but you can see them if you open the speaker notes window (hit `s` on your keyboard).

---

## Take a Moment

Press `B` or `.` on your keyboard to pause the presentation. This is helpful when you're on stage and want to take distracting slides off the screen.

---

## Print your Slides

Down below you can find a print icon<i class="fa fa-fw fa-print"></i>.

After you click on it, use the print function of your browser (either CTRL+P or cmd+P) to print the slides as PDF. [See official reveal.js instructions for details](https://github.com/hakimel/reveal.js#instructions-1)

---

# The End
