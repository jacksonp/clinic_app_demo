if (!localStorage.records) {
  localStorage.records = JSON.stringify([]);
}


(function () {
  'use strict';

  function addRecord (record) {
    var recs = getRecords();
    recs.push(record);
    localStorage.records = JSON.stringify(recs);
  }

  function getRecords () {
    return JSON.parse(localStorage.records);
  }

  function getRecord (index) {
    var recs = getRecords();
    return recs[index];
  }

  var
    deviceReady = false,
    domReady    = false;

  var editRecordId = 0;

  var editPatient = {};

  document.addEventListener('deviceready', function () {
    deviceReady = true;
    init();
  }, false);

  $(function () {
    domReady = true;

    var $currentPatientsTBody = $('#table-column-toggle').children('tbody');

    $('#form-sign-in').submit(function (e) {
      e.preventDefault();
      $.mobile.changePage('#menu');
      $('#sign-in-input-password').val('');
    });

    $currentPatientsTBody.on('click', 'tr', function () {
      editRecordId = $(this).attr('data-id');
      $.mobile.changePage('#edit-patient');
    });

    $('#form-add-patient').submit(function (e) {
      e.preventDefault();
      editPatient = {};
      $.each($(this).serializeArray(), function (_, kv) {
        editPatient[kv.name] = kv.value;
      });
      addRecord(editPatient);
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
          fromPageId = ui.prevPage[0].id,
          toPageId   = ui.toPage[0].id;

        if (toPageId === 'edit-patient') {

          var editRecord = getRecord(editRecordId);

          var $editPage = $('#edit-patient');
          $editPage.find('h1').text(editRecord.first_name + ' ' + editRecord.last_name);


          var dob = moment(editRecord.dob);
          var now = moment();
          var age = now.diff(dob, 'years');

          $editPage.find('#edit-dob').text(editRecord.dob + ' (age: ' + age + ')');

          $editPage.find('#edit-gender').text(editRecord.gender === 'male' ? '♂' : '♀');

        } else if (toPageId === 'appointment-calendar') {

          setTimeout(function () {
            $('#calendar').fullCalendar({
              editable: true
            });
          }, 200);

        } else if (toPageId === 'current-patients') {

          var records = getRecords();

          var html = '';
          records.forEach(function (r, i) {
            html += '<tr data-id="' + i + '">' +
              '<td>xxx</td>' +
              '<td>' + r.first_name + '</td>' +
              '<td>' + r.last_name + '</td>' +
              '<td></td>' +
              '<td></td>' +
              '<td></td>' +
              '</tr>';
          });

          $currentPatientsTBody.html(html);

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
