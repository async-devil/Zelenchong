const { VoiceConnection, Message, TextChannel, VoiceChannel } = require('discord.js');
const ytdl = require('ytdl-core');

const nowPlaying = require('../messages/nowPlaying.embedMessage');
const message = require('../messages/message.embedMessage');

const selectStreamType = (song) => {
  switch (song.type) {
    case 'Youtube':
      return ytdl(song.url);
    case 'Radio':
      return song.url;
  }
};

/**
 * Create stream to voice channel
 * @param {Message} msg Discord message which had called function
 * @param {{title: String, url: String, thumbnail: String, duration: String, type: String}} song Song to play
 * @param {Map<{textChannel: TextChannel,
 * voiceChannel: VoiceChannel,
 * connection: VoiceConnection,
 * songs: Array<{title: String, url: String, thumbnail: String, duration: String, type: String}>,
 * volume: Number,
 * playing: Boolean}>} queue Bot queue
 * @param {{color: Number, prefix: String | Number, dev: Boolean}} config Bot configuration settings
 * @return {Void} Messages to chat
 */
module.exports = function play(msg, song, queue, config) {
  const serverQueue = queue.get(msg.channel.guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(msg.channel.guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(selectStreamType(song))
    .on('finish', () => {
      serverQueue.songs.shift();
      play(msg, serverQueue.songs[0], queue, config);
    })
    .on('start', () => msg.channel.send(nowPlaying(msg, song, serverQueue, config.color)))
    .on('error', (err) => {
      //* Deletes queue to prevent errors with connection
      queue.delete(msg.guild.id);

      if (config.dev) console.error(err);
      return msg.channel.send(message(`:x: Something went wrong: ${err.message}`, '#CC0000'));
    });
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
};
