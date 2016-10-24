var electionMap;

function links() {
  console.info("do the links");
  var links = window.document.getElementsByClassName('tab__link');
  for (var i = 0; i<links.length; i++) {
    links[i].addEventListener('click', function (e) {
      e.preventDefault();
      console.log(e.target);

      var activeTab = window.document.getElementsByClassName('tab--active')[0];
      var activeTabLink = window.document.getElementsByClassName('tab__link--active')[0];
      var selected = window.document.getElementById(e.target.getAttribute('data-key'));

      activeTab.setAttribute("class", "tab");
      activeTabLink.setAttribute("class", "tab__link");

      selected.className += " tab--active";
      e.target.className += " tab__link--active";
    });
  }
}

function setUpTabs() {
  var tabLabels = {
    "map_us": "Map of U.S.",
    "cartogram": "Sized by # of Notes"
  };

  var tabs = document.createElement("div");
  var tabKeys = Object.keys(tabLabels);

  tabs.setAttribute("class", "tabs");

  for (var i = 0; i<tabKeys.length; i++) {
    var tab = document.createElement("div");
    var tabButton = document.createElement("a");
    var tabContent = document.createElement("div");
    var tabKey = tabKeys[i];

    tab.setAttribute("id", tabKey);

    tabButton.innerHTML = tabLabels[tabKey];
    tabButton.setAttribute("href", "#");
    tabButton.setAttribute("class", "tab__link");
    tabButton.setAttribute("data-key", tabKey);
    tabButton.setAttribute("data-beacon", "{\"p\":{\"lnid\":\"tab_"+tabKey+"\"}}");

    tabs.appendChild(tabButton);
    tab.setAttribute("class", "tab");

    // For Click Tracking testing
    tab.innerHTML = "<a class='thingie' data-beacon='{\"p\":{\"lnid\":\"test_link_"+tabKey+"\"}}' href='http://eelslap.com/'>Click me for tracking</a>";
    electionMap.appendChild(tab);
  }

  tabs.children[0].setAttribute("class", "tab__link tab__link--active");
  electionMap.children[0].setAttribute("class", "tab tab--active");
  electionMap.insertBefore(tabs, electionMap.children[0]);
}

module.exports = {
  render: function(data) {
    electionMap = window.document.getElementById('election_map');

    if(election_map) {
      setUpTabs();
      links();
    }
  }
};
