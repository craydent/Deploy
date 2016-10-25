var routes = {
	"routes": {
		"${domain}": [{
			"host": ["localhost"],
			"port": ["4900"],
			"verbs": ["get", "post", "put", "delete"],
			"allow": ["*"],
			"headers": {},
			"path": "/socket.io/",
			"request_path": "/socket.io/*",
			"domain": "${domain}",
			"http_auth": false
		}, {
			"host": ["craydent.com"],
			"port": ["80"],
			"verbs": ["get", "post", "put", "delete"],
			"allow": ["*"],
			"headers": {},
			"path": "/JsonObjectEditor/",
			"request_path": "/JsonObjectEditor/*",
			"domain": "${domain}",
			"http_auth": false
		}, {
			"host": ["localhost"],
			"port": ["4900"],
			"verbs": ["get", "post", "put", "delete"],
			"allow": ["*"],
			"headers": {},
			"path": "/",
			"request_path": "/:4900/*",
			"domain": "${domain}",
			"http_auth": false
		}, {
			"host": ["localhost"],
			"port": ["4800"],
			"verbs": ["get", "post", "put", "delete"],
			"allow": ["*"],
			"headers": {},
			"path": "/",
			"request_path": "/*",
			"domain": "${domain}",
			"http_auth": false
		}]
	}
};