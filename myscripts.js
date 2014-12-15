/*
 * Just nu en fil för alla javascript-funktioner osv.. 
 * Göra det snyggare sen helt enkelt. Bara för att få ett enkelt test att funka!
 */

/* ----------------------------------------------------------------------------------- */
// Code found at: https://developer.mozilla.org/en-US/docs/Web/WebGL/Getting_started_with_WebGL

var gl; // A global variable for the WebGL context

function initWebGL(canvas) {  
  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("experimental-webgl"); // canvas.getContext("webgl") || 
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  }
  catch(e) {}
  
  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
  }

/* ----------------------------------------------------------------------------------- */

/* Found this stuff on other site.. For setup the shaders and the program */
function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

var vpb; // vertexpositionbuffer, a square
var vcb; // vertexcolorbuffer

function initBuffers() {
    vpb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vpb);
    vertices = [
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    vpb.itemSize = 3;
    vpb.numItems = 4;

    // colors, just now rainbow.. change later
    vcb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vcb);

    var colors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    vcb.itemSize = 4;
    vcb.numItems = 4;
}

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // set perspective right 
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [0.0, 0.0, -4.0]);

	// init the buffer for the square
    gl.bindBuffer(gl.ARRAY_BUFFER, vpb);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vpb.itemSize, gl.FLOAT, false, 0, 0);
    
    // set the colors
    gl.bindBuffer(gl.ARRAY_BUFFER, vcb);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vcb.itemSize, gl.FLOAT, false, 0, 0);


    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vpb.numItems);

    // check what time it is and set as uniform variable for the animation
    var currentTime = (new Date).getTime(); // returns millisecunds
    gl.uniform1f(shaderProgram.uTime, 0.001 * (currentTime - startTime)); 

}

/**
 * Provides requestAnimationFrame in a cross browser way.
 */
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
           window.setTimeout(callback, 1000/60);
         };
})();

var startTime = (new Date).getTime();

function tick() {
	requestAnimFrame(tick);
	drawScene();
}

function webGLStart() {
    var canvas = document.getElementById("glcanvas");
    initWebGL(canvas);
    initShaders();
    initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick(); 
}



