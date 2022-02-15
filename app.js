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
    await fs.writeFile(filepath, prettyXML);
  }

  return getReply.sshFrames || escapeHTML(prettyXML);
}

async function editConfig({ params }) {
  const {
    operation, outPath, xmlPath,
  } = params;

  const datastore = params.targetDatastore ?? "candidate";

  const authOptions = mapAuthOptions(params);

  const config = await loadXmlFromFile(xmlPath);

  const netconfClient = new NetconfClient();

  await netconfClient.connect(authOptions);

  await netconfClient.lockDatastore(datastore);

  const editReply = await netconfClient.editConfig({
    config,
    operation,
    datastore,
  });
  checkReply(editReply);

  await netconfClient.commit();

  await netconfClient.unlockDatastore(datastore);

  netconfClient.close();

  const prettyXML = prettifyXml(editReply.rawXML);

  if (outPath) {
    await fs.writeFile(outPath, prettyXML);
  }

  return editReply.sshFrames || escapeHTML(prettyXML);
}

module.exports = {
  getConfig,
  editConfig,
};
