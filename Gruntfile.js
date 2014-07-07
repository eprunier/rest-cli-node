module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.initConfig({
	jshint: {
	    all: ['Gruntfile.js', 'lib/**/*.js']
	}
    });

    grunt.registerTask('default', ['jshint']);
};
