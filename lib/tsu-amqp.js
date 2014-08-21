(function () {
    'use strict';

    var fs = require('fs');
    var minimist = require('minimist');
    var amqp = require('amqplib');
    var pd = require('pretty-data').pd;
    require('when');
    var common = require('./common');

    exports.help = help;
    exports.execute = execute;

    /**
     * Display help for this task.
     */
    function help() {
	common.displayHelp('tsu-amqp');
    }

    /**
     * Execute this task.
     */
    function execute(cmdLine) {
	var args = parseCmdLine(cmdLine);
	var errors = checkArgs(args);

	if (errors.length > 0) {
	    common.displayErrors(errors);
	    process.exit(1);
	} else {
	    var options = createOptions(args);
	    sendRequest(options);
	}
    }

    /**
     * Parse command line arguments.
     */    
    function parseCmdLine(cmdLine) {
	var argsOptions = {
	    'alias': {
		'e': 'exchange',
		'f': 'file',
		'h': 'host',
		'k': 'routing-key',
		'p': 'port',
		'v': 'verbose'
	    },
	    'boolean': ['verbose', 'json']
	};

	return minimist(cmdLine, argsOptions);
    }

    /**
     * Check args. Exits if invalid.
     */
    function checkArgs(args) {
	var requirements = {
	    required: [['Exchange name', args.exchange],
		       ['Routing key', args['routing-key']],
		       ['Message', args._[0] || args.file]]
	};
	
	return common.validate(requirements);
    }

    /**
     * Create AMQP options from CLI arguments.
     */
    function createOptions(args) {
	var options = {
	    server: {
		host: args.host || 'localhost',
		port: args.port || 5672
	    },
	    exchange: {
		name: args.exchange,
		type: 'topic',
		options: {
		    durable: false
		}
	    },
	    routingKey: args['routing-key'],
	    verbose: args.verbose,
	    json: args.json
	};

	addMessage(options, args);

	return options;
    }

    /**
     * Add message to request options.
     */
    function addMessage(options, args) {
	var file = args.file;
	if (file) {
	    try {
		options.message = fs.readFileSync(file);
	    } catch (e) {
		console.error('Error while reading file %s: %s',
			      file,
			      e.message);
		process.exit(1);
	    }
	} else {
	    options.message = args._[0];
	}
    }

    /**
     * Send message
     */
    function sendRequest(options) {
	var url = ['amqp://',
		   options.server.host,
		   ':',
		   options.server.port].join('');
	
	var connected = amqp.connect(url);
	connected.then(createChannel)
	    .then(createExchange)
	    .then(createReplyQueue)
	    .then(addPublisher(options))
	    .catch(manageError);

	function createChannel(connection) {
	    return connection.createChannel();
	}

	function createExchange(channel) {
	    channel.assertExchange(
		options.exchange.name, 
		options.exchange.type, 
		options.exchange.options);

	    return channel;
	}

	function createReplyQueue(channel) {
	    return channel.assertQueue(null, { exclusive: true }).then(function (ok) {
		var queue = ok.queue;
		return channel.consume(queue, consumer(options)).then(function () {
		    return {queue: queue,
			    channel: channel};
		});
	    });
	}

	function addPublisher(options) {
	    return function (ok) {
		var channel = ok.channel;
		var replyQueue = ok.queue;

		if (options.verbose) {
		    console.log(
			"Sending message to '%s' with routing key '%s':\n'%s'", 
			options.exchange.name,
			options.routingKey,
			options.message
		    );
		}

		return channel.publish(
		    options.exchange.name, 
		    options.routingKey, 
		    new Buffer(options.message), 
		    { replyTo: replyQueue }
		);
	    };
	}

	function consumer(options) {
	    return function (message) {
		var content = message.content.toString();
		if (options.json) {
		    content = pd.json(message.content.toString());
		}

		if (options.verbose) {
		    console.log('\nResponse:\n%s', content);
		} else {
		    console.log(content);
		}

		connected.then(function (connection) {
		    connection.close();
		});
	    };
	}

	function manageError(error) {
	    console.log(error);
	    process.exit(1);
	}
    }

})();
