var certs = require("./ca-certificates.json");
var asn1js = require("asn1js");
var Certificate = require("pkijs").Certificate;
var stringToArrayBuffer = function str2ab(str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);

    for (var i = 0, strLen = str.length; i < strLen; i++)
        bufView[i] = str[i];

    return buf;
};

Object.keys(certs).map(function(key) {
    var pem = certs[key];
    try {
        var der = stringToArrayBuffer(Buffer.from(pem, 'base64'));
        var asn = asn1js.fromBER(der);

    } catch (e) {
        throw new Error("Failed to decode certificate")
    }

    if (asn.offset === -1) {
        throw new Error("Failed to decode certificate")
    }

    try {
        certs[key] = new Certificate({schema: asn.result});
    } catch (e) {
        throw new Error("Failed to decode certificate")
    }
});

var TrustStore = {};

TrustStore.getCerts = function() {
    return certs;
};

module.exports = TrustStore;
