var battlegrounds = require('./splash/battlegrounds');
var seats = require('./splash/seats');
var electoral = require('./splash/electoral');

window.decision2016_init = function(data) {
  console.log("Sending data", data);
  battlegrounds.render(data.battlegrounds);
  seats.renderHouse(data.house);
  seats.renderSenate(data.senate);
  electoral.render(data.electoral);
};

// Warning: this script runs before DOMContentLoaded.
