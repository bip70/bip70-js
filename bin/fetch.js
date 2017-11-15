var HttpClient = require('../lib/client');
var Validation = require('../lib/x509/validation.jsrsasign');
var TrustStore = require('../lib/x509/truststore');

if (process.argv.length < 3) {
    throw new Error("Expecting a url as an argument");
}

var url = process.argv[2];
var opts = {
    trustStore: TrustStore
};
var validator = new Validation.RequestValidator(opts);
var client = new HttpClient(validator);

client
    .getRequest(url, validator)
    .then(function(response) {
        console.log(response)
    }, function(error) {
        console.log(error);
    });
