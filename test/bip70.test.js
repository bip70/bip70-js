/* jshint -W101, -W098 */

var bip70 = require('../main.js');
var assert = require('assert');
var RequestBuilder = bip70.RequestBuilder;
var ProtoBuf = bip70.ProtoBuf;
var PaymentDetails = ProtoBuf.PaymentDetails;

var encodeAndDecode = function(details) {
    return PaymentDetails.decode(PaymentDetails.encode(details).finish());
};
//var mocha = require('mocha');

describe('RequestBuilder setters', function() {
    it('sets the network and time', function(cb) {
        var network = "mainnet";
        var now = new Date().getTime();
        var builder = new RequestBuilder();
        builder.setNetwork(network);
        builder.setTime(now);

        var test = function(builder) {
            assert.equal(builder.network, network);
            assert.equal(builder.time, now);
        };

        test(builder);
        test(encodeAndDecode(builder));
        cb();
    });

    it('sets the memo', function(cb) {
        var memo = "thanks from btc.com";
        var now = new Date().getTime();
        var builder = new RequestBuilder();
        builder.setMemo(memo);
        builder.setTime(now);

        var test = function(builder) {
            assert.equal(builder.memo, memo);
        };

        test(builder);
        test(encodeAndDecode(builder));
        cb();
    });

    it('sets the expire time', function(cb) {
        var now = new Date().getTime();
        var expireTime = new Date().getTime();
        var builder = new RequestBuilder();
        builder.setExpires(expireTime);
        builder.setTime(now);

        var test = function(builder) {
            assert.equal(builder.expires, expireTime);
        };

        test(builder);
        test(encodeAndDecode(builder));
        cb();
    });

    it('sets the payment url', function(cb) {
        var paymentUrl = "https://webstore.com/payments?id=correcthorsebatterystaple-ie-random";
        var builder = new RequestBuilder();
        builder.setPaymentUrl(paymentUrl);
        builder.setTime(new Date().getTime());

        var test = function(builder) {
            assert.equal(builder.paymentUrl, paymentUrl);
        };

        test(builder);
        test(encodeAndDecode(builder));
        cb();
    });

    it('sets merchant data', function(cb) {
        var merchantData = "4cf6403a-b5a3-11e7-abc4-cec278b6b50a\n";
        var builder = new RequestBuilder();
        builder.setMerchantData(merchantData);
        builder.setTime(new Date().getTime());
        assert.equal(builder.merchantData, merchantData);

        var test = function(builder) {

        };

        test(builder);
        test(encodeAndDecode(builder));
        cb();
    });

    it('sets an output', function(cb) {
        var txOut = {
            amount: 1,
            script: Buffer.from('', 'hex')
        };

        var builder = new RequestBuilder();
        builder.addOutput(txOut);
        builder.setTime(new Date().getTime());

        var test = function(builder) {
            assert.equal(1, builder.outputs.length);
            assert.equal(builder.outputs[0].amount, txOut.amount);
            assert.equal(builder.outputs[0].script.toString('hex'), txOut.script.toString('hex'));
        };

        test(builder);
        test(encodeAndDecode(builder));

        cb();
    });

    it('sets outputs', function(cb) {
        var txOut1 = {
            amount: 1,
            script: Buffer.from('', 'hex')
        };
        var txOut2 = {
            amount: 1,
            script: Buffer.from('', 'hex')
        };
        var builder = new RequestBuilder();
        builder.setOutputs([txOut1, txOut2]);
        builder.setTime(new Date().getTime());

        var test = function(builder) {
            assert.equal(2, builder.outputs.length);
            assert.equal(builder.outputs[0].amount, txOut1.amount);
            assert.equal(builder.outputs[0].script.toString('hex'), txOut1.script.toString('hex'));

            assert.equal(builder.outputs[1].amount, txOut2.amount);
            assert.equal(builder.outputs[1].script.toString('hex'), txOut2.script.toString('hex'));
        };

        test(builder);
        test(encodeAndDecode(builder));

        cb();
    });

    it('builds PaymentDetails', function(cb) {
        var time = new Date().getTime();

        // obviously invalid script, shout out p2pool ;)
        var txOut = {
            amount: 1,
            script: Buffer.from('ascii')
        };
        var network = "mainnet";

        var builder = new RequestBuilder();
        builder.setTime(time);
        builder.setNetwork(network);
        builder.addOutput(txOut);

        var test = function(builder) {
            assert.equal(builder.time, time);
            assert.equal(builder.network, network);
            assert.equal(builder.outputs[0].amount, txOut.amount);
            assert.equal(builder.outputs[0].script.toString('binary'), txOut.script.toString('binary'));
        };

        test(builder);
        test(builder.buildDetails());
        test(encodeAndDecode(builder));

        cb();
    });

    it('builds PaymentRequest', function(cb) {
        var time = new Date().getTime();

        // obviously invalid script, shout out p2pool ;)
        var txOut = {
            amount: 1,
            script: Buffer.from('ascii')
        };
        var network = "mainnet";

        var builder = new RequestBuilder();
        builder.setTime(time);
        builder.setNetwork(network);
        builder.addOutput(txOut);

        var encodedDetails = ProtoBuf.PaymentDetails.encode(builder.buildDetails()).finish();
        var request = builder.buildRequest();

        assert.equal(request.serialized_payment_details.toString('hex'), encodedDetails.toString('hex'));

        cb();
    });

});
