const config = require('../config');
const dev = config.dev;

const { VoiceConnection, Message, Client } = require('discord.js');
/**
   * Join voice channel where message author has been connected
   * @param {Message} msg Discord message which had called function
   * @param {Client} client Bot
   * @return {Promise<VoiceConnection>} Voice connection of joined channel
   */
  module.exports = async function join(msg, client) {
    const bot = msg.guild.members.cache.get(client.user.id);

    if (!msg.member.voice.channel) {
      return msg.channel.send('**Please join voice channel first**');
    }

    let connection, joinMessage;
    //* If bot is not connected or bot connected to other voice channel
    if (!bot.voice.channel || bot.voice.channelID != msg.member.voice.channelID) {
      await msg.channel
        .send(`**Trying to join** \`${msg.member.voice.channel.name}\``)
        .then((message) => {
          joinMessage = message;
        });
    }
    try {
      connection = msg.member.voice.channel.join();
      if (joinMessage) {
        joinMessage.edit(`**Joined** \`${msg.member.voice.channel.name}\``);
      }
    } catch (err) {
      if (dev) console.error(err);
      return msg.channel.send(`**Something went wrong:** \`${err.message}\``);
    }
    return connection;
  }