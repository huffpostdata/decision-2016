var senate_seats;
var house_seats;

function setUpHouse(data) {
  var h2 = document.createElement('h2');
  var bar = document.createElement('div');
  var sub = document.createElement('div');

  h2.setAttribute('class', 'seats-title');
  h2.innerHTML = "HOUSE SEATS";
  sub.innerHTML = "Nine up for grabs";

  bar.setAttribute("class", "bar bar-house");

  bar.innerHTML  = repeatBoxes(150, "box dem");

  bar.innerHTML += repeatBoxes(20, "box");
  bar.innerHTML += "<div class='box space'></div>";
  bar.innerHTML += repeatBoxes(8, "box");
  bar.innerHTML += "<div class='box space'></div>";
  bar.innerHTML += repeatBoxes(8, "box");
  bar.innerHTML += "<div class='box space'></div>";
  bar.innerHTML += repeatBoxes(8, "box");
  bar.innerHTML += "<div class='box space'></div>";
  bar.innerHTML += repeatBoxes(8, "box");
  bar.innerHTML += "<div class='box space'></div>";
  bar.innerHTML += repeatBoxes(8, "box");
  bar.innerHTML += "<div class='box space'></div>";
  bar.innerHTML += repeatBoxes(8, "box");
  bar.innerHTML += "<div class='box space'></div>";
  bar.innerHTML += repeatBoxes(8, "box");
  bar.innerHTML += "<div class='box space'></div>";

  bar.innerHTML += "<div class='middle'></div>";

  bar.innerHTML += repeatBoxes(8, "box");
  bar.innerHTML += "<div class='box space'></div>";
  bar.innerHTML += "<div class='box'></div>";
  bar.innerHTML += repeatBoxes(7, "box gop");
  bar.innerHTML += "<div class='box space'></div>";
  bar.innerHTML += repeatBoxes(8, "box gop");
  bar.innerHTML += "<div class='box space'></div>";
  bar.innerHTML += repeatBoxes(8, "box gop");
  bar.innerHTML += "<div class='box space'></div>";
  bar.innerHTML += repeatBoxes(8, "box gop");
  bar.innerHTML += "<div class='box space'></div>";
  bar.innerHTML += repeatBoxes(8, "box gop");
  bar.innerHTML += "<div class='box space'></div>";
  bar.innerHTML += repeatBoxes(8, "box gop");
  bar.innerHTML += "<div class='box space'></div>";
  bar.innerHTML += repeatBoxes(153, "box gop");

  house_seats.innerHTML = '<a href="'+electionBaseUrl+'/house" target="_blank" id="house-link"></a>';
  var linkWrapper = document.getElementById('house-link');
  linkWrapper.appendChild(h2);
  linkWrapper.appendChild(sub);
  linkWrapper.appendChild(bar);
}

function setUpSenate() {
  var h2 = document.createElement("h2");
  var bar = document.createElement('div');
  var sub = document.createElement('div');

  h2.setAttribute('class', 'seats-title');
  h2.innerHTML = "SENATE SEATS";
  sub.innerHTML = "Thirty up for grabs";

  bar.setAttribute("class", "bar bar-senate");

  bar.innerHTML += repeatBoxes(34, "box dem not-in-play");
  bar.innerHTML += repeatBoxes(11, "box dem in-play");
  bar.innerHTML += repeatBoxes(7, "box in-play");
  bar.innerHTML += "<div class='middle'></div>";
  bar.innerHTML += repeatBoxes(8, "box in-play");
  bar.innerHTML += repeatBoxes(10, "box gop in-play");
  bar.innerHTML += repeatBoxes(30, "box gop not-in-play");


  senate_seats.innerHTML = '<a href="'+electionBaseUrl+'/senate" target="_blank" id="senate-link"></a>';
  var linkWrapper = document.getElementById('senate-link');
  linkWrapper.appendChild(h2);
  linkWrapper.appendChild(sub);
  linkWrapper.appendChild(bar);
}

function repeatBoxes(times, css) {
  return new Array(times).fill("<div class='" + css + "'></div>").join('');
}

module.exports = {
  renderHouse: function(data) {
    house_seats = window.document.getElementById('house_seats');
    if (house_seats) {
      setUpHouse(data);
    }

  },
  renderSenate: function(data) {
    senate_seats = window.document.getElementById('senate_seats');

    if (senate_seats) {
      setUpSenate();
    }
  }
}
