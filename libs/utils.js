/*/---------------------------------------------------------/*/
/*/ Craydent LLC deploy-v1.2.0                              /*/
/*/ Copyright 2011 (http://craydent.com/about)              /*/
/*/ Dual licensed under the MIT or GPL Version 2 licenses.  /*/
/*/ (http://craydent.com/license)                           /*/
/*/---------------------------------------------------------/*/
/*/---------------------------------------------------------/*/
const pkg = require('../package.json'),
	ns = !pkg.name.indexOf('@craydent/') ? "@craydent/" : "";

const $c = require(ns + 'craydent/noConflict');
const fs = require('fs'), fswrite = $c.yieldable(fs.writeFile,fs);
const CONFIG_PATH = "/var/craydent/config/craydent-deploy/",
	APP_CONFIG = CONFIG_PATH + "craydent_deploy_config.json",
	NODE_CONFIG = "nodeconfig.js";

function encrypt_password(str) {
	var hex = "0123456789abcdef", salt = "";
	while (salt.length < 32) { salt += hex[parseInt($c.rand(0,hex.length))]; }
	return $c.md5(str + salt) + salt;
}
function correct_password(guess, str) {
	str = str || "";
	var salt = str.slice(-32);
	return $c.md5(guess + salt) + salt == str;
}
function authorized (b64, section) {
	var buf = new Buffer(b64, 'base64'),
		plain_auth = buf.toString(),
		creds = plain_auth.split(':'),
		username = creds[0],
		password = creds[1],
		auth = global.HTTP_AUTH;
	if (!auth[username] || section && !~auth[username].access.indexOf('*') && !~auth[username].access.indexOf(LISTENERS[section])) {
		return false;
	}
	if (!correct_password(password, auth[username].password)) {
		return false;
	}
	return true;
}
function writeNodeConfig(config) {
	config = config || {};
	var path = $c.isString(config) ? config : (config.path || CONFIG_PATH);
	return fswrite(path + NODE_CONFIG,
		"global.SOCKET_PORT = " + (config.sport || global.SOCKET_PORT) +
		";\nglobal.HTTP_PORT = " + (config.hport || global.HTTP_PORT) +
		";\nglobal.SAC = '" + (config.scuid || global.SAC) + "';" +
		"\nglobal.HTTP_AUTH = " + JSON.stringify(global.HTTP_AUTH) + ";" +
		"\nglobal.EMAIL = '" + (config.email || global.EMAIL || "" ) + "';" +
		"\nglobal.EMAIL2 = '" + (config.email2 || global.EMAIL2 || "" ) + "';" +
		"\nglobal.ENV = '" + (config.env || global.ENV || "prod") + "';" +
		"\nglobal.FQDN = '" + (config.fqdn || global.FQDN) + "';" +
		"\nglobal.INTERVAL = " + (config.interval || global.INTERVAL || 30000) + ";" +
		"\nglobal.EMAIL_INTERVAL = " + (config.einterval || global.EMAIL_INTERVAL || 3600000) + ";" +
		"\nglobal.SENDER = '" + (config.sender || global.SENDER || "") + "';" +
		"\nglobal.SMTP = '" + (config.smtp || global.SMTP || "") + "';" +
		"\nglobal.AWSACCESSKEY = '" + (config.awskey || global.AWSACCESSKEY || "") + "';" +
		"\nglobal.AWSSECRETKEY = '" + (config.awssecret || global.AWSSECRETKEY || "") + "';" +
		"\nglobal.MONGO_URI = '" + (config.mongouri || global.MONGO_URI || "") + "';");
}
function writeAppConfig(apps) {
	return fswrite(APP_CONFIG, JSON.stringify(apps, null, 2));
}
module.exports = {
	encrypt_password: encrypt_password,
	correct_password: correct_password,
	authorized: authorized,
	writeNodeConfig: writeNodeConfig,
	writeAppConfig: writeAppConfig
};