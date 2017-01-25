app.factory('form-submitter', ['$http', function($http) {

  function noPreflightPost(url, data) {

    function param(data) {
      // NOTE: this parameterizing function is not very robust
      //       it assumes all your k,v pairs will be unnested
      //       and that your keys do not need to be encoded.
      var result = [];

      angular.forEach(data, function(value, key) {
        result.push(key + '=' + encodeURIComponent(value));
      });

      return result.join('&');
    }

    // unset stupid angular defaults
    var noPreflightConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Can't specify a Cache-Control header.
        // This is the only configuration that seems to work.
        // multipart/form-data fails splendidly; angular doesn't
        // transform the data for you.
      }
    };
    return $http.post(url, param(data), noPreflightConfig);
  };

  // there can be two entries with the same key
  var root = {
    config: {
      setStrKeyDelimiter: function(delimiter) {
        root.transform.fn.__str_key_delimeter__ = delimiter;
      },
      debug: {
        errors: true,
        warn: true,
        info: false
      }
    },
    _squashed: false,
    _log: {
      _log_fn: function(mode, txt) {
        !root.config.debug[mode] || console[mode](txt);
      },
      error: function(txt) { root._log._log_fn('error', txt); },
      warn: function(txt) { root._log._log_fn('warn', txt); },
      info: function(txt) { root._log._log_fn('info', txt); }
    },
    transforms: {
      tmpVal: '',
      google: {
        map: {}
      }
    },
    setTransformMap: function(name, map) {
      if(!root.transforms[name]) root.transforms[name] = {map: {}};
      root.transforms[name].map = map;
    },
    postURLs: {
      google: {
        url: '',
        noPreflight: true,
        givesBadErrorMessages: true
      }
    },
    setPostURL: function(name, url) {
      if (typeof(url) == 'object') {
        root.postURLs[name] = url;
        return;
      }
      root.postURLs[name] = root.postURLs[name] || {};
      root.postURLs[name].url = url;
    },
    transform: {
      fn: {
        __str_key_delimeter__: '-',
        _str_key_parser_: function(start, oldKey) {
          root.transforms.tmpVal = start;
          oldKey.split(root.transform.fn.__str_key_delimeter__)
            .forEach(function(k) {
              root.transforms.tmpVal = root.transforms.tmpVal[k];
            });
          return root.transforms.tmpVal;
        },
        basicTransform: function(obj, which) {
          return function(newKey, oldKey) {
            root.transforms.tmpVal = obj;
            root.transform.fn._str_key_parser_(obj, oldKey);
            root.transforms[which].result[newKey] = root.transforms.tmpVal;
          };
        }
      },
      // specific transformers
      default: function(formObj, which){
        if (!root.transforms[which].map) {
          return root._log.error('form-submitter.transform() fail: no transform map specified'
                               + ' for ' + which + '.');
        }
        root.transforms[which].result = {};
        angular.forEach(root.transforms[which].map
                        , (root.transform.fn[which]
                           || root.transform.fn.basicTransform)(formObj, which));
      },
      google: function(formObj) {
        root.transform.default(formObj, 'google');
      },
      custom: function(formObj) {
        // NOTE: by default, don't transform custom
        if (!root.transforms['custom']) root.transforms.custom = {};
        root.transforms.custom.result = formObj;
      }
    },
    _wrap_fail_callback: function(cb, to) {
      if(root.postURLs[to].givesBadErrorMessages) {
        return function() {
          root._log.warn("form-submitter warn: Error message(s) probably false; service \"" + to + "\" gives bad CORs responses.");
          root._squashed = true; // report error maybe should be squashed
          return typeof(cb) == 'function' ? cb.apply(arguments) : null;
        }
      }
      return cb;
    },
    submit: function(to, form, successCallback, failCallback) {
      // transform
      if(!!root.transform[to]) {
        root.transform[to](form);
      } else {
        root._log.warn('form-submitter.transform.' + to + '() warn: transformer does not exist.'
                       + ' Request will send, but data keys may be incorrect.');
      }
      // set _squashed to false
      root._squashed = false;
      // post to appropriate URL
      if (!!root.postURLs[to]) {
        return (root.postURLs[to].noPreflight
          ? noPreflightPost(root.postURLs[to].url, root.transforms[to].result)
          : $http.post(root.postURLs[to].url, root.transforms[to].result))
          .success(successCallback)
          .error(root._wrap_fail_callback(failCallback, to));
      } else {
        root._log.error('form-submitter.submit() fail: no valid URL for ' + to + '.');
      }
    },
    submitAll: function(form, success, fail) {
      Object.keys(root.postURLs).forEach(function(url) {
        if (success && fail)
          root.submit(url, form, success, fail);
        else if (success)
          root.submit(url, form, success);
        else
          root.submit(url, form);
      });
    }
  };

  return root;
}]);
