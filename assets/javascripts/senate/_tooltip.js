var toolTip = (function() {

//  our tooltip element
  var element = {};

  element.init = function(targ) {
    this.tooltip = targ;
    this.stateName = targ.querySelector('.state-name');
    this.precinctsReporting = targ.querySelector('.precincts-reporting');

    this.setData = function(data) {
      console.log(data);
      this.raceData = {};
      for (var i = 0; i < data.length; i++) {
        this.raceData[data[i].id] = data[i];
      }
    }
  };

//  helper functions

  return element;
}());

module.exports = function tooltipObject(el) {
  toolTip.init(el);
  return toolTip
}
