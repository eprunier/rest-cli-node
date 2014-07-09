(function () {
    'use strict';

    var knownTasks = ['help', 'http'];

    exports.execute = execute;

    function execute(cmdLine) {
	var taskName = cmdLine[0];
	var task = getTask(taskName);

	if (taskName === 'help') {
	    if (cmdLine.length > 1) {
		getTask(cmdLine[1]).help();
	    } else {
		task.execute();
	    }
	} else {
	    getTask(taskName).execute(cmdLine.slice(1));
	}
    }

    /**
     * Return the task identified by its name.
     */
    function getTask(name) {
	var task;

	if (!name || name === '--help') {
	    name = 'help';
	} 

	if (knownTasks.indexOf(name) >= 0) {
	    task = require('./tsu-' + name);
	} else {
	    console.log('Undefined task: ' + name);
	    process.exit(1);
	}
	
	return task;
    }
})();
