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

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.aTextureCoord = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(shaderProgram.aTextureCoord);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

  // används för att skriva ut i pixlar istället för -1 till 1 som alltid är i typ..
  shaderProgram.resolutionLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
  gl.uniform2f(shaderProgram.resolutionLocation, document.getElementById("glcanvas").width, document.getElementById("glcanvas").height);

  shaderProgram.uTime = gl.getUniformLocation(shaderProgram, "uTime");

}

// handle textrues. stegu. 
function handleLoadedTexture(texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Image dimensions might be not-powers-of-two (NPOT), so avoid unsupported wrap modes
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // Do not generate mipmaps. Mipmaps are not supported for NPOT textures in WebGL.
  gl.bindTexture(gl.TEXTURE_2D, null);
}
var TextureRGBA;

function initTexture() {
  TextureRGBA = gl.createTexture();
  TextureRGBA.image = new Image();
  TextureRGBA.image.onload = function () {
    handleLoadedTexture(TextureRGBA)
  }
  TextureRGBA.image.src = "fire.gif";
}


var vertexPositionBuffer;
var vertexCoordBuffer; 
var vertexIndexBuffer; 

function initBuffers() {
    vertexPositionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    vertices = [
        0.0,    0.0,    0.0,
        500.0,  0.0,    0.0,
        500.0,  500.0,  0.0,
        0.0,    500.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numItems = 4;

    // texture coords, för att kunna beräkna x och y typ just nu
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

    // set texture image
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, TextureRGBA);
    gl.uniform1i(shaderProgram.uSampler, 0); // Texture unit 0

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);

    setMatrixUniforms();
    // Draw the single quad
    gl.drawElements(gl.TRIANGLES, vertexIndexBuffer.numItems,
			gl.UNSIGNED_SHORT, 0);

    // check what time it is and set as uniform variable for the animation
    var currentTime = (new Date).getTime(); // returns millisecunds
    gl.uniform1f(shaderProgram.uTime, 0.001 * (currentTime - startTime)); 

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
    initTexture();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick(); 
}



