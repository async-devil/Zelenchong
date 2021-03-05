const { VoiceConnection, TextChannel, VoiceChannel, Message } = require('discord.js');
/**
 * @param {Message} msg Message which has been called command
 * @param {{title: String, url: String, thumbnail: String, duration: String, type: String}} song Song which has been added to queue
 * @param {{textChannel: TextChannel,
 * voiceChannel: VoiceChannel,
 * connection: VoiceConnection,
 * songs: Array<{title: String, url: String, thumbnail: String, duration: String, type: String}>,
 * volume: Number,
 * playing: Boolean}} queue Queue
 * @param {Number} color Decimal color of left vertical line
 */
module.exports = (msg, song, queue, color) => {
  return {
    embed: {
      title: `${song.title}`,
      url: `${song.url}`,
      color: color,
      thumbnail: {
        url: `${song.thumbnail}`,
      },
      author: {
        name: 'Added to queue',
        url: 'https://github.com/async-devil/Zelenchong',
        icon_url: `${msg.author.displayAvatarURL()}`,
      },
      fields: [
        {
          name: '`Video duration:`',
          value: `${song.duration}`,
        },
        {
          name: '`Position in queue`',
          value: `${queue.songs.length - 1}`,
        },
      ],
    },
  };
};
