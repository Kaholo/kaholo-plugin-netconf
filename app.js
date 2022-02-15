const escapeHtml = require("escape-html");
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

  if (filepath) {
    await fs.writeFile(filepath, prettifyXml(getReply.rawXML));
  }

  return getReply.sshFrames || escapeHtml(getReply.rawXML);
}

async function editConfig({ params }) {
  const {
    operation, outPath, xmlPath,
  } = params;

  const authOptions = mapAuthOptions(params);

  const config = loadXmlFromFile(xmlPath);

  const netconfClient = new NetconfClient();

  await netconfClient.connect(authOptions);

  await netconfClient.lockDatastore("running");

  await netconfClient.deleteConfig("candidate");

  const editReply = await netconfClient.editConfig({
    config,
    operation,
  });
  checkReply(editReply);

  await netconfClient.commit();

  await netconfClient.unlockDatastore("running");

  netconfClient.close();

  if (outPath) {
    await fs.writeFile(outPath, prettifyXml(editReply.rawXML));
  }

  return editReply.sshFrames || escapeHtml(editReply.rawXML);
}

module.exports = {
  getConfig,
  editConfig,
};
