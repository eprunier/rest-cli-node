(function () {
    'use strict';

    var path= require('path');
    var fs = require('fs');

    exports.displayHelp = function (moduleName) {
	var lib = path.join(path.dirname(fs.realpathSync(__filename)), '../help');
	var file = lib + '/' + moduleName + '.txt';

	fs.readFile(file, {'encoding': 'utf8'}, function (err, data) {
	    if (err) {
		throw err;
	    } else {
		console.log(data);
	    }
	});
    };
})();
