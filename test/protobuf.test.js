/* jshint -W101, -W098 */

var bip70 = require('../main.js');
var assert = require('assert');
var ProtoBuf = bip70.ProtoBuf;
//var mocha = require('mocha');

describe('Protobuf', function() {
    it('example usage', function(cb) {
        var PaymentDetails = ProtoBuf.PaymentDetails;

        var proto = PaymentDetails.create({});
        console.log(proto);
        cb();
    });
});
