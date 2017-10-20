/* jshint -W101, -W098 */

var bip70 = require('../main.js');
var assert = require('assert');
var RequestBuilder = bip70.RequestBuilder;
var ProtoBuf = bip70.ProtoBuf;
//var mocha = require('mocha');

describe('RequestBuilder', function() {
    it('sets the network', function(cb) {
        var network = "mainnet";
        var builder = new RequestBuilder();
        builder.setNetwork(network);
        assert.equal(builder.network, network);
        cb();
    });

    it('sets the memo', function(cb) {
        var memo = "thanks from btc.com";
        var builder = new RequestBuilder();
        builder.setMemo(memo);
        assert.equal(builder.memo, memo);
        cb();
    });

    it('sets the time', function(cb) {
        var time = new Date().getTime();
        var builder = new RequestBuilder();
        builder.setTime(time);
        assert.equal(builder.time, time);
        cb();
    });

    it('sets the expire time', function(cb) {
        var expireTime = new Date().getTime();
        var builder = new RequestBuilder();
        builder.setExpires(expireTime);
        assert.equal(builder.expires, expireTime);
        cb();
    });

    it('sets the payment url', function(cb) {
        var paymentUrl = "https://webstore.com/payments?id=correcthorsebatterystaple-ie-random";
        var builder = new RequestBuilder();
        builder.setPaymentUrl(paymentUrl);
        assert.equal(builder.payment_url, paymentUrl);
        cb();
    });

    it('sets merchant data', function(cb) {
        var merchantData = "4cf6403a-b5a3-11e7-abc4-cec278b6b50a\n";
        var builder = new RequestBuilder();
        builder.setMerchantData(merchantData);
        assert.equal(builder.merchant_data, merchantData);
        cb();
    });

    it('sets an output', function(cb) {
        var txOut = {
            amount: 1,
            script: Buffer.from('', 'hex')
        };

        var builder = new RequestBuilder();
        builder.addOutput(txOut);

        assert.equal(1, builder.outputs.length);
        assert.equal(builder.outputs[0].amount, txOut.amount);
        assert.equal(builder.outputs[0].script.toString('hex'), txOut.script.toString('hex'));
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

        assert.equal(2, builder.outputs.length);
        assert.equal(builder.outputs[0].amount, txOut1.amount);
        assert.equal(builder.outputs[0].script.toString('hex'), txOut1.script.toString('hex'));

        assert.equal(builder.outputs[1].amount, txOut2.amount);
        assert.equal(builder.outputs[1].script.toString('hex'), txOut2.script.toString('hex'));

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

        var details = builder.buildDetails();

        assert.equal(details.time, time);
        assert.equal(details.network, network);
        assert.equal(details.outputs[0].amount, txOut.amount);
        assert.equal(details.outputs[0].script, txOut.script.toString('binary'));

        var encoded = ProtoBuf.PaymentDetails.encode(details).finish();
        var decoded = ProtoBuf.PaymentDetails.decode(encoded);
        console.log(decoded);
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
