const escapeHTML = require("escape-html");
const fs = require("fs/promises");
const {
  prettifyXml, mapAuthOptions, loadXmlFromFile, checkReply,
} = require("./helpers");
const NetconfClient = require("./NetconfClient");

async function getConfig({ params }) {
  const {
    sourceDatastore, filepath,
  } = params;

  const authOptions = mapAuthOptions(params);
  const netconfClient = new NetconfClient();
  await netconfClient.connect(authOptions);
  const getReply = await netconfClient.getConfig(sourceDatastore);
  checkReply(getReply);
  netconfClient.close();

  const prettyXML = prettifyXml(getReply.rawXML);
  if (filepath) {
    await fs.writeFile(filepath.trim(), prettyXML);
  }
  return escapeHTML(prettyXML);
}

async function editConfig({ params }) {
  const {
    operation, outPath, xmlPath,
  } = params;

  const datastore = params.targetDatastore ?? "candidate";
  const authOptions = mapAuthOptions(params);
  const config = await loadXmlFromFile(xmlPath.trim());
  const netconfClient = new NetconfClient();
  await netconfClient.connect(authOptions);
  const lockReply = await netconfClient.lockDatastore(datastore);
  checkReply(lockReply);
  const editReply = await netconfClient.editConfig({
    config,
    operation,
    datastore,
  });
  checkReply(editReply);
  const commitReply = await netconfClient.commit();
  checkReply(commitReply);
  const unlockReply = await netconfClient.unlockDatastore(datastore);
  checkReply(unlockReply);
  netconfClient.close();

  const prettyXML = prettifyXml(editReply.rawXML);
  if (outPath) {
    await fs.writeFile(outPath, prettyXML);
  }
  return escapeHTML(prettyXML);
}

module.exports = {
  getConfig,
  editConfig,
};
