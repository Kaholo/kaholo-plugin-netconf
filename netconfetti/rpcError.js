"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RPCError extends Error {
    constructor(error) {
        super((error["error-message"] || [])[0] || "RPC Error");
        this.type = (error["error-type"] || [])[0];
        this.tag = (error["error-tag"] || [])[0];
        this.severity = (error["error-severity"] || [])[0];
        this.originalError = error;
    }
}
exports.default = RPCError;
