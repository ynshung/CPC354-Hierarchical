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
var body1Id = 10;
var body2Id = 11;
var head1Id = 12;
var head2Id = 13;
var tail1Id = 14;

var numNodes = 10;
var angle = 0;

var theta = [
    230, 0, 0, 0, 0, 0, 0, 0, 0, 130, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

var numVertices = 36;

var stack = [];

var figure = [];

for (var i = 0; i < numNodes; i++)
    figure[i] = createNode(null, null, null, null);

var vBuffer, cBuffer;
var modelViewLoc;

var pointsArray = [];
var colorsArray = [];
var normalsArray = [];

// TODO: Set default material / light / camera properties values below


var shininess = 50.0; // TODO: Set a good looking default shininess

var lightPosition; // TODO: Set default light position

var ambientProduct;
var diffuseProduct;
var specularProduct;

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
        case body1Id:
        case body2Id:
            m = rotate(theta[bodyId], 0, 1, 0);
            m = mult(m, rotate(theta[body1Id], 1, 0, 0));
            m = mult(m, rotate(theta[body2Id], 0, 0, 1));
            figure[bodyId] = createNode(m, body, null, [
                headId,
                legFrontLeftId,
                legBackLeftId,
                tailId,
            ]);
            break;

        case headId:
        case head1Id:
        case head2Id:
            m = translate(bodyLength / 2 - 0.5, bodyHeight / 2 - 0.5, 0.0);
            m = mult(m, rotate(theta[headId], 1, 0, 0));
            m = mult(m, rotate(theta[head1Id], 0, 1, 0));
            m = mult(m, rotate(theta[head2Id], 0, 0, 1));
            figure[headId] = createNode(m, head, null, [earLeftId, noseId]);
            break;

        case earLeftId:
            m = translate(headLength / 2, headLength, headLength / 3);
            m = mult(m, rotate(theta[earLeftId], 1, 0, 0));
            figure[earLeftId] = createNode(m, earLeft, earRightId, null);
            break;

        case earRightId:
            m = translate(headLength / 2, headLength, -headLength / 3);
            m = mult(m, rotate(-theta[earRightId], 1, 0, 0));
            figure[earRightId] = createNode(m, earRight, null, null);
            break;

        case noseId:
            m = translate(headLength, headLength / 2, 0);
            m = mult(m, translate(0, theta[noseId], 0));
            figure[noseId] = createNode(m, nose, null, null);
            break;

        case legFrontLeftId:
            m = translate(
                bodyLength / 2 - 0.5,
                -bodyHeight / 2,
                -bodyWidth / 2 + 0.5
            );
            m = mult(m, rotate(theta[legFrontLeftId], 0, 0, 1));
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
            m = mult(m, rotate(theta[legFrontRightId], 0, 0, 1));
            figure[legFrontRightId] = createNode(m, legFrontRight, null, null);
            break;

        case legBackLeftId:
            m = translate(
                -bodyLength / 2 + 0.5,
                -bodyHeight / 2,
                -bodyWidth / 2 + 0.5
            );
            m = mult(m, rotate(theta[legBackLeftId], 0, 0, 1));
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
            m = mult(m, rotate(theta[legBackRightId], 0, 0, 1));
            figure[legBackRightId] = createNode(m, legBackRight, null, null);
            break;

        case tailId:
        case tail1Id:
            m = translate(-bodyLength / 2, bodyHeight / 4, 0);
            m = mult(m, rotate(theta[tailId], 0, 0, 1));
            m = mult(m, rotate(theta[tail1Id], 1, 0, 0));
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
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
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
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function earLeft() {
    instanceMatrix = mult(modelViewMatrix, translate(0, 0, 0));
    instanceMatrix = mult(
        instanceMatrix,
        scale4(earLength, earHeight, earWidth)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function earRight() {
    instanceMatrix = mult(modelViewMatrix, translate(0, 0, 0));
    instanceMatrix = mult(
        instanceMatrix,
        scale4(earLength, earHeight, earWidth)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function nose() {
    instanceMatrix = mult(modelViewMatrix, translate(0, 0, 0));
    instanceMatrix = mult(
        instanceMatrix,
        scale4(noseLength, noseHeight, noseWidth)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function legFrontLeft() {
    instanceMatrix = mult(modelViewMatrix, translate(0, -bodyHeight / 4, 0));
    instanceMatrix = mult(
        instanceMatrix,
        scale4(legLength, legHeight, legLength)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function legFrontRight() {
    instanceMatrix = mult(modelViewMatrix, translate(0, -bodyHeight / 4, 0));
    instanceMatrix = mult(
        instanceMatrix,
        scale4(legLength, legHeight, legLength)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function legBackLeft() {
    instanceMatrix = mult(modelViewMatrix, translate(0, -bodyHeight / 4, 0));
    instanceMatrix = mult(
        instanceMatrix,
        scale4(legLength, legHeight, legLength)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function legBackRight() {
    instanceMatrix = mult(modelViewMatrix, translate(0, -bodyHeight / 4, 0));
    instanceMatrix = mult(
        instanceMatrix,
        scale4(legLength, legHeight, legLength)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function tail() {
    instanceMatrix = mult(modelViewMatrix, translate(0, tailHeight/2, 0));
    instanceMatrix = mult(
        instanceMatrix,
        scale4(tailLength, tailHeight, tailLength)
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function quad(a, b, c, d) {
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    var normal = vec3(normal);
    normal = normalize(normal);

    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[a]);
    normalsArray.push(normal);

    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[b]);
    normalsArray.push(normal);

    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[c]);
    normalsArray.push(normal);

    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[a]);
    normalsArray.push(normal);

    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[c]);
    normalsArray.push(normal);

    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[d]);
    normalsArray.push(normal);
}

function cube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

const setElementText = (id, text) => {
    document.getElementById(id).innerHTML = text;
};

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

    // TODO: Camera properties
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

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        flatten(normalsArray),
        gl.STATIC_DRAW
    );

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

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
        .getElementById("body0")
        .addEventListener("input", function (event) {
            theta[bodyId] = event.target.value;
            initNodes(bodyId);
            setElementText("body0Value", event.target.value);
        });

    document
        .getElementById("body1")
        .addEventListener("input", function (event) {
            theta[body1Id] = event.target.value;
            initNodes(body1Id);
            setElementText("body1Value", event.target.value);
        });

    document
        .getElementById("body2")
        .addEventListener("input", function (event) {
            theta[body2Id] = event.target.value;
            initNodes(body2Id);
            setElementText("body2Value", event.target.value);
        });

    document
        .getElementById("head0")
        .addEventListener("input", function (event) {
            theta[headId] = event.target.value;
            initNodes(headId);
            setElementText("head0Value", event.target.value);
        });

    document
        .getElementById("head1")
        .addEventListener("input", function (event) {
            theta[head1Id] = event.target.value;
            initNodes(head1Id);
            setElementText("head1Value", event.target.value);
        });

    document
        .getElementById("head2")
        .addEventListener("input", function (event) {
            theta[head2Id] = event.target.value;
            initNodes(head2Id);
            setElementText("head2Value", event.target.value);
        });

    document
        .getElementById("nose")
        .addEventListener("input", function (event) {
            theta[noseId] = event.target.value;
            initNodes(noseId);
            setElementText("noseValue", event.target.value);
        });

    document
        .getElementById("earLeft0")
        .addEventListener("input", function (event) {
            theta[earLeftId] = event.target.value;
            initNodes(earLeftId);
            setElementText("earLeft0Value", event.target.value);
        });

    document
        .getElementById("earRight0")
        .addEventListener("input", function (event) {
            theta[earRightId] = event.target.value;
            initNodes(earRightId);
            setElementText("earRight0Value", event.target.value);
        });

    document
        .getElementById("legFrontLeft")
        .addEventListener("input", function (event) {
            theta[legFrontLeftId] = event.target.value;
            initNodes(legFrontLeftId);
            setElementText("legFrontLeftValue", event.target.value);
        });

    document
        .getElementById("legFrontRight")
        .addEventListener("input", function (event) {
            theta[legFrontRightId] = event.target.value;
            initNodes(legFrontRightId);
            setElementText("legFrontRightValue", event.target.value);
        });
    
    document
        .getElementById("legBackLeft")
        .addEventListener("input", function (event) {
            theta[legBackLeftId] = event.target.value;
            initNodes(legBackLeftId);
            setElementText("legBackLeftValue", event.target.value);
        });
    
    document
        .getElementById("legBackRight")
        .addEventListener("input", function (event) {
            theta[legBackRightId] = event.target.value;
            initNodes(legBackRightId);
            setElementText("legBackRightValue", event.target.value);
        });

    document
        .getElementById("tail0")
        .addEventListener("input", function (event) {
            theta[tailId] = event.target.value;
            initNodes(tailId);
            setElementText("tail0Value", event.target.value);
        });

    document
        .getElementById("tail1")
        .addEventListener("input", function (event) {
            theta[tail1Id] = event.target.value;
            initNodes(tail1Id);
            setElementText("tail1Value", event.target.value);
        });

    for (i = 0; i < numNodes; i++) initNodes(i);

    // TODO: Add event listeners for light, material properties and viewing/shading options
    // TODO: might need to run render() if the slider does not affect the model

    render();
};

var render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // TODO: Material color, properties and coefficient

    
    // TODO: Light color, properties, position
    lightPosition = vec4(2.0, 2.0, 2.0, 0.0); // Default should be set globally


    // TODO: Calculate the products of ambient, diffuse, specular, currently is set to default values
    ambientProduct = vec4(0.2, 0.5, 0.5, 1.0);
    diffuseProduct = vec4(1.0, 1.0, 1.0, 1.0);
    specularProduct = vec4(0.5, 0.5, 0.5, 1.0);

    // Set material properties
    gl.uniform4fv(
        gl.getUniformLocation(program, "ambientProduct"),
        flatten(ambientProduct)
    );
    gl.uniform4fv(
        gl.getUniformLocation(program, "diffuseProduct"),
        flatten(diffuseProduct)
    );
    gl.uniform4fv(
        gl.getUniformLocation(program, "specularProduct"),
        flatten(specularProduct)
    );

    // TODO: Take shininess as input from the user
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);

    // Set light position
    gl.uniform4fv(
        gl.getUniformLocation(program, "lightPosition"),
        flatten(lightPosition)
    );

    traverse(bodyId);
    requestAnimFrame(render);
};
