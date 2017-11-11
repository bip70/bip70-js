require('babel-polyfill');

var asn1js = require('asn1js');
var pkijs = require('pkijs');
var WebCrypto = require("node-webcrypto-ossl");
const webcrypto = new WebCrypto();
pkijs.setEngine('ossl', webcrypto, webcrypto.subtle);
var Certificate = pkijs.Certificate;
var CertificateChainValidationEngine = pkijs.CertificateChainValidationEngine;
var CertificateRevocationList = pkijs.CertificateRevocationList;

var ProtoBuf = require('../protobuf');
var X509Certificates = ProtoBuf.X509Certificates;

var Validator = function() {
};

Validator.stringToArrayBuffer = function str2ab(str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);

    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str[i];
    }

    return buf;
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
        var asn1 = asn1js.fromBER(Validator.stringToArrayBuffer(x509.certificate[i]));
        if (asn1.offset === -1) {
            throw new Error("Failed to decode certificate DER");
        }

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
