var electoralPlacement = document.getElementById('electoral_votes');

if (electoralPlacement) {
  electoralPlacement.innerHTML = electoralHTML;

  var electoral = document.querySelector('.electoral-content');
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
      loadedImages[i] = image;
    }
    return loadedImages;
  }

  var clintonImages = loadImages([
    {
      name: electoralImages.clinton.sad,
      width: 600,
      height: 536
    }, 
    {
      name: electoralImages.clinton.basic,
      width: 600,
      height: 547
    }, 
    {
      name: electoralImages.clinton.happy,
      width: 600,
      height: 566
    }, 
  ]);

  var trumpImages = loadImages([
    {
      name: electoralImages.trump.sad,
      width: 600,
      height: 452
    }, 
    {
      name: electoralImages.trump.basic,
      width: 600,
      height: 413
    }, 
    {
      name: electoralImages.trump.happy,
      width: 600,
      height: 444
    }, 
  ]);

  var electoralBars = electoral.querySelector('.bars');
  var electoralTitle = document.querySelector('.electoral-title');
  var electoralBlurb = document.querySelector('.electoral-blurb');

  var areaWidth = electoral.offsetWidth;
  var areaHeight = electoral.offsetHeight;

  var cMod = '--clinton';
  var tMod = '--trump';

  var cBar = electoral.querySelector('.bar'+cMod);
  var tBar = electoral.querySelector('.bar'+tMod);

  var cBarText = electoral.querySelector('.bar-text'+cMod);
  var tBarText = electoral.querySelector('.bar-text'+tMod);

  var cFace = electoral.querySelector('.face'+cMod);
  var tFace = electoral.querySelector('.face'+tMod);

  var cBubble = electoral.querySelector('.bubble'+cMod);
  var cBubbleName = cBubble.querySelector('.bubble__candidate');
  var cBubbleVotes = cBubble.querySelector('.bubble__votes');
  var cBubbleHandle = electoral.querySelector('.bubble-handle--clinton');

  var tBubble = electoral.querySelector('.bubble'+tMod);
  var tBubbleName = tBubble.querySelector('.bubble__candidate');
  var tBubbleVotes = tBubble.querySelector('.bubble__votes');
  var tBubbleHandle = electoral.querySelector('.bubble-handle--trump');

  var bubbleMaxWidth = 200;
  var bubbleMaxHeight = 140;

  var imageMaxHeight = electoralBars.offsetTop;

  var totalVotes = 538;
  var finishBubble = electoral.querySelector('.finish-bubble');

  function percentToPixel(percent) {
    return electoral.offsetWidth * (percent/100);
  }

  function percentOfVotes(val) {
    return val/totalVotes*100;
  }

  function normalizeData(data, i18n) {
    var format = new window.Intl.NumberFormat(i18n.locale).format;

    return {
      clinton: {
        electoral: data.nClintonElectoralVotes,
        electoral_display: format(data.nClintonElectoralVotes),
        popular: data.nClinton,
      },
      trump: {
        electoral: data.nTrumpElectoralVotes,
        electoral_display: format(data.nTrumpElectoralVotes),
        popular: data.nTrump,
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

    var collision = getCollision(cBarPosition, tBarPosition, cBubbleSize.width, tBubbleSize.width);

    var cBubblePosition = bubblePosition(cBarPosition, cBubbleSize.width, collision.clinton);
    var tBubblePosition = bubblePosition(tBarPosition, tBubbleSize.width, collision.trump);

    var cHandlePosition = handlePosition(cBarPosition, cBubbleSize.width, collision.clinton);
    var tHandlePosition = handlePosition(tBarPosition, tBubbleSize.width, collision.trump);

    var cImage = facePicker('clinton', clintonImages, data.winner);
    var tImage = facePicker('trump', trumpImages, data.winner);

    var cFaceSize = faceSize(cPer, cImage);
    var tFaceSize = faceSize(tPer, tImage);

    var cFacePosition = facePosition(cBarPosition, cBubble, cBubbleSize.width, cFaceSize.width, collision.clinton);
    var tFacePosition = facePosition(tBarPosition, tBubble, tBubbleSize.width, tFaceSize.width, collision.trump);

    return {
      clinton: {
        barPosition: cBarPosition+'px',
        bubble: {
          position: cBubblePosition+'px',
          handle: cHandlePosition.offset+'px',
          handleModifier: cHandlePosition.modifier,
          width: cBubbleSize.width+'px',
          height: cBubbleSize.height+'px',
        },
        face: {
          image: cImage.src,
          width: cFaceSize.width+'px',
          height: cFaceSize.height+'px',
          position: cFacePosition,
        },
        collision: collision.clinton,
      },             
      trump: {
        barPosition: tBarPosition+'px',
        bubble: {
          position: tBubblePosition+'px',
          handle: tHandlePosition.offset+'px',
          handleModifier: tHandlePosition.modifier,
          width: tBubbleSize.width+'px',
          height: tBubbleSize.height+'px',
        },
        face: {
          image: tImage.src,
          width: tFaceSize.width+'px',
          height: tFaceSize.height+'px',
          position: tFacePosition,
        },
        collision: collision.trump,
      }
    }
  }

  function getCollision(cPosition, tPosition, cBubbleW, tBubbleW) {
    var cBubbleHalf = cBubbleW/2;
    var tBubbleHalf = tBubbleW/2;

    var cBubbleRange = cPosition + cBubbleHalf;
    var tBubbleRange = tPosition + tBubbleHalf;

    var collisionDiff = 0;
    var cCollision = 0;
    var tCollision = 0;

    if (cBubbleRange > (electoral.offsetWidth - tBubbleRange)) {
      collisionDiff = cBubbleRange - (electoral.offsetWidth - tBubbleRange);
    }

    if (collisionDiff/2 > cBubbleHalf) {
      cCollision = cBubbleHalf;
      tCollision = collisionDiff - cBubbleHalf;
    } else if (collisionDiff/2 > tBubbleHalf) {
      cCollision = collisionDiff - tBubbleHalf;
      tCollision = tBubbleHalf;
    } else {
      cCollision = collisionDiff/2;
      tCollision = collisionDiff/2;
    }

    if (cPosition >= 450 || tPosition >= 450) {
      cCollision = 0; 
      tCollision = 0;
    }
    return {
      clinton: cCollision,
      trump: tCollision,
    }
  }

  function bubbleSize(percent) {
    // min limit 40%, max limit 100%
    var percentRange = Math.max(0.4, Math.min(percent/50, 1));
    return {
      width: bubbleMaxWidth * percentRange,
      height: bubbleMaxHeight * percentRange,
    }
  }

  function facePicker(candidate, images, winner) {
    var index = 1;
    if (winner) {
      index = 0;
      if (winner === candidate) {
        index = 2;
      }
    }
    return images[index];
  }

  function faceSize(percent, image) {
    // min limit 40%, max limit 100%
    var height = imageMaxHeight * Math.max(0.4, Math.min(percent/50, 1));
    return {
      width: (image.width/image.height)*height,
      height: height,
    }
  }

  function facePosition(barPosition, bubble, bubbleWidth, faceWidth, collision) {
    var position = 0;
    var bubbleRange = Math.abs(barPosition - (bubbleWidth)/2 - collision);
    var faceRange = faceWidth*0.7;
    var bubbleIsCoveringFace = collision && faceRange > bubbleRange;
    
    if (barPosition < 110 && !collision) {
      position = barPosition + (bubbleWidth/2);
    } 
    if (barPosition <= bubbleWidth/2) {
      position = bubbleWidth;
    }
    if (barPosition > 110 && bubbleIsCoveringFace) {
      position = bubbleRange - faceRange;
    }

    return position+'px';
  }

  function bubblePosition(position, bubbleWidth, collision) {
    var bubbleOffset = position - collision;
    bubbleOffset = bubbleOffset < 0 ? 0 : bubbleOffset;
    if (position <= bubbleWidth/2) {
      bubbleOffset = bubbleWidth/2;
    }
    if (position >= 425) {
      bubbleOffset = 300;
    }
    return bubbleOffset;
  }

  function nameSize(bubbleHeight) {
    var size = bubbleHeight * .33;
    return size;
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
    if (position >= 425) {
      handleOffset = 332.5;
      handleMod = '';
    }

    return {
      offset: handleOffset,
      modifier: handleMod
    }
  }

  function bubbles(d, c, t, i18n) {
    cBubble.style.left = c.bubble.position;
    cBubble.style.width = c.bubble.width;
    cBubble.style.height = c.bubble.height;
    cBubble.style.fontSize = c.bubble.height;
    cBubbleVotes.textContent = d.clinton.electoral_display;
    cBubbleHandle.style.left = c.bubble.handle;
    cBubbleHandle.setAttribute('data-handle', c.bubble.handleModifier);

    tBubble.style.right = t.bubble.position;
    tBubble.style.width = t.bubble.width;
    tBubble.style.height = t.bubble.height;
    tBubble.style.fontSize = t.bubble.height;
    tBubbleVotes.textContent = d.trump.electoral_display;
    tBubbleHandle.style.right = t.bubble.handle;
    tBubbleHandle.setAttribute('data-handle', t.bubble.handleModifier);
  }

  function bars(d, c, t, i18n) {
    cBar.style.width = c.barPosition; 
    cBarText.textContent = i18n.t('counts.n Popular Votes', d.clinton.popular);
    tBar.style.width = t.barPosition;
    tBarText.textContent = i18n.t('counts.n Popular Votes', d.trump.popular);
  }

  function faces(c, t) {
    cFace.style.width = c.face.width;
    cFace.style.height = c.face.height;
    cFace.style.left = c.face.position;
    cFace.style.backgroundImage = "url("+c.face.image+")";

    tFace.style.width = t.face.width;
    tFace.style.height = t.face.height;
    tFace.style.right = t.face.position;
    tFace.style.backgroundImage = "url("+t.face.image+")";
  }

  function updateThings(data, i18n) {
    var clintonPercent = percentOfVotes(data.clinton.electoral);
    var trumpPercent = percentOfVotes(data.trump.electoral);
    var newState = nextState(data, clintonPercent, trumpPercent);

    bubbles(data, newState.clinton, newState.trump, i18n);
    bars(data, newState.clinton, newState.trump, i18n);
    faces(newState.clinton, newState.trump);
  }

  function updateStaticContent(i18n) {
    electoralTitle.textContent = i18n.t('h2.Electoral Votes');
    electoralBlurb.textContent = i18n.t('electoral.blurb');
    cBubbleName.textContent = i18n.t('name.clinton');
    tBubbleName.textContent = i18n.t('name.trump');
    finishBubble.textContent = i18n.t('counts.270 to win');
  }
}

module.exports = {
  update: function(data, i18n) {
    if(electoralPlacement) {
      var normalData = normalizeData(data, i18n);
      updateThings(normalData, i18n);
    }
  },
  render: function(data, i18n) {
    if(electoralPlacement) {
      var normalData = normalizeData(data, i18n);
      updateStaticContent(i18n);
      updateThings(normalData, i18n);
    }
  }
}
