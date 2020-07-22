// Teodor Wozniak 2018.04

function GLView(canvas, width, height) {
    this.tex_width = width;
    this.tex_height = height;
    function initShaderProgram(gl, vs_source, fs_source) {
        const vsh = loadShader(gl, gl.VERTEX_SHADER, vs_source);
        const fsh = loadShader(gl, gl.FRAGMENT_SHADER, fs_source);
        const shader_program = gl.createProgram();
        gl.attachShader(shader_program, vsh);
        gl.attachShader(shader_program, fsh);
        gl.linkProgram(shader_program);
        if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
            console.error('Couldn\'t link shader program');
            return null;
        }
        return shader_program;
    }

    function loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Couldn\'t compile shader: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    
    // Create context:
    
    const gl = canvas.getContext('webgl');
    if (!gl) {
        alert("WebGL not supported");
        return;
    }
    
    
    // Init shaders:
    
    const vs_source = `
        attribute vec4 a_vertex_pos;
        attribute vec2 a_tex_coord;
        attribute vec2 a_view_coord;
        attribute mediump vec2 a_texels_per_pixel;
        varying mediump vec2 v_tex_coord;
        varying mediump vec2 v_view_coord;
        varying mediump vec2 v_texels_per_pixel;
        void main() {
            gl_Position = a_vertex_pos;
            v_tex_coord = a_tex_coord;
            v_view_coord = a_view_coord;
            v_texels_per_pixel = a_texels_per_pixel;
        }
    `;
    const fs_source = `
        uniform mediump float u_texel_width;
        uniform mediump float u_texel_height;
        uniform lowp float u_has_signal;
        uniform sampler2D u_image;
        varying mediump vec2 v_tex_coord;
        varying mediump vec2 v_view_coord;
        varying mediump vec2 v_texels_per_pixel;
        void main() {
                //mediump float tpp = v_texels_per_pixel.x;
                gl_FragColor = texture2D(u_image, v_tex_coord);
                /*if (tpp>3.0) {
                    mediump float aafactor = 1.0/15.0;
                    gl_FragColor = gl_FragColor * aafactor*3.0 + /*vec4(0.5, 0.0, 0.5, 0.0) +
                            texture2D(u_image, v_tex_coord+vec2(u_texel_width, 0.0))*aafactor +
                            texture2D(u_image, v_tex_coord+vec2(-u_texel_width, 0.0))*aafactor +
                            texture2D(u_image, v_tex_coord+vec2(0.0, u_texel_height))*aafactor +
                            texture2D(u_image, v_tex_coord+vec2(0.0, -u_texel_height))*aafactor +
                            texture2D(u_image, v_tex_coord+vec2(u_texel_width, u_texel_height))*aafactor +
                            texture2D(u_image, v_tex_coord+vec2(u_texel_width, -u_texel_height))*aafactor +
                            texture2D(u_image, v_tex_coord+vec2(-u_texel_width, u_texel_height))*aafactor +
                            texture2D(u_image, v_tex_coord+vec2(-u_texel_width, -u_texel_height))*aafactor +
                            texture2D(u_image, v_tex_coord+vec2(2.0*u_texel_width, 0.0))*aafactor +
                            texture2D(u_image, v_tex_coord+vec2(-2.0*u_texel_width, 0.0))*aafactor +
                            texture2D(u_image, v_tex_coord+vec2(0.0, 2.0*u_texel_height))*aafactor +
                            texture2D(u_image, v_tex_coord+vec2(0.0, -2.0*u_texel_height))*aafactor;
                } else if (tpp>1.0) {*/
                    //mediump float aafactor = 0.25;
                    //mediump float nbprop = v_texels_per_pixel.y;
                    /*gl_FragColor = gl_FragColor * (1.0-nbprop) +
                            (texture2D(u_image, v_tex_coord+vec2(u_texel_width, 0.0))*aafactor +
                            texture2D(u_image, v_tex_coord+vec2(-u_texel_width, 0.0))*aafactor +
                            texture2D(u_image, v_tex_coord+vec2(0.0, u_texel_height))*aafactor +
                            texture2D(u_image, v_tex_coord+vec2(0.0, -u_texel_height))*aafactor)*nbprop;*/
                //}
            } 
    `;
    const shader_program = initShaderProgram(gl, vs_source, fs_source);
    
    this.program_info = {
        program: shader_program,
        attrib_loc: {
            vertex_pos: gl.getAttribLocation(shader_program, 'a_vertex_pos'),
            tex_coord: gl.getAttribLocation(shader_program, 'a_tex_coord'),
            view_coord: gl.getAttribLocation(shader_program, 'a_view_coord'),
            texels_per_pixel: gl.getAttribLocation(shader_program, 'a_texels_per_pixel'),
        },
        uniform_loc: {
            texel_width: gl.getUniformLocation(shader_program, 'u_texel_width'),
            texel_height: gl.getUniformLocation(shader_program, 'u_texel_height'),
            has_signal: gl.getUniformLocation(shader_program, 'u_has_signal'),
        }
    }
    
    this.position_buffer = gl.createBuffer();
    this.coord_buffer = gl.createBuffer();
    this.view_coord_buffer = gl.createBuffer();
    this.index_buffer = gl.createBuffer();
    this.tpp_buffer = gl.createBuffer();
    
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    this.gl = gl;
    
    this.canvas = canvas;
    this.has_signal = -1;
    
    this.gl.useProgram(this.program_info.program);
    
    //this.gl.uniform1f(this.program_info.uniform_loc.texel_width, 0.1);
    //this.gl.uniform1f(this.program_info.uniform_loc.texel_height, 0.1);
    
    this._updateTextureSize();
};


GLView.prototype.resizeCanvas = function(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
};

GLView.prototype.setViewsCount = function(count) {
    this.views_count = count;
    this.coords = Array(count*8);
    this.view_coords = Array(count*8);
    this.texels_per_pixel = Array(count*8);
    this.indices = Array(count*6);
    for (var i=0; i<count; i++) {
        const ii = i*6;
        const ci = i*4;
        const vi = i*8;
        this.view_coords[vi  ] = 1; this.view_coords[vi+1] = 0;
        this.view_coords[vi+2] = 0; this.view_coords[vi+3] = 0;
        this.view_coords[vi+4] = 1; this.view_coords[vi+5] = 1;
        this.view_coords[vi+6] = 0; this.view_coords[vi+7] = 1;
        this.indices[ii  ] = ci;
        this.indices[ii+1] = ci+1;
        this.indices[ii+2] = ci+2;
        this.indices[ii+3] = ci+2;
        this.indices[ii+4] = ci+1;
        this.indices[ii+5] = ci+3;
    }
    this.positions = Array(count*8);
    this.views_widths = Array(count);
    this.views_heights = Array(count);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.view_coord_buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.view_coords), this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(
        this.program_info.attrib_loc.view_coord,
        2,
        this.gl.FLOAT,
        false,
        0,
        0
    );
    this.gl.enableVertexAttribArray(this.program_info.attrib_loc.view_coord);
    
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);
};

GLView.prototype._updateTexelsPerPixel = function(viewid) {
    const ci = viewid*8;
    const tpp = (this.coords[ci+2]-this.coords[ci])*1.0*this.tex_width / ((this.positions[ci+2]-this.positions[ci])*0.5*this.canvas.width); 
    var nbprop = (tpp-1.0)*0.5;
    if (nbprop>0.8) nbprop = 0.8;
    if (nbprop<0.0) nbprop = 0.0;
    console.log("View "+viewid+" TPP = "+tpp+", nbprop = "+nbprop);
    for (var i=0; i<8; i+=2) this.texels_per_pixel[ci+i] = tpp;
    for (var i=1; i<8; i+=2) this.texels_per_pixel[ci+i] = nbprop;
};

GLView.prototype._commitTexelsPerPixel = function() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tpp_buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.texels_per_pixel), this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(
        this.program_info.attrib_loc.texels_per_pixel,
        2,
        this.gl.FLOAT,
        false,
        0,
        0
    );
    this.gl.enableVertexAttribArray(this.program_info.attrib_loc.texels_per_pixel);
};

GLView.prototype.setTextureCoords = function(viewid, left, top, width, height) {
    const ci = viewid*8;
    this.coords[ci  ] = left+width;
    this.coords[ci+1] = top;
    this.coords[ci+2] = left;
    this.coords[ci+3] = top;
    this.coords[ci+4] = left+width;
    this.coords[ci+5] = top+height;
    this.coords[ci+6] = left;
    this.coords[ci+7] = top+height;
    this._updateTexelsPerPixel(viewid);
};

GLView.prototype.getViewTexelsWidth = function(viewid) {
    return (this.coords[viewid*8] - this.coords[viewid*8+2])*this.tex_width;
}
GLView.prototype.getViewTexelsHeight = function(viewid) {
    return (this.coords[viewid*8+5] - this.coords[viewid*8+3])*this.tex_height;
}

GLView.prototype.commitTextureCoords = function() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.coord_buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.coords), this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(
        this.program_info.attrib_loc.tex_coord,
        2, // values per item
        this.gl.FLOAT, // type of data in buffer
        false, // don't normalize
        0, // stride = default
        0 // offset
    );
    this.gl.enableVertexAttribArray(this.program_info.attrib_loc.tex_coord);
    this._commitTexelsPerPixel();
}

GLView.prototype.setViewPosition = function(viewid, left, top, width, height) {
    var size_changed = false;
    if (typeof width !== 'undefined') {
        this.views_widths[viewid] = width;
        size_changed = true;
    } else {
        width = this.views_widths[viewid];
    }
    if (typeof height !== 'undefined') {
        this.views_heights[viewid] = height;
        size_changes = true;
    } else {
        height = this.views_heights[viewid];
    }
    left = (left*2.0/this.canvas.width-1.0);
    top = -(top*2.0/this.canvas.height-1.0);
    width = width*2.0/this.canvas.width;
    height = -height*2.0/this.canvas.height;
    const i = viewid*8;
    this.positions[i] = left+width;
    this.positions[i+1] = top;
    this.positions[i+2] = left;
    this.positions[i+3] = top;
    this.positions[i+4] = left+width;
    this.positions[i+5] = top+height;
    this.positions[i+6] = left;
    this.positions[i+7] = top+height;
    if (size_changed) this._updateTexelsPerPixel(viewid);
}

GLView.prototype.commitViewPositions = function() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.position_buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(
        this.program_info.attrib_loc.vertex_pos,
        2, // values per item
        this.gl.FLOAT, // type of data in buffer
        false, // don't normalize
        0, // stride = default
        0 // offset
    );
    this.gl.enableVertexAttribArray(this.program_info.attrib_loc.vertex_pos);
    this._commitTexelsPerPixel();
}

GLView.prototype._updateTextureSize = function() {
    this.gl.uniform1f(this.program_info.uniform_loc.texel_width, 1.0/this.tex_width);
    this.gl.uniform1f(this.program_info.uniform_loc.texel_height, 1.0/this.tex_height);
    console.log("Texel size set to 1/"+this.tex_width+" x 1/"+this.tex_height);
    for (var i=0; i<this.views_count; i++) this._updateTexelsPerPixel(i);
    this._commitTexelsPerPixel();
}

GLView.prototype.draw = function() {
    console.log('inside draw');
    if (this.source_img.readyState>=2) {
        this.has_signal = 1;
        if ((this.source_img.videoWidth != this.tex_width) || (this.source_img.videoHeight != this.tex_height)) {
            console.log('update texture size');
            this.tex_width = this.source_img.videoWidth;
            this.tex_height = this.source_img.videoHeight;
            this._updateTextureSize();
        }
    } else {
        this.has_signal -= 0.01;
    }
	this.gl.uniform1f(this.program_info.uniform_loc.has_signal, this.has_signal);
    this.gl.clearColor(0,0,0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    if (this.has_signal>0) this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.source_img);
    
    this.commitViewPositions();
    this.commitTextureCoords();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
    this.gl.drawElements(this.gl.TRIANGLES, this.views_count*6, this.gl.UNSIGNED_SHORT, 0);
};

