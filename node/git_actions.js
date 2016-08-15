/*/---------------------------------------------------------/*/
/*/ Craydent LLC deploy-v0.1.7                              /*/
/*/ Copyright 2011 (http://craydent.com/about)              /*/
/*/ Dual licensed under the MIT or GPL Version 2 licenses.  /*/
/*/ (http://craydent.com/license)                           /*/
/*/---------------------------------------------------------/*/
/*/---------------------------------------------------------/*/
function createDeployKey(data) {
	if ($c.contains(data.git_address,'git@github.com')) {
		return $c.ajax({
			url: "https://api.github.com/repos/" + data.repo_owner + "/" + data.project_name + "/keys",
			headers: {
				'Authorization': 'Basic ' + new Buffer(data.git_user + ":" + data.git_password).toString('base64'),
				'Content-Type': 'application/json',
				'User-Agent': data.repo_owner + "-" + data.project_name
			},
			method: "POST",
			data: {"title": data.key_name, "key": data.content, "read_only": true},
			onsuccess: function (data) {
				console.log(data);
			}
		});
	} else if ($c.contains(data.git_address,'git@bitbucket.org')) {
		return $c.ajax({
			url: "https://api.bitbucket.org/1.0/repositories/" + data.repo_owner + "/" + data.project_name + "/deploy-keys",
			headers: {
				'Authorization': 'Basic ' + new Buffer(data.git_user + ":" + data.git_password).toString('base64'),
				'Content-Type': 'application/json',
				'User-Agent': data.repo_owner + "-" + data.project_name
			},
			method: "POST",
			data: {"label": data.key_name, "key": data.content},
			onsuccess: function (data) {
				console.log(data);
			}
		});
	}
}
function createWebhook(data) {
	var url = data.protocol + "://" + data.host + ":" + global.HTTP_PORT + "/build/" + data.name + "/" + global.SAC;
	if ($c.contains(data.git_address,'git@github.com')) {
		return $c.ajax({
			url: "https://api.github.com/repos/" + data.repo_owner + "/" + data.project_name + "/hooks",
			headers: {
				'Authorization': 'Basic ' + new Buffer(data.git_user + ":" + data.git_password).toString('base64'),
				'Content-Type': 'application/json',
				'User-Agent': data.repo_owner + "-" + data.project_name
			},
			method: "POST",
			data: {
				name: "web",
				config: {url: url, content_type: "json"},
				events: ["push", "pull_request"],
				active: true
			},
			onsuccess: function (data) {
				console.log(data);
			}
		});
	} else if ($c.contains(data.git_address,'git@bitbucket.org')) {
		return $c.ajax({
			url: "https://api.bitbucket.org/2.0/repositories/" + data.repo_owner + "/" + data.project_name + "/hooks",
			headers: {
				'Authorization': 'Basic ' + new Buffer(data.git_user + ":" + data.git_password).toString('base64'),
				'Content-Type': 'application/json',
				'User-Agent': data.repo_owner + "-" + data.project_name
			},
			method: "POST",
			data: {
				description: "Webhook for Craydent Deploy - " + data.name,
				url: url,
				events: ["repo:push", "pullrequest:fulfilled"],
				active: true
			},
			onsuccess: function (data) {
				console.log(data);
			}
		});
	}
}
module.exports = {createWebhook:createWebhook,createDeployKey,createDeployKey};
