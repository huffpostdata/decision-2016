var battlegrounds = require('./splash/battlegrounds');

window.decision2016_init = function(data) {
  console.log("Sending data", data);
  battlegrounds.render(data.battlegrounds);
};

// Warning: this script runs before DOMContentLoaded.
