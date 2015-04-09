(function () {
    'use strict';

    module.exports = function (grunt) {
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.initConfig({
	    jshint: {
		all: ['Gruntfile.js', 'bin/tsu', 'lib/**/*.js'],
		options: {
		    curly: true,
		    eqeqeq: true,
		    unused: true,
		    strict: true,
		    maxdepth: 2,
		    maxcomplexity: 5
		}
	    }
	});

	grunt.registerTask('default', ['jshint']);
    };
}());
