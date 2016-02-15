//<editor-fold desc="Prime localStorage">
if (!localStorage.records) {
  localStorage.records = JSON.stringify({});
}
if (!localStorage.appointments) {
  localStorage.appointments = JSON.stringify({});
}
//</editor-fold>

function makeUUID () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

(function () {
  'use strict';


  $('input[type="date"]').val(moment().format('YYYY-MM-DD'));


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
    var
      uuid = makeUUID(),
      recs = getRecords();
    recs[uuid] = record;
    saveRecords(recs);
    return uuid;
  }

  function getRecord (uuid) {
    var recs = getRecords();
    return recs[uuid];
  }

  function saveRecord (uuid, record) {
    var recs = getRecords();
    recs[uuid] = record;
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
    var
      uuid = makeUUID(),
      recs = getAppointments();
    recs[uuid] = record;
    saveAppointments(recs);
    return uuid;
  }

  function getSortedPatientAppointments (patientUUID, rev) {
    rev = !!rev;
    var patientAppointments = [];
    var appointments = getAppointments();
    Object.keys(appointments).forEach(function (appointmentUUID) {
      var a = appointments[appointmentUUID];
      if (a.patientUUID === patientUUID) {
        a.uuid = appointmentUUID;
        patientAppointments.push(a);
      }
    });
    patientAppointments.sort(function (a, b) {
      var
        aa = moment(a.start),
        bb = moment(b.start);
      if (rev) {
        return bb.isBefore(aa) ? -1 : 1;
      } else {
        return aa.isBefore(bb) ? -1 : 1;
      }
    });
    return patientAppointments;
  }

  function getAppointment (uuid) {
    var recs = getAppointments();
    return recs[uuid];
  }

  function saveAppointment (uuid, record) {
    var recs = getAppointments();
    recs[uuid] = record;
    saveAppointments(recs);
  }

  //</editor-fold>

  var
    deviceReady         = false,
    domReady            = false,
    editRecordUUID      = 0,
    editAppointmentUUID = null;

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
      $currentPatientsTBody = $currentPatientsTable.children('tbody'),
      $healthVisitPopup     = $('#healthVisitPopup');

    $healthVisitPopup.enhanceWithin().popup();

    $('#patient-appointments').delegate('a', 'click', function () {
      var
        editAppointmentUUID = $(this).attr('data-uuid'),
        appointment         = getAppointment(editAppointmentUUID),
        appointmentStart    = moment(appointment.start);

      $('#health-visit-date').val(appointmentStart.format('YYYY-MM-DD'));
      $('#health-visit-time').val(appointmentStart.format('HH:mm'));
      $('#health-visit-reason').val(appointment.reason);
      $('#health-visit-treatment').val(appointment.treatment);
      $('#health-visit-referral').val(appointment.referral);
      $('#health-visit-follow-up').val(appointment.follow_up);

    });

    $('#edit-patient-add-visit').click(function () {
      editAppointmentUUID = null;
      $('#health-visit-reason').val('');
      $('#health-visit-treatment').val('');
      $('#health-visit-referral').val('');
      $('#health-visit-follow-up').val('');
    });

    $healthVisitPopup.find('form').submit(function (e) {
      e.preventDefault();
      var
        appointmentReason = $('#health-visit-reason').val(),
        dateTime          = $('#health-visit-date').val() + ' ' + $('#health-visit-time').val(),
        event             = {
          patientUUID: editRecordUUID,
          title      : getRecord(editRecordUUID).name + ' - ' + appointmentReason,
          reason     : appointmentReason,
          treatment  : $('#health-visit-treatment').val(),
          referral   : $('#health-visit-referral').val(),
          follow_up  : $('#health-visit-follow_up').val(),
          start      : moment(dateTime).toISOString(),
          allDay     : false
        };
      if (!editAppointmentUUID) {
        addAppointment(event);
      } else {
        saveAppointment(editAppointmentUUID, event);
      }
      console.log(editAppointmentUUID);
      console.log(event);
      $healthVisitPopup.popup('close');
    });

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
      editRecordUUID = $(this).attr('data-id');
      $.mobile.changePage('#edit-patient');
    });

    $('#form-add-patient').submit(function (e) {
      e.preventDefault();
      var newRecord = {};
      $.each($(this).serializeArray(), function (_, kv) {
        newRecord[kv.name] = kv.value;
      });
      editRecordUUID = addRecord(newRecord);
      $.mobile.changePage('#edit-patient');
      this.reset();
    });

    $('#form-edit-patient').submit(function (e) {
      e.preventDefault();
      var editFields = {};
      $.each($(this).serializeArray(), function (_, kv) {
        editFields[kv.name] = kv.value;
      });
      var record = getRecord(editRecordUUID);
      $.extend(record, editFields);
      saveRecord(editRecordUUID, record);
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
      var record = getRecord(editRecordUUID);
      if (!record.pregnancies) {
        record.pregnancies = [];
      }
      record.pregnancies.push({
        due_date     : $('#add-pregnancy-due-date').val(),
        mother_weight: $('#add-pregnancy-mother-weight').val()
      });
      saveRecord(editRecordUUID, record);
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

    $('#health-visit-time').click(function (e) {
      e.preventDefault();
      datePicker.show({
        date    : new Date(),
        mode    : 'time',
        is24Hour: true
      }, function (date) {
        $('#health-visit-time').val(moment(date).format('HH:mm'));
      }, function (error) {
        console.log('Error: ' + error);
      });
    });

    $('#form-edit-patient-add-appointment').submit(function (e) {
      e.preventDefault();
      var
        $selectPatient    = $('#add-appointment-patient-select'),
        appointmentReason = $('#add-appointment-reason').val(),
        dateTime          = $('#add-appointment-date').val() + ' ' + $('#add-appointment-time').val(),
        event             = {
          patientUUID: $selectPatient.val(),
          title      : $selectPatient.find('option:selected').text() + ' - ' + appointmentReason,
          reason     : appointmentReason,
          start      : moment(dateTime).toISOString(),
          allDay     : false
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
          var record = getRecord(editRecordUUID);
          record.photo = newSrc;
          saveRecord(editRecordUUID, record);
        }, function (message) {
          //Failure handler: could just be "Camera cancelled" - do nothing.
        }, options);
    }

    $('#add-take-photo').click(takePic);


    $('body').pagecontainer({
      beforetransition: function (event, ui) {

        var
          records,
          html     = '',
          now      = moment(),
          toPageId = ui.toPage[0].id;

        if (toPageId === 'edit-patient') {

          var
            editRecord = getRecord(editRecordUUID),
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

          var patientAppointments = getSortedPatientAppointments(editRecordUUID, true);

          html = '';
          if (patientAppointments.length === 0) {
            html = 'No health visits on record.';
          } else {
            patientAppointments.forEach(function (a) {
              html += '<li><a href="#healthVisitPopup" data-rel="popup" data-position-to="window" data-uuid="' + a.uuid + '"><h4>' + a.reason + '</h4><p>' + moment(a.start).format('YYYY-MM-DD HH:mm') + '</p></a></li>';
            });
          }

          $('#patient-appointments').html(html).listview('refresh');

        } else if (toPageId === 'appointment-calendar') {

          records = getRecords();
          Object.keys(records).forEach(function (key) {
            var r = records[key];
            html += '<option value="' + key + '">' + r.first_name + ' ' + r.last_name + '</option>';
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

          records = getRecords();

          Object.keys(records).forEach(function (uuid) {

            var r = records[uuid];

            var
              lastVisit       = '',
              nextAppointment = '';

            var patientAppointments = getSortedPatientAppointments(uuid);
            patientAppointments.forEach(function (a) {
              a = moment(a.start);
              if (a.isBefore(now)) {
                lastVisit = a.format('YYYY-MM-DD');
              }
              if (!nextAppointment && a.isAfter(now)) {
                nextAppointment = a.format('YYYY-MM-DD');
              }
            });


            html += '<tr data-id="' + uuid + '">' +
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
