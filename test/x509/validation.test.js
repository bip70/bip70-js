var asn1js = require('asn1js');
var assert = require('assert');
var ProtoBuf = require('../../lib/protobuf');
var TrustStore = require('../../lib/x509/truststore');
var X509Certificates = ProtoBuf.X509Certificates;
var Certificate = require('pkijs').Certificate;
var CertificateChainValidationEngine = require('pkijs').CertificateChainValidationEngine;
var Validator = require('../../lib/x509/validation.pkijs');

var certfile = require("./certfile");

describe('Validation', function() {
    var certSelfSigned64 = 'MIIDCjCCAfKgAwIBAgIJAPfHe1r84gY8MA0GCSqGSIb3DQEBCwUAMBoxGDAWBgNV\n' +
        'BAMMD0JJUDcwIHRlc3QgY2FzZTAeFw0xNzEwMjgxOTQ4MDhaFw0xODEwMjgxOTQ4\n' +
        'MDhaMBoxGDAWBgNVBAMMD0JJUDcwIHRlc3QgY2FzZTCCASIwDQYJKoZIhvcNAQEB\n' +
        'BQADggEPADCCAQoCggEBAKzsGo3E26GKAI9YWHxIykJTSdake20WGZBCr94KydV8\n' +
        '2DERn+20u6dTPN838m1U6dXioWRAu1el3XwybYEyOBI4cZwteG83LZMSWuH5/85p\n' +
        'l5FWsQjzO/wz4fPY2og4B8H0F95BrDCr2W1vaRSMB5Prt2n0MPjvYVDTF7vKOFNC\n' +
        'uigGoqRX2bRnuA4wsT6YPK8gCX74SLZRgrohRga9ZREsDEHjon7YoM81deDF5Ajm\n' +
        'b/keOx7V0I/7LTHg5r6+EjR/IbFsZT2QlD9IBfpC2Tznizkd+xszZrYIhFmINxmQ\n' +
        'DLTFOnWPzjy5hu5gX9cXHH3xReDrFLiSQkM5mLLkS00CAwEAAaNTMFEwHQYDVR0O\n' +
        'BBYEFHH2DkuFgA1TyDivdN4xGdibx+/pMB8GA1UdIwQYMBaAFHH2DkuFgA1TyDiv\n' +
        'dN4xGdibx+/pMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAKM2\n' +
        'CkqnOTGtpE78sAB1QrRjrcUY9sj3hylTDbBOBg5IIrNk7HVhy6odgw3/xTnPnka+\n' +
        '6YMxZ3S7Uv6lss1NVVvxMChrSZjbaRg91Ci44QnANgqGQ4O+jwXbR+cEVla2miPG\n' +
        'lV4oOKEr7tGSGU2j90x2mHpVwZfb6WlqY47qPYKD8sF44mC5kvpnZLSCm2WCsJIU\n' +
        'DcUo4qsZ54l7phZFRaSEOHwOeeyQN8q78BZd1Brr+qS3laVrH44dXHLKeh/qzlUn\n' +
        'mkgjF1R8AgJhcjM6U4xR+WeY6AQKdt5imHVyeHDay0ZHi+e6rUwkFj9mbbaZwIsT\n' +
        '2XXjwmZziZA+LeCLPvY=';

    it('selfsigned', function(cb) {
        var der = Buffer.from(certSelfSigned64, "base64");
        var decodeAsn1 = asn1js.fromBER(Validator.stringToArrayBuffer(der));
        assert.notEqual(-1, decodeAsn1.offset);

        var cert = new Certificate({schema: decodeAsn1.result});
        var validator = new Validator();
        var x509 = X509Certificates.create({
            certificate: [der]
        });

        validator
            .validateCertificateChain(x509, {trustedCerts: [cert]})
            .then(function(a) {
                console.log(a);
                console.log("success");
                cb();
            }, function(err) {
                console.log("error");
                console.log(err);
                cb();
            });
    });

    function base64ToCert(b64) {
        var buf = Buffer.from(b64, "base64");
        var asn1 = asn1js.fromBER(Validator.stringToArrayBuffer(buf));
        if (asn1.offset === -1) {
            throw new Error("Failed to decode certificate DER");
        }
        var cert = new Certificate({schema: asn1.result});
        return {
            der: buf,
            asn1: asn1,
            cert: cert
        }
    }

    it('builds', function(cb) {
        var fixture = certfile.test_cert;
        var entity = base64ToCert(fixture.entityCertificate);
        var root = base64ToCert(fixture.rootCertificate);
        var intermediates = fixture.intermediates.map(base64ToCert);

        var certs = [entity.cert];
        certs = certs.concat(intermediates.map(function(v) { return v.cert; }));

        var chainVerification = new CertificateChainValidationEngine({
            certs: certs,
            trustedCerts: [root.cert]
        });

        chainVerification.verify()
            .then(function(a) {
                console.log(a);
                cb();
            }, function(e) {
                console.log(e);
                cb();
            });
    })

    it('signedbyintermediate', function(cb) {
        var fixture = certfile.pkijs;
        var entityCert = Buffer.from(fixture.entityCertificate, "base64");
        var rootCert = Buffer.from(fixture.rootCertificate, "base64");
        var intermediates = fixture.intermediates.map(function(base64) {
            return Buffer.from(base64, "base64");
        });

        var decodeAsn1 = asn1js.fromBER(Validator.stringToArrayBuffer(rootCert));
        assert.notEqual(-1, decodeAsn1.offset);

        var trustRoot = new Certificate({schema: decodeAsn1.result});

        var opt = {
            trustedCerts: [trustRoot]
        };

        var certs = [];
        certs.push(entityCert);
        certs = certs.concat(intermediates);
        var x509 = X509Certificates.create({
            certificate: certs
        });

        new Validator()
            .validateCertificateChain(x509, opt)
            .then(function(a) {
                console.log("success");
                console.log(a);
                cb();
            }, function(err) {
                console.log("error");
                console.log(err);
                cb();
            });
    })
});
