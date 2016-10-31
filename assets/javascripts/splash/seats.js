var senate_seats;
var house_seats;
var MAX_HOUSE_GRID = 49*9; // Each column is 9 boxes tall by 49 wide
var MAX_SENATE_GRID = 25*4; // Each column is 4 boxes tall by 25 wide

function setUpHouse(data) {
  var h2 = document.createElement('h2');
  var bar = document.createElement('div');
  var sub = document.createElement('div');
  var boxOffset = MAX_HOUSE_GRID - data.total;

  h2.setAttribute('class', 'module__header');
  h2.innerHTML = "HOUSE SEATS";

  bar.setAttribute("class", "bar bar-house");

  bar.innerHTML = repeatBoxes(MAX_HOUSE_GRID, "box")

  bar.childNodes[8].classList.add("space");
  bar.childNodes[17].classList.add("space");
  bar.childNodes[26].classList.add("space");
  bar.childNodes[422].classList.add("space");
  bar.childNodes[431].classList.add("space");
  bar.childNodes[440].classList.add("space");

  house_seats.innerHTML = '<a href="'+electionBaseUrl+'/house" target="_blank" id="house-link" class="seats-link"></a>';
  var linkWrapper = document.getElementById('house-link');
  linkWrapper.appendChild(h2);
  linkWrapper.appendChild(sub);
  linkWrapper.appendChild(bar);
}

function updateHouseSeats(data) {
  var barHouse = document.getElementsByClassName("bar-house")[0];
  var other = data.total - data.wins.dem - data.wins.gop - data.tossup;
  var boxes = barHouse.querySelectorAll('.box:not(.space)');
  var filledIn = 0;

  for (var i=0; i<data.wins.dem; i++) {
    boxes[i].className = "box dem";
  }
  filledIn += data.wins.dem;

  for (var i = filledIn; i<filledIn+other; i++) {
    boxes[i].className = "box other";
  }
  filledIn+=other;

  for (var i = filledIn; i<filledIn+data.tossup; i++) {
    boxes[i].className = "box tossup";
  }
  filledIn+=data.tossup;

  for (var i = filledIn; i<filledIn+data.wins.gop; i++) {
    boxes[i].className = "box gop";
  }
}

function setUpSenate(data) {
  var h2 = document.createElement("h2");
  var bar = document.createElement('div');
  var sub = document.createElement('div');

  h2.setAttribute('class', 'module__header');
  h2.innerHTML = "SENATE SEATS";
  sub.innerHTML = "Thirty up for grabs";

  bar.setAttribute("class", "bar bar-senate");

  bar.innerHTML = repeatBoxes(MAX_SENATE_GRID, "box");

  senate_seats.innerHTML = '<a href="'+electionBaseUrl+'/senate" target="_blank" id="senate-link" class="seats-link"></a>';
  var linkWrapper = document.getElementById('senate-link');
  linkWrapper.appendChild(h2);
  linkWrapper.appendChild(sub);
  linkWrapper.appendChild(bar);
}

function updateSenateSeats(data) {
  var barSenate = document.getElementsByClassName("bar-senate")[0];
  var boxes = barSenate.querySelectorAll('.box');
  var filledIn = 0;

  for (var i=0; i<data.priors.dem; i++) {
    boxes[i].className = "box dem--priors";
  }
  filledIn += data.priors.dem;

  for (var i=filledIn; i<filledIn+data.wins.dem; i++) {
    boxes[i].className = "box dem";
  }
  filledIn += data.wins.dem;

  for (var i=filledIn; i<filledIn+data.tossup; i++) {
    boxes[i].className = "box tossup";
  }
  filledIn += data.tossup;

  for (var i=filledIn; i<filledIn+data.wins.gop; i++) {
    boxes[i].className = "box gop";
  }
  filledIn += data.wins.gop;

  for (var i=filledIn; i<filledIn+data.priors.gop; i++) {
    boxes[i].className = "box gop--priors";
  }
}

function repeatBoxes(times, css) {
  return new Array(times).fill("<div class='" + css + "'></div>").join('');
}

module.exports = {
  updateHouse: function(data) {
    updateHouseSeats(data);
  },
  renderHouse: function(data) {
    house_seats = window.document.getElementById('house_seats');
    if (house_seats) {
      setUpHouse(data);
      this.updateHouse(data);
    }
  },
  updateSenate: function(data) {
    updateSenateSeats(data);
  },
  renderSenate: function(data) {
    senate_seats = window.document.getElementById('senate_seats');

    if (senate_seats) {
      setUpSenate(data);
      this.updateSenate(data);
    }
  }
}
