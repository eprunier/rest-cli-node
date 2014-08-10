(function () {
    'use strict';

    var fs = require('fs');
    var minimist = require('minimist');
    var amqp = require('amqplib');
    var when = require('when');
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
	    sendMessage(args);
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
		'p': 'port'
	    }
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
     * Send message
     */
    function sendMessage(args) {
	var options = createOptions(args);

	var url = ['amqp://',
		   options.server.host,
		   ':',
		   options.server.port].join('');
	
	amqp.connect(url).then(function(connection) {
	    return connection.createChannel().then(function(channel) {
		var exchangeOK = channel.assertExchange(
		    options.exchange.name, 
		    options.exchange.type, 
		    options.exchange.options);

		var replyQueue;
		var queueOK = channel.assertQueue(null, { exclusive: true }).then(function (ok) {
		    replyQueue = ok.queue;
		    return replyQueue;
		});

		var consumeOK = queueOK.then(function (queue) {
		    return channel.consume(queue, consume);
		});

		var publishOK = when.all([exchangeOK, consumeOK]).then(function () {
		    return channel.publish(
			options.exchange.name, 
			options.routingKey, 
			new Buffer(options.message), 
			{ replyTo: replyQueue }
		    );
		});

		return publishOK.then(function () {
		    console.log(
			"Sending message to '%s' with routing key '%s':\n'%s'", 
			options.exchange.name,
			options.routingKey,
			options.message
		    );
		}); 

		function consume(message) {
		    console.log('\nResponse:\n%s', message.content.toString());
		    connection.close();
		}
	    });
	}).then(null, console.log);
    }

    /**
     * Create AMQP options from args.
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
	    routingKey: args['routing-key']
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
})();
