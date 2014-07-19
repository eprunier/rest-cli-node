(function () {
    'use strict';

    var _ = require('lodash');
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

	var options = createOptions(args);
	var errors = checkOptions(options);

	if (errors.length > 0) {
	    common.displayErrors(errors);
	    process.exit(1);
	} else {
	    sendMessage(options);
	}
    }

    /**
     * Parse command line arguments.
     */    
    function parseCmdLine(cmdLine) {
	var argsOptions = {
	    'alias': {
		'h': 'host',
		'p': 'port',
		'e': 'exchange',
		'k': 'routing-key'
	    }
	};

	return minimist(cmdLine, argsOptions);
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
	    routingKey: args['routing-key'],
	    message: args._[0],
	};

	return options;
    }

    /**
     * Check options. Exits if invalid.
     */
    function checkOptions(options) {
	var requirements = {
	    required: [['Exchange name', options.exchange.name],
		       ['Routing key', options.routingKey],
		       ['Message', options.message]]
	};
	
	return common.validate(requirements);
    }

    /**
     * Send message
     */
    function sendMessage(options) {
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
})();
