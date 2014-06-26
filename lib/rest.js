var http = require('http')

var help = "tsu \
[--host|-h <host>] [-port|-p <port>] \
[--method|-m <method>] [--user|-u <user:password>] [-v] path\n \
-m : HTTP method (GET, POST, DELETE...)\n \
-v : verbose mode"

function launch() {
    var args = parseArgs();
    sendRequest(args);
}

// parse args
function parseArgs() {
    var args = {
	host: 'localhost',
	port: 80,
	path: process.argv[process.argv.length - 1],
	method: 'GET',
	user: undefined,
	verbose: false,
    }

    process.argv.forEach(function (val, index, array) {
	switch (val) {
	case '--help':
	case 'help':
	    console.log(help);
	    process.exit(0);
	    break;
	case '--host':
	    args.host = process.argv[index + 1];
	    break;
	case '--port':
	case '-p':
	    args.port = process.argv[index + 1];
	    break;
	case '--method':
	case '-m':
	    args.method = process.argv[index + 1];
	    break;
	case '--user':
	case '-u':
	    args.user = process.argv[index + 1];
	    break;
	case '-v':
	    args.verbose = true;
	    break;
	}
    });

    return args;
}

// create request
function sendRequest(args) {
    var options = createOptions(args);

    var req = http.request(options, function(res) {
	if (args.verbose) {
	    console.log('resquest options: ' + JSON.stringify(options));
	    console.log('response status: ' + res.statusCode);
	    console.log('response headers: ' + JSON.stringify(res.headers));
	}
	res.setEncoding('UTF-8');
	res.on('data', function(result) {
	    var json = JSON.parse(result)
	    console.log(JSON.stringify(json, null, 2));
	});
    }).on('error', function(e) {
	console.log('problem with request: ' + e.message);
    }).end();
}

// create request options
function createOptions(args) {
    var options = {
	hostname: args.host,
	port: args.port,
	path: args.path,
	method: args.method,
	headers: {}
    };

    var user = args.user
    if (user) {
	options.headers['Authorization'] = 'Basic ' + new Buffer(user).toString('base64');
    }

    return options;
}

exports.launch = launch;
