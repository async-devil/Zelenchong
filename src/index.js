const Discord = require('discord.js');
require('dotenv').config();

const Player = require('./Play');
const clear = require('./clear');

const client = new Discord.Client();
client.login(process.env.TOKEN);

const prefix = '='

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({
    status: 'online',
    activity: {
      name: `${prefix}help`,
      type: 2,
      url: 'https://github.com/async-devil/Zelenchong',
    },
  });
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
    msg.reply({
      embed: {
        title: 'Help page',
        description: 'Here is list of existing commands: ',
        url: 'https://github.com/async-devil/Zelenchong',
        color: 942019,
        footer: {
          text: 'Thanks for using!',
        },
        thumbnail: {
          url: 'https://img.icons8.com/ios/452/help.png',
        },
        fields: [
          {
            name: 'Video or audio player',
            value: '=play `stream link or something to search on Youtube`',
          },
          {
            name: 'Stop player',
            value: '=stop',
          },
          {
            name: 'Skip current song',
            value: '=skip',
          },
          {
            name: 'Pause player',
            value: '=pause `works correct only on radio streams`',
          },
          {
            name: 'Resume player',
            value: '=resume `works correct only on radio streams`',
          },
          {
            name: 'Message cleaner',
            value: '=clear `number of messages to clear`',
          },
        ],
      },
    });
  }
})