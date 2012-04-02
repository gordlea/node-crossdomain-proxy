/*  (C) 2012 Premist aka Minku Lee.
    LICENSE : https://github.com/premist/node-crossdomain-proxy/blob/master/LICENSE
*/


var fs = require('fs');
var path = require('path');
var crypto = require('crypto');



var http = require('http');
var url = require('url');
var port = process.env.port || 1337;


http.createServer(function(proxyReq, proxyResp) {
    var params = url.parse(proxyReq.url, true);
    var URL = "http://" + params.query.src;


	// console.log("destination url=", URL);
    var destParams = url.parse(URL);
	util = require('util');

    var reqOptions = {
        host : destParams.host,
        port : 80,
        path : destParams.pathname,
        method : "GET",
		agent: false
    };
	if (reqOptions.host === 'undefined') {
		return;
	}
	// console.dir(reqOptions);
	var shasum = crypto.createHash('md5');
	shasum.update(URL);
	var cacheFileName = 'cache/' + shasum.digest('hex')+".jpeg";
	// console.log(cacheFileName, URL);
	// console.trace();
	var headers = null;
	path.exists(cacheFileName, function(exists) {
		if (!exists) {
			console.log("cache miss:",cacheFileName);
			var ws = fs.createWriteStream(cacheFileName);
			
			ws.on('close', function() {

				var rs = fs.createReadStream(cacheFileName);
				proxyResp.writeHead(200, headers);
				util.pump(rs, proxyResp)
			})
			
		    var req = http.request(reqOptions, function(res) {
		        headers = res.headers;
		        headers['Access-Control-Allow-Origin'] = '*';
		        headers['Access-Control-Allow-Headers'] = 'X-Requested-With';
				
				
				util.pump(res, ws);
		    });

		    req.on('error', function(e) {
		        console.log('An error occured: ' + e.message);
		        proxyResp.writeHead(503);
		        proxyResp.write("Error!");
		        proxyResp.end();
		    });
		    req.end();

		} else {
		//read from fs
		console.log('cache hit:', cacheFileName)
		var rs = fs.createReadStream(cacheFileName);
        headers = {};
        headers['Access-Control-Allow-Origin'] = '*';
        headers['Access-Control-Allow-Headers'] = 'X-Requested-With';
		headers['Content-Type'] = 'image/jpeg';
		proxyResp.writeHead(200, headers);
		util.pump(rs, proxyResp)
	}
	});

 

}).listen(port);