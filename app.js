const netconfetti = require("./netconfetti");
const { formatXml } = require("./helpers");

async function getConfig({ params }) {
  const {
    host, port, username, password, datastoreSrc,
  } = params;
  const netconfClient = new netconfetti.Client();

  await netconfClient.connect({
    host,
    port: +port,
    password,
    username,
  });

  const reply = await netconfClient.rpc({
    "get-config": {
      source: {
        [datastoreSrc]: {},
      },
    },
  });

  return formatXml(reply.rawXML, "  ");
}

async function editConfig() {
  return true;
}

module.exports = {
  getConfig,
  editConfig,
};
