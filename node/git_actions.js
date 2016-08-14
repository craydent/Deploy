
function createDeployKey(data) {
	if (data.git_address.contains('git@github.com')) {
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
	} else if (data.git_address.contains('git@bitbucket.org')) {
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
	var url = data.protocol + "://" + data.host + ":" + GLOBAL.HTTP_PORT + "/build/" + data.name + "/" + GLOBAL.SAC;
	if (data.git_address.contains('git@github.com')) {
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
	} else if (data.git_address.contains('git@bitbucket.org')) {
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
