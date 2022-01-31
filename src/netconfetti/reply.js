"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rpcError_1 = require("./rpcError");
class Reply {
    constructor(result, raw) {
        this.messageId = result.$["message-id"];
        this.data = result;
        this.errors = (result["rpc-error"] || []).map((err) => new rpcError_1.default(err));
        this.raw = raw;
    }
}
exports.default = Reply;
