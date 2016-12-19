<img src="http://craydent.com/JsonObjectEditor/img/svgs/craydent-logo.svg" width=75 height=75/>

# Craydent Deploy 1.1.0
**by Clark Inada**

This standalone module is a deployment, continuous integration (CI), and log viewing platform for NodeJS written in node.  This craydent-deploy can be used in conjunction with [craydent-proxy](https://www.npmjs.com/package/craydent-proxy) and routes can be automatically added when the package.json of the app to be deployed has a configuration properly set.  Craydent-deploy can add git projects and set up CI and allows you to view real-time logs on the server for the added projects.
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

#### Version

```shell
$ sudo cdeploy version;

$ sudo cdeploy --version;

$ sudo cdeploy -v;
```

cdeploy version takes no arguments.  This will output the current verion of Craydent Deploy.

#### Initialize
Usage with arguments (these are defaults or variables) to initialize
```shell
$ sudo cdeploy 'prod' 4900 4800 admin admin /var/craydent/key/master_id_rsa.pub '' '{{git@github.com:craydent/Craydent-Deploy.git or skip}}' '{{Craydent-Deploy}}' 'yes' 'yes' '{{http://www.example.com}}' '{{gituser}}' '{{gitpassword}}'

$ sudo cdeploy -e 'prod' -s 4900 -h 4800 -u admin -p admin -k /var/craydent/key/master_id_rsa.pub -m '' -a '{{git@github.com:craydent/Craydent-Deploy.git or skip}}' -n '{{Craydent-Deploy}}' -w 'yes' -r 'yes' -f '{{http://www.example.com}}' -g '{{gituser}}' -i '{{gitpassword}}'

$ sudo cdeploy --environment 'prod' --socketport 4900 --hostport 4800 --httpuser admin --httppassword admin --sshkey /var/craydent/key/master_id_rsa.pub --email '' --gitaddress '{{git@github.com:craydent/Craydent-Deploy.git or skip}}' --name '{{Craydent-Deploy}}' --use-webhook 'yes' --sshkey-exists 'yes' --fqdn '{{http://www.example.com}}' --gituser '{{gituser}}' --gitpassword '{{gitpassword}}'
```

cdeploy initialization can take 14 arguments.  When arguments are missing, the CLI will ask a series of questions to obtain the missing arguments.

1. env tier - dev, stg, prod (or custom name).
2. socket port - port the websocket server will listen on.
3. http port - port the webserver server will listen on.
4. http auth username - username to login with to access the deploy UI (HTTP AUTH).
5. http auth password - password to login with to access the deploy UI (HTTP AUTH).
6. ssh key - path to ssh key or 'create' to create a new key.
7. email - email to send notifications
8. git url - first project to add from a git repo or 'skip' to skip this step
9. project name - name of the git project
10. yes/no to add webhooks - flag to enable webhook for continuous integration
11. yes/no if the ssh key is already registered in git - if yes, continuous integration will use the key.  if no the key will be added to the git repo
12. the domain pointing to this server - the fully qualified domain name or IP for this server
13. git username - username for the git user able to add webhooks and keys. (this is not stored and used one time)
14. git password - password for the git user able to add webhooks and keys. (this is not stored and used one time)

#### Reset

```shell
$ sudo cdeploy reset
```

cdeploy reset takes no arguments.  This will remove configuration/log files and reset the state to a freshly installed state.

#### Uninstall

```shell
$ sudo cdeploy uninstall
```

cdeploy uninstall takes no arguments.  This will remove configuration/log files and and uninstalled the global module but leave all projects that were added.

#### Add Project
Usage with arguments (variables) to add projects
```shell
$ sudo cdeploy add '{{git@github.com:craydent/Craydent-Deploy.git}}' '{{Craydent-Deploy}}' 'yes' 'yes' '{{gituser}}' '{{gitpassword}}' /var/craydent/key/master_id_rsa.pub

$ sudo cdeploy add -a '{{git@github.com:craydent/Craydent-Deploy.git}}' -n '{{Craydent-Deploy}}' -w 'yes' -r 'yes' -g '{{gituser}}' -i '{{gitpassword}}' -k /var/craydent/key/master_id_rsa.pub

$ sudo cdeploy add --gitaddress '{{git@github.com:craydent/Craydent-Deploy.git}}' --name '{{Craydent-Deploy}}' --use-webhook 'yes' --use-sshkey 'yes' --gituser '{{gituser}}' --gitpassword '{{gitpassword}}' --sshkey /var/craydent/key/master_id_rsa.pub
```
cdeploy add can take 8 arguments.  When arguments are missing, the CLI will ask a series of questions to obtain the missing arguments.

1. git url - first project to add from a git repo
2. project name - name of the git project
3. yes/no to add webhooks - flag to enable webhook for continuous integration
4. yes/no if the ssh key is already registered in git - if yes, continuous integration will use the key.  if no the key will be added to the git repo
5. git username - username for the git user able to add webhooks and keys. (this is not stored and used one time)
6. git password - password for the git user able to add webhooks and keys. (this is not stored and used one time)
7. ssh key name to add as a deploy key. (default: is master_id_rsa created when Craydent Deploy was initialized)

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
* rm - Removes a project from Craydent Deploy and all files (Backup is performed before removing and if there are Craydent Proxy routes, they will be removed as well).
* start - Performs a nohup node on the main NodeJS file
* stop - Kills the process of the project
* sync - Sync performs an rsync on the configured source to destination (typically used when your node application is a web application with a NodeJS backend)

```shell
$ sudo cdeploy backup '{{Project Name}}'

$ sudo cdeploy backup -n '{{Project Name}}'

$ sudo cdeploy backup --name '{{Project Name}}'
```
```shell
$ sudo cdeploy build '{{Project Name}}'

$ sudo cdeploy build -n '{{Project Name}}'

$ sudo cdeploy build --name '{{Project Name}}'
```
```shell
$ sudo cdeploy npminstall '{{Project Name}}'

$ sudo cdeploy npminstall -n '{{Project Name}}'

$ sudo cdeploy npminstall --name '{{Project Name}}'
```
```shell
$ sudo cdeploy pull '{{Project Name}}'

$ sudo cdeploy pull -n '{{Project Name}}'

$ sudo cdeploy pull --name '{{Project Name}}'
```
```shell
$ sudo cdeploy pullrestart '{{Project Name}}'

$ sudo cdeploy pullrestart -n '{{Project Name}}'

$ sudo cdeploy pullrestart --name '{{Project Name}}'
```
```shell
$ sudo cdeploy pullsync '{{Project Name}}'

$ sudo cdeploy pullsync -n '{{Project Name}}'

$ sudo cdeploy pullsync --name '{{Project Name}}'
```
```shell
$ sudo cdeploy restart '{{Project Name}}'

$ sudo cdeploy restart '{{Project Name}}'

$ sudo cdeploy restart --name '{{Project Name}}'
```
```shell
$ sudo cdeploy rm '{{Project Name}}'

$ sudo cdeploy rm -n '{{Project Name}}'

$ sudo cdeploy rm --name '{{Project Name}}'
```
```shell
$ sudo cdeploy start '{{Project Name}}'

$ sudo cdeploy start -n '{{Project Name}}'

$ sudo cdeploy start --name '{{Project Name}}'
```
```shell
$ sudo cdeploy stop '{{Project Name}}'

$ sudo cdeploy stop -n '{{Project Name}}'

$ sudo cdeploy stop --name '{{Project Name}}'
```
```shell
$ sudo cdeploy sync '{{Project Name}}'

$ sudo cdeploy sync -n '{{Project Name}}'

$ sudo cdeploy sync --name '{{Project Name}}'
```
cdeploy {{action}} requires 1 argument (project name).  When argument is missing, the CLI will ask a for the project name.

REST equivalents

```
/backup/{{Project Name}}/{{passcode} }
```
```
/build/{{Project Name}}/{{passcode} }
```
```
/npm/{{command}}/{{Project Name}}/{{passcode} }
```
```
/pull/{{Project Name}}/{{passcode} }
```
```
/pull/{{command}}/{{Project Name}}/{{passcode} }
```
```
/restart/{{Project Name}}/{{passcode} }
```
```
/rm/{{Project Name}}/{{passcode} }
```
```
/start/{{Project Name}}/{{passcode} }
```
```
/stop/{{Project Name}}/{{passcode} }
```
```
/sync/{{Project Name}}/{{passcode} }
```
 
#### Add HTTP User

```shell
$ sudo cdeploy adduser '{{username}}' '{{password}}' '{{access level}}'

$ sudo cdeploy adduser -u '{{username}}' -p '{{password}}' -l '{{access level}}'

$ sudo cdeploy adduser --user '{{username}}' --password '{{password}}' --access '{{access level}}'
```

cdeploy adduser can take up to 3 arguments.

1. *username - username to add. (-u,--user)
2. *password - password for the username. (-p,--password)
3. access - access level for the username. (-l,--access)

REST equivalents

```
/admin/user/add/{{passcode}}/{{username}}/{{password} }
```

#### Remove HTTP User

```shell
$ sudo cdeploy rmuser '{{username}}'

$ sudo cdeploy rmuser -u '{{username}}'

$ sudo cdeploy rmuser -user '{{username}}'
```

cdeploy rmuser takes 1 argument.
                               
1. *username - username to remove. (-u,--user)

REST equivalents

```
/admin/user/remove/{{passcode}}/{{username}}/{{password}} 
```

#### Update HTTP User

```shell
$ sudo cdeploy updateuser '{{username}}' '{{password}}' '{{access level}}'

$ sudo cdeploy updateuser -u '{{username}}' -p '{{password}}' -l '{{access level}}'

$ sudo cdeploy updateuser --user '{{username}}' --password '{{password}}' --access '{{access level}}'
```

deploy updateuser can take up to 3 arguments.

1. *username - username to add. (-u,--user)
2. *password - password for the username. (-p,--password)
3. access - access level for the username. (-l,--access)

REST equivalents

```
/admin/password/update/{{passcode}}/{{username}}/{{password}}
```


If [craydent-proxy](https://www.npmjs.com/package/craydent-proxy) is installed and there are routes in the package.json of the added project, deploy will automatically add the routes to [craydent-proxy](https://www.npmjs.com/package/craydent-proxy).  The package.json file must contain a property named "cproxy" and follow the route structure of [craydent-proxy](https://www.npmjs.com/package/craydent-proxy).
```js
"cproxy":{
    "routes": {
        // these are the domains which the server be requested on 
        "sub.example.com": [{
            // name is the identifier of the route and must be unique
            "name": "unique name identifier"
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
 * [GitLab](https://gitlab.com/craydent/deploy)

Craydent-Deploy is released under the [Dual licensed under the MIT or GPL Version 2 licenses](http://craydent.com/license).<br>
