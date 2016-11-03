var senate_seats;
var house_seats;
var MAX_HOUSE_GRID = 49*9; // Each column is 9 boxes tall by 49 wide
var MAX_SENATE_GRID = 25*4; // Each column is 4 boxes tall by 25 wide

function setUpHouse(data, i18n) {
  house_seats.innerHTML = markoHouse;
  house_seats.querySelector('h2').innerHTML = i18n.t('banner.House Seats');
  house_seats.querySelector('.count').innerHTML = i18n.t('banner.All 435 seats up for re-election');
  house_seats.querySelector('.balance').innerHTML = i18n.t('house.Balance of Power');
}

function updateHouseSeats(data) {
  var barHouse = document.getElementsByClassName("races")[0];
  var other = data.total - data.wins.dem - data.wins.gop - data.tossup;
  var boxes = barHouse.querySelectorAll('li:not(.space)');
  var filledIn = 0;

  for (var i=0; i<data.wins.dem; i++) {
    boxes[i].className = "dem-win";
  }
  filledIn += data.wins.dem;

  for (var i = filledIn; i<filledIn+other; i++) {
    boxes[i].className = "other";
  }
  filledIn+=other;

  for (var i = filledIn; i<filledIn+data.tossup; i++) {
    boxes[i].className = "tossup";
  }
  filledIn+=data.tossup;

  for (var i = filledIn; i<filledIn+data.wins.gop; i++) {
    boxes[i].className = "gop-win";
  }
}

function setUpSenate(data, i18n) {
  senate_seats.innerHTML = markoSenate;
  senate_seats.querySelector('h2').innerHTML = i18n.t('banner.Senate Seats');
  senate_seats.querySelector('.count').innerHTML = i18n.t('banner.34 seats up for re-election');
  senate_seats.querySelector('.balance').innerHTML = i18n.t('senate.Balance of Power');
}

function updateSenateSeats(data) {
  var barSenate = document.getElementsByClassName("races")[0];
  var boxes = barSenate.querySelectorAll('li');
  var filledIn = 0;

  for (var i=0; i<data.priors.dem; i++) {
    boxes[i].className = "dem-prior";
  }
  filledIn += data.priors.dem;

  for (var i=filledIn; i<filledIn+data.wins.dem; i++) {
    boxes[i].className = "dem-win";
  }
  filledIn += data.wins.dem;

  for (var i=filledIn; i<filledIn+data.tossup; i++) {
    boxes[i].className = "tossup";
  }
  filledIn += data.tossup;

  for (var i=filledIn; i<filledIn+data.wins.gop; i++) {
    boxes[i].className = "gop-win";
  }
  filledIn += data.wins.gop;

  for (var i=filledIn; i<filledIn+data.priors.gop; i++) {
    boxes[i].className = "gop-prior";
  }
}

function repeatBoxes(times, css) {
  return new Array(times).fill("<div class='" + css + "'></div>").join('');
}

module.exports = {
  updateHouse: function(data) {
    updateHouseSeats(data);
  },
  renderHouse: function(data, i18n) {
    house_seats = window.document.getElementById('house_seats');
    if (house_seats) {
      setUpHouse(data, i18n);
      this.updateHouse(data);
    }
  },
  updateSenate: function(data) {
    updateSenateSeats(data);
  },
  renderSenate: function(data, i18n) {
    senate_seats = window.document.getElementById('senate_seats');

    if (senate_seats) {
      setUpSenate(data, i18n);
      this.updateSenate(data);
    }
  }
}
