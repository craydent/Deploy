/*/---------------------------------------------------------/*/
/*/ Craydent LLC deploy-v0.3.0                              /*/
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
const BASE_PATH = "/var/craydent/";
const GIT_BASE_PATH = BASE_PATH + "git/";
const CONFIG_BASE_PATH = BASE_PATH + "config/";
const PROJECT_PATH = BASE_PATH + "nodejs/craydent-deploy/";
const NODE_PATH = PROJECT_PATH + "node/";
const CONFIG_PATH = BASE_PATH + "config/craydent-deploy/";
const LOG_BASE_PATH = BASE_PATH + "log/";
const LOG_PATH = LOG_BASE_PATH + "/craydent-deploy/";
const KEY_PATH = BASE_PATH + "key/";

var fs = require('fs');
var git = require('./git_actions');
var actions = include('./config/actions.json'),
    deploying = {},
    apps = include(CONFIG_PATH + 'craydent_deploy_config.json'),
    nconfig = include(CONFIG_PATH + 'nodeconfig.js'),
    shelldir = __dirname + '/../shell_scripts/',
    fswrite = yieldable(fs.writeFile,fs),
    fsreaddir = yieldable(fs.readdir,fs),
    fsread = yieldable(fs.readFile,fs),
    fsexists = yieldable(fs.exists,fs),
    fsopen = yieldable(fs.open,fs),
    fsstat = yieldable(fs.stat,fs),
    config = {apps:apps,keys:["master_id_rsa"]},
    io;

syncroit(function *(){
    if (!apps) {
        apps = [{
            "name": "craydent-deploy",
            "servers": ["index.js"],
            "logfile": [LOG_PATH + "index.log"],
            "size":{},
            "fd":{},
            "www": "",
            "nodejs":"node",
            "webdir":"",
            "email":""
        }];
        yield fswrite(CONFIG_PATH + "craydent_deploy_config.json", JSON.stringify(apps));
    }
    config.apps = apps;

    global.SOCKET_PORT = process.argv[2] || global.SOCKET_PORT || 4900;
    global.HTTP_PORT = process.argv[3] || global.HTTP_PORT || 4800;
    global.SAC = process.argv[4] || global.SAC;
    global.HTTP_AUTH_USERNAME = process.argv[5] || global.HTTP_AUTH_USERNAME || "admin";
    global.HTTP_AUTH_PASSWORD = process.argv[6] || global.HTTP_AUTH_PASSWORD || "admin";
    global.ENV = process.argv[6] || global.ENV || "prod";

    if (nconfig === false) {
        global.SAC = global.SAC || cuid();
        yield writeNodeConfig();
    }
    io = require('socket.io')(SOCKET_PORT);
    logit('socket start on port: ' + SOCKET_PORT);

    // store all keys to config.keys variable as a string of names
    try {
        config.keys = yield fsreaddir(KEY_PATH);
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
    io.on('connection', function (socket) {
        logit('connection made');
        socket.on('deploy', function(data){
            syncroit(function*(){
                var args = yield buildit(data), code = args[0], output = args[1], message = args[2];

                io.emit("process_complete",{code:code,output:output});
            });
        });
        socket.on("gitadd", function(data){
            syncroit(function*() {
                logit('gitadd', data);
                if (data.passcode == SAC || data.sac == SAC) {
                    var appobj = apps.where({name: data.name})[0];
                    if (appobj) {
                        return io.emit("add_error", {code: '1', output: data.name + " already exists."});
                    }
                    var project_name = data.git_address.replace(/.*\/(.*?)\.git$/, '$1'),
                        repo_owner = data.git_address.replace(/.*?\.com[\/:](.*?)\/.*\.git$/, '$1');

                    yield _exec(shelldir + "git_script.sh " + data.git_address + " " + project_name + " " + data.name + " " + (data.key_name || "master_id_rsa").replace(/\.pub$/, ''));

                    var logFiles = [];
                    var servers = $c.isArray(data.servers) ? data.servers : [];
                    for (var i = 0, len = servers.length; i < len; i++) {
                        logFiles.push(LOG_BASE_PATH + data.name + "/" + servers[i]);
                    }
                    apps.push({
                        'git': data.git_address,
                        'name': data.name,
                        servers: servers,
                        logfile: logFiles,
                        size: {},
                        fd: {},
                        www: data.www || "",
                        nodejs: data.nodejs || "",
                        webdir: data.webdir || "",
                        email: data.email
                    });
                    yield fswrite(CONFIG_PATH + "craydent_deploy_config.json", JSON.stringify(apps));

                    var dt = yield getsshkey(data.name);

                    var params = {
                        repo_owner: repo_owner,
                        project_name: project_name,
                        git_address: data.git_address,
                        git_user: data.git_user,
                        git_password: data.git_password,
                        name: data.name,
                        content: dt.content,
                        key_name: dt.name,
                        host: socket.handshake.headers.host.split(':')[0],
                        protocol: socket.handshake.headers.origin.contains('https') ? "https" : "http"
                    };
                    yield git.createDeployKey(params);
                    yield git.createWebhook(params);
                }
            });
        });
        socket.on("sshkey", function(data){
            syncroit(function*() {
                logit('sshkey', data);
                if (data.passcode == SAC || data.sac == SAC) {
                    var args = yield _exec(shelldir + "sshkey_script.sh " + data.name + " " + data.email),
                        code = args[0], output = args[1], message = args[2];

                    logit(message);
                    var pubkey = data.name + '.pub';
                    var path = KEY_PATH + pubkey;
                    var exists = yield fsexists(path);

                    if (!exists) { return; }
                    args = yield fsread(path, 'utf8');
                    var err = args[0], data = args[1];

                    var obj = {error: true, message: err};
                    if (!err) {
                        config.keys.push(pubkey);
                        obj = {content: data, name: pubkey};
                    }
                    socket.emit("showsshkey", obj);

                }
            });
        });
        socket.on("init", function(data){
            syncroit(function *() {
                logit('initializing', data);
                var eobj = {error: false, message: "already initialized"};
                if (nconfig === false || data.passcode == SAC || data.sac == SAC) {
                    nconfig = true;
                    global.SOCKET_PORT = parseInt(data.ws_port);
                    global.HTTP_PORT = parseInt(data.http_port);
                    global.SAC = data.passcode || data.sac;
                    global.HTTP_AUTH_USERNAME = data.http_username;
                    global.HTTP_AUTH_PASSWORD = data.http_password;
                    global.EMAIL = data.email;
                    global.ENV = data.environment;
                    yield writeNodeConfig();
                    var args = yield _exec("echo '" + data.password + "' | sudo -S bash " + shelldir + "initial_script.sh " + data.email + " " + (data.rootdir || "/var") + " $USER"),
                        code = args[0], output = args[1], message = args[2];
                    logit(message);
                    eobj = {error: false};
                }
                socket.emit("initialized", eobj);
            });
        });
        socket.on("getsshkey",function(data){
            syncroit(function *() {
                if (data.passcode != SAC || data.sac != SAC) { return; }

                var dt = yield getsshkey(data.name);
                socket.emit("showsshkey", dt);
            })
        });
    });
});
function _exec (process) {
    return syncroit(function* (){
        var func = function (code, output, message) {
            console.log(message);
            io.emit("process_complete",{code:code,output:output});
            return arguments;
        };
        var exec_it = yieldable(exec);
        var args = yield exec_it(process);
        return func.apply(this,args);
    });
}
function buildit(data){
    return syncroit(function*() {
        logit('deploy', data);
        var appobj = apps.where({name: data.name})[0] || {};
        var name = appobj.name;
        logit(appobj);
        if (data.passcode == SAC && name && actions[data.action]) {
            deploying[name] = true;
            yield _exec("echo \"user is $USER\";");
            var args  = yield _exec(shelldir + "deploy_script.sh " + name + " " + actions[data.action] +
                " " + (appobj.www || "''") +
                " " + (appobj.nodejs || "''") +
                " " + (appobj.webdir || "''") +
                " '" + appobj.servers.join(" ") + "'" +
                " '" + (global.ENV || "prod") + "'");
            console.log(args);
            if ($c.startsWithAny(data.action,"build","pull","npm")) {
                var cproxy_path = CONFIG_BASE_PATH + 'craydent-proxy/pconfig.json';
                var pconfig = $c.include(cproxy_path);
                if (pconfig) {
                    var p = $c.include(GIT_BASE_PATH + name + '/package.json');
                    p = JSON.parseAdvanced(p);
                    var routes = $c.getProperty(p, 'cproxy.routes') || {};
                    pconfig.routes = $c.merge(pconfig.routes, routes);
                    yield fswrite(cproxy_path, JSON.stringify(pconfig, null, 2));
                }

            }
            delete deploying[name];
            return args;
        } else {
            return "Access Denid";
        }
    });
}
function rest_action(self, action, params) {
    return $c.syncroit(function*(){
        params.action = action;
        var args = yield buildit(params),code = args[0], output = args[1];
        self.send(!code ? 200 : 500, {code:code,output:output});
    });
}
// create http server
// the front facing files are in the public folder
var server = $c.createServer(function* (req, res) {
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
    var exists = yield fsexists(path);
    if (!exists) {
        console.log('missing file: ' + path,exists);
        return self.end();
    }
    console.log('file: ' + path);
    var args = yield fsread(path,'utf8'),err = args[0],data = args[1];

    if (err) { return self.end(); }
    return self.end(fillTemplate(data,config));
}).listen(HTTP_PORT);
server.all("/build/${name}/${passcode}", function* (req, res, params) {
    rest_action(this,"build",params);
});
server.all("/backup/${name}/${passcode}", function* (req, res, params) {
    rest_action(this,"backup",params);
});
server.all("/npm/${command}/${name}/${passcode}", function* (req, res, params) {
    rest_action(this,"npm" + params.command,params);
});
server.all("/pull/${name}/${passcode}", function* (req, res, params) {
    rest_action(this,"backup",params);
});
server.all("/pull/${command}/${name}/${passcode}", function* (req, res, params) {
    rest_action(this,"pull" + params.command,params);
});
server.all("/restart/${name}/${passcode}", function* (req, res, params) {
    rest_action(this,"restart",params);
});
server.all("/start/${name}/${passcode}", function* (req, res, params) {
    rest_action(this,"start",params);
});
server.all("/stop/${name}/${passcode}", function* (req, res, params) {
    rest_action(this,"stop",params);
});
server.all("/sync/${name}/${passcode}", function* (req, res, params) {
    rest_action(this,"sync",params);
});

logit('http start on port: ' + HTTP_PORT);


// helper functions
function pollProcess(name) {
    return syncroit(function*() {
        if (!deploying[name]) {
            console.log(yield _exec("ps aux | grep " + name));
        }
    });
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
    return fswrite(CONFIG_PATH + "nodeconfig.js",
            "global.SOCKET_PORT = " + global.SOCKET_PORT +
            ";\nglobal.HTTP_PORT = " + global.HTTP_PORT +
            ";\nglobal.SAC = '" + global.SAC + "';" +
            "\nglobal.HTTP_AUTH_USERNAME = '" + (global.HTTP_AUTH_USERNAME || "admin") + "';" +
            "\nglobal.HTTP_AUTH_PASSWORD = '" + (global.HTTP_AUTH_PASSWORD || "admin") + "';" +
            "\nglobal.EMAIL = '" + (global.EMAIL || "" ) + "';" +
            "\nglobal.ENV = '" + (global.ENV || "prod") + "';");
}
function getsshkey(name){
    return syncroit(function*(){
        var path = KEY_PATH + name;
        var exists = yield fsexists(path);

        if (!exists) { return; }
        var args = yield fsreaddir(path, 'utf8'),
            err = args[0], dt = args[1];
        if (err) {
            return {error: true, message: err};
        }
        return {content: dt,name:name};

    });
}