Release Notes
===

<i class="fa fa-tag"></i> 0.4.3 `espresso` <i class="fa fa-clock-o"></i> 2016-06-28 02:04
---
### Features
* Add support of spellcheck
* Add support of light editor theme
* Add support of embed pdf
* Add support of exporting raw html
* Add revision modal with UIs and support marking patch diff texts
* Add support of saving note revision

### Enhancements
* Update to extend login info cookies to 365 days to reduce reductant page refresh
* Update to support new metadata: title, description, tags and google-analytics
* Prevent crawling editing note to enhance privacy
* Update to remove all data lines attributes to gain better update performance
* Update refresh modal to show more detail informations
* Update to make cursor tag default as hover mode to prevent tag overlay other lines
* Update highlight.js to version 9.4.0 and use bower dependency
* Improve history performance

### Fixes
* Fix history filter tags and search keyword might not apply after refresh
* Fix part class in list item might infect buildMap process
* Fix pdf tmp path is missing a folder slash before timestamp
* Fix realtime connection get stock when lots of client try to connect at same moment
* Fix locked or private permission should block any operation if owner is null
* Add back missing support of image size syntax in 0.4.2
* Fix update permission might cause duplicate view rendering
* Fix on paste long document to editor might cause scroll not syncing
* Workaround CodeMirror won't draw selections outside of the viewport
* Fix to make socket keep retry after disconnect on server maintenance

### Removes
- Remove metadata spellcheck support
- Remove robot meta on note edit page and html template


<i class="fa fa-tag"></i> 0.4.2 `cappuccino` <i class="fa fa-clock-o"></i> 2016-04-22 10:43
---
### Features
+ Support sync scrolling to edit area
+ Support import and export with GitLab snippet
+ Support GitLab signin
+ Add cheatsheet and help modal

### Enhancements
* Upgrade CodeMirror to version 5.15.3
* Support maintenance mode and gracefully exit process on signal
* Update to update doc in db when doc in filesystem have newer modified time
* Update to replace animation acceleration library from gsap to velocity
* Support image syntax with size 
* Update textcomplete rules to support more conditions
* Update to use bigger user profile image
* Support showing signin button only when needed

### Fixes
* Fix other clients' cursor might disappear or move out of bound
* Fix to handle user profile image not exists
* Fix potential toolbar layout glitch
* Fix imgur uploads should always use https to avoid mix-content warning
* Fix to change fullscreen key to avoid OS key conflicts
* Fix and change ESC key in Vim mode

<i class="fa fa-tag"></i> 0.4.1 <i class="fa fa-clock-o"></i> 2016-04-22 10:43
---
### Enhancements
* Support when client domain not provided will use window.location variable
* Support when domain not provided will use relative path
* Support DOMAIN and URL_PATH environment variables


<i class="fa fa-tag"></i> 0.4.0 `first-year` <i class="fa fa-clock-o"></i> 2016-04-20 14:30
---
### Features
+ Support docs
+ Support Ionicons and Octicons
+ Support mermaid diagram
+ Support import and export with Gist
+ Support import and export with Google Drive
+ Support more options in YAML metadata
+ Support change keymap and indentation size/type

### Enhancements
* Change header anchor styles
* Refactor server code and configs
* Support experimental spell checking
* Upgrade CodeMirror to 5.13.5
* Update to emit info and disconnect clients if updater get errors
* Support to indicate if the note status is created or updated
* Support more DB types
* Server now use ORM for DBs
* Support static file cache
* Support more ssl settings
* Improve server stablilty
* Improve server performance
* Support Ionicons
* Support container syntax and styles
* Improve input performance
* Change markdown engine from remarkable to markdown-it
* Server now support set sub url path
* Support textcomplete in multiple editing
* Update to filter XSS on rendering
* Update to make sync scroll lerp on last line
* Update to make continue list in todo list default as unchecked
* Support auto indent whole line in list or blockquote

### Fixes
* Fix status bar might be inserted before loaded
* Fix mobile layout and focus issues
* Fix editor layout and styles might not handle correctly
* Fix all diagram rendering method and styles to avoid partial update gets wrong
* Fix to ignore process image which already wrapped by link node
* Fix when cut or patse scroll map might get wrong
* Fix to handle more socket error and info status
* Fix textcomplete not matching properly
* Fix and refactor cursor tag and cursor menu
* Fix Japanese, Chinese font styles
* Fix minor bugs of UI and seletor syntaxes

<i class="fa fa-tag"></i> 0.3.4 `techstars` <i class="fa fa-clock-o"></i> 2016-01-19 00:22
---
### Features
+ Beta Support slide mode
+ Beta Support export to PDF
+ Support TOC syntax
+ Support embed slideshare and speakerdeck
+ Support Graphviz charts
+ Support YAML metadata
+ Support private permission

### Enhancements
* Support pin note in history
* Support IE9 and above
* Support specify and continue line number in code block
* Changed all embed layout to 100% width
* Added auto detect default mode
* Support show last change note user
* Upgrade CodeMirror to 5.10.1 with some manual patches
* Improved server performance
* Support autocomplete for code block languages of charts

### Fixes
* Fixed some server connection issues
* Fixed several issues cause scrollMap incorrect
* Fixed cursor animation should not apply on scroll
* Fixed a possible bug in partial update
* Fixed internal href should not link out
* Fixed dropbox saver url not correct
* Fixed mathjax might not parse properly
* Fixed sequence diagram might render multiple times

<i class="fa fa-tag"></i> 0.3.3 `moon-festival` <i class="fa fa-clock-o"></i> 2015-09-27 14:00
---
### Features
+ Added status bar below editor
+ Added resizable grid in both mode
+ Added title reminder if have unread changes
+ Support todo list change in the view mode
+ Support export to HTML
+ Changed to a new theme, One Dark(modified version)

### Enhancements
* Support extra tags in todo list
* Changed overall font styles
* Optimized build sync scroll map, gain lots better performance
* Support and improved print styles
* Support to use CDN
* Image and link will href to new tab ors window
* Support auto scroll to corresponding position when change mode from view to edit
* Minor UI/UX tweaks

### Fixes
* Change DB schema to support long title
* Change editable permission icon to avoid misunderstanding
* Fixed some issues in OT and reconnection
* Fixed cursor menu and cursor tag are not calculate doc height properly
* Fixed scroll top might not animate
* Fixed scroll top not save and restore properly
* Fixed history might not delete or clear properly
* Fixed server might not clean client properly

<i class="fa fa-tag"></i> 0.3.2 `typhoon` <i class="fa fa-clock-o"></i> 2015-07-11 12:30
---
### Features
+ Support operational transformation
+ Support show other user selections
+ Support show user profile image if available

### Enhancements
* Updated editor to 5.4.0
* Change UI share to publish to avoid misleading
* Added random color in blockquote tag
* Optimized image renderer, avoid duplicated rendering
* Optimized building syncscroll map, make it faster
* Optimized SEO on publish and edit note

<i class="fa fa-tag"></i> 0.3.1 `clearsky` <i class="fa fa-clock-o"></i> 2015-06-30 16:00
---
### Features
+ Added auto table of content
+ Added basic permission control
+ Added view count in share note

### Enhancements
* Toolbar now will hide in single view
* History time now will auto update
* Smooth scroll on anchor changed
* Updated video style

### Fixes
* Note might not clear when all users disconnect
* Blockquote tag not parsed properly
* History style not correct

<i class="fa fa-tag"></i> 0.3.0 `sunrise` <i class="fa fa-clock-o"></i> 2015-06-15 24:00
---
### Enhancements
* Used short url in share notes
* Added upload image button on toolbar
* Share notes are now SEO and mobile friendly
* Updated code block style
* Newline now will cause line breaks
* Image now will link out
* Used otk to avoid race condition
* Used hash to avoid data inconsistency
* Optimized server realtime script

### Fixes
* Composition input might lost or duplicated when other input involved
* Note title might not save properly
* Todo list not render properly

<i class="fa fa-tag"></i> 0.2.9 `wildfire` <i class="fa fa-clock-o"></i> 2015-05-30 14:00
---
### Features
+ Support text auto complete
+ Support cursor tag and random last name
+ Support online user list
+ Support show user info in blockquote

### Enhancements
* Added more code highlighting support
* Added more continue list support
* Adjust menu and history filter UI for better UX
* Adjust sync scoll animte to gain performance
* Change compression method of dynamic data
* Optimized render script

### Fixes
* Access history fallback might get wrong
* Sync scroll not accurate
* Sync scroll reach bottom range too much
* Detect login state change not accurate
* Detect editor focus not accurate
* Server not handle some editor events

<i class="fa fa-tag"></i> 0.2.8 `flame` <i class="fa fa-clock-o"></i> 2015-05-15 12:00
---
### Features
+ Support drag-n-drop(exclude firefox) and paste image inline
+ Support tags filter in history
+ Support sublime-like shortcut keys

### Enhancements
* Adjust index description
* Adjust toolbar ui and view font
* Remove scroll sync delay and gain accuracy

### Fixes
* Partial update in the front and the end might not render properly
* Server not handle some editor events

<i class="fa fa-tag"></i> 0.2.7 `fuel` <i class="fa fa-clock-o"></i> 2015-05-03 12:00
---
### Features
+ Support facebook, twitter, github, dropbox login
+ Support own history

### Enhancements
* Adjust history ui
* Upgrade realtime package
* Upgrade editor package, now support composition input better

### Fixes
* Partial update might not render properly
* Cursor focus might not at correct position

<i class="fa fa-tag"></i> 0.2.6 `zippo` <i class="fa fa-clock-o"></i> 2015-04-24 16:00
---
### Features
+ Support sync scroll
+ Support partial update

### Enhancements
* Added feedback ui
* Adjust animations and delays
* Adjust editor viewportMargin for performance
* Adjust emit refresh event occasion
* Added editor fallback fonts
* Index page auto focus at history if valid

### Fixes
* Server might not disconnect client properly
* Resume connection might restore wrong info

<i class="fa fa-tag"></i> 0.2.5 `lightning` <i class="fa fa-clock-o"></i> 2015-04-14 21:10
---
### Features
+ Support import from dropbox and clipboard
+ Support more code highlighting
+ Support mathjax, sequence diagram and flow chart

### Enhancements
* Adjust toolbar and layout style
* Adjust mobile layout style
* Adjust history layout style
* Server using heartbeat to gain accuracy of online users

### Fixes
* Virtual keyboard might broken the navbar
* Adjust editor viewportMargin for preloading content

<i class="fa fa-tag"></i> 0.2.4 `flint` <i class="fa fa-clock-o"></i> 2015-04-10 12:40
---
### Features
+ Support save to dropbox
+ Show other users' cursor with light color

### Enhancements
* Adjust toolbar layout style for future
### Fixes
* Title might not render properly
* Code border style might not show properly
* Server might not connect concurrent client properly

<i class="fa fa-tag"></i> 0.2.3 `light` <i class="fa fa-clock-o"></i> 2015-04-06 20:30
---
### Features
+ Support youtube, vimeo
+ Support gist
+ Added quick link in pretty
+ Added font-smoothing style

### Enhancements
* Change the rendering engine to remarkable
* Adjust view, todo list layout style for UX
+ Added responsive layout check
+ Auto reload if client version mismatch
+ Keep history stack after reconnect if nothing changed
+ Added features page

### Fixes
* Closetags auto input might not have proper origin
* Autofocus on editor only if it's on desktop
* Prevent using real script and iframe tags
* Sorting in history by time not percise

<i class="fa fa-tag"></i> 0.2.2 `fire` <i class="fa fa-clock-o"></i> 2015-03-27 21:10
---
### Features
+ Support smartLists, smartypants
+ Support line number on code block
+ Support tags and search or sort history

### Enhancements
+ Added delay on socket change
+ Updated markdown-body width to match github style
+ Socket changes now won't add to editor's history
+ Reduce redundant server events

### Fixes
* Toolbar links might get wrong
* Wrong action redirections

<i class="fa fa-tag"></i> 0.2.1 `spark` <i class="fa fa-clock-o"></i> 2015-03-17 13:40
---

### Features
+ Support github-like todo-list
+ Support emoji

 ### Enhancements
+ Added more effects on transition
+ Reduced rendering delay
+ Auto close and match brackets
+ Auto close and match tags
+ Added code fold and fold gutters
+ Added continue listing of markdown

<i class="fa fa-tag"></i> 0.2.0 `launch-day` <i class="fa fa-clock-o"></i> 2015-03-14 20:20
---
### Features

+ Markdown editor
+ Preview html
+ Realtime collaborate
+ Cross-platformed
+ Recently used history