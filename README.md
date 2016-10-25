<img src="http://craydent.com/JsonObjectEditor/img/svgs/craydent-logo.svg" width=75 height=75/>

# Craydent Deploy 0.3.0 added
**by Clark Inada**

This standalone module is a deployment, continuous integration (CI), and log viewing platform for NodeJS written in node.  This craydent-deploy can be used in conjunction with [craydent-proxy](https://www.npmjs.com/package/@craydent/proxy) and routes can be automatically added when the package.json of the app to be deployed has a configuration properly set.  Craydent-deploy can add git projects and set up CI and allows you to view real-time logs on the server for the added projects.
Craydent-deploy needs to creates a webserver and a websocket server and will require assignable ports.

### Install
Recommended
```shell
$ npm install -g craydent-deploy
$ sudo cdeploy
```

Once installed and configured, the cdeploy command without arguments will restart the craydent-deploy server.  It will also create the following directories:

* /var/craydent/config/ - stores config files for Craydent applications.
* /var/craydent/git/ - stores the original/current git repo files.
* /var/craydent/nodejs/ - stores all the nodejs file for each git repo.
* /var/craydent/log/ - stores the logs for each project.
* /var/craydent/backup/ - stores back up copies for each project.
* /var/craydent/key/ - stores ssh keys created and used by Craydent-deploy.

### CLI

#### Initialize
Usage with arguments (these are defaults or variables) to initialize
```shell
$ sudo cdeploy 'prod' 4900 4800 admin admin /var/craydent/key/master_id_rsa.pub '' '{{git@github.com:craydent/Craydent-Deploy.git}}' '{{Craydent-Deploy}}' 'yes' 'yes' '{{http://www.example.com}}' '{{gituser}}' '{{gitpassword}}'
```

cdeploy initialization can take 14 arguments.  When arguments are missing, the CLI will ask a series of questions to obtain the missing arguments.

1. env tier - dev, stg, prod (or custom name).
2. socket port - port the websocket server will listen on.
3. http port - port the webserver server will listen on.
4. http auth username - username to login with to access the deploy UI (HTTP AUTH).
5. http auth password - password to login with to access the deploy UI (HTTP AUTH).
6. ssh key - path to ssh key or 'create' to create a new key.
7. email - email to send notifications
8. git url - first project to add from a git repo
9. project name - name of the git project
10. yes/no to add webhooks - flag to enable webhook for continuous integration
11. yes/no if the ssh key is already registered in git - if yes, continuous integration will use the key.  if no the key will be added to the git repo
12. the domain pointing to this server - the fully qualified domain name or IP for this server
13. git username - username for the git user able to add webhooks and keys. (this is not stored and used one time)
14. git password - password for the git user able to add webhooks and keys. (this is not stored and used one time)

#### Add Project
Usage with arguments (variables) to add projects
```shell
$ sudo cdeploy add '{{git@github.com:craydent/Craydent-Deploy.git}}' '{{Craydent-Deploy}}' 'yes' 'yes' '{{http://www.example.com}}' '{{gituser}}' '{{gitpassword}}'
```
cdeploy add can take 8 arguments.  When arguments are missing, the CLI will ask a series of questions to obtain the missing arguments.

1. git url - first project to add from a git repo
2. project name - name of the git project
3. yes/no to add webhooks - flag to enable webhook for continuous integration
4. yes/no if the ssh key is already registered in git - if yes, continuous integration will use the key.  if no the key will be added to the git repo
5. the domain pointing to this server - the fully qualified domain name or IP for this server
6. git username - username for the git user able to add webhooks and keys. (this is not stored and used one time)
7. git password - password for the git user able to add webhooks and keys. (this is not stored and used one time)
8. ssh key name to add as a deploy key. (default: is master_id_rsa created when Craydent Deploy was initialized)

#### Project Actions

Usage with arguments (variables) to manually run actions against projects
Available actions:

* backup - Manually create a back up of the project
* build - Build will perform a backup, pull, npminstall, restart, and sync
* npminstall - Performs a fresh npm install on the project
* pull - Performs a git pull on the project
* pullrestart - Performs a pull and restart
* pullsync - Performs a pull and sync
* restart - Performs a stop and start
* rm - Removes a project from Craydent Deploy and all files (Backup is performed before removing and ff there are Craydent Proxy routes, they will be removed as well).
* start - Performs a nohup node on the main NodeJS file
* stop - Kills the process of the project
* sync - Sync performs an rsync on the configured source to destination (typically used when your node application is a web application with a NodeJS backend)

```shell
$ sudo cdeploy backup '{{Craydent-Deploy}}'
```
```shell
$ sudo cdeploy build '{{Craydent-Deploy}}'
```
```shell
$ sudo cdeploy npminstall '{{Craydent-Deploy}}'
```
```shell
$ sudo cdeploy pull '{{Craydent-Deploy}}'
```
```shell
$ sudo cdeploy pullrestart '{{Craydent-Deploy}}'
```
```shell
$ sudo cdeploy pullsync '{{Craydent-Deploy}}'
```
```shell
$ sudo cdeploy restart '{{Craydent-Deploy}}'
```
```shell
$ sudo cdeploy rm '{{Craydent-Deploy}}'
```
```shell
$ sudo cdeploy start '{{Craydent-Deploy}}'
```
```shell
$ sudo cdeploy stop '{{Craydent-Deploy}}'
```
```shell
$ sudo cdeploy sync '{{Craydent-Deploy}}'
```
cdeploy {{action}} requires 1 argument (project name).  When argument is missing, the CLI will ask a for the project name.


If [craydent-proxy](https://www.npmjs.com/package/@craydent/proxy) is installed and there are routes in the package.json of the added project, deploy will automatically add the routes to [craydent-proxy](https://www.npmjs.com/package/@craydent/proxy).  The package.json file must contain a property named "cproxy" and follow the route structure of [craydent-proxy](https://www.npmjs.com/package/@craydent/proxy).
```js
"cproxy":{
    "routes": {
        // these are the domains which the server be requested on 
        "sub.example.com": [{
            // host is the destination to forward the request
            "host": ["localhost"],
            // port is the port to forward on the destination
            "port": ["3000"],
            // verbs are the allowable methods on the destination
            "verbs": ["get", "post", "put", "delete"],
            // refering domains allowed to use this route
            "allow": ["*"],
            // headers are used to overwrite the headers being passed iff it is passed
            "headers": {},
            // destination path prefix
            "path": "/websocket/",
            // request path for this route
            "request_path": "/websocket/*"
            // http authentication
            "http_auth": false
            "http_username": "user",
            "http_password": "password"
        }]
    }
}
```

In addition, the actual configuration for the for the routes can be a reference to a different file.
```js
"cproxy": { "$ref": "../routes.json#/routes_to_add" }
```
This will pull the json object from ../routes.json and use the routes_to_add property.


## Download

 * [GitHub](https://github.com/craydent/Deploy/)
 * [BitBucket](https://bitbucket.org/craydent/deploy)

Craydent-Deploy is released under the [Dual licensed under the MIT or GPL Version 2 licenses](http://craydent.com/license).<br>
