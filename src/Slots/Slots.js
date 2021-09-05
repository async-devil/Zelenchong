const message = require('../messages/message.embedMessage');

class Slots {
  _emojis = [
    ':four_leaf_clover:',
    ':blueberries:',
    ':cherries:',
    ':kiwi:',
    ':seven:',
    ':crown:',
    ':peach:',
  ];

  constructor(client, config) {
    this.client = client;
    this.config = config;
    this.serversLuck = new Map();
  }

  /*------------------------------------------------------------------------------------------*/
  /**
   * @param {number} luck luck parametr from 0 to 1
   * @returns {Array<string>} first, second and third emojis
   */
  cheat(luck) {
    let first, second, third;
    /** @param {number} target value */
    const randomValue = Math.random();

    first = this.getRandomEmoji();

    second = luck > randomValue ? first : this.getRandomEmoji();
    third = luck / 2 > randomValue ? first : this.getRandomEmoji();

    return [first, second, third];
  }
  /*------------------------------------------------------------------------------------------*/

  spin(msg) {
    const guildLuck = this.serversLuck.get(msg.guild.id);

    const [first, second, third] = this.cheat(guildLuck);
    const win = first === second && second === third;

    msg.channel.send({
      embed: {
        color: this.config.color,
        fields: [
          {
            name: `${first} ${second} ${third}`,
            value: win ? 'You lucky one' : 'Give your money',
          },
        ],
      },
    });

    if (win) {
      this.serversLuck.set(msg.guild.id, 0);
    } else {
      this.serversLuck.set(msg.guild.id, guildLuck + 0.05);
    }
  }

  getRandomEmoji = () => this._emojis[Math.floor(Math.random() * 6)];

  /** @param {Array<string>} emojiList List of discord emojis*/
  set emojis(emojiList) {
    this._emojis = emojiList;
  }

  init() {
    this.client.on('message', (msg) => {
      if (msg.author.bot) return;
      if (msg.guild === null) return;
      if (!msg.content.startsWith(this.config.prefix)) return;

      const commandBody = msg.content.slice(this.config.prefix.length);
      const args = commandBody.split(' ');
      const command = args.shift().toLowerCase();

      if (!this.serversLuck.has(msg.guild.id)) this.serversLuck.set(msg.guild.id, 0);

      if (command === 'spin' || command === 'roll') {
        this.spin(msg);
      }
    });
  }
}

module.exports = Slots;
