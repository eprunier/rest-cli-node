var minimist = require('minimist');
var http = require('http');

exports.execute = function() {
    var args = parseArgs();

    if (args._.length < 2) {
	console.log('You must provide a URL');
	process.exit(1);
    } else {
	var options = createOptions(args);
	var verbose = args.v || false;
	sendRequest(options, verbose);
    }
};

/**
 * Parse command line arguments.
 */
function parseArgs() {
    var cmdLine = process.argv.slice(2);
    var argsOptions = {'boolean': 'v',
		       'alias': {'h': 'host',
				 'p': 'port',
				 'm': 'method',
				 'u': 'user'}}

    return minimist(cmdLine,argsOptions);
}

/**
 * create request options.
 */
function createOptions(args) {
    var options = {
	hostname: args.host || 'localhost',
	port: args.port || 80,
	path: args._[args._.length - 1],
	method: args.method || 'GET',
	headers: {}
    };

    var user = args.user;
    if (user) {
	options.headers['Authorization'] = 'Basic ' + new Buffer(user).toString('base64');
    }

    return options;
}

/**
 * create request.
 */
function sendRequest(options, verbose) {
    var req = http.request(options, function(res) {
	if (verbose) {
	    var status = res.statusCode;
	    console.log('Status: ' + status + ' ' + http.STATUS_CODES[status]);
	    console.log('Headers: \n' + JSON.stringify(res.headers, null, 2));
	}

	res.setEncoding('UTF-8');
	res.on('data', function(result) {
	    var json = JSON.parse(result)

	    if (verbose) {
		console.log('Body: ');
	    }
	    console.log(JSON.stringify(json, null, 2));
	});
    }).on('error', function(e) {
	console.log('problem with request: ' + e.message);
    }).end();
}
