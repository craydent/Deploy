/*/---------------------------------------------------------/*/
/*/ Craydent LLC deploy-v1.1.0                              /*/
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
const pkg = require('./package.json'),
    ns = !pkg.name.indexOf('@craydent/') ? "@craydent/" : "";

require(ns + 'craydent/global');

$c.DEBUG_MODE = true;

const CL = new CLI({});
CL
    .add({
        option: "-s,--socketport",
        type:"number",
        description:"Port number for the socket server to listen on"
    })
    .add({
        option: "-h,httpport",
        type:"number",
        description:"Port number for the web server to listen on"
    })
    .add({
        option: "-c,--cuid",
        type:"string",
        description:"Token/cuid to use for admin rights to API and web interface"
    })
    .add({
        option: "-u,--httpuser",
        type:"string",
        description:"Username for http authentication"
    })
    .add({
        option: "-p,--httppassword",
        type:"string",
        description:"Password for http authentication"
    })
    .add({
        option: "-e,--environment",
        type:"string",
        description:"Environment for the current server"
    })
    .add({
        option: "-x,--basepath",
        type:"string",
        description:"Base path of cdeploy"
    });

CL.validate();


const BASE_PATH = CL.basepath || "/var/craydent/";
const GIT_BASE_PATH = BASE_PATH + "git/";
const CONFIG_BASE_PATH = BASE_PATH + "config/";
const PROJECT_PATH = BASE_PATH + "nodejs/craydent-deploy/";
const CONFIG_PATH = BASE_PATH + "config/craydent-deploy/";
const LOG_BASE_PATH = BASE_PATH + "log/";
const LOG_PATH = LOG_BASE_PATH + "/craydent-deploy/";
const KEY_PATH = BASE_PATH + "key/";
const LISTENERS = include('./config/listeners.json',true);


const CPROXY_PATH = CONFIG_BASE_PATH + 'craydent-proxy/pconfig.json';
var pconfig = include(CPROXY_PATH, true);

var fs = require('fs');
var git = require('./libs/git_actions');
var utils = require('./libs/utils'),
    writeNodeConfig = utils.writeNodeConfig,
    encrypt_password = utils.encrypt_password,
    correct_password = utils.correct_password,
    authorized = utils.authorized;

var actions = include('./config/actions.json',true),
    deploying = {},
    apps = include(CONFIG_PATH + 'craydent_deploy_config.json',true),
    nconfig = include(CONFIG_PATH + 'nodeconfig.js',true),
    shelldir = __dirname + '/shell_scripts/',
    fswrite = yieldable(fs.writeFile,fs),
    fsreaddir = yieldable(fs.readdir,fs),
    fsread = yieldable(fs.readFile,fs),
    fsexists = yieldable(fs.exists,fs),
    fsopen = yieldable(fs.open,fs),
    fsstat = yieldable(fs.stat,fs),
    config = {apps:apps,keys:["master_id_rsa"],deploying:deploying},
    io;
var cb = function(event_type, filename){
    try {
        if (event_type == "change") {

            filename == 'nodeconfig.js' ?
                (nconfig = include(CONFIG_PATH + 'nodeconfig.js',true)) :
                (apps = include(CONFIG_PATH + 'craydent_deploy_config.json',true)) ;
        } else if (event_type == "rename") {
            if (filename == 'nodeconfig.js') {
                try {
                    nwatcher && nwatcher.close();
                    nwatcher = fs.watch(CONFIG_PATH + 'nodeconfig.js', cb);
                } catch (e) {
                    e.errno == "ENOENT" ? flog(CONFIG_PATH + "nodeconfig.js not found") : flog(e);
                }
            } else {
                try {
                    cwatcher && cwatcher.close();
                    cwatcher = fs.watch(CONFIG_PATH + 'craydent_deploy_config.json', cb);
                } catch (e) {
                    e.errno == "ENOENT" ? flog(CONFIG_PATH + "craydent_deploy_config.json not found") : flog(e);
                }
            }
        }
    } catch (e) {
        flog(e);
    }
}, nwatcher, cwatcher;
try { nwatcher = fs.watch(CONFIG_PATH + 'nodeconfig.js', cb); } catch (e) {e.errno == "ENOENT" ? flog(CONFIG_PATH + "nodeconfig.js not found") : flog(e); }
try { cwatcher = fs.watch(CONFIG_PATH + 'craydent_deploy_config.json', cb); } catch (e) {e.errno == "ENOENT" ? flog(CONFIG_PATH + "craydent_deploy_config.json not found") : flog(e); }

syncroit(function *(){
    if (!config.apps) {
        config.apps = [{
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
        yield fswrite(CONFIG_PATH + "craydent_deploy_config.json", JSON.stringify(config.apps, null, 2));
    }
    config.apps = apps;

    global.SOCKET_PORT = CL.socketport || global.SOCKET_PORT || 4900;
    global.HTTP_PORT = CL.httpport || global.HTTP_PORT || 4800;
    global.SAC = CL.cuid || global.SAC;
    global.ENV = CL.environment || global.ENV || "prod";
    global.HTTP_AUTH = global.HTTP_AUTH || {};
    var usernames = (CL.httpuser || "admin").split(','),
        passwords = (CL.httppassword || "admin").split(',');
    for (var i = 0, len = usernames.length; i < len; i++) {
        global.HTTP_AUTH[usernames[i]] = global.HTTP_AUTH[usernames[i]] || { "access": ['*'] };
        global.HTTP_AUTH[usernames[i]].password = encrypt_password(passwords[i]);
    }

    if (nconfig === false) {
        global.SAC = global.SAC || cuid();
        yield writeNodeConfig(CONFIG_PATH);
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
    for (var i = 0, len = config.apps.length; i < len; i++) {
        start_app(config.apps[i]);
    }
    io.on('connection', function (socket) {
        logit('connection made');
        socket.on(LISTENERS['deploy'], function(data){
            syncroit(function*(){
                var args = yield buildit(data), code = args[0], output = args[1], message = args[2];

                io.emit("process_complete",{code:code,output:output});
            });
        });
        socket.on(LISTENERS["addgit"], function(data){
            syncroit(function*() {
                logit('gitadd', data);
                if (data.passcode == SAC || data.sac == SAC) {
                    config.apps = include(CONFIG_PATH + 'craydent_deploy_config.json', true) || config.apps;
                    var appobj = config.apps.where({name: data.name})[0];
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
                    config.apps.push({
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
                    yield fswrite(CONFIG_PATH + "craydent_deploy_config.json", JSON.stringify(config.apps, null, 2));

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
                    yield git.createWebhook(params, pconfig);
                }
            });
        });
        socket.on(LISTENERS["addssh"], function(data){
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
        socket.on(LISTENERS["init"], function(data){
            syncroit(function *() {
                logit('initializing', data);
                var eobj = {error: false, message: "already initialized"};
                if (nconfig === false || data.passcode == SAC || data.sac == SAC) {
                    nconfig = true;
                    global.SOCKET_PORT = parseInt(data.ws_port);
                    global.HTTP_PORT = parseInt(data.http_port);
                    global.SAC = data.passcode || data.sac;
                    //global.HTTP_AUTH_USERNAME = data.http_username || "admin";
                    //global.HTTP_AUTH_PASSWORD = data.http_password || "admin";

                    global.HTTP_AUTH = global.HTTP_AUTH || {};
                    var usernames = (data.http_username || "admin").split(','),
                        passwords = (data.http_password || "admin").split(',');
                    for (var i = 0, p = 0, len = usernames.length; i < len; i++) {
                        global.HTTP_AUTH[usernames[i]] = global.HTTP_AUTH[usernames[i]] || { "access": ['*'] };
                        global.HTTP_AUTH[usernames[i]].password = encrypt_password(passwords[p++] || passwords[p--,--p]);
                    }

                    global.EMAIL = data.email;
                    global.ENV = data.environment;
                    yield writeNodeConfig(CONFIG_PATH);
                    var args = yield _exec("echo '" + data.password + "' | sudo -S bash " + shelldir + "initial_script.sh " + data.email + " " + (data.rootdir || "/var") + " $USER"),
                        code = args[0], output = args[1], message = args[2];
                    logit(message);
                    eobj = {error: false};
                }
                socket.emit("initialized", eobj);
            });
        });
        socket.on(LISTENERS["getssh"],function(data){
            syncroit(function *() {
                if (data.passcode != SAC || data.sac != SAC) { return; }

                var dt = yield getsshkey(data.name);
                socket.emit("showsshkey", dt);
            })
        });
        socket.on(LISTENERS["adduser"],function(data){
            socket.emit("addadminuser", add_admin_user(data));
        });
        socket.on(LISTENERS["removeuser"],function(data){
            socket.emit("removeadminuser", rm_admin_user(data));
        });
        socket.on(LISTENERS["updatepassword"],function(data){
            socket.emit("updateadminpassword", update_admin(data));
        });
    });
    init_webserver();
});
function flog(){
    var prefix = $c.now('M d H:i:s')+' PID[' + process.pid + ']: ';
    for (var i = 0, len = arguments.length; i < len; i++) {
        if ($c.isString(arguments[i])) { console.log(prefix + arguments[i]); }
        else { console.log(prefix, arguments[i]); }
    }
}
function _exec (process) {
    return syncroit(function* (){
        var func = function (code, output, message) {
            flog(message);
            io.emit("process_complete",{code:code,output:output});
            return arguments;
        };
        var args = yield CL.exec(process);
        return func.apply(this,args);
    });
}
function buildit(data){
    return syncroit(function*() {
        logit('deploy', data);
        config.apps = include(CONFIG_PATH + 'craydent_deploy_config.json', true);
        var appobj = config.apps.where({name: data.name})[0] || {};
        var name = appobj.name;
        if (data.passcode == SAC && name && actions[data.action]) {
            deploying[name] = true;
            yield _exec("echo \"user is $USER\";");
            var args  = yield _exec(shelldir + "deploy_script.sh " + name + " " + actions[data.action] +
                " " + (appobj.www || "''") +
                " " + (appobj.nodejs || "''") +
                " " + (appobj.webdir || "''") +
                " '" + appobj.servers.join(" ") + "'" +
                " '" + (global.ENV || "prod") + "'");

            if ($c.startsWithAny(data.action,"build","pull","npm")) {
                if (pconfig = include(CPROXY_PATH, true)) {
                    var p = include(GIT_BASE_PATH + name + '/package.json',true);
                    p = JSON.parseAdvanced(p,null,null,GIT_BASE_PATH + name);
                    var routes = $c.getProperty(p, 'cproxy.routes') || {};
                    for (var fqdn in routes) {
                        if (!routes.hasOwnProperty(fqdn)) { continue; }
                        pconfig.routes[fqdn] = pconfig.routes[fqdn] || [];
                        $c.upsert(pconfig.routes[fqdn], routes[fqdn], "name");
                    }
                    yield fswrite(CPROXY_PATH, JSON.stringify(pconfig, null, 2));
                }

            }
            delete deploying[name];
            logit('build complete.');
            return args;
        } else {
            return [500,"Access Denied"];
        }
    });
}
function rest_action(self, action, params) {
    return syncroit(function*(){
        params.action = action;
        if (params.webhook) {
            buildit(params);
            self.send(200, {message:"build request received."});
            return;
        }
        var args = yield buildit(params),code = args[0], output = args[1];
        self.send(!code ? 200 : 500, {code:code,output:output});
    });
}
function add_admin_user (data) {
    var auth = global.HTTP_AUTH;
    if (auth[data.username]) { return {error:true,message:"user already exists."}; }
    if (data.passcode != SAC || data.sac != SAC
    || (!~auth[data.username].access.indexOf('*') && !~auth[data.username].access.indexOf(LISTENERS["adduser"]))) {
        return {error:true,message:"you do not have sufficient access."};
    }
    //if (!~global.HTTP_AUTH_USERNAME.indexOf(data.username)) { return {error:true,message:"user already exists."}; }
    auth[data.username] = { "access": (data.access || "").split(','), "password": encrypt_password(data.password) };
    writeNodeConfig(CONFIG_PATH);
    return {error: false,message:"successfully added user."}
}
function rm_admin_user (data) {
    var auth = global.HTTP_AUTH;
    if (!auth[data.username]) { return {error:true,message:"user does not exist."}; }
    if (data.passcode != SAC || data.sac != SAC
    || (!~auth[data.username].access.indexOf('*') && !~auth[data.username].access.indexOf(LISTENERS["removeuser"]))) {
        return {error:true,message:"you do not have sufficient access."};
    }
    delete auth[data.username];
    writeNodeConfig(CONFIG_PATH);
    return {error: false,message:"successfully removed user."}
}
function update_admin (data) {
    var auth = global.HTTP_AUTH;
    if (!auth[data.username]) { return {error:true,message:"user does not exist."}; }
    if (data.passcode != SAC || data.sac != SAC
        || (!~auth[data.username].access.indexOf('*') && !~auth[data.username].access.indexOf(LISTENERS["updateuser"]))) {
        return {error:true,message:"you do not have sufficient access."};
    }
    if (!correct_password(data.old_password, auth[data.username])) { return {error:true,message:"password does not match"}}
    auth[data.username].password = encrypt_password(data.password);
    auth[data.username].access = (data.access ? data.access.split(',') : auth[data.username].access) || [];
    writeNodeConfig(CONFIG_PATH);
    return {error: false,message:"successfully updated password."}
}
// create http server
// the front facing files are in the public folder
function init_webserver() {
    var server = createServer(function* (req, res) {
        var self = this,
            path = self.SERVER_PATH,
            hauth = req.headers['authorization'],
            auth_header = 'WWW-Authenticate: Basic realm="Deployer Secure Area"';
        if (path.contains('?')) {
            path = path.split('?')[0];
        }
        if (path.endsWith('/')) {
            path += "index.html";
        }
        path = (path.startsWith('/') ? PROJECT_PATH + "public" : PROJECT_PATH + "public/") + path;
        path.endsWith('.html') && self.header("Content-Type: text/html");

        if (!self.SERVER_PATH.contains(global.SAC) && path.endsWith('.html')) {
            if (!hauth) {     // No Authorization header was passed in so it's the first time the browser hit us
                self.header(auth_header);
                return self.end(401, '<html><body>You are trying to access a secure area.  Please login.</body></html>');
            }

            var encoded = hauth.split(' ')[1];   // Split on a space, the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part

            var index, not_authorized = '<html><body>You are not authorized to access this page</body></html>';
            if (!authorized(encoded)) {
                self.header(auth_header);
                self.end(401, not_authorized);
            }
        }
        var exists = yield fsexists(path);
        if (!exists) {
            flog('missing file: ' + path, exists);
            return self.end();
        }
        flog('file: ' + path);
        var args = yield fsread(path, 'utf8'), err = args[0], data = args[1];

        if (err) {
            return self.end();
        }
        return self.end(fillTemplate(data, config));
    }).listen(global.HTTP_PORT);
    server.all("/build/${name}/${passcode}", function* (req, res, params) {
        return yield rest_action(this, "build", params);
    });
    server.all("/backup/${name}/${passcode}", function* (req, res, params) {
        return yield rest_action(this, "backup", params);
    });
    server.all("/npm/${command}/${name}/${passcode}", function* (req, res, params) {
        return yield rest_action(this, "npm" + params.command, params);
    });
    server.all("/pull/${name}/${passcode}", function* (req, res, params) {
        return yield rest_action(this, "pull", params);
    });
    server.all("/pull/${command}/${name}/${passcode}", function* (req, res, params) {
        return yield rest_action(this, "pull" + params.command, params);
    });
    server.all("/restart/${name}/${passcode}", function* (req, res, params) {
        return yield rest_action(this, "restart", params);
    });
    server.all("/start/${name}/${passcode}", function* (req, res, params) {
        return yield rest_action(this, "start", params);
    });
    server.all("/stop/${name}/${passcode}", function* (req, res, params) {
        return yield rest_action(this, "stop", params);
    });
    server.all("/sync/${name}/${passcode}", function* (req, res, params) {
        return yield rest_action(this, "sync", params);
    });
    server.all("/admin/user/add/${passcode}/${username}/${password}", function* (req, res, params) {
        return add_admin_user(params);
    });
    server.all("/admin/user/remove/${passcode}/${username}", function* (req, res, params) {
        return rm_admin_user(params);
    });
    server.all("/admin/password/update/${passcode}/${username}/${old_password}/${password}", function* (req, res, params) {
        return update_admin(params);
    });
    logit('http start on port: ' + global.HTTP_PORT);
}


// helper functions
function pollProcess(name) {
    return syncroit(function*() {
        if (!deploying[name]) {
            flog(yield _exec("ps aux | grep " + name));
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