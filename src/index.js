const Discord = require('discord.js');
require('dotenv').config();

const Player = require('./Player/Player');
const clear = require('./clear');
const help = require('./messages/help.embedMessage');
const message = require('./messages/message.embedMessage');
const helpCommands = require('./parseHelp');
const config = require('./config');

const client = new Discord.Client();
client.login(process.env.TOKEN);

const serversConfig = new Map();
let commands;

/**
 * Deep clone of object
 * @param {Object} obj
 */
const clone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({
    activity: {
      name: `${config.prefix}help`,
      type: 'WATCHING',
      url: 'https://github.com/async-devil/Zelenchong',
    },
    status: 'online',
  });

  const player = new Player(client, config);
  player.init();
});

client.on('message', (msg) => {
  if (msg.author.bot) return;
  if (msg.guild === null) return;
  if (!msg.content.startsWith(config.prefix)) return;

  let serverConfig = serversConfig.get(msg.guild.id);
  if (!serverConfig) {
    //? Map.set sets reference to obj
    serversConfig.set(msg.guild.id, clone(config));
    serverConfig = clone(config);
  }

  const commandBody = msg.content.slice(serverConfig.prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();

  if (command === 'ping') {
    return msg.channel.send(
      message(
        `Pong! This message had a latency of \`${Date.now() - msg.createdTimestamp}\`ms :timer:`,
        serverConfig.color,
      ),
    );
  }

  if (command == 'help' || command == 'h') {
    if (!commands)
      helpCommands(serverConfig.prefix).then((data) => {
        commands = data;
        return msg.reply(help(serverConfig.color, commands));
      });
    else return msg.reply(help(serverConfig.color, commands));
  }

  if (command === 'clear' || command === 'c') {
    return clear(client, msg, args, serverConfig.color);
  }

  if (command === 'color') {
    let hex = args[0].toUpperCase();

    if (!/(^[A-F0-9]{6})|(^#[A-F0-9]{6})/gm.test(hex))
      return msg.channel.send(message(`:x: Invalid hex number`, '#CC0000'));
    if (hex.startsWith('#')) hex = hex.slice(1);

    try {
      serversConfig.get(msg.guild.id).color = `0x${hex}`;
      msg.channel.send(
        message(
          `:paintbrush: Succsessfuly set color to #${hex}`,
          serversConfig.get(msg.guild.id).color,
        ),
      );
    } catch (err) {
      if (serverConfig.dev) console.err(err);
      return msg.channel.send(message(`:x: Something went wrong: ${err.message}`, '#CC0000'));
    }
    return;
  }
  if (command === 'birthday') {
    const birthday = new Date(2020, 7, 6);
    const now = new Date();
    const daysFrom = (now.getTime() - Date.parse(birthday)) / (1000 * 60 * 60 * 24);

    if (now.getDate() === 6 && now.getMonth() === 7)
      return msg.channel.send(
        message(`:birthday: My birthday is today! Hurray! :fireworks:`, serverConfig.color),
      );

    return msg.channel.send(
      message(
        `:birthday: My birthday is: __06.08.20__, it was **${~~daysFrom}** days ago`,
        serverConfig.color,
      ),
    );
  }
});
