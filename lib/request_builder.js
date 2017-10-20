var protobuf = require('./protobuf');

function checkOutput(txOut) {
    if (typeof txOut.amount === "undefined") {
        throw new Error("Missing Output `value`");
    }
    if (typeof txOut.script === "undefined") {
        throw new Error("Missing Output `script`");
    }
    if (!(txOut.script instanceof Buffer)) {
        throw new Error("Output `script` must be a Buffer");
    }
}

function convertOutput(txOut) {
    return {
        amount: txOut.amount,
        script: txOut.script.toString('binary')
    }
}

function RequestBuilder() {
    this.network = null;
    this.outputs = [];
    this.time = null;
    this.expires = null;
    this.memo = null;
    this.payment_url = null;
    this.merchant_data = null;
}

RequestBuilder.prototype.setMemo = function(memo) {
    this.memo = memo;
};
RequestBuilder.prototype.setNetwork = function(network) {
    this.network = network;
};
RequestBuilder.prototype.setOutputs = function(txOutArray) {
    txOutArray.map(checkOutput);
    this.outputs = txOutArray.map(convertOutput);
};
RequestBuilder.prototype.addOutput = function(txOut) {
    checkOutput(txOut);
    this.outputs.push(convertOutput(txOut));
};
RequestBuilder.prototype.setTime = function(time) {
    this.time = time;
};
RequestBuilder.prototype.setExpires = function(expireTime) {
    this.expires = expireTime;
};
RequestBuilder.prototype.setPaymentUrl = function(url) {
    this.payment_url = url;
};
RequestBuilder.prototype.setMerchantData = function(merchantData) {
    this.merchant_data = merchantData;
};
RequestBuilder.prototype.buildDetails = function() {
    if (null === this.time) {
        throw new Error("Missing `time` for PaymentDetails");
    }
    if (this.outputs.length < 1) {
        throw new Error("Missing `outputs` for PaymentDetails");
    }

    return protobuf.PaymentDetails.create(this);
};
RequestBuilder.prototype.buildRequest = function() {
    var details = this.buildDetails();

    return protobuf.PaymentRequest.create({
        serialized_payment_details: protobuf.PaymentDetails.encode(details).finish()
    });
};
exports = module.exports = RequestBuilder;
