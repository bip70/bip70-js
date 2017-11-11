require('babel-polyfill');

var jsrsasign = require('jsrsasign');
var ProtoBuf = require('../protobuf');
var X509Certificates = ProtoBuf.X509Certificates;

var Validator = function() {
};

Validator.prototype.verifyX509Details = function(paymentRequest) {
    var x509 = X509Certificates.decode(paymentRequest.pkiData);
    return this.validateCertificateChain(x509)
};

Validator.prototype.validateCertificateChain = function(x509, opt) {
    opt = opt || {};
    var certs = [];
    // Load cert to be validated, its intermediates and root
    for (var i = 0; i < x509.certificate.length; i++) {
        var cert = new X509();
        x.readCertHex(hCert);
        var asn1 = asn1js.fromBER(Validator.stringToArrayBuffer(x509.certificate[i]));
        if (asn1.offset === -1) {
            throw new Error("Failed to decode certificate DER");
        }
w
        certs[i] = new Certificate({schema: asn1.result});
    }

    var ts = opt.trustedCerts || [];
    var chainVerification = new CertificateChainValidationEngine({
        certs: certs,
        crls: [],
        trustedCerts: ts
    });

    console.log(chainVerification);
    return chainVerification.verify()
};

Validator.prototype.validateSignature = function() {

};

module.exports = Validator;
