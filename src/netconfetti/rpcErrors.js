"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RPCErrors extends Error {
    constructor(errors) {
        const message = errors.length === 1
            ? errors[0].message
            : `Multiple errors: ${errors.map(x => x.message).join(", ")}.`;
        super(message);
        this.errors = errors;
    }
}
exports.default = RPCErrors;
