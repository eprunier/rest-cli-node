var minimist = require('minimist');
var url = require('url');
var http = require('http');
var pd = require('pretty-data').pd;
var _ = require('underscore');

(function () {
    'use strict';

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
})();

/**
 * Parse command line arguments.
 */
function parseArgs(args) {
    'use strict';

    var argsOptions = {'boolean': 'v',
		       'alias': {'m': 'method',
				 'h': 'header',
				 'v': 'verbose'}};

    return minimist(args, argsOptions);
}

/**
 * Send request.
 */
function sendRequest(args) {
    'use strict';

    var options = createRequestOptions(args);

    http.request(options, function (res) {
	var verbose = args.verbose || false;
	var head = args.method && (args.method.toUpperCase() === 'HEAD');

	if (verbose || head) {
	    displayResponseInfos(res, head);
	}

	if (!head) {
	    displayResponseBody(res);
	}
    }).on('error', function (e) {
	console.log('problem with request: ' + e.message);
    }).end();
}

/**
 * create request options.
 */
function createRequestOptions(args) {
    'use strict';

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
    'use strict';

    var proxy = url.parse(args.proxy);
    var target = args._[0];

    return {
	hostname: proxy.hostname,
	port: proxy.port,
	path: target,
	method: args.method || 'GET',
	headers: {}
    };
}

/**
 * Create base options for direct access.
 */
function createBaseOptionsForDirectAccess(args) {
    'use strict';

    var target = url.parse(args._[0]);

    return {
	hostname: target.hostname || 'localhost',
	port: target.port || 80,
	path: target.path,
	method: args.method || 'GET',
	headers: {}
    };
}

/**
 * Add basic-auth to request options.
 */
function addBasicAuth(options, args) {
    'use strict';

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
    'use strict';

    var headerData = header.split(':');
    options.headers[headerData[0]] = headerData[1];
}

/**
 * Add all headers to request options.
 */
function addHeaders(options, header) {
    'use strict';

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
 */
function displayResponseInfos(res, head) {
    'use strict';

    var status = res.statusCode;
    var statusLine = status + ' ' + http.STATUS_CODES[status];
    console.log('Status: ' + statusLine);

    console.log('Headers:\n' + pd.json(res.headers));

    if (!head) {
	console.log('Body: ');
    }
}

/**
 * Display response body.
 */
function displayResponseBody(res) {
    'use strict';

    res.setEncoding('utf8');
    res.on('data', function (chunk) {
	var contentType = res.headers['content-type'];
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
