if (!localStorage.records) {
  localStorage.records = JSON.stringify([]);
}
if (!localStorage.appointments) {
  localStorage.appointments = JSON.stringify([]);
}


(function () {
  'use strict';

  function getRecords () {
    return JSON.parse(localStorage.records);
  }

  function saveRecords (records) {
    localStorage.records = JSON.stringify(records);
  }

  function addRecord (record) {
    var recs = getRecords();
    var length = recs.push(record);
    saveRecords(recs);
    return length - 1; // index of new record
  }

  function getRecord (index) {
    var recs = getRecords();
    return recs[index];
  }

  function saveRecord (index, record) {
    var recs = getRecords();
    recs[index] = record;
    saveRecords(recs);
  }

  function getAppointments () {
    return JSON.parse(localStorage.appointments);
  }

  function saveAppointments (records) {
    localStorage.appointments = JSON.stringify(records);
  }

  function addAppointment (record) {
    var recs = getAppointments();
    var length = recs.push(record);
    saveAppointments(recs);
    return length - 1; // index of new record
  }

  function getAppointment (index) {
    var recs = getAppointments();
    return recs[index];
  }

  function saveAppointment (index, record) {
    var recs = getAppointments();
    recs[index] = record;
    saveAppointments(recs);
  }

  var
    deviceReady = false,
    domReady    = false;

  var editRecordId = 0;

  document.addEventListener('deviceready', function () {
    deviceReady = true;
    init();
  }, false);

  $(function () {
    domReady = true;

    var $calendar = $('#calendar');

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
      var newRecord = {};
      $.each($(this).serializeArray(), function (_, kv) {
        newRecord[kv.name] = kv.value;
      });
      editRecordId = addRecord(newRecord);
      $.mobile.changePage('#edit-patient');
      this.reset();
    });

    $('#form-edit-patient').submit(function (e) {
      e.preventDefault();
      var editFields = {};
      $.each($(this).serializeArray(), function (_, kv) {
        editFields[kv.name] = kv.value;
      });
      var record = getRecord(editRecordId);
      $.extend(record, editFields);
      saveRecord(editRecordId, record);
      $.mobile.changePage('#current-patients');
    });

    $('#add-appointment-time').click(function (e) {
      e.preventDefault();
      datePicker.show({
        date: new Date(),
        mode: 'time'
      }, function (date) {
        $('#add-appointment-time').val(moment(date).format('HH:mm'));
      }, function (error) {
        console.log('Error: ' + error);
      });
    });

    $('#form-edit-patient-add-appointment').submit(function (e) {
      e.preventDefault();
      var
        dateTime = $('#add-appointment-date').val() + ' ' + $('#add-appointment-time').val(),
        event    = {
          title : $('#add-appointment-patient-select').val(),
          start : moment(dateTime).toISOString(),
          allDay: false
        };
      //console.log(dateTime);
      //console.log($('#add-appointment-patient-select').val());
      addAppointment(event);
      $('#collapsible-add-appointment').collapsible('collapse');
      $calendar.fullCalendar('renderEvent', event);
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
          html       = '',
          fromPageId = ui.prevPage[0].id,
          toPageId   = ui.toPage[0].id;

        if (toPageId === 'edit-patient') {

          var editRecord = getRecord(editRecordId);
          var isMale = editRecord.gender === 'male';

          if (isMale) {
            $('#pregnancy-container').hide();
          } else {
            $('#pregnancy-container').show();
          }

          var $editPage = $('#edit-patient');
          $editPage.find('h1').text(editRecord.first_name + ' ' + editRecord.last_name);

          var dob = moment(editRecord.dob);
          var now = moment();
          var age = now.diff(dob, 'years');

          $editPage.find('#edit-dob').text(editRecord.dob + ' (age: ' + age + ')');

          $editPage.find('#edit-gender').text(isMale ? '♂' : '♀');

          $editPage.find('#edit-phone').val(editRecord.phone);
          $editPage.find('#edit-village').val(editRecord.village);
          $editPage.find('#edit-family').val(editRecord.family);
          $editPage.find('#edit-hiv').val(editRecord.hiv);
          $editPage.find('#edit-health-issues').val(editRecord.health_issues);
          $editPage.find('#edit-medication').val(editRecord.medication);
          $editPage.find('#edit-notes').val(editRecord.notes);

          $editPage.find('#add-photo').attr('src', '');

        } else if (toPageId === 'appointment-calendar') {

          getRecords().forEach(function (r) {
            html += '<option>' + r.first_name + ' ' + r.last_name + '</option>';
          });

          $('#add-appointment-patient-select').html(html).selectmenu('refresh');


          setTimeout(function () {
            $calendar.fullCalendar({
              header          : {
                left  : 'prev,next today',
                center: 'title',
                right : 'month,basicWeek,basicDay'
              },
              theme           : true,
              themeButtonIcons: false,
              editable        : true,
              events          : getAppointments(),
              dayClick        : function (date, jsEvent, view) {
                $calendar.fullCalendar('gotoDate', date);
                $calendar.fullCalendar('changeView', 'basicDay');
              },
              eventClick      : function (calEvent, jsEvent, view) {
                $calendar.fullCalendar('gotoDate', calEvent.start);
                $calendar.fullCalendar('changeView', 'basicDay');
              }
            });
          }, 200);

        } else if (toPageId === 'current-patients') {

          var records = getRecords();

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
