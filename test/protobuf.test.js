
/* jshint -W101, -W098 */

var bip70 = require('../main.js');
var assert = require('assert');
var ProtoBuf = bip70.ProtoBuf;
var PaymentDetails = ProtoBuf.PaymentDetails;
var PaymentRequest = ProtoBuf.PaymentRequest;
var X509Certificates = ProtoBuf.X509Certificates;
var Output = ProtoBuf.Output;

describe('Protobuf', function() {
    describe('Output', function() {
        [
            [0, new Buffer("")],
            [1234567890, new Buffer("ascii")]
        ].map(function(fixture, i) {
            it("fixture #" + i + " can be encoded and decoded", function(cb) {
                var amount = fixture[0];
                var script = fixture[1];
                var output = Output.create({
                    amount: amount,
                    script: script
                });

                assert.equal(output.amount, amount);
                assert.ok(output.script.equals(script));

                var encoded = new Buffer(Output.encode(output).finish());
                var decoded = Output.decode(encoded);


                assert.equal(decoded.amount, amount);
                assert.ok(decoded.script.equals(script));

                cb();
            });
        });
    });

    describe('PaymentDetails', function() {
        it('set a create time', function(cb) {
            var time = 1513527325;

            var details = PaymentDetails.create({
                time: time
            });
            var str = PaymentDetails.encode(details).finish();
            var decoded = PaymentDetails.decode(str);

            assert.equal(decoded.time, time);
            cb();
        });
    });

    describe('PaymentRequest', function() {
        it('parses a static PaymentRequest', function(cb) {
            var pkiType = "x509+sha256";
            var memo = "Payment for 1 shoes";
            var network = "main";
            var paymentUrl = "https://example.com/payment";
            var txOutVal = 500000;
            var merchantData = Buffer.from("30ae4a789834ed78ed74ff1291689131", "hex");
            var txOutScript = Buffer.from("76a914ef137c53ddae4dcf04f5a656c42f451c0b99165788ac", "hex");
            var someRequest = "Egt4NTA5K3NoYTI1NhqQCAqFBDCCAgEwggFqAgkAqnj+xtf3r5MwDQYJKoZIhvcNAQELBQAwRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoMGEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0xNTA5MjkxMzU2NDBaFw0xNjA5MjgxMzU2NDBaMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBALKAUiA22Umgy666aJ9Ka1ilvU/JGfCMN/hmGKCR5kfnfOVaSdhm3ZCvnAwbUwS2j3DZ1jofRG3OV9PelRry8bSMb8zADtdGSVovjbTzlqkNzIS2ZwRglL05gkLPJnNJB/0M/1JNgCKeqA9hw0CMgR5B5ozFmR8OxplFLQDa3S2hAgMBAAEwDQYJKoZIhvcNAQELBQADgYEACwtR35RSKJG8sNYxgfCUwFKxPSxto6FQ9ge59xZ5xPOPLGuS4Otadf0hyKyrRGZGqVe8U8MEzi5Q32C0daB+llTX96winSkxy8T9t28AJLEJGG32qvLZzxkTn0LiwfH0obnCNxcXVlKsANIVKkZxTcd1g8PG5YuTyHNA6GL2rN4KhQQwggIBMIIBagIJAKp4/sbX96+TMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTUwOTI5MTM1NjQwWhcNMTYwOTI4MTM1NjQwWjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCygFIgNtlJoMuuumifSmtYpb1PyRnwjDf4ZhigkeZH53zlWknYZt2Qr5wMG1MEto9w2dY6H0RtzlfT3pUa8vG0jG/MwA7XRklaL42085apDcyEtmcEYJS9OYJCzyZzSQf9DP9STYAinqgPYcNAjIEeQeaMxZkfDsaZRS0A2t0toQIDAQABMA0GCSqGSIb3DQEBCwUAA4GBAAsLUd+UUiiRvLDWMYHwlMBSsT0sbaOhUPYHufcWecTzjyxrkuDrWnX9Icisq0RmRqlXvFPDBM4uUN9gtHWgfpZU1/esIp0pMcvE/bdvACSxCRht9qry2c8ZE59C4sHx9KG5wjcXF1ZSrADSFSpGcU3HdYPDxuWLk8hzQOhi9qzeInESHwigwh4SGXapFO8TfFPdrk3PBPWmVsQvRRwLmRZXiKwYpayozwUglZCozwUqE1BheW1lbnQgZm9yIDEgc2hvZXMyG2h0dHBzOi8vZXhhbXBsZS5jb20vcGF5bWVudDoQMK5KeJg07XjtdP8SkWiRMSqAARFwvKAuhNc3DiD6yk/SgD41uej9fflYbWvjRN4dD2xeQ/Z6We/H7gKdKPYzTynTj0osZnUcPq/An1opewevdjpPPYBwoTAa+ClYX3g4eMofJseLT/+60r0nS39xbbxxlUBdSmItqqoBEl853r8yBAfLA0aMGW47v1xeo62DI3lb";
            var rawRequest = Buffer.from(someRequest, 'base64');

            var paymentRequest = PaymentRequest.decode(rawRequest);
            assert.equal(paymentRequest.pkiType, pkiType);

            var paymentDetails = PaymentDetails.decode(paymentRequest.serializedPaymentDetails);
            assert.equal(paymentDetails.memo, memo);
            assert.equal(paymentDetails.network, network);
            assert.equal(paymentDetails.paymentUrl, paymentUrl);
            assert.equal(paymentDetails.outputs[0].amount, txOutVal);

            var script = Buffer.from(paymentDetails.outputs[0].script);
            assert.equal(script.toString('hex'), txOutScript.toString('hex'));

            var m = Buffer.from(paymentDetails.merchantData);
            assert.equal(m.toString('hex'), merchantData.toString('hex'));

            var x509 = X509Certificates.decode(paymentRequest.pkiData);
            assert.equal(x509.certificate.length, 2);

            cb();
        });
    });
});
