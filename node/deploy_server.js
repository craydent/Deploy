require('./nodeconfig.js');
require('shelljs/global');
var io = require('socket.io')(SOCKET_PORT);//.of("deploy");
console.log('socket start on port: ' + SOCKET_PORT);
//io.set("origins","*:*");

var fs = require('fs');
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
    apps = [
        {'name': 'catnap',filename:"catnap_server.js.log",logfile:"/var/scripts/logs/catnap/catnap_server.js.log",size:0,fd:null},
        {'name': 'deploy',filename:"deploy_server.js.log",logfile:"/var/scripts/logs/deploy/deploy_server.js.log",size:0,fd:null},
        {'name': 'proto',filename:"proto_server.js.log",logfile:"/var/scripts/logs/proto/proto_server.js.log",size:0,fd:null},
        {'name': 'joe'},
        {'name': 'proxy',filename:"proxy_server.js.log",logfile:"/var/scripts/logs/proxy/proxy_server.js.log",size:0,fd:null},
        {'name': 'shapow',filename:"shapow_server.js.log",logfile:"/var/scripts/logs/shapow/shapow_server.js.log",size:0,fd:null}

        //{'name': 'catnap',filename:"catnap_server.js.log",logfile:"logs/catnap_server.js.log",size:0,fd:null},
        //{'name': 'deploy',filename:"deploy_server.js.log",logfile:"logs/deploy_server.js.log",size:0,fd:null},
        //{'name': 'proto',filename:"proto_server.js.log",logfile:"logs/proto_server.js.log",size:0,fd:null},
        //{'name': 'proxy',filename:"proxy_server.js.log",logfile:"logs/proxy_server.js.log",size:0,fd:null},
        //{'name': 'shapow',filename:"shapow_server.js.log",logfile:"logs/shapow_server.js.log",size:0,fd:null}
    ];

for (var i = 0, len = apps.length; i < len; i++) {
    (function (obj) {
        if (!obj.logfile) { return; }
        var file = obj.logfile;
        if (!fs.existsSync(file)) { return; }
        obj.fd = fs.openSync(file, 'r');
        obj.size = fs.statSync(file).size;
        fs.watch(file, function (action, filename) {
            if (action != "change") { return; }
            fs.stat(file, function (err, stats) {
                if (err) { io.emit('error',err); }
                var cfsize = stats.size,
                    size = obj.size;
                if (size && cfsize > size) {
                    fs.read(obj.fd, new Buffer(cfsize - size), 0, cfsize - size - 1, size, function (err, br, buffer) {
                        io.emit('line', {line:buffer.toString('utf8'),file:obj.filename});
                    });
                }
                obj.size = cfsize;
            });
        });
    })(apps[i]);
}
io.on('connection', function (socket) {
    console.log('connection made');
    socket.on('deploy', function(data){
        console.log('deploy',data);
        var appobj = apps.filter(function(app){ return app.name == data.name;})[0] || {};
        var name = appobj.name;
        console.log(appobj);
        if (data.passcode == SAC && name && actions[data.action]) {
            _exec("service deploy-nodejs " + name + " " + actions[data.action],'deploy done');
        }
    });
    socket.on("add", function(data){
        console.log('adding',data);
        if (data.passcode == SAC) {
            _exec("service add-nodejs " + data.git_url + " " + data.deploy_path, "add complete");
        }
    });
    function _exec (process) {
        exec(process, function (code, output, message) {
            console.log(message);
            io.emit("process_complete",{code:code,output:output});
        });
    }
});