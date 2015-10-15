var http2 = require('http2');
var fs = require('fs');
var url = require('url');
var path = require('path');
var cheerio = require('cheerio');

http2.createServer({
    key: fs.readFileSync('./certs/server/http2.local.key.pem'),
    cert: fs.readFileSync('./certs/server/http2.local.crt.pem')
}, function (req, res) {
    var filename = path.join(__dirname, req.url);
    var stream = fs.createReadStream(filename);

    if (req.url == '/index.html') {
        var $ = cheerio.load(fs.readFileSync(path.join(__dirname, '/index.html')));

        $('script[src*=".js"], link[href*=".css"]').each(function () {
            var src = $(this).attr('src') || $(this).attr('href');
            var filename = url.parse(src).pathname.replace(/^\/?/, '/');

            var push = res.push(filename);
            fs.createReadStream(path.join(__dirname, filename)).pipe(push);
        });
    }

    stream.on('data', function (chunk) {
        res.write(chunk);
    });

    stream.on('error', function (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
        return;
    });

    stream.on('end', function () {
        res.writeHead(200);
        res.end();
    });
}).listen(3000);
