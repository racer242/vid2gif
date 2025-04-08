var resolver = require('dns');
var https = require("https");
var http = require('http');
var ConfigResolvers = require('./resolvers.js');

var PublicIpAddress = function PublicIpAddress() {

    this.parse_google_result = function (result) {
        try {
            var splitted = result[1][0].split(" ");
            var ret = splitted[1].split("/")[0];
            return ret
        } catch (error) {
            return null;
        }
    };

    this.performDnsQuery = function (settings, version, callback) {
        var type = settings[version].dnsQuery.type;
        resolver.setServers([settings[version].dnsServer1, settings[version].dnsServer2]);
        resolver.resolve(settings[version].dnsQuery.name, type, function (err, addresses) {
                callback(err, addresses);
                return;
        });
    };

    this.getPublicIpFromService = function (callback, service) {
        var version = "v4";
        var str = ''
        var options = ConfigResolvers.http_params[version]["http"]
        options["headers"] = {"Host": options["host"]}
        var req = http.request(options, function (response) {
            response.on('error', function (error) {
                callback(error, str);
                return;
            });
            response.on('data', function (chunk) {
                str += chunk;
            });
            response.on('end', function () {
                callback(null, str);
              });
        })
        req.end();
    };

    this.getPublicIpFromOpenDns = function (callback) {
        var version = "v4";
        this.performDnsQuery(ConfigResolvers.opendns_params, version, callback);
    };

    this.getPublicIpFromGoogleDns = function (callback) {
        var version = "v4";
        this.performDnsQuery(ConfigResolvers.googledns_params, version, function (err, addresses) {
            var parsed_result = this.parse_google_result(addresses);
            if (err && !parsed_result) {
                callback(err, null);
            } else {
                callback(null, parsed_result);
            }
        });
    };

    this.getPublicIpFromHTTPS = function (callback) {
        this.getPublicIpFromService(callback, "https");
    };

    this.getPublicIpFromHTTP = function (callback) {
        this.getPublicIpFromService(callback, "http");
    };

    this.getPublicIpFrom = function (service, callback) {
        this.getPublicIpFromService(callback, service);
    };
};

module.exports = new PublicIpAddress();
