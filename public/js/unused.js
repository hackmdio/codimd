
    //parse Youtube
    result.find(".youtube").each(function (key, value) {
        if (!$(value).attr('videoid')) return;
        setSizebyAttr(this, this);
        var icon = '<i class="icon fa fa-youtube-play fa-5x"></i>';
        $(this).append(icon);
        var videoid = $(value).attr('videoid');
        var thumbnail_src = '//img.youtube.com/vi/' + videoid + '/hqdefault.jpg';
        $(value).css('background-image', 'url(' + thumbnail_src + ')');
        $(this).click(function () {
            imgPlayiframe(this, '//www.youtube.com/embed/');
        });
    });
    //parse vimeo
    result.find(".vimeo").each(function (key, value) {
        if (!$(value).attr('videoid')) return;
        setSizebyAttr(this, this);
        var icon = '<i class="icon fa fa-vimeo-square fa-5x"></i>';
        $(this).append(icon);
        var videoid = $(value).attr('videoid');
        $.ajax({
            type: 'GET',
            url: 'http://vimeo.com/api/v2/video/' + videoid + '.json',
            jsonp: 'callback',
            dataType: 'jsonp',
            success: function (data) {
                var thumbnail_src = data[0].thumbnail_large;
                $(value).css('background-image', 'url(' + thumbnail_src + ')');
            }
        });
        $(this).click(function () {
            imgPlayiframe(this, '//player.vimeo.com/video/');
        });
    });
    //todo list
    var lis = result[0].getElementsByTagName('li');
    for (var i = 0; i < lis.length; i++) {
        var html = lis[i].innerHTML;
        if (/^\s*\[[x ]\]\s*/.test(html)) {
            lis[i].innerHTML = html.replace(/^\s*\[ \]\s*/, '<input type="checkbox" class="task-list-item-checkbox" disabled>')
                .replace(/^\s*\[x\]\s*/, '<input type="checkbox" class="task-list-item-checkbox" checked disabled>');
            lis[i].setAttribute('class', 'task-list-item');
        }
    }