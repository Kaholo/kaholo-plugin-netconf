const netconfetti = require("@128technology/netconfetti");

class NetconfClient extends netconfetti.Client {
  constructor() {
    super();
    this.sshFrames = [];
    this.xmlBuffer = "";
    this.framesDefinitions = {
      beginFrame: /\n#(\d*)\n/,
      endFrame: /(.|\n)+(?=\n##)/,
    };
  }

  close() {
    return this.sshClient.end();
  }

  getConfig(datastore) {
    return this.rpcCall({
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
    return this.rpcCall({
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
    return this.rpcCall({
      commit: {},
    });
  }

  lockDatastore(target) {
    return this.rpcCall({
      lock: {
        target: {
          [target]: {},
        },
      },
    });
  }

  unlockDatastore(target) {
    return this.rpcCall({
      unlock: {
        target: {
          [target]: {},
        },
      },
    });
  }

  deleteConfig(targetDatastore) {
    return this.rpcCall({
      "delete-config": {
        target: {
          [targetDatastore]: {},
        },
      },
    });
  }

  validate(datastore) {
    return this.rpcCall({
      validate: {
        source: {
          [datastore]: {},
        },
      },
    });
  }

  async rpcCall(msg) {
    try {
      const { reply: parsedObject, data: rawXML } = await this.rpc(msg);
      return { parsedObject, rawXML };
    } catch {
      return { sshFrames: [...this.sshFrames] };
    } finally {
      this.sshFrames = [];
    }
  }

  async processData(buffer) {
    const frame = buffer.toString();
    this.sshFrames.push(frame);

    if (!this.framesDefinitions.endFrame.test(frame)) {
      this.xmlBuffer += frame.replace(this.framesDefinitions.beginFrame, "");
      return;
    }
    this.xmlBuffer += frame.replace(this.framesDefinitions.beginFrame, "").match(this.framesDefinitions.endFrame)[0];

    try {
      const data = await this.parser.parseStringPromise(this.xmlBuffer);
      this.emit("reply", {
        reply: data["rpc-reply"],
        data: this.xmlBuffer,
        messageId: data["rpc-reply"].$["message-id"],
        errors: [],
      });
    } catch (e) {
      this.emit("reply", { errors: [e] });
    } finally {
      this.xmlBuffer = "";
    }
  }
}

module.exports = NetconfClient;
