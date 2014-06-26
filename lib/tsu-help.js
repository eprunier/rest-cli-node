exports.execute = function() {
    var help = "tsu \
[--host|-h <host>] [-port|-p <port>] \
[--method|-m <method>] [--user|-u <user:password>] [-v] path\n \
-m : HTTP method (GET, POST, DELETE...)\n \
-v : verbose mode";

    console.log(help);    
};
