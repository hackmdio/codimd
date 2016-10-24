Slide example
===
This feature still in beta, may have some issues.

For details please visit:
https://github.com/hakimel/reveal.js/

You can use `URL query` or `slideOptions` of the YAML metadata to customize your slides.

---

## First slide

`---`

Is the divider of slides

----

### First branch of first slide

`----`

Is the divider of branches

----

### Second branch of first slide

`<!-- .element: class="fragment" data-fragment-index="1" -->`

Is the fragment syntax

- Item 1<!-- .element: class="fragment" data-fragment-index="1" -->
- Item 2<!-- .element: class="fragment" data-fragment-index="2" -->

---

## Second slide

<!-- .slide: data-background="#1A237E" -->

`<!-- .slide: data-background="#1A237E" -->`

Is the background syntax

---

<!-- .slide: data-transition="zoom" -->

`<!-- .slide: data-transition="zoom" -->`

Is the transition syntax

you can use:  
none/fade/slide/convex/concave/zoom

---

<!-- .slide: data-transition="fade-in convex-out" -->

`<!-- .slide: data-transition="fade-in convex-out" -->`

Also can set different in/out transition

you can use:  
none/fade/slide/convex/concave/zoom  
postfix with `-in` or `-out`

---

<!-- .slide: data-transition-speed="fast" -->

`<!-- .slide: data-transition-speed="fast" -->`

Custom the transition speed!

you can use:  
default/fast/slow

---

# The End