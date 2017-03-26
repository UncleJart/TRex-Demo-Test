var canvasElement = document.getElementById("dinoCanvas"),
	dinoCanvas = {
		jump: false,
		crouch: false
	},
	requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame,
	canvas,ctx,cWidth,cHeight,
	clouds = [
		{
			x : 31,
			y: 59,
			animSpeed: 2
		},
		{
			x : 270,
			y: 86,
			animSpeed: 2
		},
		{
			x : 509,
			y: 64,
			animSpeed: 2
		}
	],
	dinocharacter = {
		x: 25,
		y: 186
	},
	groundLines = {
		x: 0,
		y: 0
	},
	groundLines2 = {
		x: 1200,
		y: 0
	},
	dinoStartY = dinocharacter.y,
	dinoJumpTopY,
	dinoJumpDY = 3,
	dino = new Image(),
	dinocrouch = new Image(),
	ground = new Image(),
	dinoAnimCycle = 0,
	dinoAnimDelay = 0,
	cloudSpeed = 2,
	animSpeed = {
		dinoJumpDY : 3,
		dinoJumpPercentageValue : 1.8,
		ground: 3
	},
	skyGradientOptions = {
		positions : [0.0,0.3,0.6,0.8,1.0],
		colors: ["#0b5b98","#5e92ba","#a3c3dc","#dfe9f0","#ffffff"]
	},
	grassGradientOptions = {
		positions : [0.0,0.3,0.6,0.8,1.0],
		colors: ["#fded70","#fbe754","#fbe53e","#fbe225","#fbe010"]
	},
	score = 0,
	speed = 3,
	hillsLine = [],
	cactusLine = [];

window.onload = function(){
	ctx = canvasElement.getContext('2d');
	canvas = canvasElement;
	cWidth = canvas.width;
	cHeight = canvas.height;
	init();
};

document.addEventListener("keydown",function(event){
	var keyCode = event.keyCode;
	if(keyCode === 38 || keyCode === 32){
		dinoCanvas.jump = true;
	}else{
		if(keyCode === 40){
			dinoCanvas.crouch = true;
		}
	}
});

document.addEventListener("keyup",function(event){
	var keyCode = event.keyCode;
	if(keyCode === 40){
		dinoCanvas.crouch = false;
	}
});

//Canvas rendering context extensions for drawing primitives
//Clear canvas
CanvasRenderingContext2D.prototype.clearCanvas = function(){
	this.clearRect(0,0,this.cWidth,this.cHeight);
};
//Draw rectangle
CanvasRenderingContext2D.prototype.drawRect = function(x,y,width,height,fillStyle,strokeStyle,lineWidth){
	x = x || 0;
	y = y || 0;
	width = width || 10;
	height = height || 10;
	fillStyle = fillStyle || "#000000";
	strokeStyle = strokeStyle || "#000000";
	lineWidth = lineWidth || 1;

	this.beginPath();
	this.rect(x, y, width, height);
	this.closePath();
	this.fillStyle = fillStyle;
	this.strokeStyle = strokeStyle;
	this.lineWidth = lineWidth;
	this.fill();
};
//Draw Line
CanvasRenderingContext2D.prototype.drawLine = function(x0,y0,x1,y1,strokeStyle,lineWidth) {
	strokeStyle = strokeStyle || "#000000";
	lineWidth = lineWidth || 1;

	this.beginPath();
	this.moveTo(x0,y0);
	this.lineTo(x1,y1);
	this.stroke();
};
//Draw circle
CanvasRenderingContext2D.prototype.drawCircle = function (x,y,r,fillStyle,strokeStyle,lineWidth) {
	x = x || 10;
	y = y || 10;
	r = r || 10;
	fillStyle = fillStyle || "#000000";
	strokeStyle = strokeStyle || "#000000";
	lineWidth = lineWidth || 1;

	this.beginPath();
	this.arc(x, y, r, 0, Math.PI*2, true);
	this.fillStyle = fillStyle;
	this.strokeStyle = strokeStyle;
	this.lineWidth = lineWidth;
	this.fill();
};

CanvasRenderingContext2D.prototype.drawQuadraticCurve = function(x0,y0,x1,y1,x,y,fillStyle,strokeStyle,lineWidth){
	x0 = x0 || 0;
	y0 = y0 || 20;
	x1 = x1 || 30;
	y1 = y1 || 20;
	x = x || 15;
	y = y || 0;
	fillStyle = fillStyle || "transparent";
	strokeStyle = strokeStyle || "#000000";
	lineWidth = lineWidth || 1;

	this.beginPath();
	this.moveTo(x0, y0);
	this.quadraticCurveTo(x, y, x1, y1);
	this.fillStyle = fillStyle;
	this.strokeStyle = strokeStyle;
	this.lineWidth = lineWidth;
	this.fill();
	this.stroke();
};

CanvasRenderingContext2D.prototype.makeShadow = function(){
	this.shadowColor = "#999";
	this.shadowBlur = 20;
	this.shadowOffsetX = 15;
	this.shadowOffsetY = 15;
};

CanvasRenderingContext2D.prototype.drawCenteredText = function(font,fillText,fillStyle,x,y){
	x = x || this.canvas.width / 2;
	y =	y || this.canvas.height / 2;

	font = font || "40pt Courier New";
	fillText = fillText || "Text";
	fillStyle = fillStyle || "white";

	this.fillStyle = fillStyle;
	this.textAlign = 'center';
	this.font = font;
	this.fillText(fillText, x, y);
};

function getRandom(min, max) {
	return Math.random() * (max - min) + min;
}

function getRoundedRandom(min,max,rounded){
	return rounded ?
		Math.round(getRandom(min,max)) :
		Math.floor(getRandom(min,max))
}

function checkXCoordinate(x,dx,xmin,startXPos){
	x-= dx;
	if (x < xmin){
		x = startXPos;
	}
	return x;
}
//Generate lines on ground for ground move animation
function generateGroundElement(ctx,startX,startY,width,height,rows,avgLineWidth){
	rows = rows || 1;
	startX = startX || 0;
	startY = startY || 0;
	width = width || ctx.cWidth;
	height = height || ctx.cHeight;
	avgLineWidth = avgLineWidth || 3;

	var minLineWidth = avgLineWidth - Math.floor(avgLineWidth / 2),
		maxLineWidth = avgLineWidth + Math.floor(avgLineWidth / 2),
		minDistanceBetLines = maxLineWidth,
		maxDistanceBetLines = maxLineWidth * 3,
		coordinatesY = [];

	coordinatesY = calculateReferenceLines();
	drawGroundLines();

	function calculateReferenceLines(){
		var distBetRefLines = Math.round(height / (rows + 1)),
			linePosY = startY;

		while(linePosY < (startY + height)){
			if(linePosY !== startY){
				coordinatesY.push(linePosY);
			}
			linePosY+= distBetRefLines;
		}
		return coordinatesY;
	}

	function drawGroundLines(){
		var	linePosX = startX,
			coordX,
			coordY,
			lineWidth,
			lineXEndCoord;

		while(linePosX < width){
			coordX = getRoundedRandom(minDistanceBetLines,maxDistanceBetLines);
			coordY = coordinatesY[getRoundedRandom(0,rows)];
			linePosX += coordX;
			lineWidth = getRoundedRandom(minLineWidth,maxLineWidth,true);
			lineXEndCoord = linePosX + lineWidth;
			ctx.drawLine(linePosX,coordY,lineXEndCoord,coordY);
			linePosX = lineXEndCoord;
		}
	}
}

function generateHills(startX,startY,num,avgWidth,maxHeight){
	var count, width = 0, height, distance = 0,
		minWidth = Math.round(avgWidth / 2),
		maxWidth = Math.round(avgWidth / 2) + avgWidth,
		hills = [];

	num = Math.abs(num);

	for (count = 1; count <= num; count++){
		var currentHill = {};
		startX+= width + distance;
		width = getRoundedRandom(minWidth,maxWidth,true);
		height = getRoundedRandom(maxHeight / 2,maxHeight,true);
		currentHill.newNode = false;
		currentHill.x0 = startX;
		currentHill.y0 = startY;
		currentHill.x1 = startX + width;
		currentHill.y1 = startY;
		currentHill.x = startX + Math.round(width/2);
		currentHill.disToNext = getRoundedRandom(100,300,true);

		if(getRoundedRandom(0,1,true)){
			currentHill.y = startY - height;
			currentHill.color = "#fded70";
		}else{
			currentHill.y0 = currentHill.y1 = startY - 2;
			currentHill.y = startY + height;
			currentHill.color = "#e8edf0";
		}
		distance+= getRoundedRandom(width/2,width,true);
		hills.push(currentHill);
	}
	return hills;
}

function getMousePosAboveCanvas(canvas, event) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top
	};
}

function init(){

	dino.src = 'img/dino.png';
	dinocrouch.src = 'img/dino_crouch.png';

	dino.onload = function(){
		dinoJumpTopY = dinocharacter.y - dino.naturalHeight * animSpeed.dinoJumpPercentageValue;
	};

	generateGroundElement(ctx,0,220,cWidth*2,30,4,3);

	ground.src = canvas.toDataURL();

	hillsLine.push(generateHills(cWidth,221,2,10,10)); //First Hills
	cactusLine.push(generateCactuses(600,230));

	window.requestAnimationFrame(draw);
}

function createGradientStopPoints(gradient,options){
	options.positions.forEach(function(item,index){
		var color = options.colors[index];
		gradient.addColorStop(item,color);
	});
}

function drawTopToBottomLinearGradient(x0,y0,x1,y1,options){
	var gradient = ctx.createLinearGradient(x0,y0,0,y1);

	createGradientStopPoints(gradient,options);

	ctx.beginPath();

	ctx.fillStyle = gradient;
	ctx.fillRect(x0,y0,x1,y1);
}

function drawCloud(ctx, x, y) {
	var cloudGradientOptions = {
			positions : [0.0,0.3,0.6,0.8,1.0],
			colors: ["#d2e4e9","#bfdfe9","#addcea","#97d7ea","#84d2ea"]
		},
		gradient = ctx.createLinearGradient(x, y - 36, x, y + 23);

	createGradientStopPoints(gradient,cloudGradientOptions);

	ctx.save();
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.bezierCurveTo(x - 24, y + 2, x - 13, y - 33, x + 3, y - 23);
	ctx.bezierCurveTo(x + 9, y - 19, x - 1, y - 51, x + 29, y - 36);
	ctx.bezierCurveTo(x + 34, y - 33, x + 45, y - 66, x + 74, y - 37);
	ctx.bezierCurveTo(x + 80, y - 31, x + 96, y - 55, x + 103, y - 27);
	ctx.bezierCurveTo(x + 104, y - 23, x + 140, y - 30, x + 115, y - 4);
	ctx.bezierCurveTo(x + 112, y, x + 142, y + 20, x + 104, y + 20);
	ctx.bezierCurveTo(x + 99, y + 20, x + 94, y + 52, x + 71, y + 23);
	ctx.bezierCurveTo(x + 70, y + 21, x + 53, y + 50, x + 35, y + 20);
	ctx.bezierCurveTo(x + 34, y + 18, x - 2, y + 32, x, y);
	ctx.fillStyle = gradient;
	/*ctx.makeShadow();*/
	ctx.fill();
	ctx.stroke();
	ctx.restore();
}

function drawCactus(ctx,startX,startY,width,height,rightSided,strokeStyle){
	var halfWidth = Math.round(width/2),
		halfHeight = Math.round(height/2),
		centerPointX = startX + halfWidth,
		highestPointY = startY - height,
		heightThird = Math.round(height/3),
		middlePointY = startY - heightThird,
		rightSideX = centerPointX + halfWidth,
		leftSideX = centerPointX - halfWidth,
		sideY = middlePointY - halfHeight,
		otherSideY = sideY + heightThird;

	strokeStyle = strokeStyle || "#515151";

	ctx.strokeStyle = strokeStyle;
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(centerPointX,startY);
	ctx.lineWidth = 6;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	ctx.lineTo(centerPointX,highestPointY);
	ctx.stroke();
	ctx.restore();
	ctx.moveTo(centerPointX,middlePointY);
	ctx.save();
	ctx.lineWidth = 4;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";

	if(rightSided){
		ctx.lineTo(rightSideX, middlePointY);
		ctx.lineTo(rightSideX, middlePointY);
		ctx.lineTo(rightSideX,sideY);
		ctx.moveTo(leftSideX,sideY);
		ctx.lineTo(leftSideX,otherSideY);
		ctx.lineTo(centerPointX,otherSideY);
	}else{
		ctx.lineTo(leftSideX, middlePointY);
		ctx.lineTo(leftSideX, middlePointY);
		ctx.lineTo(leftSideX,sideY);
		ctx.moveTo(rightSideX,sideY);
		ctx.lineTo(rightSideX,otherSideY);
		ctx.lineTo(centerPointX,otherSideY);
	}
	ctx.stroke();
	ctx.restore();
}

function generateCactuses(startX,startY){
	var widthArray = [15,18],
		heightArray = [25,30,35],
		num = getRoundedRandom(1,3,true),
		width,height,count,
		cactusesArray = [];

	for (count = 1; count <= num; count++){
		cactusOptions = {};
		width = widthArray[getRoundedRandom(0,1,true)];

		if(width === 15) {
			height = heightArray[getRoundedRandom(0,1,true)];
		}else{
			height = heightArray[2];
		}

		cactusOptions.startX = startX;
		cactusOptions.startY = startY;
		cactusOptions.width = width;
		cactusOptions.height = height;
		cactusOptions.rightSided = getRoundedRandom(0,1,true);
		cactusOptions.newNode = false;
		cactusOptions.disToNext = getRoundedRandom(400,500,true);

		cactusesArray.push(cactusOptions);

		startX = startX + width + 6;
	}

	return cactusesArray;

}

function draw() {

	var gameOver = false;


	function checkDinoCoordinate(ystart,y,yend){
		if (y < yend) dinoJumpDY = -dinoJumpDY;
		y-= dinoJumpDY;
		if (y > ystart){
			y = ystart;
			dinoJumpDY = -dinoJumpDY;
			dinoCanvas.jump = false;
		}
		return y;
	}

	ctx.clearCanvas();

	drawTopToBottomLinearGradient(0,0,cWidth,cHeight,skyGradientOptions);

	clouds.forEach(function(item){
		drawCloud(ctx,item.x,item.y);
		item.x = checkXCoordinate(item.x,item.animSpeed,-117,cWidth + 1);
	});

	drawTopToBottomLinearGradient(0,220,cWidth,cHeight,grassGradientOptions);

	ctx.drawLine(0,220,cWidth,220);

	ctx.drawImage(ground,groundLines.x,groundLines.y,cWidth*2,cHeight);
	ctx.drawImage(ground,groundLines2.x,groundLines2.y,cWidth*2,cHeight);

	groundLines.x = checkXCoordinate(groundLines.x,speed,-cWidth*2,0);
	groundLines2.x = checkXCoordinate(groundLines2.x,speed,0,cWidth*2);

	hillsLine.forEach(function(item,i,array){
		item.forEach(function(itemInner,iInner,arrayInner){
			ctx.drawQuadraticCurve(itemInner.x0,itemInner.y0,itemInner.x1,itemInner.y1,itemInner.x,itemInner.y,itemInner.color);
			itemInner.x0-= speed;
			itemInner.x-= speed;
			itemInner.x1-= speed;
			/*console.log(i,iInner,itemInner.x0,itemInner.x,itemInner.x1);*/

			if(iInner === arrayInner.length - 1){
				if((itemInner.x0 < cWidth - itemInner.disToNext) && !itemInner.newNode){
					array.push(generateHills(cWidth,221,2,10,10));
					itemInner.newNode = !itemInner.newNode;
				}
				if(itemInner.x1 < 0){
					array.splice(i,1);
				}
			}

		});
	});


	cactusLine.forEach(function(item,i,array){
		item.forEach(function(itemInner,iInner,arrayInner){
			drawCactus(ctx,itemInner.startX,itemInner.startY,itemInner.width,itemInner.height);

			itemInner.startX-= speed;

			if(iInner === arrayInner.length - 1){
				if((itemInner.startX < (cWidth - itemInner.disToNext)) && !itemInner.newNode){
					array.push(generateCactuses(600,230));
					itemInner.newNode = !itemInner.newNode;
				}
				if(itemInner.x1 < 0){
					array.splice(i,1);
				}
			}

			if(itemInner.startX > dinocharacter.x && itemInner.startX < (dinocharacter.x + 20) &&
				(dinocharacter.y + 44) <= itemInner.startY && (dinocharacter.y + 44) > itemInner.startY - itemInner.height){
				gameOver = true;
			}
		});
	});
	if (dinoCanvas.jump){

		if(gameOver){
			ctx.drawImage(dino,120,0,40,44,dinocharacter.x,dinocharacter.y,40,44);
		}else{
			ctx.drawImage(dino,80,0,40,44,dinocharacter.x,dinocharacter.y,40,44);
			dinocharacter.y = checkDinoCoordinate(dinoStartY,dinocharacter.y,dinoJumpTopY);
		}

	}else if(dinoCanvas.crouch){

		ctx.drawImage(dinocrouch,dinoAnimCycle*55,0,55,26,dinocharacter.x,dinocharacter.y+18,55,26);

		dinoAnimDelay++;

		if((dinoAnimDelay % 8) === 0){
			dinoAnimCycle = (dinoAnimCycle + 1) % 2; //Make more slower legs animation - maybe some other variant?
		}

	}else if(gameOver){
		ctx.drawImage(dino,120,0,40,44,dinocharacter.x,dinocharacter.y,40,44);
	}else{

		ctx.drawImage(dino,dinoAnimCycle*40,0,40,44,dinocharacter.x,dinocharacter.y,40,44);

		dinoAnimDelay++;

		if((dinoAnimDelay % 8) === 0){
			dinoAnimCycle = (dinoAnimCycle + 1) % 2; //Make more slower legs animation - maybe some other variant?
		}
	}

	score++;
	ctx.drawCenteredText("bold 14pt Courier New",score,"#000000",550,16);

	if(!gameOver){
		window.requestAnimationFrame(draw);
	}else{
		ctx.drawCenteredText("40pt Courier New","Game over!","#515151");
	}
}