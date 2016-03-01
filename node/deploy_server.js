require('shelljs/global');
require('craydent/global');
//io.set("origins","*:*");

var fs = require('fs');
var actions = {
        "backup":"backup",
        "build":"build",
        "npminstall":"npminstall",
        "pull":"pull",
        "pullrestart":"pullrestart",
        "pullsync":"pullsync",
        "restart":"restart",
        "start":"start",
        "stop":"stop",
        "sync":"sync"
    },
    deploying = {},
    //apps = [
    //    {'name': 'catnap',servers:[],filename:"catnap_server.js.log",logfile:["/var/scripts/logs/catnap/catnap_server.js.log"],size:{},fd:{},www:"/var/www/catnap.craydent.com/web",nodejs:"node",webdir:""},
    //    {'name': 'deploy',servers:[],filename:"deploy_server.js.log",logfile:["/var/scripts/logs/deploy/deploy_server.js.log"],size:{},fd:{},www:"/var/www/deploy.craydent.com/web",nodejs:"node",webdir:""},
    //    {'name': 'proto',servers:[],filename:"proto_server.js.log",logfile:["/var/scripts/logs/proto/proto_server.js.log"],size:{},fd:{},www:"/var/www/platform.craydent.com/web/",nodejs:"node",webdir:""},
    //    {'name': 'joe',servers:[],www:"/var/www/craydent.com/web/jsonobjecteditor/",webdir:""},
    //    {'name': 'proxy',servers:[],filename:"proxy_server.js.log",logfile:["/var/scripts/logs/proxy/proxy_server.js.log"],size:{},fd:{},nodejs:"node"},
    //    {'name': 'shapow',servers:[],filename:"shapow_server.js.log",logfile:["/var/scripts/logs/shapow/shapow_server.js.log"],size:{},fd:{},www:"/var/www/shapow.net/web/",nodejs:"node",webdir:""}
	//
    //    //{'name': 'catnap',filename:"catnap_server.js.log",logfile:"logs/catnap_server.js.log",size:0,fd:null},
    //    //{'name': 'deploy',filename:"deploy_server.js.log",logfile:"logs/deploy_server.js.log",size:0,fd:null},
    //    //{'name': 'proto',filename:"proto_server.js.log",logfile:"logs/proto_server.js.log",size:0,fd:null},
    //    //{'name': 'proxy',filename:"proxy_server.js.log",logfile:"logs/proxy_server.js.log",size:0,fd:null},
    //    //{'name': 'shapow',filename:"shapow_server.js.log",logfile:"logs/shapow_server.js.log",size:0,fd:null}
    //];

    apps = include('./craydent_deploy_config.json'),
    nconfig = include('./nodeconfig.js'),
    shelldir = '../shell_scripts/';
if (!apps) {
    apps = [{
        "name": "craydent-deplo",
        "servers": ["deploy_server.js"],
        "logfile": ["/var/craydentdeploy/log/craydent-deplo/deploy_server.log"],
        "size":{},
        "fd":{},
        "www": "",
        "nodejs":"node",
        "webdir":"",
        "email":""
    }];
    fs.writeFileSync("./craydent_deploy_config.json", JSON.stringify(apps));
}
GLOBAL.SOCKET_PORT = process.argv[2] || GLOBAL.SOCKET_PORT || 4900;
GLOBAL.HTTP_PORT = process.argv[3] || GLOBAL.HTTP_PORT || 4800;
GLOBAL.SAC = process.argv[4] || GLOBAL.SAC;

if (nconfig === false) {
    GLOBAL.SAC = GLOBAL.SAC || cuid();
    fs.writeFileSync("./nodeconfig.js", "GLOBAL.SOCKET_PORT = "+GLOBAL.SOCKET_PORT+";\nGLOBAL.HTTP_PORT = "+GLOBAL.HTTP_PORT+";\nGLOBAL.SAC = '" + GLOBAL.SAC + "';");
}

var io = require('socket.io')(SOCKET_PORT);//.of("deploy");
console.log('socket start on port: ' + SOCKET_PORT);

var config = {apps:apps,keys:["master_id_rsa"]};
try {
    config.keys = fs.readdirSync('/var/craydentdeploy/key/');
    for (var i = 0,len = config.keys.length; i < len; i++) {
        if (!config.keys[i].endsWith('.pub')) {
            config.keys.removeAt(i);
            len--;
        }
    }
} catch(e) { }

for (var i = 0, len = apps.length; i < len; i++) {
    start_app(apps[i]);
}
io.on('connection', function (socket) {
    console.log('connection made');
    socket.on('deploy', function(data){
        console.log('deploy',data);
        //var appobj = apps.filter(function(app){ return app.name == data.name;})[0] || {};
        var appobj = apps.where({name: data.name})[0] || {};
        var name = appobj.name;
        console.log(appobj);

        if (data.passcode == SAC && name && actions[data.action]) {
            deploying[name] = true;;
            _exec(shelldir + "deploy_script.sh " + name + " " + actions[data.action] +
                " " + (appobj.www || "''") +
                " " + (appobj.nodejs || "''") +
                " " + (appobj.webdir || "''") +
                " " + (appobj.servers.join(" ") || "''"),function(code, output, message){
                console.log(message);
                io.emit("process_complete",{code:code,output:output});
                delete deploying[name];
            });
        }
    });
    socket.on("gitadd", function(data){
        console.log('gitadd',data);
        if (data.passcode == SAC) {
            var appobj = apps.where({name: data.name})[0];
            if (appobj) {
                return io.emit("add_error",{code:'1',output:data.name + " already exists."});
            }
            var projectName = data.git_address.replace(/.*\/(.*?)\.git$/,'$1');
            _exec(shelldir + "git_script.sh " + data.git_address + " " + projectName + " " + data.name + " " + (data.key_name || "master_id_rsa").replace(/\.pub$/,''), function(code,output,message) {
                var logFiles = [];
                var servers = $c.isArray(data.servers) ? data.servers : [];
                for (var i = 0, len = servers.length; i < len; i++) {
                    logFiles.push("/var/craydentdeploy/log/" + data.name + "/" + servers[i]);
                }
                apps.push({
                    'git':data.git_address,
                    'name': data.name,
                    servers: servers,
                    logfile: logFiles,
                    size:{},
                    fd:{},
                    www:data.www || "",
                    nodejs:data.nodejs || "",
                    webdir:data.webdir || "",
                    email:data.email
                });
                fs.writeFileSync("./craydent_deploy_config.json", JSON.stringify(apps));
            });
        }
    });
    socket.on("sshkey", function(data){
        console.log('sshkey',data);
        if (data.passcode == SAC) {
            _exec(shelldir + "sshkey_script.sh " + data.name + " " + data.email,function (code,output,message) {
                console.log(message);
                var pubkey = data.name+'.pub';
                var path = '/var/craydentdeploy/key/'+pubkey;
                fs.exists(path,function(exists){
                    if (exists) {
                        fs.readFile(path, 'utf8', function (err,data) {
                            if (err) {
                                return socket.emit("showsshkey",{error:true,message:err});
                            }
                            config.keys.push(pubkey);
                            socket.emit("showsshkey",{content:data,name:pubkey});
                        });
                    }
                });

            });
        }
    });
    socket.on("init", function(data){
        console.log('initializing',data);
        if (!nconfig || data.passcode == SAC) {
            nconfig = true;
            _exec("echo '"+data.password+"' | sudo -S bash " + shelldir + "initial_script.sh " + data.email + " " + (data.rootdir || "/var"),function(code,output,message){
                console.log(message);
                socket.emit("initialized",{error:false});
            });
        } else {
            socket.emit("initialized",{error:false,message:"already initialized"});
        }
    });
    socket.on("getsshkey",function(data){
        if (data.passcode == SAC) {
            var path = '/var/craydentdeploy/key/' + data.name;
            fs.exists(path, function (exists) {
                if (exists) {
                    fs.readFile(path, 'utf8', function (err, dt) {
                        if (err) {
                            return socket.emit("showsshkey", {error: true, message: err});
                        }
                        socket.emit("showsshkey", {content: dt,name:data.name});
                    });
                }
            });
        }
    });
    function _exec (process, func) {
        exec(process, func || function (code, output, message) {
            console.log(message);
            io.emit("process_complete",{code:code,output:output});
        });
    }
});
function pollProcess(name) {
    if (!deploying[name]){
        exec("ps aux | grep " + name,function (code, output, message) {
            //io.emit("process_complete",{code:code,output:output});
            console.log(arguments);
        });
    }
}
function start_app(obj) {
    if (!obj.logfile) { return; }
    var files = obj.logfile;
    for (var i = 0, len = files.length; i < len; i++) {
        var file = files[i];
        (function(fname) {
            if (!fs.existsSync(fname)) {
                return;
            }
            obj.fd[fname] = fs.openSync(fname, 'r');
            obj.size[fname] = fs.statSync(fname).size;
            fs.watch(fname, function (action, filename) {
                if (action != "change") {
                    return;
                }
                fs.stat(fname, function (err, stats) {
                    if (err) {
                        io.emit('error', err);
                    }
                    var cfsize = stats.size,
                        size = obj.size[fname] || 0;
                    if (size && cfsize > size) {
                        fs.read(obj.fd[fname] || null, new Buffer(cfsize - size), 0, cfsize - size - 1, size, function (err, br, buffer) {
                            io.emit('line', {line: buffer.toString('utf8'), file: fname});
                        });
                    }
                    obj.size[fname] = cfsize;
                });
            });
        })(file);
    }
}

// create http server
$c.createServer(function(req,res){
    var self = this,
        path = self.SERVER_PATH;
    if (path.contains('?')) {
        path = path.split('?')[0];
    }
    if (path.endsWith('/')) {
        path += "index.html";
    }
    self.header("Content-Type: text/html");
    path = (path.startsWith('/') ? ".." : "../") + path;
    fs.exists(path,function(exists){
        if (exists) {
            return fs.readFile(path, 'utf8', function (err,data) {
                if (err) {
                    return self.end();
                }
                return self.end(fillTemplate(data,config));
            });
        }
        return self.end();
    });
    self.DEFER_END = true;
}).listen(HTTP_PORT);
console.log('http start on port: ' + HTTP_PORT);