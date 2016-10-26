var electoral = document.getElementById('electoral_votes');
var electoralBars = electoral.querySelector('.bars');

if (!electoral) {
  return false;
}

var areaWidth = electoral.offsetWidth;
var areaHeight = electoral.offsetHeight;

var cMod = '--clinton';
var tMod = '--trump';

var cBar = electoral.querySelector('.bar'+cMod);
var tBar = electoral.querySelector('.bar'+tMod);

var cFace = electoral.querySelector('.face'+cMod);
var tFace = electoral.querySelector('.face'+tMod);

var cBubble = electoral.querySelector('.bubble'+cMod);
var cBubbleText = cBubble.querySelector('.bubble__votes');
var cBubbleHandle = electoral.querySelector('.bubble-handle--clinton');


var tBubble = electoral.querySelector('.bubble'+tMod);
var tBubbleText = tBubble.querySelector('.bubble__votes');
var tBubbleHandle = electoral.querySelector('.bubble-handle--trump');

var bubbleMaxWidth = 200;
var bubbleMaxHeight = 140;

var imageMaxWidth = 300;
var imageMaxHeight = electoralBars.offsetTop;

var totalVotes = 538;
var winCondition = 270;
var titleFont = '"ProximaNovaCond-Extrabld", "Helvetica Neue", "Helvetica", Arial, sans-serif';
// var barTopPosition = ctx.canvas.height - (barHeight*2.5);

// var clintonImages = loadImages([
//   {
//     name: electoralImages.clinton.sad,
//     width: 664,
//     height: 593
//   }, 
//   {
//     name: electoralImages.clinton.basic,
//     width: 685,
//     height: 624
//   }, 
//   {
//     name: electoralImages.clinton.happy,
//     width: 682,
//     height: 643
//   }, 
// ]);
// var trumpImages = loadImages([
//   {
//     name: electoralImages.trump.sad,
//     width: 850,
//     height: 640
//   }, 
//   {
//     name: electoralImages.trump.basic,
//     width: 906,
//     height: 623
//   }, 
//   {
//     name: electoralImages.trump.happy,
//     width: 821,
//     height: 607
//   }, 
// ]);

function percentToPixel(percent) {
  return electoral.offsetWidth * (percent/100);
}

function percentOfVotes(val) {
  return val/totalVotes*100;
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
function nextState(data, cPer, tPer) {
  var cBarPosition = percentToPixel(cPer);
  var tBarPosition = percentToPixel(tPer);

  var cBubbleSize = bubbleSize(cPer);
  var tBubbleSize = bubbleSize(tPer);

  var collision = getCollision(cPer, tPer, cBubbleSize.width, tBubbleSize.width);

  var cBubblePosition = bubblePosition(cBarPosition, cBubbleSize.width, collision.clinton);
  var tBubblePosition = bubblePosition(tBarPosition, tBubbleSize.width, collision.trump);

  var cHandlePosition = handlePosition(cBarPosition, cBubbleSize.width, collision.clinton);
  var tHandlePosition = handlePosition(tBarPosition, tBubbleSize.width, collision.trump);

  var cFaceSize = faceSize(cPer);
  var tFaceSize = faceSize(tPer);

  var cFacePosition = facePosition(cBarPosition, cBubble, cBubbleSize.width, cFaceSize.width);
  var tFacePosition = facePosition(tBarPosition, tBubble, tBubbleSize.width, tFaceSize.width);

  return {
    clinton: {
      barPosition: cBarPosition+'px',
      bubblePosition: cBubblePosition+'px',
      bubbleHandle: cHandlePosition.offset+'px',
      bubbleHandleModifier: cHandlePosition.modifier,
      bubbleWidth: cBubbleSize.width+'px',
      bubbleHeight: cBubbleSize.height+'px',
      faceWidth: cFaceSize.width,
      faceHeight: cFaceSize.height,
      facePosition: cFacePosition,
      collision: collision.clinton,
    },             
    trump: {
      barPosition: tBarPosition+'px',
      bubblePosition: tBubblePosition+'px',
      bubbleHandle: tHandlePosition.offset+'px',
      bubbleHandleModifier: tHandlePosition.modifier,
      bubbleWidth: tBubbleSize.width+'px',
      bubbleHeight: tBubbleSize.height+'px',
      faceWidth: tFaceSize.width,
      faceHeight: tFaceSize.height,
      facePosition: tFacePosition,
      collision: collision.trump,
    }
  }
}

function getCollision(cPer, tPer, cBubbleW, tBubbleW) {
  var cBubblePosition = percentToPixel(cPer)
  var tBubblePosition = percentToPixel(tPer);

  var cBubbleHalf = parseInt(cBubbleW)/2;
  var tBubbleHalf = parseInt(tBubbleW)/2;

  var cBubbleRange = cBubblePosition + cBubbleHalf;
  var tBubbleRange = tBubblePosition + tBubbleHalf;

  var collisionDiff = 0;
  var collision = {
    clinton: 0,
    trump: 0,
  }
  if (cBubbleRange > (electoral.offsetWidth - tBubbleRange)) {
    collisionDiff = cBubbleRange - (electoral.offsetWidth - tBubbleRange);
  }

  if (collisionDiff/2 > cBubbleHalf) {
    collision.clinton = cBubbleHalf;
    collision.trump = collisionDiff - cBubbleHalf;
  } else if (collisionDiff/2 > tBubbleHalf) {
    collision.clinton = collisionDiff - tBubbleHalf;
    collision.trump = tBubbleHalf;
  } else {
    collision.clinton = collisionDiff/2;
    collision.trump = collisionDiff/2;
  }

  return collision;
}

function bubbleSize(percent) {
  // min limit 40%, max limit 100%
  var percentRange = Math.max(0.4, Math.min(percent/50, 1));
  return {
    width: bubbleMaxWidth * percentRange,
    height: bubbleMaxHeight * percentRange,
  }
}

function faceSize(percent) {
  // min limit 40%, max limit 100%
  var height = imageMaxHeight * Math.max(0.4, Math.min(percent/50, 1));
  return {
    width: (imageMaxWidth/imageMaxHeight)*height + 'px',
    height: height + 'px',
  }
}

function facePosition(bubblePosition, bubble, bubbleWidth, faceWidth) {
  var position = 0;
  var bubbleRange = Math.abs(bubblePosition - (bubbleWidth)/2);
  
  if (bubblePosition < 110) {
    position = bubblePosition + (bubbleWidth/2);
  }
  return position+'px';
}

function bubblePosition(position, bubbleWidth, collision) {
  var bubbleOffset = position - collision - 1;
  bubbleOffset = bubbleOffset < 0 ? 0 : bubbleOffset;
  if (position <= bubbleWidth/2) {
    bubbleOffset = bubbleWidth/2 + 1;
  }
  return bubbleOffset;
}

function handlePosition(position, bubbleWidth, collision) {
  var handleOffset = Math.max(3, position);
  var handleMod = '';
  if (position < 7) {
    handleMod = 'outside';
  }
  if (collision >= bubbleWidth/2 - 7) {
    handleOffset = position - 3;
    handleMod = 'inside';
  }

  return {
    offset: handleOffset,
    modifier: handleMod
  }
}

function bubbles(c, t) {
  cBubble.style.left = c.bubblePosition;
  cBubble.style.width = c.bubbleWidth;
  cBubble.style.height = c.bubbleHeight;
  cBubbleHandle.style.left = c.bubbleHandle;
  cBubbleHandle.setAttribute('data-handle', c.bubbleHandleModifier);

  tBubble.style.right = t.bubblePosition;
  tBubble.style.width = t.bubbleWidth;
  tBubble.style.height = t.bubbleHeight;
  tBubbleHandle.style.right = t.bubbleHandle;
  tBubbleHandle.setAttribute('data-handle', t.bubbleHandleModifier);
}

function bars(c, t) {
  cBar.style.width = c.barPosition; 
  tBar.style.width = t.barPosition;
}

function faces(c, t) {
  cFace.style.width = c.faceWidth;
  cFace.style.height = c.faceHeight;
  cFace.style.left = c.facePosition;

  tFace.style.width = t.faceWidth;
  tFace.style.height = t.faceHeight;
  tFace.style.right = t.facePosition;
}

function updateThings(data) {
  var clintonPercent = percentOfVotes(data.clinton.electoral);
  var trumpPercent = percentOfVotes(data.trump.electoral);
  var newState = nextState(data, clintonPercent, trumpPercent);

  animate(newState.clinton, newState.trump);  
}

function animate(c, t) {
  bubbles(c, t);
  bars(c, t);
  faces(c, t);
}

module.exports = {
  update: function(data) {
    var normalData = normalizeData(data);
    updateThings(normalData);
  },
  render: function(data) {
    var normalData = normalizeData(data);
    updateThings(normalData);
  }
}
