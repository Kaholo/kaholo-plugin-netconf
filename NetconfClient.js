const netconfetti = require("./netconfetti");

class NetconfClient {
  constructor() {
    this.netconfetti = new netconfetti.Client();
    this.connected = false;
  }

  connect(auth) {
    return this.netconfetti.connect(auth);
  }

  close() {
    return this.netconfetti.sshClient.end();
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

  editConfig({ config, operation }) {
    return this.netconfetti.rpc({
      "edit-config": {
        target: {
          candidate: {},
        },
        "default-operation": operation,
        config,
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
