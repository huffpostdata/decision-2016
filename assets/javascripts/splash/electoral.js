var electoral = document.getElementById('electoral_votes');

if (!electoral) {
  return false;
}

genHTML();

var ctx = document.getElementById('ev-canvas').getContext('2d');
ctx.canvas.width = 665;
ctx.canvas.height = 275;

var bg = document.getElementById('static-background').getContext('2d');
bg.canvas.width = ctx.canvas.width;
bg.canvas.height = ctx.canvas.height;

var overlay = document.getElementById('static-overlay').getContext('2d');
overlay.canvas.width = ctx.canvas.width;
overlay.canvas.height = ctx.canvas.height;

var totalVotes = 538;
var winCondition = 270;
var titleFont = '"ProximaNovaCond-Extrabld", "Helvetica Neue", "Helvetica", Arial, sans-serif';
var barHeight = 30;
var barTopPosition = ctx.canvas.height - (barHeight*2.5);

// image stuff
var loadcount = 0;
var totalimages = 0;
var preloaded = false;

var loadImages = function(imageArray) {
  loadcount = 0;
  totalimages = imageArray.length;
  preloaded = false;

  var loadedImages = [];
  for (var i=0; i<imageArray.length; i++) {
    var image = new Image();
    image.onload = function() {
      loadcount++
      if(loadcount === totalimages) {
        preloaded = true;
      }
    }
    image.src = imageArray[i].name;
    image.width = imageArray[i].width;
    image.height = imageArray[i].height;
    image.style.width = '300px';
    image.style.height = 300 * imageArray[i].height / imageArray[i].width;
    loadedImages[i] = image;
  }
  return loadedImages;
}
var clintonImages = loadImages([
  {
    name: electoralImages.clinton.sad,
    width: 664,
    height: 593
  }, 
  {
    name: electoralImages.clinton.basic,
    width: 685,
    height: 624
  }, 
  {
    name: electoralImages.clinton.happy,
    width: 682,
    height: 643
  }, 
]);
var trumpImages = loadImages([
  {
    name: electoralImages.trump.sad,
    width: 850,
    height: 640
  }, 
  {
    name: electoralImages.trump.basic,
    width: 906,
    height: 623
  }, 
  {
    name: electoralImages.trump.happy,
    width: 821,
    height: 607
  }, 
]);

// CANVAS Functions ---- START
function drawStaticThings() {
  // top border?
  bg.beginPath();
  bg.strokeStyle = '#ececec';
  bg.lineWidth = 3;
  bg.moveTo(0, 0);
  bg.lineTo(ctx.canvas.width, 0);
  bg.stroke();

  // bar background
  bg.beginPath();
  bg.fillStyle = '#c7c7c7';
  bg.fillRect(0, barTopPosition, ctx.canvas.width, barHeight);
  bg.beginPath();
  bg.strokeStyle = '#f1f1f1f';
  bg.lineWidth = 1;
  bg.moveTo(0, barTopPosition + barHeight);
  bg.lineTo(ctx.canvas.width, barTopPosition + barHeight - 1);
  bg.stroke();

  // 270 marker
  bg.setLineDash([8, 8]);
  bg.beginPath();
  bg.strokeStyle = '#c7c7c7';
  bg.lineWidth = 1;
  bg.moveTo(ctx.canvas.width/2, 0);
  bg.lineTo(ctx.canvas.width/2, barTopPosition + barHeight);
  bg.stroke();

  // 270 bubble
  overlay.setLineDash([]);
  overlay.beginPath();
  overlay.fillStyle = '#fff';
  overlay.strokeStyle = '#000';
  overlay.lineWidth = 1;
  overlay.moveTo(ctx.canvas.width/2, barTopPosition + barHeight - 5);
  overlay.lineTo(ctx.canvas.width/2 - 5, barTopPosition + barHeight + 10);
  overlay.lineTo(ctx.canvas.width/2 - 110, barTopPosition + barHeight + 10);
  overlay.lineTo(ctx.canvas.width/2 - 110, barTopPosition + barHeight + 30);
  overlay.lineTo(ctx.canvas.width/2 + 110, barTopPosition + barHeight + 30);
  overlay.lineTo(ctx.canvas.width/2 + 110, barTopPosition + barHeight + 10);
  overlay.lineTo(ctx.canvas.width/2 + 5, barTopPosition + barHeight + 10);
  overlay.lineTo(ctx.canvas.width/2, barTopPosition + barHeight - 5);
  overlay.stroke();
  overlay.fill();

  overlay.beginPath();
  overlay.fillStyle = '#000';
  overlay.font = '10pt Helvetica, Arial, serif';
  overlay.textAlign = 'center';
  overlay.fillText('270 Electoral Votes Needed to Win', ctx.canvas.width/2, barTopPosition + barHeight + 25);
}

function drawThings(newData, currentData) {
  var clintonUpToDate = newData.clinton.electoral === currentData.clinton.electoral;
  var trumpUpToDate = newData.trump.electoral === currentData.trump.electoral;
  var clintonPosition = setBarPosition('clinton', newData, currentData);
  var clintonPercent = percentOfWin(currentData.clinton.electoral);
  var trumpRawPosition = setBarPosition('trump', newData, currentData);
  var trumpPosition = ctx.canvas.width - trumpRawPosition;
  var trumpPercent = percentOfWin(currentData.trump.electoral);
  var winner = newData.winner;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  drawBars(clintonPosition, trumpPosition, trumpRawPosition);
  drawPopularVotes(newData);
  drawFaces(clintonPercent, trumpPercent, clintonPosition, trumpPosition, winner);
  drawBubbleBoxes(clintonPosition, clintonPercent, trumpPosition, trumpPercent, currentData, winner);

  requestAnimationFrame(function() {
    if (!clintonUpToDate || !trumpUpToDate) {
      drawThings(newData, currentData);
    }
  });
}

function drawBars(clintonPosition, trumpPosition, trumpRawPosition) {
  // clinton
  ctx.beginPath();
  ctx.rect(0, barTopPosition, clintonPosition, barHeight);
  ctx.fillStyle = '#4056BE';
  ctx.fill();

  // trump
  ctx.beginPath();
  ctx.rect(trumpPosition, barTopPosition, trumpRawPosition, barHeight);
  ctx.fillStyle = '#e2272e';
  ctx.fill();
}

function drawPopularVotes(data) {
  drawPopularVotesFor('clinton', data, 'left', 10);
  drawPopularVotesFor('trump', data, 'right', ctx.canvas.width - 10);
}

function drawPopularVotesFor(candidate, data, align, x) {
  ctx.beginPath();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'normal 9pt Helvetica, Arial, serif';
  ctx.textAlign = align;
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
  ctx.shadowBlur = 1;
  ctx.fillText(data[candidate].popular.toLocaleString() + ' POPULAR VOTES', x, barTopPosition + 20);
}

function bubbleCollision(clintonPosition, clintonPercent, trumpPosition, trumpPercent) {
  // if bubbles collide, calculate how much the bubbles are crossing each other so they can adjust and push each other accordingly
  var clintonBubble = bubbleConfig(clintonPercent);
  var trumpBubble = bubbleConfig(trumpPercent);
  var clintonBubbleRange = clintonPosition + clintonBubble.corner.bottom.right.x;
  var trumpBubbleRange = trumpPosition - trumpBubble.corner.bottom.left.x;
  var offset = clintonBubbleRange > trumpBubbleRange ? Math.abs(clintonBubbleRange - trumpBubbleRange + 2)/2 : 0;

  return {
    clinton: offset * clintonPercent,
    trump: offset * trumpPercent
  };
}

function drawBubbleBoxes(clintonPosition, clintonPercent, trumpPosition, trumpPercent, currentData, winner) {
  // set limit to how far a bubble can go into opponent's area
  var clintonAdjustedPosition = clintonPosition > 360 ? 360 : clintonPosition;
  var trumpAdjustedPosition = trumpPosition < 280 ? 280 : trumpPosition;
  console.log(trumpPosition);

  // if bubbles collide, see who pushes who harder and by how much
  // offsets adjusts the bubbles at the beginning and end of bar for "collision"
  var collision = bubbleCollision(clintonAdjustedPosition, clintonPercent, trumpAdjustedPosition, trumpPercent);

  var clintonOffset = clintonPosition < 40 ? 41 : clintonAdjustedPosition - collision.clinton;
  var trumpOffset = trumpPosition > ctx.canvas.width - 40 ? ctx.canvas.width - 41 : trumpAdjustedPosition + collision.trump;

  drawBubble('CLINTON', clintonPosition, clintonPercent, '#cfd4ea', currentData.clinton.electoral, '#4056BE', clintonOffset, winner);
  drawBubble('TRUMP', trumpPosition, trumpPercent, '#f8dad8', currentData.trump.electoral, '#e2272e', trumpOffset, winner);
}

function drawBubble(text, position, percentOfWin, color, electoralVotes, colorText, bubbleOffset, winner) {
  var minPercent = 0.4;
  var percent = percentOfWin;
  if (percent < minPercent) {
    percent = minPercent;
  }
  if (percent > 1) {
    percent = 1;
  }
  var bubble = bubbleConfig(percent);
  // adjust bubble handle when its at the edge of the bubble START
  var bubbleCornerBottomLeftX = bubbleOffset - bubble.corner.bottom.left.x;
  var handleBaseLeftX = position - bubble.handle.base.left.x;
  var bubbleCornerBottomRightX = bubbleOffset + bubble.corner.bottom.right.x;
  var handleBaseRightX = position + bubble.handle.base.right.x;
  // adjust bubble handle when its at the edge of the bubble END

  if (winner === 'clinton') {
    handleBaseLeftX = bubbleCornerBottomLeftX > handleBaseLeftX ? bubbleCornerBottomLeftX : handleBaseLeftX;
    handleBaseRightX = bubbleCornerBottomRightX < handleBaseRightX ? bubbleCornerBottomRightX : handleBaseRightX;
    handleBaseLeftX = handleBaseLeftX > handleBaseRightX ? handleBaseRightX : handleBaseLeftX;
  } 
  
  if (winner === 'trump') {
    handleBaseRightX = bubbleCornerBottomRightX < handleBaseRightX ? bubbleCornerBottomRightX : handleBaseRightX;
    handleBaseLeftX = bubbleCornerBottomLeftX > handleBaseLeftX ? bubbleCornerBottomLeftX : handleBaseLeftX;
    handleBaseRightX = handleBaseRightX < handleBaseLeftX ? handleBaseLeftX : handleBaseRightX;
    // bubble.handle.base.right.y += 5;
  }

  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.moveTo(position - bubble.handle.tip.x, barTopPosition - bubble.handle.tip.y);
  ctx.lineTo(handleBaseLeftX, barTopPosition - bubble.handle.base.left.y);
  ctx.lineTo(bubbleCornerBottomLeftX, barTopPosition - bubble.corner.bottom.left.y);
  ctx.lineTo(bubbleOffset - bubble.corner.top.left.x, barTopPosition - bubble.corner.top.left.y);
  ctx.lineTo(bubbleOffset + bubble.corner.top.right.x, barTopPosition - bubble.corner.top.right.y);
  ctx.lineTo(bubbleCornerBottomRightX, barTopPosition - bubble.corner.bottom.right.y);
  ctx.lineTo(handleBaseRightX, barTopPosition - bubble.handle.base.right.y);
  ctx.lineTo(position - bubble.handle.tip.x, barTopPosition - bubble.handle.tip.y);
  ctx.stroke();
  ctx.fill();

  drawBubbleText(text, (36 * percent), '#000000', bubbleOffset, barTopPosition - (bubble.padding * percent) - bubble.corner.bottom.left.y - (85 * percent));
  drawBubbleText(electoralVotes, (80 * percent), colorText, bubbleOffset, barTopPosition - ((bubble.padding + 5) * percent) - bubble.corner.bottom.left.y);
}

function bubbleConfig(percent) {
  if (percent > 1) {
    percent = 1;
  }
  var width = 200 * percent;
  var height = 140 * percent;
  var padding = 10;

  return {
    width: width,
    height: height,
    padding: padding,
    handle: {
      tip: {
        x: 0,
        y: 2
      },
      base: {
        left: {
          x: 5,
          y: padding
        },
        right: {
          x: 5,
          y: padding
        }
      }
    },
    corner: {
      bottom: {
        left: {
          x: width/2,
          y: padding
        },
        right: {
          x: width/2,
          y: padding
        }
      },
      top: {
        left: {
          x: width/2,
          y: padding + height
        },
        right: {
          x: width/2,
          y: padding + height
        }
      }
    }
  }
}

function drawBubbleText(text, size, color, x, y) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.font = size+'pt '+titleFont;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

function drawFaces(clintonPercent, trumpPercent, clintonPosition, trumpPosition, winner) {
  var minPercent = 0.4;
  var collision = bubbleCollision(clintonPosition, clintonPercent, trumpPosition, trumpPercent);

  // offsets adjusts face positions when colliding with bubbles
  var clintonOffset = clintonPosition < 100;
  var trumpOffset = trumpPosition > ctx.canvas.width - 100;
  makeClintonFace(clintonPosition, clintonPercent, minPercent, clintonOffset, collision.clinton, winner);
  makeTrumpFace(trumpPosition, trumpPercent, minPercent, trumpOffset, collision.trump, winner);
}

function makeClintonFace(position, percent, minPercent, offset, collision, winner) {
  var percent = percent;
  if (percent < minPercent) {
    percent = minPercent;
  }
  if (percent > 1) {
    percent = 1;
  }
  var faceValue = 1;
  if (winner) {
    if (winner === 'clinton') {
      faceValue = 2;
    } 
    if (winner === 'trump') {
      faceValue = 0;
    }
  }
  var currentImage = clintonImages[faceValue];
  var bubble = bubbleConfig(percent);
  var clintonBubble = bubbleConfig(percent);
  var w = ctx.canvas.width/3.2 * percent;
  var h = w * currentImage.height / currentImage.width;
  var x = offset ? position + bubble.corner.bottom.right.x : 0;
  var y = barTopPosition - h;
  var bubbleRange = position - bubble.corner.bottom.left.x - (collision/2);
  var faceRange = w;
  // faceAdjustment: adjust the faces based on bubble position so the faces aren't covered up.
  var faceAdjustment;
  if(percent > minPercent) {
    faceAdjustment = faceRange > bubbleRange ? faceRange - bubbleRange : 0;
  } else {
    faceAdjustment = offset && bubbleRange < 0 ? bubbleRange : 0;
  }

  ctx.drawImage(currentImage, x - faceAdjustment, y, w, h);
}

function makeTrumpFace(position, percent, minPercent, offset, collision, winner) {
  var percent = percent;
  if (percent < minPercent) {
    percent = minPercent;
  }
  if (percent > 1) {
    percent = 1;
  }
  var faceValue = 1;
  if (winner) {
    if (winner === 'trump') {
      faceValue = 2;
    } 
    if (winner === 'clinton') {
      faceValue = 0;
    }
  }
  var currentImage = trumpImages[faceValue];
  var bubble = bubbleConfig(percent);
  var w = ctx.canvas.width/2.8 * percent;
  var h = w * currentImage.height / currentImage.width;
  var x = offset ? position - w - bubble.corner.bottom.right.x : ctx.canvas.width - w;
  var y = barTopPosition - h;
  var bubbleRange = position + bubble.corner.top.right.x + (collision/2);
  var faceRange = x;
  // faceAdjustment: adjust the faces based on bubble position so the faces aren't covered up.
  var faceAdjustment = 0;

  if (percent > minPercent) {
    faceAdjustment = bubbleRange > faceRange ? bubbleRange - faceRange : 0;
  } else {
    if (offset && bubbleRange > ctx.canvas.width) {
      faceAdjustment = ctx.canvas.width - bubbleRange;
    } 
    if (!offset) {
      faceAdjustment = (bubbleRange - faceRange) / 2;
    }        
  }

  ctx.drawImage(currentImage, x + faceAdjustment, y, w, h);
}

function setBarPosition(candidate, newData, currentData) {
  var position;
  if (newData[candidate].electoral > currentData[candidate].electoral) {
    position = barPosition(percentOfWin(currentData[candidate]['electoral']++));
  } else if (newData[candidate]['electoral'] < currentData[candidate]['electoral']) {
    position = barPosition(percentOfWin(currentData[candidate]['electoral']--));
  } else {
    position = barPosition(percentOfWin(currentData[candidate]['electoral']));
  }
  return position;
}

function barPosition(val) {
  return val * (ctx.canvas.width/2);
}

function percentOfWin(val) {
  var percent = val/winCondition;
  return percent;
}

function normalizeData(data) {
  return {
    clinton: {
      electoral: data.nClintonElectoralVotes,
      popular: data.nClinton
    },
    trump: {
      electoral: data.nTrumpElectoralVotes,
      popular: data.nTrump
    },
    winner: data.winner
  };
}

// CANVAS Functions --- END

// HTML Gen Functions --- START
function genHTML() {
  electoral.setAttribute('class', 'ev');
  var headerContent = genHeaderContent();
  var canvasElements = genCanvasElements();
  electoral.appendChild(headerContent);
  electoral.appendChild(canvasElements);
}

function genHeaderContent() {
  var electoralHeader = document.createElement('div');
  electoralHeader.setAttribute('class', 'ev__header');

  var title = document.createElement('h2');
  title.setAttribute('class', 'ev__title');
  title.innerHTML = 'ELECTORAL VOTES';

  var blurb = document.createElement('div');
  blurb.setAttribute('class', 'ev__blurb');
  blurb.innerHTML = '<p>Text and things.</p>';

  electoralHeader.appendChild(title);
  electoralHeader.appendChild(blurb);

  return electoralHeader;
}

function genCanvasElements() {
  var electoralContent = document.createElement('div');
  electoralContent.setAttribute('class', 'ev__content');

  var bgCanvas = document.createElement('canvas');
  bgCanvas.setAttribute('id', 'static-background');
  bgCanvas.setAttribute('class', 'canvas-onion');

  var animatedCanvas = document.createElement('canvas');
  animatedCanvas.setAttribute('id', 'ev-canvas');
  animatedCanvas.setAttribute('class', 'canvas-onion');

  var overlayCanvas = document.createElement('canvas');
  overlayCanvas.setAttribute('id', 'static-overlay');
  overlayCanvas.setAttribute('class', 'canvas-onion canvas-overlay');

  electoralContent.appendChild(bgCanvas);
  electoralContent.appendChild(animatedCanvas);
  electoralContent.appendChild(overlayCanvas);

  return electoralContent;
}
// HTML Gen Functions --- END

module.exports = {
  currentData: {
    clinton: {
      electoral: 0,
      popular: 0
    },
    trump: {
      electoral: 0,
      popular: 0
    }
  },
  update: function(data) {
    var newData = normalizeData(data);
    drawThings(newData, this.currentData);
    this.currentData = newData;
  },
  render: function(data) {
    var newData = normalizeData(data);
    drawStaticThings();
    drawThings(newData, this.currentData);
    this.currentData = newData;
  }
}
