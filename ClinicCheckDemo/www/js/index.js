(function () {
  'use strict';

  var
    deviceReady = false,
    domReady    = false;

  var editPatient = {};

  document.addEventListener('deviceready', function () {
    deviceReady = true;
    init();
  }, false);

  $(function () {
    domReady = true;

    $('#form-sign-in').submit(function (e) {
      e.preventDefault();
      $.mobile.changePage('#menu');
      $('#sign-in-input-password').val('');
    });

    $('#form-add-patient').submit(function (e) {
      e.preventDefault();
      editPatient = {};
      $.each($(this).serializeArray(), function (_, kv) {
        editPatient[kv.name] = kv.value;
      });
      $.mobile.changePage('#edit-patient');
      this.reset();
    });

    function takePic () {
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
          //Failure handler: could just be "Camera cancelled" - do nothing.
        }, options);
    }

    $('#add-take-photo').click(takePic);


    $('body').pagecontainer({
      beforetransition: function (event, ui) {

        var
          isGoingBack = ui.options.reverse,
          fromPageId  = ui.prevPage[0].id,
          toPageId    = ui.toPage[0].id;

        if (toPageId === 'edit-patient') {

          var $editPage = $('#edit-patient');
          $editPage.find('h1').text(editPatient.first_name + ' ' + editPatient.last_name);
          $editPage.find('#edit-dob').text(editPatient.dob);
          $editPage.find('#edit-gender').text(editPatient.gender === 'male' ? '♂' : '♀');


        }
      }

    });


    init();
  });

  function init () {

    if (!deviceReady || !domReady) {
      return;
    }

  }

}());
