(function () {
    'use strict';

    var minimist = require('minimist');
    var url = require('url');
    var http = require('http');
    var pd = require('pretty-data').pd;
    var _ = require('underscore');

    exports.help = function () {
	require('./common').displayHelp('tsu-http');
    };

    exports.execute = function (cmdLine) {
	var args = parseArgs(cmdLine);

	if (args._.length === 0) {
	    console.log('You must provide a URL');
	    process.exit(1);
	} else {
	    sendRequest(args);
	}
    };

    /**
     * Parse command line arguments.
     */
    function parseArgs(cmdLine) {
	var argsOptions = {'boolean': 'v',
			   'alias': {'d': 'data',
				     'h': 'header',
				     'm': 'method',
				     'v': 'verbose'}};
	var args = minimist(cmdLine, argsOptions);
	
	processProxyURL(args);
	processDestinationURL(args);

	return args;
    }

    /**
     * Parse and set proxy infos.
     */
    function processProxyURL(args) {
	if (args.proxy) {
	    args.proxy = url.parse(args.proxy);
	}
    }

    /**
     * Parse and set destination infos.
     */
    function processDestinationURL(args) {
	args.destination = url.parse(args._[0]);
	var protocol = args.destination.protocol;
	args.destination.protocol = protocol.substring(0, protocol.indexOf(':'));
    }

    /**
     * Send request.
     */
    function sendRequest(args) {
	var protocol = require(args.destination.protocol);
	var options = createRequestOptions(args);

	var req = protocol.request(options, function (response) {
	    var verbose = args.verbose || false;
	    var head = args.method && 'HEAD' === args.method.toUpperCase();
	    
	    displayResponseInfos(response, verbose, head);
	    displayResponseBody(response);
	}).on('error', function (e) {
	    console.log('problem with request: ' + e.message);
	});

	var data = args.data;
	if (data) {
	    req.write(data);
	}

	req.end();
    }

    /**
     * create request options.
     */
    function createRequestOptions(args) {
	var options;
	if (args.proxy) {
	    options = createBaseOptionsForProxyAccess(args);
	} else {
	    options = createBaseOptionsForDirectAccess(args);
	}

	addBasicAuth(options, args);
	addHeaders(options, args.header);

	return options;
    }

    /**
     * Create base options when a proxy is used.
     */
    function createBaseOptionsForProxyAccess(args) {
	var proxy = args.proxy;
	var destination = args._[0];

	return {
	    hostname: proxy.hostname,
	    port: proxy.port,
	    path: destination,
	    method: args.method || 'GET',
	    headers: {}
	};
    }

    /**
     * Create base options for direct access.
     */
    function createBaseOptionsForDirectAccess(args) {
	var destination = args.destination;

	return {
	    hostname: destination.hostname,
	    port: destination.port,
	    path: destination.path,
	    method: args.method || 'GET',
	    headers: {}
	};
    }

    /**
     * Add basic-auth to request options.
     */
    function addBasicAuth(options, args) {
	var target = url.parse(args._[0]);
	var auth = target.auth || args['basic-auth'];

	if (auth) {
	    addHeader(options, 'Authorization:Basic ' + new Buffer(auth).toString('base64'));
	}
    }

    /**
     * Add a single header to request options.
     */
    function addHeader(options, header) {
	var headerData = header.split(':');
	options.headers[headerData[0]] = headerData[1];
    }

    /**
     * Add all headers to request options.
     */
    function addHeaders(options, header) {
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
	    var status = response.statusCode;
	    var statusLine = status + ' ' + http.STATUS_CODES[status];
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
	response.on('data', function (chunk) {
	    var contentType = response.headers['content-type'];
	    if (contentType.indexOf('application/json') >= 0) {
		var json = pd.json(chunk);
		console.log(json);
	    } else if (contentType.indexOf('text/html') >= 0) {
		var html = pd.xml(chunk);
		console.log(html);
	    } else {
		console.log(chunk);
	    }
	});
    }
})();
