(function () {
  'use strict';

  function help () {
    require('./common').displayHelp('tsu-help');
  }

  exports.help = help;
  exports.execute = help;
})();
