const netconfetti = require("./netconfetti");
const {
  ncNS, changeNamespace, yangNS, withDefaultsNS,
} = require("./netconfetti/messages");

class NetconfClient {
  constructor() {
    this.netconfetti = new netconfetti.Client();
    this.netconfNamespace = ncNS;
    this.yangNamespace = yangNS;
    this.withDefaulstNamespace = withDefaultsNS;
  }

  connect(auth) {
    return this.netconfetti.connect(auth);
  }

  close() {
    return this.netconfetti.sshClient.end();
  }

  changeNetconfNamespace(namespace) {
    this.netconfNamespace = namespace;
    changeNamespace("netconf", namespace);
  }

  changeYangNamespace(namespace) {
    this.yangNamespace = namespace;
    changeNamespace("yang", namespace);
  }

  changeWithDefaultsNamespace(namespace) {
    this.withDefaultsNamespace = namespace;
    changeNamespace("withDefaults", namespace);
  }

  getConfig(datastore) {
    return this.netconfetti.rpc({
      "get-config": {
        source: {
          [datastore]: {},
        },
      },
    });
  }

  editConfig({ config, operation, datastore }) {
    if (!config.config) {
      throw new Error("Invalid XML format. The root tag must be \"config\".");
    }
    return this.netconfetti.rpc({
      "edit-config": {
        target: {
          [datastore]: {},
        },
        "default-operation": operation,
        ...config,
      },
    });
  }

  commit() {
    return this.netconfetti.rpc({
      commit: {},
    });
  }

  lockDatastore(target = "running") {
    return this.netconfetti.rpc({
      lock: {
        target: {
          [target]: {},
        },
      },
    });
  }

  unlockDatastore(target = "running") {
    return this.netconfetti.rpc({
      unlock: {
        target: {
          [target]: {},
        },
      },
    });
  }

  deleteConfig(targetDatastore) {
    return this.netconfetti.rpc({
      "delete-config": {
        target: {
          [targetDatastore]: {},
        },
      },
    });
  }

  validate(datastore) {
    return this.netconfetti.rpc({
      validate: {
        source: {
          [datastore]: {},
        },
      },
    });
  }
}

module.exports = NetconfClient;
