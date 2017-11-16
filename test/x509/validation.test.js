var jsrsasign = require('jsrsasign');
var assert = require('assert');
var bip70 = require('../../lib');
var ChainPathValidator = bip70.X509.ChainPathValidator;
var ChainPathBuilder = bip70.X509.ChainPathBuilder;
var Validation = require('../../lib/x509/validation.jsrsasign');
var certfile = require("./certfile");


function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function subDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
}

function certFromEncoding(data, encoding) {
    var b = Buffer.from(data, encoding);
    var cert = new jsrsasign.X509();
    cert.readCertHex(b.toString('hex'));
    return cert;
}

describe('ChainPathBuilder', function() {
    var fixture = certfile.test_cert;
    var entityCert = certFromEncoding(fixture.entityCertificate, "base64");
    var rootCert = certFromEncoding(fixture.rootCertificate, "base64");
    var intermediates = fixture.intermediates.map(function(base64) {
        return certFromEncoding(base64, "base64");
    });
    var chainValidTime = fixture.chainValidTime;

    it('builds a valid certificate chain', function(cb) {
        var numCerts = 2 + intermediates.length;
        var builder = new ChainPathBuilder([rootCert]);
        var path = builder.shortestPathToTarget(entityCert, intermediates);

        assert.equal(path.length, numCerts, "expecting " + numCerts + " certificates in total for path");

        var validator = new ChainPathValidator({
            currentTime: chainValidTime
        }, path);

        validator.validate();

        cb();
    });

    function testCertificateValidity(now) {
        var builder = new ChainPathBuilder([rootCert]);
        var path = builder.shortestPathToTarget(entityCert, intermediates);
        assert.equal(path.length, 3, "expecting 3 certificates in total for path");

        var validator = new ChainPathValidator({
            currentTime: now
        }, path);

        var err;
        try {
            validator.validate();
        } catch (e) {
            err = e;
        }

        assert.ok(typeof err === "object");
        assert.equal(err.message, "Certificate is not valid");
    }

    [rootCert].concat(intermediates).concat(entityCert).map(function(cert, i) {
        it('rejects if `now` is after #' + i + ' certs `notAfter`', function(cb) {
            // this timestamp conflicts with the root certificates notBefore
            var now = jsrsasign.zulutodate(cert.getNotAfter());
            now = addDays(now, 2);
            testCertificateValidity(now);
            cb();
        });

        it('rejects if `now` is before #' + i + ' certs `notBefore`', function(cb) {
            // this timestamp conflicts with the root certificates notBefore
            var now = jsrsasign.zulutodate(rootCert.getNotBefore());
            now = subDays(now, 2);
            testCertificateValidity(now);
            cb();
        });
    });

    function testNoCertificationPath(trusted, intermediate, end) {
        var err;
        try {
            var builder = new ChainPathBuilder(trusted);
            builder.shortestPathToTarget(end, intermediate);
        } catch (e) {
            err = e;
        }

        assert.equal(typeof err, "object");
        assert.equal(err.message, "No certificate paths found");
    }

    it('errors if intermediate certificate is missing', function(cb) {
        testNoCertificationPath([rootCert], [], entityCert);
        cb();
    });

    it('errors if root certificate is missing', function(cb) {
        testNoCertificationPath([], intermediates, entityCert);
        cb();
    });
});
