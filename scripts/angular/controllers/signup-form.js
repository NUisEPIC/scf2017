app.controller('form-controller',
['$scope', 'form-submitter', function($scope, formSubmitter) {

  // -- formSubmitter setup
  var googleFormMap =
      {
        'name-first':         'entry_639294980',
        'name-last':          'entry_1691405821',
        'email':              'entry_748884876',
        'gender':             'entry_272020502',
        'school':             'entry_698874225',
        'major':              'entry_1286357864',
        'year':               'entry_989404952',
        'yearOtherExplanation':'entry_199254716',
        'seeking-internship': 'entry_1273344196',
        'seeking-fulltime':   'entry_279922099',
        'international':      'entry_2079578939',
        'resume-url':         'entry_1821095653'
      };

  formSubmitter.setTransformMap('google', googleFormMap);
  formSubmitter.setPostURL('google', 'https://docs.google.com/a/u.northwestern.edu/forms/d/1X8qXL0fSRd5mhaiF2Bg0iLZpL7Hn0QVwtf1sELLh_fs/formResponse');
  formSubmitter.setPostURL('custom', 'http://formula-one.herokuapp.com/scf/application');

  $scope.processing = false;
  $scope.success = false;

  $scope.submitForm = function() {
    // fix "other" major
    if ($scope.registration.major == 'other') {
      console.log($scope.registration.otherMajor);
      console.log($scope.registration.major);
      $scope.registration.major = $scope.registration.otherMajor;
    }

    var success = function() {
      $scope.processing = false;
      $scope.success = true;
    }
    $scope.processing = true;
    formSubmitter.submitAll($scope.registration,
                            success,
                            function(d, status, headers, config) {
      if (!formSubmitter._squashed) {
        console.log('Probable failure.');
      }
    });
  }

  // -- filepicker setup
  // API key for resume_portal
  filepicker.setKey('AVRqlhXowRme6yNY2qmrdz');

  var policy = {"expiry":1350465080,"call":["pick", "read"]};

  $scope.pickFile = function() {
    filepicker.pick({
      mimetypes: ['text/plain',
                  'text/richtext',
                  'application/pdf',
                  'text/pdf'],
      container: 'modal',
      services: ['COMPUTER', 'GMAIL', 'BOX'
                 , 'DROPBOX', 'GOOGLE_DRIVE'
                 , 'SKYDRIVE', 'EVERNOTE'
                 , 'CLOUDDRIVE'],
      //debug: true
    },
    function(InkBlob) {
      $scope.$apply(function() {
        // update $scope inside $apply
        $scope.uploadedFilename = InkBlob.filename;
        $scope.registration.resume = InkBlob;
      });
    },
    function(PFError) {
      console.log(PFError.toString());
    });
  };

  // -- form manipulations
  $scope.setGender = function(string) {
    if(string == 'male' || string == 'female') {
      $scope.registration.gender = string;
    }
  }

  // manual validation
  // TODO: abstract this
  $scope.formValid = function() {
    var r = $scope.registration;
    return    r.name
           && r.name.first
           && r.name.last
           && (r.email
               && r.email.indexOf('@') > 0
               && r.email.indexOf('northwestern.edu') > 0)
           && (r.school
               && (r.school == 'mccormick'
                   || r.school == 'weinberg'
                   || r.school == 'sesp'
                   || r.school == 'medill'
                   || r.school == 'bienen'
                   || r.school == 'comm'
                   || r.school == 'kellogg'
                   || r.school == 'tgs'))
           && (r.year
               && (r.year == 'Freshman'
                   || r.year == 'Sophomore'
                   || r.year == 'Junior'
                   || r.year == 'Senior'
                   || r.year == 'Graduate Student'
                   || (r.year == 'Other'
                       && r.yearOtherExplanation)))
           && typeof(r.resume) == "object"
           && (r.gender == 'male' || r.gender == 'female')
           && (r.seeking.fulltime
               || r.seeking.internship)
           && r.major;
  };

  $scope.formIsFilledOut = function() {
    var r = $scope.registration;
    return r.name.first
           && r.name.last
           && r.email
           && r.school
           && r.year
           && r.resume
           && r.gender
           && r.major;
  }

}]);
