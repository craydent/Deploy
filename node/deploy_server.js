require('./nodeconfig.js');
require('shelljs/global');
var io = require('socket.io')(SOCKET_PORT);
console.log('socket start on port: ' + SOCKET_PORT);
io.set("origins","*:*");
io = io.of("deploy");

io.on('connection', function (socket) {
    console.log('connection made')
    var actions = {
            "build":"build",
            "install":"install",
            "pull":"pull",
            "pullrestart":"pullrestart",
            "pullsync":"pullsync",
            "restart":"restart",
            "start":"start",
            "stop":"stop",
            "sync":"sync"
        },
        apps = {
            'catnap': 'catnap',
            'deploy': 'deploy',
            'proto': 'proto',
            'proxy': 'proxy',
            'shapow': 'shapow'
        };
    socket.on('tail',function(data){
        var app = apps[data.name];
        if (data.passcode == SAC && app) {
            var Tail = require('always-tail');
            var fs = require('fs');
            var filename = "/var/scripts/logs/" + app + "/" + app + "_server.js.log";

            if (!fs.existsSync(filename)) fs.writeFileSync(filename, "");

            var tail = new Tail(filename, '\n');

            tail.on('line', function(data) {
                io.emit("line:", data);
            });

            tail.on('error', function(data) {
                io.emit("error:", data);
            });
            tail.watch();
        }
    });
    socket.on('deploy', function(data){
        if (data.passcode == SAC && apps[data.name] && actions[data.action]) {
            _exec("service deploy-nodejs " + apps[data.name] + " " + actions[data.action]);
        }
    });
    function _exec (process) {
        exec(process, function (code, output) {
            io.emit("process_complete",{code:code,output:output});
        });
    }
});