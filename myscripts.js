/*  Done in the project TNM084 at Linköping University 2015.
    by: Linnéa Mellblom. linme882
*/
/* ----------------------------------------------------------------------------------- */
var gl; // A global variable for the WebGL context

function initWebGL(canvas) {  
  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("experimental-webgl"); // canvas.getContext("webgl") || 
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  }
  catch(e) {}
  // If we don't have a GL context, alert
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}

/* ----------------------------------------------------------------------------------- */

/* For setup the shaders and the program */
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

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

// -------------------------------------------------------------

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

  // attributes and uniforms for the shaders
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.aTextureCoord = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(shaderProgram.aTextureCoord);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

  shaderProgram.resolutionLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
  gl.uniform2f(shaderProgram.resolutionLocation, document.getElementById("glcanvas").width, document.getElementById("glcanvas").height);

  // for the user inputs
  shaderProgram.selectedNoise = gl.getUniformLocation(shaderProgram, "selectedNoise");
  shaderProgram.addEffect = gl.getUniformLocation(shaderProgram, "addEffect");
  shaderProgram.effectWidth = gl.getUniformLocation(shaderProgram, "effectWidth");
  shaderProgram.effectHeight = gl.getUniformLocation(shaderProgram, "effectHeight");
  shaderProgram.sameSize = gl.getUniformLocation(shaderProgram, "sameSize");

  shaderProgram.uTime = gl.getUniformLocation(shaderProgram, "uTime");

}


var vertexPositionBuffer;
var vertexCoordBuffer; 
var vertexIndexBuffer; 

function initBuffers() {
    vertexPositionBuffer = gl.createBuffer();

    var width = document.getElementById("glcanvas").width;    //500.0;
    var height = document.getElementById("glcanvas").height;  //500.0;

    // init a square
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    vertices = [
        0.0,    0.0,    0.0,
        width,  0.0,    0.0,                                          
        width,  height,  0.0,
        0.0,    height,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numItems = 4;

    // texture coordinates
    vertexCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexCoordBuffer);
    var textureCoords = [
      // Stretch unit square for texcoords across the single face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      ];
  	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
  	vertexCoordBuffer.itemSize = 2;
  	vertexCoordBuffer.numItems = 4;

  	// to draw a single quad.
  	vertexIndexBuffer = gl.createBuffer();
  	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
  	var vertexIndices = [
  		// a single quad, made from two triangles
  		0,1,2,	0,2,3
  	];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
			new Uint16Array(vertexIndices), gl.STATIC_DRAW);
    vertexIndexBuffer.itemSize = 1;
    vertexIndexBuffer.numItems = 6;
}


var startTime = (new Date).getTime();
function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // set perspective right 
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    mat4.identity(mvMatrix);
	  mat4.translate(mvMatrix, [0.0, 0.0, -3.0]);

	  // init the buffer for the square
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    //set the texture coords
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.aTextureCoord, vertexCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);

    setMatrixUniforms();

    // Draw the single quad
    gl.drawElements(gl.TRIANGLES, vertexIndexBuffer.numItems,
			gl.UNSIGNED_SHORT, 0);

    // check what time it is and set as uniform variable for the animation
    var currentTime = (new Date).getTime(); // returns millisecunds
    gl.uniform1f(shaderProgram.uTime, 0.001 * (currentTime - startTime)); 

    // ------------------------GET USER INPUTS--------------------------------------------------
    
    // set selected noise, 0.0 for the simplex, 1.0 for the flow, 0.5 for the simplex2 and 1.5 for flow 2
    var noiseFromPage = 0.0;
    if (document.getElementById("simplex1").checked)
      noiseFromPage = 0.0;
    else if (document.getElementById("simplex2").checked)
      noiseFromPage = 0.5;
    else if(document.getElementById("flow").checked)
      noiseFromPage = 1.0;
    else 
      noiseFromPage = 1.5;

    var e = document.getElementById("numberWidth");
    var nWidth = e.options[e.selectedIndex].value;
    e = document.getElementById("numberHeight");
    var nHeight = e.options[e.selectedIndex].value;

    // if the addEffect on the page in not checked, we can not choose the sameSize
    if (!document.getElementById("addEffect").checked) {
      document.getElementById("sameSize").disabled = true;
      document.getElementById("sameSize").checked = false;
      document.getElementById("numberWidth").disabled = true;
      document.getElementById("numberHeight").disabled = true;
    }
    else {
      document.getElementById("sameSize").disabled = false;
      document.getElementById("numberWidth").disabled = false;
      document.getElementById("numberHeight").disabled = false;

    }

    gl.uniform1i(shaderProgram.sameSize, document.getElementById("sameSize").checked);
    gl.uniform1f(shaderProgram.selectedNoise, noiseFromPage);
    gl.uniform1i(shaderProgram.addEffect, document.getElementById("addEffect").checked);
    gl.uniform1f(shaderProgram.effectWidth, nWidth);
    gl.uniform1f(shaderProgram.effectHeight, nHeight);

    // ---------------------------END USER INPUTS----------------------------------------------

}

// to work cross-platform
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

// for counting FPS
var timeElapsed = 0;
var frameCount = 0;
var lastTime = (new Date).getTime();

// draw animation
function tick() {
	requestAnimFrame(tick);
	drawScene();

	/*
	// ------ for counting FPS ----------------
	var fpsElement = document.getElementById("fps");
	var now = (new Date).getTime();
	frameCount ++;
	timeElapsed += (now - lastTime);
	lastTime = now;
	if (timeElapsed >= 1000) {
		fps = frameCount;
		frameCount = 0;
		timeElapsed -= 1000;
		fpsElement.innerHTML = fps.toFixed(2);
	}*/
}

// function to call when the site loading. 
function webGLStart() {
    var canvas = document.getElementById("glcanvas");
    initWebGL(canvas);
    initShaders();
    initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // if several layers
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    tick(); 
}



