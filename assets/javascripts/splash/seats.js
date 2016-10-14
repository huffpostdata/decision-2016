var senate_seats;
var house_seats;

function setUpHouse(data) {
  var h2 = document.createElement('h2');
  var bar = document.createElement('div');
  var sub = document.createElement('div');

  h2.innerHTML = "House Seats";
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

  house_seats.appendChild(h2);
  house_seats.appendChild(sub);
  house_seats.appendChild(bar);
}

function setUpSenate() {
  var h2 = document.createElement("h2");
  var bar = document.createElement('div');
  var sub = document.createElement('div');

  h2.innerHTML = "Senate Seats";
  sub.innerHTML = "Thirty up for grabs";

  bar.setAttribute("class", "bar bar-senate");

  bar.innerHTML += repeatBoxes(34, "box dem not-in-play");
  bar.innerHTML += repeatBoxes(11, "box dem in-play");
  bar.innerHTML += repeatBoxes(7, "box in-play");
  bar.innerHTML += "<div class='middle'></div>";
  bar.innerHTML += repeatBoxes(8, "box in-play");
  bar.innerHTML += repeatBoxes(10, "box gop in-play");
  bar.innerHTML += repeatBoxes(30, "box gop not-in-play");


  senate_seats.appendChild(h2);
  senate_seats.appendChild(sub);
  senate_seats.appendChild(bar);
}

function repeatBoxes(times, css) {
  return new Array(times).fill("<div class='" + css + "'></div>").join('');
}

module.exports = {
  renderHouse: function(data) {
    house_seats = window.document.getElementById('house_seats');
    console.debug("house", data);

    setUpHouse(data);
  },
  renderSenate: function(data) {
    senate_seats = window.document.getElementById('senate_seats');

    console.debug("senate", data);

    setUpSenate();

    console.debug("Sweet Christmas.");
  }
}
