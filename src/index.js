const Discord = require('discord.js');
require('dotenv').config();

const Player = require('./Play');
const clear = require('./clear');

const client = new Discord.Client();
client.login(process.env.TOKEN);

const prefix = '='

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  clear(client, prefix);

  const player = new Player(client, prefix);
  player.init();
});

client.on('message', (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(prefix)) return;

  const commandBody = msg.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();

  if (command == 'ping') {
    msg.reply(`Pong! This message had a latency of \`${Date.now() - msg.createdTimestamp}\`ms.`);
  }

  if(command == 'help') {
    msg.reply(`Here is list of existing commands: \n\`\`\`${
      prefix
    }clear (Number of messages)\n${
      prefix
    }play (Youtube url or string to search)\n${
      prefix
    }skip\n${
      prefix
    }stop\n${
      prefix
    }radio (Online radio url)\n${
      prefix
    }ping\`\`\``)
  }
})