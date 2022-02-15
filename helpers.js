const fs = require("fs/promises");
const xml2js = require("xml2js");

const DEFAULT_PORT = 830;

// from https://stackoverflow.com/a/49458964/13269713
function prettifyXml(xml, tabChar = "  ") {
  let formatted = "";
  let indent = "";
  const tab = tabChar || "\t";
  xml.split(/>\s*</).forEach((node) => {
    if (node.match(/^\/\w/)) { indent = indent.substring(tab.length); }
    formatted += `${indent}<${node}>\r\n`;
    if (node.match(/^<?\w[^>]*[^/]$/)) { indent += tab; }
  });
  return formatted.substring(1, formatted.length - 3);
}

/**
 * Maps the params to the authentication object
 * @param {{
 *  host: string,
 *  username: string,
 *  password?: string,
 *  sshKey?: string,
 *  port?: number
 * }} params
 * @returns {{
 *  host: string,
 *  username: string,
 *  port: number
 * }}
 */
function mapAuthOptions(params) {
  const {
    host, username, password, sshKey,
  } = params;
  const port = +(params.port ?? DEFAULT_PORT);
  // prioritize ssh key over password
  const authentication = sshKey ? { privateKey: Buffer.from(sshKey) } : { password };

  return {
    host,
    port,
    username,
    ...authentication,
  };
}

/**
 * Loads and parses XML from file
 * @param {string} path
 * @returns {Object}
 */
async function loadXmlFromFile(path) {
  const fileContent = await fs.readFile(path);
  return xml2js.parseStringPromise(fileContent);
}

class NetconfError extends Error {
  constructor(errors) {
    super("NETCONF Reply contains errors");
    this.errors = errors;
  }
}

/**
 * Checks if the NETCONF reply does not contain any errors etc.
 * @param {{
 *  parsedObject: Object,
 *  rawXML: string,
 *  sshFrames?: string[]
 * }} reply
 * @param {{
 *  ignore?: string[]
 * }} options
 */
function checkReply(reply, options = {}) {
  if (reply.sshFrames) {
    throw new Error(`Received incorrect NETCONF Reply: ${reply.sshFrames.join(";")}`);
  }
  const errorsToIgnore = options.ignore || [];
  if (reply.parsedObject["rpc-error"]) {
    const errors = reply.parsedObject["rpc-error"]
      .map((error) => ({
        type: error["error-type"][0],
        tag: error["error-tag"][0],
        severity: error["error-severity"][0],
        message: error["error-message"][0]._,
      }))
      .filter(({ tag }) => !errorsToIgnore.includes(tag));
    if (errors.length) {
      throw new NetconfError(errors);
    }
  }
}

module.exports = {
  prettifyXml,
  mapAuthOptions,
  loadXmlFromFile,
  checkReply,
};
