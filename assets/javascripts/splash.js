var battlegrounds = require('./splash/battlegrounds');
var seats = require('./splash/seats');
var refreshButton = require('./splash/refresh-element');

window.decision2016_init = function(data) {
  console.log("Sending data", data);
  refreshButton.render();
  battlegrounds.render(data.battlegrounds);
  seats.renderHouse(data.house);
  seats.renderSenate(data.senate);
};

// Warning: this script runs before DOMContentLoaded.
