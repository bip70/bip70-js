var jsrsasign = require('jsrsasign');
var ProtoBuf = require('../protobuf');
var PKIType = require('./pkitype');
var X509Certificates = ProtoBuf.X509Certificates;

function hasEqualSerialNumber(certA, certB) {
    return certA.getSerialNumberHex() === certB.getSerialNumberHex()
}

function hasEqualSubject(certA, certB) {
    return certA.getSubjectHex() === certB.getSubjectHex()
}

function hasEqualPublicKey(certA, certB) {
    return certA.getPublicKeyHex() === certB.getPublicKeyHex()
}

function checkCertsEqual(certA, certB) {
    return hasEqualSerialNumber(certA, certB)
        && hasEqualSubject(certA, certB)
        && hasEqualPublicKey(certA, certB);
}

function isSelfSigned(certificate) {
    return certificate.getSubjectString() === certificate.getIssuerString();
}

function makeFilterBySubjectKey(subjectKeyId) {
    return function(certificate) {
        try {
            return certificate.getExtSubjectKeyIdentifier() === subjectKeyId;
        } catch (e) {}

        return false;
    };
}

function findIssuers(target, bundle) {
    try {
        var authorityKeyIdentifier = target.getExtAuthorityKeyIdentifier();

        if (typeof authorityKeyIdentifier.kid === "string") {
            var issuerName = target.getIssuerString();
            return bundle
                .filter(makeFilterBySubjectKey(authorityKeyIdentifier.kid))
                .filter(function(issuerCert) {
                    return issuerName === issuerCert.getSubjectString()
                });
        }
    } catch (e) { }

    return [];
}

function debugCertificatePath(cert) {
    console.log("Subject: ", cert.getSubjectString());
    console.log("Issuer: ", cert.getIssuerString());
    console.log("subjectKeyId: ", cert.getExtSubjectKeyIdentifier());
    console.log("authorityKeyId: ", cert.getExtAuthorityKeyIdentifier());
}

function ChainPathBuilder(trustStore) {
    if (typeof trustStore === "undefined") {
        trustStore = [];
    }

    this.trustStore = trustStore;
}

ChainPathBuilder.prototype._pathsToTarget = function(target, intermediates) {
    var paths = [];
    findIssuers(target, this.trustStore).map(function(issuer) {
        if (checkCertsEqual(target, issuer)) {
            paths.push(target);
        } else {
            paths.push([].concat(issuer, target));
        }
    });

    if (Array.isArray(intermediates)) {
        var self = this;
        findIssuers(target, intermediates)
            .map(function(issuer) {
                if (isSelfSigned(issuer)) {
                    return;
                }

                var subpaths = self._pathsToTarget(issuer, intermediates);
                subpaths.map(function(path) {
                    paths.push([].concat(path, target));
                });
            });
    }

    return paths;
};

ChainPathBuilder.prototype.shortestPathToTarget = function(target, intermediates) {
    var paths = this._pathsToTarget(target, intermediates);
    if (paths.length === 0) {
        throw new Error("No certificate paths found");
    }

    paths.sort(function(a, b) {
        if (a < b) {
            return -1;
        }
        if (b > a) {
            return 1;
        }

        return 0;
    });

    return paths[0];
};

function WorkingData(pubKeyAlgo, pubKey, issuerName) {
    this.pubKeyAlgo = pubKeyAlgo;
    this.pubKey = pubKey;
    this.issuerName = issuerName;
    this.getPubKeyAlgo = function() {
        return this.pubKeyAlgo;
    };
    this.getPublicKey = function() {
        return this.pubKey;
    };
    this.getIssuerName = function() {
        return this.issuerName;
    };
}

WorkingData.fromCert = function(cert) {
    var subjectKey = cert.getSignatureAlgorithmField();
    return new WorkingData(subjectKey, cert.getPublicKey(), cert.getIssuerString());
};

/**
 *
 * @param {jsrsasign.Certificate} rootCert
 * @param {number} chainLength
 * @constructor
 */
function ChainValidationState(rootCert, chainLength) {
    this.workingData = WorkingData.fromCert(rootCert);
    this.index = 1;
    this.chainLength = chainLength;
    this.currentTime = Date.now();
    var self = this;
    this.updateState = function(cert) {
        var subjectKey = cert.getSignatureAlgorithmField();
        self.workingData = new WorkingData(subjectKey, cert.getPublicKey(), cert.getSubjectString());
    };
    this.isFinal = function() {
        return this.chainLength === self.index;
    };
}

/**
 * Constructor for ChainPathValidator. Takes a list of
 * certificates, starting from the root, ending with
 * the entity certificate.
 *
 * @param {object} config
 * @param {jsrsasign.Certificate[]} certificates
 * @constructor
 */
function ChainPathValidator(config, certificates) {
    this._certificates = certificates;
    this._config = config;
    this._trustAnchor = certificates[0];
}

/**
 *
 * @param {ChainValidationState} state
 * @param {KJUR.asn1.x509.Certificate} cert
 */
function checkSignature(state, cert) {
    if (!cert.verifySignature(state.workingData.getPublicKey())) {
        throw new Error("Failed to verify signature");
    }
}

/**
 *
 * @param {ChainValidationState} state
 * @param {KJUR.asn1.x509.Certificate} cert
 */
function checkValidity(state, cert) {
    var notBefore = cert.getNotBefore();
    var notAfter = cert.getNotAfter();
    if (notBefore > state.currentTime || notAfter < state.currentTime) {
        throw new Error("Certificate is not valid");
    }
}
function checkRevocation(cert) {

}
function checkIssuer(state, cert) {
    if (state.workingData.getIssuerName() !== cert.getIssuerString()) {
        throw new Error("Certificate issuer doesn't match");
    }
}
function processCertificate(state, cert) {
    checkSignature(state, cert);
    checkValidity(state, cert);
    // crl handling
    checkIssuer(state, cert);
}

ChainPathValidator.prototype.validate = function() {
    var state = new ChainValidationState(this._trustAnchor, this._certificates.length);
    for (var i = 0; i < this._certificates.length; i++) {
        state.index = i + 1;
        var cert = this._certificates[i];
        processCertificate(state, cert);
        if (!state.isFinal()) {
            state.updateState(cert)
        }
    }
};

var RequestValidator = function(opts) {
    var trustStore = [];
    if (opts) {
        trustStore = opts.trustStore ? opts.trustStore : [];
    }
    this.trustStore = trustStore;
};

RequestValidator.prototype.verifyX509Details = function(paymentRequest) {
    var x509 = X509Certificates.decode(paymentRequest.pkiData);

    function certFromDER(derBuf) {
        var cert = new jsrsasign.X509();
        cert.readCertHex(derBuf.toString('hex'));
        return cert;
    }

    var entityCert = certFromDER(x509.certificate[0]);
    var intermediates = x509.certificate.slice(1).map(certFromDER);

    this.validateCertificateChain(entityCert, intermediates);

    if (!this.validateSignature(paymentRequest, entityCert)) {
        throw new Error("Invalid signature on request");
    }
};

RequestValidator.prototype.validateCertificateChain = function(entityCert, intermediates) {
    var builder = new ChainPathBuilder(this.trustStore);
    var path = builder.shortestPathToTarget(entityCert, intermediates);
    var validator = new ChainPathValidator({}, path);
    validator.validate();
};

RequestValidator.prototype.validateSignature = function(request, entityCert) {
    var publicKey = entityCert.getPublicKey();

    var keyType;
    if (publicKey.type === "ECDSA") {
        keyType = "ECDSA";
    } else if (publicKey.type === "RSA") {
        keyType = "RSA";
    } else {
        throw new Error("Unknown public key type");
    }

    var hashAlg;
    if (request.pkiType === PKIType.X509_SHA1) {
        hashAlg = "SHA1";
    } else if (request.pkiType === PKIType.X509_SHA256) {
        hashAlg = "SHA256";
    }

    var sigAlg = hashAlg + "with" + keyType;
    var sig = new jsrsasign.Signature({alg: sigAlg});
    sig.init(publicKey);
    sig.updateHex(getDataToSign(request).toString('hex'));
    return sig.verify(request.signature.toString('hex'));
};

function getDataToSign(request) {
    if (request.signature) {
        var tmp = request.signature;
        request.signature = '';
        var encoded = ProtoBuf.PaymentRequest.encode(request).finish();
        request.signature = tmp;
        return encoded;
    }

    return ProtoBuf.PaymentRequest.encode(request).finish();
}

module.exports = {
    ChainPathBuilder: ChainPathBuilder,
    ChainPathValidator: ChainPathValidator,
    RequestValidator: RequestValidator
};
