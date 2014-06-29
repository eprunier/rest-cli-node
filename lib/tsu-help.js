function help() {
    var help = "\n\
Usage: tsu <task>\n\
\n\
Available tasks:\n \
\n\
    help\n\
    rest\n\
\n\
'tsu help <task>' to display a task help.";

    console.log(help);    
}

exports.help = help;

exports.execute = help;
