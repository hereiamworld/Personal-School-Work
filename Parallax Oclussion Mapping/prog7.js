//Alexandre Knijn
//Aknijn1@lsu.edu


    //initialize global variables.
	var canvas; 
	var gl;

	var modelRotationX=0;
	var modelRotationY=0;
	var dragging = 0;
	var lastClientX=0;
	var lastClientY=0;
	
	var lightingShader;
	var chestModel;

	var viewTranslateNum;

	function add(a, b) {
		return [
			a[0] + b[0],
			a[1] + b[1],
			a[2] + b[2]
		];
	}
	
	function subtract(a, b) {
		return [
			a[0] - b[0],
			a[1] - b[1],
			a[2] - b[2]
		];
	}

	function dot(a, b){ 
		return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	}
	
	function cross(a,b){
		return [
			a[1]*b[2] - a[2]*b[1],
			a[2]*b[0] - a[0]*b[2],
			a[0]*b[1] - a[1]*b[0]		
		];
	}
	
	function normalize(a) {
		var len = Math.sqrt(dot(a, a));
		return [
			a[0] / len,
			a[1] / len,
			a[2] / len
		];
	}
	
	function createNormal(cM,normals) {
		var n=[0.0,0.0,0.0];
		
		for(var i=0; i<cM.positions.length;i++){
			normals.push(n);
		}
		
		for(var j=0; j<cM.triangles.length;j++){
			var a = normalize( subtract(cM.positions[cM.triangles[j][1]],cM.positions[cM.triangles[j][0]]));
			var b = normalize( subtract(cM.positions[cM.triangles[j][2]],cM.positions[cM.triangles[j][0]]));
			
			n = normalize(cross(a,b));
			
			normals[cM.triangles[j][0]]=add(normals[cM.triangles[j][0]],n);
			normals[cM.triangles[j][1]]=add(normals[cM.triangles[j][1]],n);
			normals[cM.triangles[j][2]]=add(normals[cM.triangles[j][2]],n);
		}
		
		for(var k=0; k<normals.length;k++){
				if (n==normals[k]){
					n=normalize(n);
				}
		}
			
		return normals;
	}
	
	function createTangent(cM,tangents){
		
		var t=[0.0,0.0,0.0];
		
		for(var j=0; j<cM.positions.length;j++){
			tangents.push(t);
		}
		
		for(var j=0; j<cM.triangles.length;j++){
			var edge1 = subtract(cM.positions[cM.triangles[j][1]],cM.positions[cM.triangles[j][0]]);
			var edge2 = subtract(cM.positions[cM.triangles[j][2]],cM.positions[cM.triangles[j][0]]);
			
			var uv1 = cM.texCoords[cM.triangles[j][0]];
			var uv2 = cM.texCoords[cM.triangles[j][1]];
			var uv3 = cM.texCoords[cM.triangles[j][2]];
			
			var deltaUV1 = [uv2[0] - uv1[0],uv2[1] - uv1[1]];
			var deltaUV2 = [uv3[0] - uv1[0],uv3[1] - uv1[1]];
			
			var f = (1.0/((deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1])));
			
			t[0] = (f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]));
			t[1] = (f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]));
			t[2] = (f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]));
			
			t = normalize(t);
			
			tangents[j]=t;
		}
		
		return tangents;
	}		
			
	function createBitangent(cM,bitangents){
		
		var bt=[0.0,0.0,0.0];
		
		for(var j=0; j<cM.positions.length;j++){
			bitangents.push(bt);
		}
		
		for(var j=0; j<cM.triangles.length;j++){
			var edge1 = subtract(cM.positions[cM.triangles[j][1]],cM.positions[cM.triangles[j][0]]);
			var edge2 = subtract(cM.positions[cM.triangles[j][2]],cM.positions[cM.triangles[j][0]]);
			
			var uv1 = cM.texCoords[cM.triangles[j][0]];
			var uv2 = cM.texCoords[cM.triangles[j][1]];
			var uv3 = cM.texCoords[cM.triangles[j][2]];
			
			var deltaUV1 = [uv2[0] - uv1[0],uv2[1] - uv1[1]];
			var deltaUV2 = [uv3[0] - uv1[0],uv3[1] - uv1[1]];
			
			var f = 1.0/((deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1]));
			
			bt[0] = f * (-deltaUV2[0] * edge1[0] + deltaUV1[0] * edge2[0]);
			bt[1] = f * (-deltaUV2[0] * edge1[1] + deltaUV1[0] * edge2[1]);
			bt[2] = f * (-deltaUV2[0] * edge1[2] + deltaUV1[0] * edge2[2]);
			
			bt = normalize(bt);
			
			bitangents[j]=bt;
		}
		
		return bitangents;
	}
	
	//makes 2D arrays into 1D arrrays
	function flatten(a) {
		return a.reduce(function (b, v) { b.push.apply(b, v); return b }, [])
	}

	//changes the vew matrix when the mouse is moved
	function onmousemove(event){
		
		if (dragging){
			var dX = event.clientX - lastClientX;
			var dY = event.clientY - lastClientY;
		
			modelRotationX = modelRotationX + dX;
			modelRotationY = modelRotationY + dY;
		
			if(modelRotationY > 89){
				modelRotationY = 89;
			}
			
			if(modelRotationY < -89){
				modelRotationY = -89;
			}
			
			if(modelRotationX > 89){
				modelRotationX = 89;
			}
			
			if(modelRotationX < -89){
				modelRotationX = -89;
			}
			
			lastClientX = event.clientX;
			lastClientY = event.clientY;
			
			requestAnimationFrame(draw);
		}
	}
	
	//allows the view to be changed only when the mouse is clicked
	function onmousedown(event){
		lastClientX = event.clientX;
		lastClientY = event.clientY;
		dragging = true;
	}
	
	function onmouseup(event){
		dragging = false;
	}
	
	//binds texture data and requests animation frame
	function loadTexture(image, texture){
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.bindTexture(gl.TEXTURE_2D, null);
		requestAnimationFrame(draw);
	}
	
	//redraw the frame when any of the slieders is moved
	function slider() {
		requestAnimationFrame(draw);
}
	
	//object that initializes the fragment shader that is used
	function Shader(vertexId, fragmentId) {
		this.program = createProgram(gl, document.getElementById(vertexId).text, 
										 document.getElementById(fragmentId).text);
										 
		gl.useProgram(this.program);
										 
		this.vertexPositionLocation = 	gl.getAttribLocation(this.program, 'vertexPosition');
		this.vertexNormalLocation = 	gl.getAttribLocation(this.program, 'vertexNormal');
		this.vertexTangentLocation = 	gl.getAttribLocation(this.program, 'vertexTangent');
		this.vertexBitangentLocation = 	gl.getAttribLocation(this.program, 'vertexBitangent');
		this.vertexTexCoordLocation =   gl.getAttribLocation(this.program, 'vertexTexCoord');
		
		this.modelMatrixLocation = 		gl.getUniformLocation(this.program, 'modelMatrix');
		this.projectionMatrixLocation = gl.getUniformLocation(this.program, 'projectionMatrix');
		this.viewMatrixLocation = 		gl.getUniformLocation(this.program, 'viewMatrix');
		this.modelColorLocation = 		gl.getUniformLocation(this.program, 'modelColor');
		this.lightPositionLocation = 	gl.getUniformLocation(this.program, 'lightPosition');
		this.lightColorLocation = 		gl.getUniformLocation(this.program, 'lightColor');
		
		this.modelTextureLocation = gl.getUniformLocation(this.program, 'modelTexture');
		this.normalTextureLocation = gl.getUniformLocation(this.program, 'normalTexture');
		this.displacmentTextureLocation = gl.getUniformLocation(this.program, 'displacmentTexture');
		
		gl.uniform1i(this.modelTextureLocation, 1);
		gl.uniform1i(this.normalTextureLocation, 2);
		gl.uniform1i(this.displacmentTextureLocation, 3);
		
		gl.enableVertexAttribArray(this.vertexPositionLocation);
		gl.enableVertexAttribArray(this.vertexNormalLocation);
		gl.enableVertexAttribArray(this.vertexTexCoordLocation);
		gl.enableVertexAttribArray(this.vertexTangentLocation);
		gl.enableVertexAttribArray(this.vertexBitangentLocation);
	}
	
	//object that executes the fragment shader that is used
	Shader.prototype.use = function(projectionMatrix,viewMatrix, modelMatrix,X,Y,Z){
		gl.useProgram(this.program);
		//transforms the model matrix
		modelMatrix= new Matrix4;
		modelMatrix.rotate(modelRotationY, 1, 0, 0);
		modelMatrix.rotate(modelRotationX, 0, 1, 0);
		modelMatrix.translate(X,Y,Z);
		//binds uniforms
		gl.uniformMatrix4fv(this.modelMatrixLocation, false, modelMatrix.elements);
		gl.uniformMatrix4fv(this.viewMatrixLocation, false, viewMatrix.elements);
		gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix.elements);
		var x = parseFloat(document.getElementById("xSlider").value);
		var y = parseFloat(document.getElementById("ySlider").value);
		var z = parseFloat(document.getElementById("zSlider").value);
		document.getElementById("xValue").innerHTML = x;
		document.getElementById("yValue").innerHTML = y;
		document.getElementById("zValue").innerHTML = z;
		gl.uniform3f(this.modelColorLocation,0.4,0.3,0.3);
		gl.uniform3f(this.lightColorLocation,1.0,1.0,1.0);
		gl.uniform4f(this.lightPositionLocation,x,y,z,1.0);
	}
	//object that initializes the model that is used
	function Model(modelData,normals,tangents,bitangents){
		this.triangleArray = new Uint16Array (flatten(modelData.triangles)); 
		this.positionArray = new Float32Array(flatten(modelData.positions));
		this.normalArray   = new Float32Array(flatten(modelData.normals));
		this.texCoordArray = new Float32Array(flatten(modelData.texCoords));
		this.tangentArray  = new Float32Array(flatten(tangents));
		this.bitangentArray= new Float32Array(flatten(bitangents));
		
		
		this.positionBuffer = gl.createBuffer();
		this.triangleBuffer = gl.createBuffer();
		this.normalBuffer   = gl.createBuffer();
		this.texCoordBuffer = gl.createBuffer();
		this.tangentBuffer  = gl.createBuffer();
		this.bitangentBuffer= gl.createBuffer();
	}
	
	//object that executes the model that is used
	Model.prototype.draw = function(shader){
		//buffers array data into the buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.positionArray, gl.STATIC_DRAW);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.normalArray, gl.STATIC_DRAW);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.texCoordArray, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.triangleArray, gl.STATIC_DRAW);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.tangentArray, gl.STATIC_DRAW);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.bitangentBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.bitangentArray, gl.STATIC_DRAW);
		
		//draws object
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.vertexAttribPointer(shader.vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.vertexAttribPointer(shader.vertexNormalLocation, 3, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.vertexAttribPointer(shader.vertexTexCoordLocation, 2, gl.FLOAT, false, 0, 0);		
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
		gl.drawElements(gl.TRIANGLES, this.triangleArray.length, gl.UNSIGNED_SHORT, 0);	

		gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
		gl.vertexAttribPointer(shader.vertexTangentLocation, 3, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.bitangentBuffer);
		gl.vertexAttribPointer(shader.vertexBitangentLocation, 3, gl.FLOAT, false, 0, 0);
	}
	
	//Initialized the objects used
	function init(){
		
		canvas = document.getElementById('webgl');
		gl = getWebGLContext(canvas, false);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		
		canvas.onmousemove = onmousemove;
		canvas.onmousedown = onmousedown;
		canvas.onmouseup   = onmouseup;
		
		var modelTexture = gl.createTexture();
				
		var modelImage = new Image();
		modelImage.onload = function() {
			loadTexture(modelImage, modelTexture);
		}
		modelImage.crossOrigin = "anonymous";
		
		var normalTexture = gl.createTexture();
				
		var normalImage = new Image();
		normalImage.onload = function() {
			loadTexture(normalImage, normalTexture);
		}
		normalImage.crossOrigin = "anonymous";
		
		var displacmentTexture = gl.createTexture();
				
		var displacmentImage = new Image();
		displacmentImage.onload = function() {
			loadTexture(displacmentImage, displacmentTexture);
		}
		displacmentImage.crossOrigin = "anonymous";
	
		var normals=[];
		var tangents=[];
		var bitangents=[];
		
		var model=square;
		
		normals = createNormal(model,normals);
		tangents = createTangent(model,tangents);
		bitangents = createBitangent(model,bitangents);
	
		
	
		gl.enable(gl.DEPTH_TEST);
		
		modelImage.src  = 'http://i.imgur.com/QFaWimV.jpg';
		normalImage.src = 'http://i.imgur.com/umZeIDz.jpg';
		displacmentImage.src = 'http://i.imgur.com/EG3AWt8.jpg';
		
		gl.activeTexture( gl.TEXTURE1 );
		gl.bindTexture( gl.TEXTURE_2D, modelTexture );
		gl.activeTexture( gl.TEXTURE2 );
		gl.bindTexture( gl.TEXTURE_2D, normalTexture );
		gl.activeTexture( gl.TEXTURE3 );
		gl.bindTexture( gl.TEXTURE_2D, displacmentTexture );
		gl.activeTexture( gl.TEXTURE0 );
		
		//initialize shaders
		lightingShader = new Shader('vertexShader','lightingFragmentShader');
		//initialize models
		chestModel    = new Model(model,normals,tangents,bitangents);
		
		requestAnimationFrame(draw);		
	}

	function draw() {
		
		//initialize empty matrixes and other uniforms
		var viewMatrix = new Matrix4();
		var projectionMatrix = new Matrix4();
		var modelMatrix = new Matrix4();
		
		viewTranslateNum = -5;
		
		viewMatrix.translate(0, 0, viewTranslateNum);
		
		projectionMatrix.perspective(30, 1, 1, 10); //degree of view, aspect ratio,near clipping plane distance, far clipping plane distance)'
		
		var currentShader;
		var currentModel;
		
		//stores specific Objects in the generic objects
		currentShader = lightingShader;
		currentModel = chestModel;
		
		//clear the background color to a dark redish orange
		gl.clearColor(0.67843, 1.0, 0.18431, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		//executes objects functions
		currentShader.use(projectionMatrix,viewMatrix,modelMatrix,0.0,0.0,0.0);
		currentModel.draw(currentShader);
	}