var protobuf = require("protobufjs")

var root = protobuf.Root.fromJSON(require("./protofile.json"));

function NewRequest() {
    console.log(root);
}

module.exports = {
    NewRequest: NewRequest
};
