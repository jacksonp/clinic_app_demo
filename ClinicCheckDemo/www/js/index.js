(function () {
  'use strict';

  var
    deviceReady = false,
    domReady    = false;

  document.addEventListener('deviceready', function () {
    deviceReady = true;
    init();
  }, false);

  $(function () {
    domReady = true;

    $('#form-sign-in').submit(function (e) {
      e.preventDefault();
      $.mobile.changePage("#menu");
      $('#sign-in-input-password').val('');
    });

    init();
  });

  function init () {

    if (!deviceReady || !domReady) {
      return;
    }

    console.log('ready');


  }

}());
