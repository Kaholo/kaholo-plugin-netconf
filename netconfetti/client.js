Object.defineProperty(exports, "__esModule", { value: true });
const events = require("events");
const ssh2 = require("ssh2");
const uuid = require("uuid");
const xml2js = require("xml2js");
const framing = require("./deliminators");
const messages = require("./messages");
const notification_1 = require("./notification");
const reply_1 = require("./reply");
const rpcErrors_1 = require("./rpcErrors");

class Client extends events.EventEmitter {
  constructor(options = {}) {
    super();
    this.sshClient = new ssh2.Client();
    this.receiveBuffer = "";
    this.idGenerator = options.idGenerator || (() => uuid.v1());
    this.timeout = options.timeout || 1000 * 60;
    this.capabilities = options.capabilities || [];
    this.parser = new xml2js.Parser({
      attrNameProcessors: [xml2js.processors.stripPrefix],
      tagNameProcessors: [xml2js.processors.stripPrefix],
    });
  }

  connect(options) {
    this.disconnect();
    const connectTimeout = options.connectTimeout || 20000;
    const connect = new Promise((resolve, reject) => {
      this.sshClient.once("error", reject);
      this.sshClient.once("ready", resolve);
      this.sshClient.connect(options);
    })
      .then(() => new Promise((resolve, reject) => {
        this.sshClient.subsys("netconf", (err, chan) => (err ? reject(err) : resolve(chan)));
      }))
      .then((channel) => new Promise((resolve) => {
        let buffer = "";
        channel.on("data", (data) => {
          buffer += data.toString();
          if (framing.endHello.test(buffer)) {
            resolve(channel);
          }
        });
        channel.write(messages.hello(this.capabilities));
      }))
      .then((channel) => {
        channel.removeAllListeners();
        this.sshClient.removeAllListeners();
        this.activeChannel = channel;
        this.sshClient.on("error", (err) => this.emit("error", err));
        this.sshClient.on("end", () => this.disconnect());
        this.sshClient.on("close", (hadError) => this.emit("close", hadError));
        channel.on("data", (data) => this.processData(data));
      });
    let timeoutTimer;
    const timeout = new Promise((resolve, reject) => {
      timeoutTimer = setTimeout(() => reject(new Error("Timeout waiting for NetConf client to connect.")), connectTimeout);
    });
    return Promise.race([connect, timeout])
      .catch((err) => {
        this.disconnect();
        clearTimeout(timeoutTimer);
        return Promise.reject(err);
      })
      .then(() => {
        clearTimeout(timeoutTimer);
        return this;
      });
  }

  disconnect() {
    if (this.activeChannel) {
      this.activeChannel.removeAllListeners();
      this.activeChannel.close();
      this.activeChannel = undefined;
    }
    this.sshClient.removeAllListeners();
    this.sshClient.end();
    this.receiveBuffer = "";
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
        const receivedMessageId = reply.parsedObject.$["message-id"];
        if (receivedMessageId !== messageId) { return; }
        this.removeListener("reply", msgRecv);
        clearTimeout(timeoutId);
        if (reply.parsedObject.errors?.length > 0) {
          reject(new rpcErrors_1.default(reply.errors));
        } else {
          resolve(reply);
        }
      };
      this.on("reply", msgRecv);
      this.activeChannel.write(msg);
    });
  }

  subscribe(notifications) {
    return this.rpc(messages.subscription(notifications));
  }

  async processData(buffer) {
    const s = String(buffer.toString().trim().replace(/^#[0-9]+$/gm, "").trim());
    if (s == "") { return; }
    this.receiveBuffer += s;

    const endingTag = "</rpc-reply>";
    if (!s.includes(endingTag)) { return; }
    this.receiveBuffer = this.receiveBuffer.trim().substring(0, this.receiveBuffer.indexOf(endingTag) + endingTag.length);

    const data = await this.parser.parseStringPromise(this.receiveBuffer);
    this.emit("reply", { rawXML: this.receiveBuffer, parsedObject: data["rpc-reply"] });
  }
}
exports.default = Client;
