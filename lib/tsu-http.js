(function () {
  'use strict';

  exports.help = help;
  exports.execute = execute;

  var _ = require('lodash');
  var minimist = require('minimist');
  var fs = require('fs');
  var url = require('url');
  var request = require('request');
  var http = require('http');
  var pd = require('pretty-data').pd;
  var common = require('./common');

  /**
  * Display help for this task.
  */
  function help() {
    common.displayHelp('tsu-http');
  }

  /**
  * Execute this task.
  */
  function execute(cmdLine) {
    var args = parseCmdLine(cmdLine);
    sendRequest(args);
  }

  /**
  * Parse command line arguments.
  */
  function parseCmdLine(cmdLine) {
    var argsOptions = {
      'boolean': ['v', 'follow-redirect'],
      'alias': {
        'd': 'data',
        'f': 'file',
        'h': 'header',
        'm': 'method',
        'u': 'basic-auth',
        'v': 'verbose'
      }
    };

    return minimist(cmdLine, argsOptions);
  }

  /**
  * Send request.
  */
  function sendRequest(args) {
    var options = createRequestOptions(args);

    request(options).on('response', function (response) {
      var verbose = args.verbose || false;
      var head = args.method && 'HEAD' === args.method.toUpperCase();

      displayResponseInfos(response, verbose, head);
      displayResponseBody(response);
    }).on('error', function (error) {
      console.log(error);
      process.exit(1);
    });
  }

  /**
  * create request options.
  */
  function createRequestOptions(args) {
    var options = {
      url: args._[0] || 'http://localhost',
      proxy: args.proxy,
      method: args.method || 'GET',
      followRedirect: args['follow-redirect'] || false,
      rejectUnauthorized: false,
      headers: {}
    };

    addBasicAuth(options, args);
    addHeaders(options, args);
    addData(options, args);

    return options;
  }

  /**
  * Add basic-auth to request options.
  */
  function addBasicAuth(options, args) {
    var target = url.parse(options.url);
    var creds = target.auth || args['basic-auth'];

    if (creds) {
      var auth = new Buffer(creds).toString('base64');
      var header = 'Authorization:Basic ' + auth;
      addHeader(options, header);
    }
  }

  /**
  * Add a single header to request options.
  */
  function addHeader(options, header) {
    if (header) {
      var headerData = header.split(':');
      options.headers[headerData[0]] = headerData[1];
    }
  }

  /**
  * Add data to send to request options.
  */
  function addData(options, args) {
    var data = args.data;
    if (data) {
      options.body = data;
    }

    var file = args.file;
    if (file) {
      try {
        options.body = fs.readFileSync(file);
      } catch (e) {
        console.error('Error while reading file %s: %s',
        file,
        e.message);
        process.exit(1);
      }
    }
  }

  /**
  * Add all headers to request options.
  */
  function addHeaders(options, args) {
    var header = args.header;
    if (header) {
      if (_.isArray(header)) {
        _.each(header, function (element) {
          addHeader(options, element);
        });
      } else {
        addHeader(options, header);
      }
    }
  }

  /**
  * Display response informations.
  * @param response response from server
  * @param verbose indicates if verbose mode is requested
  * @param head indicates if it is a head request
  */
  function displayResponseInfos(response, verbose, head) {
    if (verbose || head) {
      var statusLine = response.statusCode + ' ' + response.statusMessage;
      console.log('Status: ' + statusLine);

      console.log('Headers:\n' + pd.json(response.headers));

      if (!head) {
        console.log('Body:');
      }
    }
  }

  /**
  * Display response body.
  * @param response response from server
  */
  function displayResponseBody(response) {
    response.setEncoding('utf8');

    var contentType = response.headers['content-type'];
    var data = "";

    response.on('data', function (chunk) {
      data += chunk;
    });

    response.on('end', function () {
      if (isJsonContent(contentType)) {
        var json = pd.json(data);
        console.log(json);
      } else if (isXmlContent(contentType)) {
        var xml = pd.xml(data);
        console.log(xml);
      } else {
        console.log(data);
      }
    });
  }

  /**
  * Test if content should be displayed as JSON according to contentType.
  */
  function isJsonContent(contentType) {
    var isJSON = false;

    if (contentType) {
      isJSON = contentType.indexOf('application/json') >= 0;
    }

    return isJSON;
  }

  /**
  * Test if content should be displayed as XML according to contentType.
  */
  function isXmlContent(contentType) {
    var isXML = false;

    if (contentType) {
      isXML = contentType.indexOf('xml') >= 0;
    }

    return isXML;
  }
})();
