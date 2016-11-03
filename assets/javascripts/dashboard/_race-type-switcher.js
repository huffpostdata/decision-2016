module.exports = function(el, container) {
  var classList = container.classList;

  el.addEventListener('change', function() {
    classList.remove('president');
    classList.remove('senate');
    classList.remove('house');
    classList.remove('ballot');
    classList.add(el.value);
  });
};
