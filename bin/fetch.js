var HttpClient = require('../lib/client');
var X509Validator = require('../lib/x509/validation.pkijs');

if (process.argv.length < 3) {
    throw new Error("Expecting a url as an argument");
}

var url = process.argv[2];
var validator = new X509Validator();
var client = new HttpClient(validator);

client
    .getRequest(url)
    .then(function(response) {
        console.log(response)
    }, function(error) {
        console.log(error);
    });
