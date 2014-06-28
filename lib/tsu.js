var knownTasks = ['help', 'rest'];

exports.execute = execute;

function execute() {
    var args = process.argv.slice(2);
    var taskName = args[0];
    var task = getTask(taskName);

    if (taskName == 'help') {
	if (args.length > 1) {
	    getTask(args[1]).help();
	} else {
	    task.execute();
	}
    } else {
	getTask(taskName).execute();
    }
};

/**
 * Return the task identified by its name.
 */
function getTask(name) {
    var task;

    if (knownTasks.indexOf(name) >= 0) {
	task = require('./tsu-' + name);
    } else {
	console.log('Undefined task: ' + name);
	process.exit(1);
    }
    
    return task;
}
