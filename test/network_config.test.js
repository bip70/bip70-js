
var assert = require('assert');
var bip70 = require('../main.js');

describe("NetworkConfig", function() {
    it("Creates network config", function(cb) {

        var cfg = bip70.NetworkConfig.Bitcoin();
        var mime = cfg.getMimeTypes();
        assert.equal(mime.PAYMENT_REQUEST, "application/bitcoin-paymentrequest");
        assert.equal(mime.PAYMENT, "application/bitcoin-payment");
        assert.equal(mime.PAYMENT_ACK, "application/bitcoin-paymentack");

        cb();
    });
});
