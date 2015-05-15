var raw = $(".markdown-body").text();
var markdown = LZString.decompressFromBase64(raw);
var result = postProcess(md.render(markdown));
var markdown = $(".markdown-body");
markdown.html(result);
markdown.show();
finishView(markdown);
autoLinkify(markdown);
scrollToHash();