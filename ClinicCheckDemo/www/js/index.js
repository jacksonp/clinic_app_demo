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

    function takePic () {
      console.log('takePic');
      var options = {
        targetWidth    : 300,
        targetHeight   : 300,
        quality        : 75,
        destinationType: navigator.camera.DestinationType.DATA_URL
      };
      navigator.camera.getPicture(
        function (imageData) {
          $('#add-photo').removeClass('no-display').attr('src', 'data:image/jpeg;base64,' + imageData);
        }, function (message) {
          console.log(message);
          //Failure handler: could just be "Camera cancelled" - do nothing.
        }, options);
    }

    $('#add-take-photo').click(takePic);

    init();
  });

  function init () {

    if (!deviceReady || !domReady) {
      return;
    }

  }

}());
