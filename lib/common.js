(function () {
    'use strict';

    var _ = require('lodash');
    var path= require('path');
    var fs = require('fs');

    /**
     * Display help.
     */
    function displayHelp(moduleName) {
	var lib = path.join(path.dirname(fs.realpathSync(__filename)), '../help');
	var file = lib + '/' + moduleName + '.txt';

	fs.readFile(file, {'encoding': 'utf8'}, function (err, data) {
	    if (err) {
		throw err;
	    } else {
		console.log(data);
	    }
	});
    }

    /**
     * Validate data according to requirements.
     * Exemple of requirements:
     * {
     *   required: [['Foo', '']
     *              ['Baz', 'xyz']]
     * }
     */
    function validate(requirements) {
	var required = requirements.required;
	return _.reduce(required, checkRequired, []);
    }

    /**
     * Check if value is present.
     * Item = [name, value]
     */
    function checkRequired(errors, item) {
	var name = item[0];
	var value = item[1];

	if (!value || _.isEmpty(value)) {
	    errors.push(name + ' is required');
	}

	return errors;
    }

    /**
     * Display errors.
     */
    function displayErrors(errors) {
	console.log('Invalid options:');
	console.log(
	    _.map(errors, function (item) { 
		return '  - ' + item;
	    }).join('\n')
	);
    }

    /**
     * Test existence of value.
     */
    function existy(value) {
	return value !== undefined && value !== null;
    }

    /**
     * Test truth of value.
     */
    function truthy(value) {
	return existy(value) && value === true;
    }

    exports.displayHelp = displayHelp;
    exports.validate = validate;
    exports.displayErrors = displayErrors;
    exports.existy = existy;
    exports.truthy = truthy;

})();
