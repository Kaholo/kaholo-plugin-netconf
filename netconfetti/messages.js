Object.defineProperty(exports, "__esModule", { value: true });
const xml2js = require("xml2js");

exports.ncNS = "urn:ietf:params:xml:ns:netconf:base:1.0";
exports.yangNS = "urn:ietf:params:xml:ns:yang:1";
exports.withDefaultsNS = "urn:ietf:params:xml:ns:yang:ietf-netconf-with-defaults";
exports.changeNamespace = (namespaceName, n) => {
  if (namespaceName === "netconf") {
    exports.ncNS = n;
  } else if (namespaceName === "yang") {
    exports.yangNS = n;
  } else if (namespaceName === "withDefaults") {
    exports.withDefaultsNS = n;
  }
}
const builderOptions = {
  renderOpts: {
    pretty: false,
  },
};
function hello(capabilities) {
  const xmlBuilder = new xml2js.Builder(builderOptions);
  const xml = xmlBuilder.buildObject({
    hello: {
      $: {
        xmlns: exports.ncNS,
      },
      capabilities: ["urn:ietf:params:netconf:base:1.1", ...capabilities].map((capability) => ({ capability })),
    },
  });
  return `${xml}\n]]>]]>`;
}
exports.hello = hello;
function rpc(messageId, message) {
  const xmlBuilder = new xml2js.Builder(builderOptions);
  const xml = xmlBuilder.buildObject({
    rpc: {
      $: {
        "message-id": messageId,
        xmlns: exports.ncNS,
      },
      ...message,
    },
  });
  return `\n#${xml.length}\n${xml}\n##\n`;
}
exports.rpc = rpc;
function subscription(notifications) {
  const filter = {
    $: {
      type: "subtree",
    },
  };
  for (const n of notifications) {
    filter[n] = {
      $: {
        xmlns: "urn:ietf:params:xml:ns:yang:ietf-netconf-notifications",
      },
    };
  }
  return {
    "create-subscription": {
      $: {
        xmlns: "urn:ietf:params:xml:ns:netconf:notification:1.0",
      },
      filter,
    },
  };
}
exports.subscription = subscription;
