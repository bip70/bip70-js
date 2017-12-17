var jsrsasign = require('jsrsasign');
var assert = require('assert');
var bip70 = require('../main.js');
var PaymentRequest = bip70.ProtoBuf.PaymentRequest;
var ChainPathValidator = bip70.X509.ChainPathValidator;
var ChainPathBuilder = bip70.X509.ChainPathBuilder;
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

describe("GetSignatureAlgorithm", function() {
    var entityCert = certFromEncoding(certfile.test_cert.entityCertificate, "base64");

    it("Deals with RSA public keys", function(cb) {
        var sha256 = bip70.X509.GetSignatureAlgorithm(entityCert, bip70.X509.PKIType.X509_SHA256);
        assert.equal(sha256, "SHA256withRSA");

        var sha1 = bip70.X509.GetSignatureAlgorithm(entityCert, bip70.X509.PKIType.X509_SHA1);
        assert.equal(sha1, "SHA1withRSA");
        cb();
    });

    it("Deals with ECDSA public keys (mocked)", function(cb) {
        var mockKey = {};
        mockKey.getPublicKey = function() {
            return {
                type: "ECDSA"
            };
        };

        var sha256 = bip70.X509.GetSignatureAlgorithm(mockKey, bip70.X509.PKIType.X509_SHA256);
        assert.equal(sha256, "SHA256withECDSA");

        var sha1 = bip70.X509.GetSignatureAlgorithm(mockKey, bip70.X509.PKIType.X509_SHA1);
        assert.equal(sha1, "SHA1withECDSA");
        cb();
    });

    it("Rejects unknown PKI types", function(cb) {
        var mockKey = {};
        mockKey.getPublicKey = function() {
            return {
                type: "ECDSA"
            };
        };

        assert.throws(function() {
            bip70.X509.GetSignatureAlgorithm(mockKey, "unknown");
        }, "Unknown PKI type or no signature algorithm specified.");

        assert.throws(function() {
            bip70.X509.GetSignatureAlgorithm(mockKey, bip70.X509.PKIType.NONE);
        }, "Unknown PKI type or no signature algorithm specified.");

        cb();
    });

    it("Rejects unknown public key type", function(cb) {
        var mockKey = {};
        mockKey.getPublicKey = function() {
            return {
                type: "wut"
            };
        };

        assert.throws(function() {
            bip70.X509.GetSignatureAlgorithm(mockKey, "unknown");
        }, "Unknown public key type");

        cb();
    });
});

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

        assert.doesNotThrow(function() {
            validator.validate();
        }, 'no errors expected during validation');

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

describe("RequestValidator", function() {
    describe("validateSignature", function() {
        var i = 0;
        certfile.test_cert.requests.map(function(request) {
            it("works with a test fixture " + i, function(cb) {
                var time = request.time;
                var request64 = request.request;
                var req = PaymentRequest.decode(Buffer.from(request64, 'base64'));
                var root = certFromEncoding(certfile.test_cert.rootCertificate, "base64");
                var intermediates = certfile.test_cert.intermediates.map(function(cert) {
                    return certFromEncoding(cert, "base64");
                });
                var entityCert = certFromEncoding(certfile.test_cert.entityCertificate, "base64");
                var validator = new bip70.X509.RequestValidator({
                    trustStore: [root],
                    currentTime: time
                });

                assert.doesNotThrow(function() {
                    validator.validateCertificateChain(entityCert, intermediates);
                }, "should validate certificate chain");

                assert.doesNotThrow(function() {
                    validator.validateSignature(req, entityCert);
                }, "should validate request signature");

                var path = [];
                assert.doesNotThrow(function() {
                    path = validator.verifyX509Details(req);
                }, "full validation should succeed");

                assert.equal(path.length, 1 + intermediates.length + 1);
                cb();
            });
            i++;
        });

        var request = certfile.test_cert.requests[0];
        it("rejects an invalid signature", function(cb) {
            var time = request.time;
            var request64 = request.request;
            var req = PaymentRequest.decode(Buffer.from(request64, 'base64'));
            var root = certFromEncoding(certfile.test_cert.rootCertificate, "base64");
            var entityCert = certFromEncoding(certfile.test_cert.entityCertificate, "base64");
            var validator = new bip70.X509.RequestValidator({
                trustStore: [root],
                currentTime: time
            });

            req.signature = Buffer.from("dZmjw+Tg7ssFmBF3gqbHvyImTEZ6ffMYMBTAFiJs0RnpY9bPCzEILbCX6rBeagffaShqmkyn0iU3+h509Ul8rtPbR+C4c26uFJNLMXWbq7QiiIbpwCaJjtQFXipm7bgVlv+swrMTVu/K+atAsY8INUyuE/CrV53fN7P9gKFqlmlMB2MdrN/oFCx2dDWooXIjvl11hJDkae+r3bC+YCMBfe3MFCDpmF/c3+0xkFrw2R7cZLdUu+kBF3iHL0ezslxKJLtYMb1cuc5DWiGbVOZqu/+Gt3Pul3DS7Tk8QNx7ou1As0EiGWc+BKxUm63lNS/JlIUwvx6A+q0nnu7WDA28Hg==", "base64");
            assert.ok(false === validator.validateSignature(req, entityCert));

            assert.throws(function() {
                validator.verifyX509Details(req);
            }, "Invalid signature on request");

            cb();
        });
    });

});
