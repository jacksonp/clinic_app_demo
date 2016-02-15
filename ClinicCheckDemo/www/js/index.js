//<editor-fold desc="Prime localStorage">
if (!localStorage.records) {
  localStorage.records = JSON.stringify([]);
}
if (!localStorage.appointments) {
  localStorage.appointments = JSON.stringify([]);
}
//</editor-fold>

(function () {
  'use strict';

  //<editor-fold desc="Patient records in localStorage fns">
  function getRecords () {
    return JSON.parse(localStorage.records);
  }

  function saveRecords (records) {
    localStorage.records = JSON.stringify(records);
  }

  function addRecord (record) {
    record.healthcare_provider = 'Dr Jones';
    var age = moment().diff(record.dob, 'years');
    record.puberty = age >= 12 ? 'Yes' : 'No';
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
    record.healthcare_provider = 'Dr Jones';
    recs[index] = record;
    saveRecords(recs);
  }

  //</editor-fold>

  //<editor-fold desc="Appointment records in localStorage fns">
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

  function getSortedPatientAppointments (name, rev) {
    rev = !!rev;
    var patientAppointments = [];
    var appointments = getAppointments();
    appointments.forEach(function (a) {
      if (a.title === name) {
        patientAppointments.push(moment(a.start));
      }
    });
    patientAppointments.sort(function (a, b) {
      if (rev) {
        return b.isBefore(a) ? -1 : 1;
      } else {
        return a.isBefore(b) ? -1 : 1;
      }
    });
    return patientAppointments;
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

  //</editor-fold>

  var
    deviceReady = false,
    domReady    = false;

  var editRecordId = 0;

  function setClinic () {
    navigator.notification.prompt('Set the name of the clinic for this tablet.', function (results) {
      var clinicName = results.input1;
      if (!clinicName) {
        setClinic();
      } else {
        localStorage.clinic = clinicName;
      }
      $('#clinic-name').text(localStorage.clinic);
    }, 'Clinic Name', ['Set']);
  }

  document.addEventListener('deviceready', function () {

    deviceReady = true;
    init();
  }, false);

  $(function () {
    domReady = true;

    if (!localStorage.clinic) {
      setClinic();
    } else {
      $('#clinic-name').text(localStorage.clinic);
    }

    var
      $calendar             = $('#calendar'),
      $currentPatientsTable = $('#table-current-patients'),
      $currentPatientsTBody = $currentPatientsTable.children('tbody');

    function updatePregnancyList (pregnancies) {
      var
        $table = $('#table-patient-pregnancies'),
        html   = '';
      if (pregnancies) {
        pregnancies.forEach(function (p, i) {
          html += '<tr data-id="' + i + '">' +
            '<td>' + p.due_date + '</td>' +
            '<td>' + p.mother_weight + '</td>' +
            '</tr>';
        });
      }
      $table.find('tbody').html(html);
      $table.table('refresh');
    }

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

    $('#edit-patient-add-appointment').click(function (e) {
      e.preventDefault();
      $.mobile.changePage('#appointment-calendar');
      $('#collapsible-add-appointment').collapsible('expand');
      $('#add-appointment-patient-select').val($('#edit-patient').find('h1').text()).selectmenu('refresh');
    });

    $('#form-add-pregnancy').submit(function (e) {
      e.preventDefault();
      var record = getRecord(editRecordId);
      if (!record.pregnancies) {
        record.pregnancies = [];
      }
      record.pregnancies.push({
        due_date     : $('#add-pregnancy-due-date').val(),
        mother_weight: $('#add-pregnancy-mother-weight').val()
      });
      saveRecord(editRecordId, record);
      updatePregnancyList(record.pregnancies);
      this.reset();
    });

    $('#add-appointment-time').click(function (e) {
      e.preventDefault();
      datePicker.show({
        date    : new Date(),
        mode    : 'time',
        is24Hour: true
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
      addAppointment(event);
      $('#collapsible-add-appointment').collapsible('collapse');
      $calendar.fullCalendar('renderEvent', event, true);
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
          var newSrc = 'data:image/jpeg;base64,' + imageData;
          $('#add-photo').removeClass('no-display').attr('src', newSrc);
          var record = getRecord(editRecordId);
          record.photo = newSrc;
          saveRecord(editRecordId, record);
        }, function (message) {
          //Failure handler: could just be "Camera cancelled" - do nothing.
        }, options);
    }

    $('#add-take-photo').click(takePic);


    $('body').pagecontainer({
      beforetransition: function (event, ui) {

        var
          html       = '',
          now        = moment(),
          fromPageId = ui.prevPage[0].id,
          toPageId   = ui.toPage[0].id;

        if (toPageId === 'edit-patient') {

          var
            editRecord = getRecord(editRecordId),
            name       = editRecord.first_name + ' ' + editRecord.last_name,
            isMale     = editRecord.gender === 'male';

          if (isMale || editRecord.puberty === 'No') {
            $('#pregnancy-container').hide();
          } else {
            updatePregnancyList(editRecord.pregnancies);
            $('#pregnancy-container').show();
          }

          var $editPage = $('#edit-patient');
          $editPage.find('h1').text(name);

          var dob = moment(editRecord.dob);
          var age = now.diff(dob, 'years');

          $editPage.find('#edit-dob').text(editRecord.dob + ' (age: ' + age + ')');

          $editPage.find('#edit-gender').text(isMale ? '♂' : '♀');

          $editPage.find('#edit-phone').val(editRecord.phone);
          $editPage.find('#edit-village').val(editRecord.village);
          $editPage.find('#edit-family').val(editRecord.family);
          $editPage.find('#edit-puberty').val(editRecord.puberty).slider('refresh');
          $editPage.find('#edit-hiv').val(editRecord.hiv);
          $editPage.find('#edit-health-issues').val(editRecord.health_issues);
          $editPage.find('#edit-medication').val(editRecord.medication);
          $editPage.find('#edit-notes').val(editRecord.notes);

          $editPage.find('#add-photo').attr('src', '');

          if (editRecord.photo) {
            $('#add-photo').removeClass('no-display').attr('src', editRecord.photo);
          }

          var patientAppointments = getSortedPatientAppointments(name, true);

          html = '';
          if (patientAppointments.length === 0) {
            html = 'No appointments.';
          } else {
            patientAppointments.forEach(function (a) {
              html += '<li>' + a.format('YYYY-MM-DD HH:mm') + '</li>';
            });
          }

          $('#patient-appointments').html(html);

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
              timeFormat      : 'H(:mm)',
              timezone        : 'local',
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

            var
              lastVisit       = '',
              nextAppointment = '';

            var patientAppointments = getSortedPatientAppointments(r.first_name + ' ' + r.last_name);
            patientAppointments.forEach(function (a) {
              if (a.isBefore(now)) {
                lastVisit = a.format('YYYY-MM-DD');
              }
              if (!nextAppointment && a.isAfter(now)) {
                nextAppointment = a.format('YYYY-MM-DD');
              }
            });


            html += '<tr data-id="' + i + '">' +
              '<td>xxx</td>' +
              '<td>' + r.first_name + '</td>' +
              '<td>' + r.last_name + '</td>' +
              '<td>' + r.healthcare_provider + '</td>' +
              '<td>' + lastVisit + '</td>' +
              '<td>' + nextAppointment + '</td>' +
              '</tr>';
          });

          $currentPatientsTBody.html(html);

          $currentPatientsTable.table('refresh');

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
