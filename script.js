var canvas;
var gl;
var program;

var projectionMatrix;
var modelViewMatrix;

var instanceMatrix;

var modelViewMatrixLoc;

var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0),
];

// RGBA colors
var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0), // black
    vec4(1.0, 0.0, 0.0, 1.0), // red
    vec4(1.0, 1.0, 0.0, 1.0), // yellow
    vec4(0.0, 1.0, 0.0, 1.0), // green
    vec4(0.0, 0.0, 1.0, 1.0), // blue
    vec4(1.0, 0.0, 1.0, 1.0), // magenta
    vec4(1.0, 1.0, 1.0, 1.0), // white
    vec4(0.0, 1.0, 1.0, 1.0), // cyan
];

var bodyId = 0;
var headId = 1;
var earLeftId = 2;
var earRightId = 3;
var noseId = 4;
var legFrontLeftId = 5;
var legFrontRightId = 6;
var legBackLeftId = 7;
var legBackRightId = 8;
var tailId = 9;

var numNodes = 10;
var numAngles = 11;
var angle = 0;

var theta = [0, 0, 0, 0, 0, 0, 180, 0, 180, 0, 0];

var numVertices = 24;

var stack = [];

var figure = [];

for (var i = 0; i < numNodes; i++)
    figure[i] = createNode(null, null, null, null);

var vBuffer, cBuffer;
var modelViewLoc;

var pointsArray = [];
var colorsArray = [];

//-------------------------------------------

function scale4(a, b, c) {
    var result = mat4();
    result[0][0] = a;
    result[1][1] = b;
    result[2][2] = c;
    return result;
}

//--------------------------------------------

function createNode(transform, render, sibling, child) {
    var node = {
        transform: transform,
        render: render,
        sibling: sibling,
        child: child,
    };
    return node;
}

function traverse(Id) {
    if (Id == null) return;
    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
    figure[Id].render();
    if (figure[Id].child != null) {
        if (Array.isArray(figure[Id].child)) {
            figure[Id].child.forEach((child) => {
                traverse(child);
            });
        } else {
            traverse(figure[Id].child);
        }
    }
    modelViewMatrix = stack.pop();
    if (figure[Id].sibling != null) traverse(figure[Id].sibling);
}

const bodyLength = 6.0;
const bodyHeight = 3.0;
const bodyWidth = 2.6;

const headLength = 2.0;
const headWidth = 1.0;

const earLength = 0.8;
const earWidth = 0.5;
const earHeight = 0.8;

const noseLength = 0.3;
const noseWidth = 1;
const noseHeight = 0.3;

const legLength = 1.0;
const legHeight = 2.0;

const tailLength = 0.5;
const tailHeight = 2.5;

function initNodes(Id) {
    var m = mat4();

    switch (Id) {
        case bodyId:
            m = rotate(-theta[bodyId], 0, 1, 0);
            // m = mult(m, rotate(theta[bodyId], 1, 0, 0));
            figure[bodyId] = createNode(m, body, null, [
                headId,
                legFrontLeftId,
                legBackLeftId,
                tailId,
            ]);
            break;

        case headId:
            m = translate(bodyLength / 2 - 0.5, bodyHeight / 2 - 0.5, 0.0);
            // m = mult(m, rotate(-theta[bodyId], 0, 0, 1));
            // m = mult(m, rotate(-theta[bodyId], 0, 1, 0));
            figure[headId] = createNode(m, head, noseId, earLeftId);
            break;

        case earLeftId:
            m = translate(headLength / 2, headLength, headLength / 3);
            // m = mult(m, rotate(-theta[bodyId], 0, 0, 1));
            // m = mult(m, rotate(-theta[bodyId], 0, 1, 0));
            figure[earLeftId] = createNode(m, earLeft, earRightId, null);
            break;

        case earRightId:
            m = translate(headLength / 2, headLength, -headLength / 3);
            // m = mult(m, rotate(-theta[bodyId], 0, 0, 1));
            // m = mult(m, rotate(-theta[bodyId], 0, 1, 0));
            figure[earRightId] = createNode(m, earRight, null, null);
            break;

        case noseId:
            m = translate(
                headLength * 2 + noseLength * 2,
                headLength - noseHeight,
                0
            );
            // m = mult(m, rotate(-theta[bodyId], 0, 0, 1));
            // m = mult(m, rotate(-theta[bodyId], 0, 1, 0));
            figure[noseId] = createNode(m, nose, null, null);
            break;

        case legFrontLeftId:
            m = translate(
                bodyLength / 2 - 0.5,
                -bodyHeight / 2,
                -bodyWidth / 2 + 0.5
            );
            // m = mult(m, rotate(-theta[bodyId], 0, 0, 1));
            figure[legFrontLeftId] = createNode(
                m,
                legFrontLeft,
                legFrontRightId,
                null
            );
            break;

        case legFrontRightId:
            m = translate(
                bodyLength / 2 - 0.5,
                -bodyHeight / 2,
                bodyWidth / 2 - 0.5
            );
            // m = mult(m, rotate(theta[bodyId], 0, 0, 1));
            figure[legFrontRightId] = createNode(m, legFrontRight, null, null);
            break;

        case legBackLeftId:
            m = translate(
                -bodyLength / 2 + 0.5,
                -bodyHeight / 2,
                -bodyWidth / 2 + 0.5
            );
            // m = mult(m, rotate(-theta[bodyId], 0, 0, 1));
            figure[legBackLeftId] = createNode(
                m,
                legBackLeft,
                legBackRightId,
                null
            );
            break;

        case legBackRightId:
            m = translate(
                -bodyLength / 2 + 0.5,
                -bodyHeight / 2,
                bodyWidth / 2 - 0.5
            );
            // m = mult(m, rotate(theta[bodyId], 0, 0, 1));
            figure[legBackRightId] = createNode(m, legBackRight, null, null);
            break;
        
        case tailId:
            m = translate(
                -bodyLength / 2,
                bodyHeight / 4,
                0
            );
            // m = mult(m, rotate(theta[bodyId], 0, 0, 1));
            // m = mult(m, rotate(theta[bodyId], 1, 0, 0));
            figure[tailId] = createNode(m, tail, null, null);
            break;
    }
}

function body() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.0));
    instanceMatrix = mult(
        instanceMatrix,
        scale4(bodyLength, bodyHeight, bodyWidth)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function head() {
    instanceMatrix = mult(
        modelViewMatrix,
        translate(headLength / 2, headLength / 2, 0)
    );
    instanceMatrix = mult(
        instanceMatrix,
        scale4(headLength, headLength, headLength)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function earLeft() {
    instanceMatrix = mult(modelViewMatrix, translate(0, 0, 0));
    instanceMatrix = mult(
        instanceMatrix,
        scale4(earLength, earHeight, earWidth)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function earRight() {
    instanceMatrix = mult(modelViewMatrix, translate(0, 0, 0));
    instanceMatrix = mult(
        instanceMatrix,
        scale4(earLength, earHeight, earWidth)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function nose() {
    instanceMatrix = mult(modelViewMatrix, translate(0, 0, 0));
    instanceMatrix = mult(
        instanceMatrix,
        scale4(noseLength, noseHeight, noseWidth)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function legFrontLeft() {
    instanceMatrix = mult(modelViewMatrix, translate(0, -bodyHeight / 4, 0));
    instanceMatrix = mult(
        instanceMatrix,
        scale4(legLength, legHeight, legLength)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function legFrontRight() {
    instanceMatrix = mult(modelViewMatrix, translate(0, -bodyHeight / 4, 0));
    instanceMatrix = mult(
        instanceMatrix,
        scale4(legLength, legHeight, legLength)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function legBackLeft() {
    instanceMatrix = mult(modelViewMatrix, translate(0, -bodyHeight / 4, 0));
    instanceMatrix = mult(
        instanceMatrix,
        scale4(legLength, legHeight, legLength)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function legBackRight() {
    instanceMatrix = mult(modelViewMatrix, translate(0, -bodyHeight / 4, 0));
    instanceMatrix = mult(
        instanceMatrix,
        scale4(legLength, legHeight, legLength)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function tail() {
    instanceMatrix = mult(modelViewMatrix, translate(0, tailHeight/2, 0));
    instanceMatrix = mult(
        instanceMatrix,
        scale4(tailLength, tailHeight, tailLength)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function quad(a, b, c, d) {
    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[b]);
    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[d]);
}

function cube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    // gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clearColor(0.95, 0.95, 0.95, 1.0);
    gl.enable(gl.DEPTH_TEST);
    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");

    gl.useProgram(program);

    instanceMatrix = mat4();

    projectionMatrix = ortho(-10.0, 10.0, -10.0, 10.0, -10.0, 10.0);
    modelViewMatrix = mat4();

    gl.uniformMatrix4fv(
        gl.getUniformLocation(program, "modelViewMatrix"),
        false,
        flatten(modelViewMatrix)
    );
    gl.uniformMatrix4fv(
        gl.getUniformLocation(program, "projectionMatrix"),
        false,
        flatten(projectionMatrix)
    );

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    cube();

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    document
        .getElementById("slider0")
        .addEventListener("input", function (event) {
            theta[bodyId] = event.target.value;
            initNodes(bodyId);
        });

    for (i = 0; i < numNodes; i++) initNodes(i);

    setInterval(() => {
        theta[bodyId] += 0.3;
        for (i = 0; i < numNodes; i++) initNodes(i);
    }, 10);

    render();
};

var render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    traverse(bodyId);
    requestAnimFrame(render);
};
