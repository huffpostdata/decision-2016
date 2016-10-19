var battlegrounds = require('./splash/battlegrounds');
var electoral = require('./splash/electoral');
var seats = require('./splash/seats');

window.decision2016_init = function(data) {
  console.log("Sending data", data);
  electoral.render(data.president);
  battlegrounds.render(data.battlegrounds);
  seats.renderHouse(data.house);
  seats.renderSenate(data.senate);
};

// Warning: this script runs before DOMContentLoaded.
