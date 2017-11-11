var axios = require('axios');
var MIMEType = require('./mimetype');
var PKIType = require('./x509/pkitype');
var ProtoBuf = require('./protobuf');
var PaymentRequest = ProtoBuf.PaymentRequest;

var HttpClient = function(validator) {
    this._checkContentType = true;
    this.validator = validator;
};

HttpClient.prototype.checkContentType = function(setting) {
    if (typeof setting === "undefined") {
        setting = true;
    }
    this._checkContentType = setting;
};

/**
 *
 * @param url
 * @return Promise
 */
HttpClient.prototype.getRequest = function(url) {
    var self = this;
    return axios({
        method: 'get',
        headers: {
            "Accept": MIMEType.PAYMENT_REQUEST
        },
        url: url,
        responseType: 'arraybuffer'
    })
        .then(function(response) {
            if (this._checkContentType) {
                if (!("content-type" in response.headers)) {
                    throw new Error("Missing content-type header in response");
                }
                if (response.headers.indexOf(MIMEType.PAYMENT_REQUEST) === -1) {
                    throw new Error("Invalid content-type header set by server, request failed");
                }
            }

            var buf = Buffer.from(response.data);
            var paymentRequest = PaymentRequest.decode(buf);

            if (paymentRequest.pkiType !== PKIType.NONE) {
                return self.validator.verifyX509Details(paymentRequest)
                    .then(function(result) {
                        return paymentRequest;
                    });
            }

            return paymentRequest;
        })
};

module.exports = HttpClient;
