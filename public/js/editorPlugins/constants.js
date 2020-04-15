import hljs from 'highlight.js'

export const supportContainers = ['success', 'info', 'warning', 'danger', 'spoiler']
export const supportCodeModes = ['javascript', 'typescript', 'jsx', 'htmlmixed', 'htmlembedded', 'css', 'xml', 'clike', 'clojure', 'ruby', 'python', 'shell', 'php', 'sql', 'haskell', 'coffeescript', 'yaml', 'pug', 'lua', 'cmake', 'nginx', 'perl', 'sass', 'r', 'dockerfile', 'tiddlywiki', 'mediawiki', 'go', 'gherkin'].concat(hljs.listLanguages())
export const supportCharts = ['sequence', 'flow', 'graphviz', 'mermaid', 'abc', 'plantuml', 'vega', 'geo']
export const supportHeaders = [
  {
    text: '# h1',
    search: '#'
  },
  {
    text: '## h2',
    search: '##'
  },
  {
    text: '### h3',
    search: '###'
  },
  {
    text: '#### h4',
    search: '####'
  },
  {
    text: '##### h5',
    search: '#####'
  },
  {
    text: '###### h6',
    search: '######'
  },
  {
    text: '###### tags: `example`',
    search: '###### tags:'
  }
]
export const supportReferrals = [
  {
    text: '[reference link]',
    search: '[]'
  },
  {
    text: '[reference]: https:// "title"',
    search: '[]:'
  },
  {
    text: '[^footnote link]',
    search: '[^]'
  },
  {
    text: '[^footnote reference]: https:// "title"',
    search: '[^]:'
  },
  {
    text: '^[inline footnote]',
    search: '^[]'
  },
  {
    text: '[link text][reference]',
    search: '[][]'
  },
  {
    text: '[link text](https:// "title")',
    search: '[]()'
  },
  {
    text: '![image alt][reference]',
    search: '![][]'
  },
  {
    text: '![image alt](https:// "title")',
    search: '![]()'
  },
  {
    text: '![image alt](https:// "title" =WidthxHeight)',
    search: '![]()'
  },
  {
    text: '[TOC]',
    search: '[]'
  }
]
export const supportExternals = [
  {
    text: '{%youtube youtubeid %}',
    search: 'youtube'
  },
  {
    text: '{%vimeo vimeoid %}',
    search: 'vimeo'
  },
  {
    text: '{%gist gistid %}',
    search: 'gist'
  },
  {
    text: '{%slideshare slideshareid %}',
    search: 'slideshare'
  },
  {
    text: '{%speakerdeck speakerdeckid %}',
    search: 'speakerdeck'
  },
  {
    text: '{%pdf pdfurl %}',
    search: 'pdf'
  }
]
