exports.execute = function (args) {
    var task = process.argv[2];

    switch(task) {
    case 'help':
	require('./tsu-help').execute();
	break;
    case 'rest':
	require('./tsu-rest').execute();
	break;
    default:
	console.log('Undefined task: ' + task);
    }
};
