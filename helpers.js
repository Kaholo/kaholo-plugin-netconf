const escapeHTML = require("escape-html");
const fs = require("fs/promises");
const xml2js = require("xml2js");
const { RPCError, RPCErrors } = require("@128technology/netconfetti");

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
 * Checks if path exists
 * @param {string} path
 */
async function pathExists(path) {
  try {
    await fs.access(path);
  } catch {
    return false;
  }
  return true;
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
  if (!await pathExists(path)) {
    throw new Error(`Path ${path} does not exist.`);
  }
  const fileContent = await fs.readFile(path);
  return xml2js.parseStringPromise(fileContent);
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
      .map((error) => new RPCError(error, escapeHTML(reply.rawXML)))
      .filter(({ tag }) => !errorsToIgnore.includes(tag));
    if (errors.length) {
      throw new RPCErrors(errors);
    }
  }
}

module.exports = {
  prettifyXml,
  mapAuthOptions,
  loadXmlFromFile,
  checkReply,
};
