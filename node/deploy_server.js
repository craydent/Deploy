/*/---------------------------------------------------------/*/
/*/ Craydent LLC deploy-v0.1.15                             /*/
/*/ Copyright 2011 (http://craydent.com/about)              /*/
/*/ Dual licensed under the MIT or GPL Version 2 licenses.  /*/
/*/ (http://craydent.com/license)                           /*/
/*/---------------------------------------------------------/*/
/*/---------------------------------------------------------/*/
/* deploy_server params
    1=>interpreter/node command (not used)
    2=>node file being executed (not used)
    3=>socket port
    4=>http port
    5=>SAC
    6=>http auth username
    7=>http auth password
 */
require('shelljs/global');
require('craydent/global');

$c.DEBUG_MODE = true;
const BASE_PATH = "/var/craydentdeploy/";
const NODE_PATH = "/var/craydentdeploy/nodejs/deploy/node/";
const PROJECT_PATH = "/var/craydentdeploy/nodejs/deploy/";
const LOG_BASE_PATH = "/var/craydentdeploy/log/";
const LOG_PATH = "/var/craydentdeploy/log/craydent-deploy/";
const KEY_PATH = "/var/craydentdeploy/key/";

var fs = require('fs');
var git = require('./git_actions');
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
    apps = include('./craydent_deploy_config.json'),
    nconfig = include('./nodeconfig.js'),
    shelldir = '../shell_scripts/';
if (!apps) {
    apps = [{
        "name": "craydent-deploy",
        "servers": ["deploy_server.js"],
        "logfile": [LOG_PATH + "deploy_server.log"],
        "size":{},
        "fd":{},
        "www": "",
        "nodejs":"node",
        "webdir":"",
        "email":""
    }];
    fs.writeFileSync(NODE_PATH + "craydent_deploy_config.json", JSON.stringify(apps));
}
global.SOCKET_PORT = process.argv[2] || global.SOCKET_PORT || 4900;
global.HTTP_PORT = process.argv[3] || global.HTTP_PORT || 4800;
global.SAC = process.argv[4] || global.SAC;
global.HTTP_AUTH_USERNAME = process.argv[5] || global.HTTP_AUTH_USERNAME || "admin";
global.HTTP_AUTH_PASSWORD = process.argv[6] || global.HTTP_AUTH_PASSWORD || "admin";
global.ENV = process.argv[6] || global.ENV || "prod";

if (nconfig === false) {
    global.SAC = global.SAC || cuid();
    writeNodeConfig();
}
var io = require('socket.io')(SOCKET_PORT);//.of("deploy");
logit('socket start on port: ' + SOCKET_PORT);

var config = {apps:apps,keys:["master_id_rsa"]};
// store all keys to config.keys variable as a string of names
try {
    config.keys = fs.readdirSync(KEY_PATH);
    for (var i = 0,len = config.keys.length; i < len; i++) {
        if (!config.keys[i].endsWith('.pub')) {
            config.keys.removeAt(i);
            len--;
        }
    }
} catch(e) { }

// start all log tails
for (var i = 0, len = apps.length; i < len; i++) {
    start_app(apps[i]);
}
function buildit(data,callback){
    logit('deploy',data);
    var appobj = apps.where({name: data.name})[0] || {};
    var name = appobj.name;
    logit(appobj);

    if (data.passcode == SAC && name && actions[data.action]) {
        deploying[name] = true;
        _exec("echo \"user is $USER\";",foo);
        _exec(shelldir + "deploy_script.sh " + name + " " + actions[data.action] +
            " " + (appobj.www || "''") +
            " " + (appobj.nodejs || "''") +
            " " + (appobj.webdir || "''") +
            " '" + appobj.servers.join(" ") + "'" +
            " '" + (global.ENV || "prod") + "'", callback);
    }
}
io.on('connection', function (socket) {
    logit('connection made');
    socket.on('deploy', function(data){
        buildit(data, function(code, output, message){
            io.emit("process_complete",{code:code,output:output});
            delete deploying[name];
        });
    });
    socket.on("gitadd", function(data){
        logit('gitadd',data);
        if (data.passcode == SAC || data.sac == SAC) {
            var appobj = apps.where({name: data.name})[0];
            if (appobj) {
                return io.emit("add_error",{code:'1',output:data.name + " already exists."});
            }
            var project_name = data.git_address.replace(/.*\/(.*?)\.git$/,'$1'),
                repo_owner = data.git_address.replace(/.*?\.com[\/:](.*?)\/.*\.git$/,'$1');
            _exec(shelldir + "git_script.sh " + data.git_address + " " + project_name + " " + data.name + " " + (data.key_name || "master_id_rsa").replace(/\.pub$/,''), function(code,output,message) {
                var logFiles = [];
                var servers = $c.isArray(data.servers) ? data.servers : [];
                for (var i = 0, len = servers.length; i < len; i++) {
                    logFiles.push(LOG_BASE_PATH + data.name + "/" + servers[i]);
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
            getsshkey(data.name,function(dt){
                var params = {
                    repo_owner:repo_owner,
                    project_name:project_name,
                    git_address:data.git_address,
                    git_user:data.git_user,
                    git_password:data.git_password,
                    name:data.name,
                    content:dt.content,
                    key_name:dt.name,
                    host:socket.handshake.headers.host.split(':')[0],
                    protocol: socket.handshake.headers.origin.contains('https') ? "https" : "http"
                };
                git.createDeployKey(params);
                git.createWebhook(params);
            });

        }
    });
    socket.on("sshkey", function(data){
        logit('sshkey',data);
        if (data.passcode == SAC || data.sac == SAC) {
            _exec(shelldir + "sshkey_script.sh " + data.name + " " + data.email,function (code,output,message) {
                logit(message);
                var pubkey = data.name+'.pub';
                var path = KEY_PATH + pubkey;
                fs.exists(path,function(exists){
                    if (!exists) { return }
                    fs.readFile(path, 'utf8', function (err,data) {
                        if (err) {
                            return socket.emit("showsshkey",{error:true,message:err});
                        }
                        config.keys.push(pubkey);
                        socket.emit("showsshkey",{content:data,name:pubkey});
                    });
                });

            });
        }
    });
    socket.on("init", function(data){
        logit('initializing', data);
        if (nconfig === false || data.passcode == SAC || data.sac == SAC) {
            nconfig = true;
            global.SOCKET_PORT = parseInt(data.ws_port);
            global.HTTP_PORT = parseInt(data.http_port);
            global.SAC = data.passcode || data.sac;
            global.HTTP_AUTH_USERNAME = data.http_username;
            global.HTTP_AUTH_PASSWORD = data.http_password;
            global.EMAIL = data.email;
            global.ENV = data.environment;
            writeNodeConfig();
            _exec("echo '"+data.password+"' | sudo -S bash " + shelldir + "initial_script.sh " + data.email + " " + (data.rootdir || "/var") + " $USER",function(code,output,message){
                logit(message);
                socket.emit("initialized",{error:false});
            });
        } else {
            socket.emit("initialized",{error:false,message:"already initialized"});
        }
    });
    socket.on("getsshkey",function(data){
        if (data.passcode == SAC || data.sac == SAC) {
            getsshkey(data.name,function(dt){
                socket.emit("showsshkey", dt);
            });
            //var path = '/var/craydentdeploy/key/' + data.name;
            //fs.exists(path, function (exists) {
            //    if (!exists) { return; }
            //    fs.readFile(path, 'utf8', function (err, dt) {
            //        if (err) {
            //            return socket.emit("showsshkey", {error: true, message: err});
            //        }
            //        socket.emit("showsshkey", {content: dt,name:data.name});
            //    });
            //});
        }
    });
    function _exec (process, func) {
        exec(process, func || function (code, output, message) {
            console.log(message);
            io.emit("process_complete",{code:code,output:output});
        });
    }
});

// create http server
// the front facing files are in the public folder
var server = $c.createServer(function (req, res) {
    var self = this,
        path = self.SERVER_PATH,
        auth = req.headers['authorization'],
        auth_header = 'WWW-Authenticate: Basic realm="Deployer Secure Area"';
    if (path.contains('?')) { path = path.split('?')[0]; }
    if (path.endsWith('/')) { path += "index.html"; }
    path = (path.startsWith('/') ? PROJECT_PATH + "public" : PROJECT_PATH + "public/") + path;
    path.endsWith('.html') && self.header("Content-Type: text/html");

    if (!self.SERVER_PATH.contains(global.SAC) && path.endsWith('.html')) {
        if (!auth) {     // No Authorization header was passed in so it's the first time the browser hit us
            self.header(auth_header);
            return self.end(401, '<html><body>You are trying to access a secure area.  Please login.</body></html>');
        }

        var encoded = auth.split(' ')[1];   // Split on a space, the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part

        var buf = new Buffer(encoded, 'base64'),
            plain_auth = buf.toString(),
            creds = plain_auth.split(':'),
            username = creds[0],
            password = creds[1];

        if (username != global.HTTP_AUTH_USERNAME || password != global.HTTP_AUTH_PASSWORD) {
            self.header(auth_header);
            // res.statusCode = 403;   // or alternatively just reject them altogether with a 403 Forbidden
            self.end(401, '<html><body>You are not authorized to access this page</body></html>');
        }
    }
    fs.exists(path,function(exists){
        if (!exists) {
            console.log('missing file: ' + path,exists);
            return self.end();
        }
        console.log('file: ' + path);
        return fs.readFile(path, 'utf8', function (err,data) {
            if (err) { return self.end(); }
            return self.end(fillTemplate(data,config));
        });

    });
    self.DEFER_END = true;
}).listen(HTTP_PORT);
server.all("/build/${name}/${passcode}", function (req, res, params) {
    var self = this;
    params.action = "build";
    buildit(params,function(code, output){ self.send(!code ? 200 : 500, {code:code,output:output}); });
});
logit('http start on port: ' + HTTP_PORT);


// helper functions
function pollProcess(name) {
    if (!deploying[name]){
        exec("ps aux | grep " + name,function (code, output, message) {
            //io.emit("process_complete",{code:code,output:output});
            console.log(arguments);
        });
    }
}
function start_app(obj) {
    // do not proceed if there is no log file
    if (!obj.logfile && !obj.logfile.length) { return; }
    var files = obj.logfile;
    // loop through each log file and start watching the logs
    for (var i = 0, len = files.length; i < len; i++) {
        var file = files[i];
        (function(fname) {
            if (!fs.existsSync(fname)) {
                return;
            }
            obj.fd[fname] = fs.openSync(fname, 'r');
            obj.size[fname] = fs.statSync(fname).size;
            fs.watch(fname, function (action, filename) {
                if (action != "change") { return; }
                fs.stat(fname, function (err, stats) {
                    if (err) {
                        return io.emit('error', err);
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
function writeNodeConfig() {
    fs.writeFileSync("./nodeconfig.js",
        "global.SOCKET_PORT = " + global.SOCKET_PORT +
        ";\nglobal.HTTP_PORT = "+global.HTTP_PORT+
        ";\nglobal.SAC = '" + global.SAC + "';" +
        "\nglobal.HTTP_AUTH_USERNAME = '" + (global.HTTP_AUTH_USERNAME || "admin") + "';" +
        "\nglobal.HTTP_AUTH_PASSWORD = '" + (global.HTTP_AUTH_PASSWORD || "admin") + "';" +
        "\nglobal.EMAIL = '" + (global.EMAIL || "" ) + "';" +
        "\nglobal.ENV = '" + (global.ENV || "prod") + "';");
}
function getsshkey(name, callback){
    var path = KEY_PATH + name;
    fs.exists(path, function (exists) {
        if (!exists) { return; }
        fs.readFile(path, 'utf8', function (err, dt) {
            if (err) {
                return callback("showsshkey", {error: true, message: err});
            }
           callback({content: dt,name:name});
        });
    });
}