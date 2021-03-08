const { Client } = require('discord.js');

const execute = require('./execute');
const commands = require('./commands')

/** Discord music bot player*/
class Player {
  /** @param {Map} queue Server queue */
  queue = new Map();

  /**
   * @param {Client} client Discord client
   * @param {{color: Number, prefix: String | Number, dev: Boolean}} config Bot configuration settings
   */
  constructor(client, config) {
    this.client = client;
    this.config = config
  }

  /** Initialize bot commands */
  init() {
    this.client.on('message', (msg) => {
      if (msg.author.bot) return;
      if (!msg.content.startsWith(this.config.prefix)) return;

      const commandBody = msg.content.slice(this.config.prefix.length);
      const args = commandBody.split(' ');
      const command = args.shift().toLowerCase();

      if (command === 'play' || command === 'p') {
        execute(msg, args, this.queue, this.config);
        return;
      }
      if (command === 'skip' || command === 'fs') {
        return commands.skip(msg, this.queue);
      }
      if (command === 'stop') {
        return commands.stop(msg, this.queue, this.client);
      }
      if (command === 'pause') {
        return commands.pause(msg, this.queue);
      }
      if (command === 'resume') {
        return commands.resume(msg, this.queue);
      }
      if (command === 'reverse') {
        return commands.reverse(msg, this.queue);
      }
      if (command === 'shuffle' || command === 'mix') {
        return commands.shuffle(msg, this.queue);
      }
    });
  }
}
module.exports = Player;
