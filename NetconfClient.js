const netconfetti = require("@128technology/netconfetti/");
const messages = require("@128technology/netconfetti/dist/messages");
const framing = require("@128technology/netconfetti/dist/deliminators");

class NetconfClient extends netconfetti.Client {
  constructor() {
    super();
    this.sshFrames = [];
  }

  close() {
    return this.sshClient.end();
  }

  getConfig(datastore) {
    return this.rpc({
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
    return this.rpc({
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
    return this.rpc({
      commit: {},
    });
  }

  lockDatastore(target) {
    return this.rpc({
      lock: {
        target: {
          [target]: {},
        },
      },
    });
  }

  unlockDatastore(target) {
    return this.rpc({
      unlock: {
        target: {
          [target]: {},
        },
      },
    });
  }

  deleteConfig(targetDatastore) {
    return this.rpc({
      "delete-config": {
        target: {
          [targetDatastore]: {},
        },
      },
    });
  }

  validate(datastore) {
    return this.rpc({
      validate: {
        source: {
          [datastore]: {},
        },
      },
    });
  }

  rpc(message) {
    return new Promise((resolve, reject) => {
      if (!this.activeChannel) {
        throw new Error("Client not connected");
      }
      const messageId = this.idGenerator();
      const msg = messages.rpc(messageId, typeof message === "string" ? { [message]: {} } : message);
      let msgRecv;
      const timeoutId = setTimeout(() => {
        this.removeListener("reply", msgRecv);
        clearTimeout(timeoutId);
        reject(new Error("Timeout waiting for response"));
      }, this.timeout);
      msgRecv = (reply) => {
        if (reply.sshFrames) {
          return resolve({ rawXML: "", parsedObject: {}, sshFrames: reply.sshFrames });
        }
        const receivedMessageId = reply.parsedObject.$["message-id"];
        if (receivedMessageId !== messageId) {
          return false;
        }
        this.removeListener("reply", msgRecv);
        clearTimeout(timeoutId);
        return resolve(reply);
      };
      this.on("reply", msgRecv);
      this.activeChannel.write(msg);
    });
  }

  async processData(buffer) {
    const frame = buffer.toString();
    this.sshFrames.push(frame);

    if (!framing.endFrame.test(frame)) {
      this.receiveBuffer += frame.replace(framing.beginFrame, "");
      return;
    }
    this.receiveBuffer += frame.replace(framing.beginFrame, "").match(framing.endFrame)[0];

    try {
      const data = await this.parser.parseStringPromise(this.receiveBuffer);
      this.emit("reply", { rawXML: this.receiveBuffer, parsedObject: data["rpc-reply"] });
      this.receiveBuffer = "";
      this.sshFrames = [];
    } catch {
      this.emit("reply", { sshFrames: this.sshFrames });
      this.receiveBuffer = "";
      this.sshFrames = [];
    }
  }
}

module.exports = NetconfClient;
