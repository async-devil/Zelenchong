const Discord = require('discord.js');
require('dotenv').config();

const Play = require('./Play');
const clear = require('./clear');

const client = new Discord.Client();
client.login(process.env.TOKEN);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', (msg) => {
  if (msg.content === '=ping') {
    const timeTaken = Date.now() - msg.createdTimestamp;
    msg.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
  }
})

clear(client)

const queue = new Play.Queue()

const player = new Play.Player(client, queue)
player.init()