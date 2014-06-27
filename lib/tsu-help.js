exports.execute = function() {
    var help = "\
tsu rest [-m|--method <method>] [--basic-auth <user:password>] [-v] <url>\n \
\n \
OPTIONS\n \
    -m, --method <method>\n \
        HTTP method (GET, POST, DELETE...)\n \
\n \
    -v\n \
        verbose mode";

    console.log(help);    
};
