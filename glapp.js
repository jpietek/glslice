var video = $('#remotevideo')[0];

function refreshStats() {
    document.getElementById('fps').innerText = fps_frm;
    fps_frm = 0;
    setTimeout(refreshStats, 1000);
}

var glv;
var fps_frm = 0;
var now;
var then = Date.now();
var elapsed;

function drawAll() {
    now = Date.now();
    elapsed = now - then;
    window.requestAnimationFrame(drawAll);
    if (elapsed > 80) {
       then = now - (elapsed % 80);
    	 glv.draw();
    	 fps_frm++;
    }
}

glv = new GLView(document.getElementById('globalview'), 1920, 1080);
console.log(video);
glv.source_img = video;
glv.setViewsCount(6);
glv.setTextureCoords(0, 0, 0, 0.5, 0.5);
glv.setTextureCoords(1, 0.5, 0, 0.5, 0.5);
glv.setTextureCoords(2, 0, 0.5, 0.25, 0.25);
glv.setTextureCoords(3, 0.25, 0.5, 0.25, 0.25);
glv.setTextureCoords(4, 0.5, 0.5, 0.25, 0.25);
glv.setTextureCoords(5, 0.75, 0.5, 0.25, 0.25);
glv.commitTextureCoords();

$('.tile').draggable({ drag: function(e, ui) {
    const viewid = ui.helper.data("view");
    glv.setViewPosition(viewid, ui.offset.left+1, ui.offset.top+1);
    glv.commitViewPositions();
}});

function resizeCanvasToWindow() {
    glv.resizeCanvas(document.body.offsetWidth, document.body.offsetHeight);
    $('.tile').each(function() {
        var je = $(this);
        const viewid = je.data("view");
        this.style.width = views_scale*glv.getViewTexelsWidth(viewid)+'px';
        this.style.height = views_scale*glv.getViewTexelsHeight(viewid)+'px';
         const offset = je.offset();
        glv.setViewPosition(viewid, offset.left+1, offset.top+1, je.width(), je.height());
    });
    glv.commitViewPositions();
}

window.addEventListener('resize', function() {
    resizeCanvasToWindow();
});


var views_scale = 0.25;

$('#scale').change(function() {
    views_scale = Math.pow(10.0, this.value/20.0); // it's in decibels :)
    resizeCanvasToWindow();
}).change();

resizeCanvasToWindow();

refreshStats();
drawAll();

var selected_input = null;

$('.intile').click(function(event) {
    $('#input_menu').css( {position:'absolute', top:event.pageY, left: event.pageX}).show();
    selected_input = $(this).data('view')-1;
});

$('body').click(function(event) {
    if (event.target.id=='globalview' || event.target==document.body) {
        $('#input_menu').hide();
        selected_input = null;
    }
});
