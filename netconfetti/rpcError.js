Object.defineProperty(exports, "__esModule", { value: true });
class RPCError extends Error {
  constructor(error, xml) {
    super(((error["error-message"] || [{}])[0]._ || JSON.stringify(error["error-info"])) || "RPC Error");
    this.type = (error["error-type"] || [])[0];
    this.tag = (error["error-tag"] || [])[0];
    this.severity = (error["error-severity"] || [])[0];
    this.originalError = JSON.stringify(error);
    this.xml = xml;
  }
}
exports.default = RPCError;
