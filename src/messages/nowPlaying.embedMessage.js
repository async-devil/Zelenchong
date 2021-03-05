const { VoiceConnection, TextChannel, VoiceChannel, Message } = require('discord.js');
/**
 * @param {Message} msg Message which has been called command
 * @param {{title: String, url: String, thumbnail: String, duration: String, type: String}} song Song which is playing
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
      title: 'Now Playing',
      description: `[${song.title}](${song.url})`,
      url: 'https://github.com/async-devil/Zelenchong',
      color: color,
      thumbnail: {
        url: `${song.thumbnail}`,
      },
      fields: [
        {
          name: '`Length:`',
          value: `${song.duration}`,
        },
        {
          name: '`Requested by:`',
          value: `${msg.author.username}`,
        },
        {
          name: '`Next in queue:`',
          value: `${queue.songs[1] ? queue.songs[1].title : 'Nothing'}`,
        },
      ],
    },
  };
};
