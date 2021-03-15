const { VoiceConnection, Message, TextChannel, VoiceChannel, Client } = require('discord.js');

const play = require('./play');
const join = require('./join');
const config = require('../config');
const message = require('../messages/message.embedMessage');

const dev = config.dev;
/**
 * Skip current song
 * @param {Message} msg Discord message which had called function
 * @param {Map<{textChannel: TextChannel,
 * voiceChannel: VoiceChannel,
 * connection: VoiceConnection,
 * songs: Array<{title: String, url: String, thumbnail: String, duration: String, type: String}>,
 * volume: Number,
 * playing: Boolean}>} queue Server queue
 * @return {Void} Messages to chat
 */
function skip(msg, queue) {
  const serverQueue = queue.get(msg.channel.guild.id);
  if (!msg.member.voice.channel)
    return msg.channel.send(message(':exclamation: Please join voice channel first', '#CC0000'));
  if (!serverQueue) return msg.channel.send(message(`:exclamation: Queue is empty!`, '#CC0000'));
  try {
    serverQueue.connection.dispatcher.end();
    msg.channel.send(message(`:next_track: Skipped successfuly`, '#4BB543'));
  } catch (err) {
    if (dev) console.error(err);
    return msg.channel.send(message(`:x: Something went wrong: ${err.message}`, '#CC0000'));
  }
}

/**
 * Skip current song
 * @param {Message} msg Discord message which had called function
 * @param {Map<{textChannel: TextChannel,
 * voiceChannel: VoiceChannel,
 * connection: VoiceConnection,
 * songs: Array<{title: String, url: String, thumbnail: String, duration: String, type: String}>,
 * volume: Number,
 * playing: Boolean}>} queue Server queue
 * @return {Void} Messages to chat
 */
function reverse(msg, queue) {
  const serverQueue = queue.get(msg.channel.guild.id);

  if (!msg.member.voice.channel)
    return msg.channel.send(message(':exclamation: Please join voice channel first', '#CC0000'));
  if (!serverQueue) return msg.channel.send(message(`:exclamation: Queue is empty!`, '#CC0000'));
  try {
    serverQueue.songs.reverse();
    msg.channel.send(message(`:repeat: Queue has been reversed!`, '#4BB543'));
  } catch (err) {
    if (dev) console.error(err);
    return msg.channel.send(message(`:x: Something went wrong: ${err.message}`, '#CC0000'));
  }
}

function shuffle(msg, queue) {
  const serverQueue = queue.get(msg.channel.guild.id);

  if (!msg.member.voice.channel)
    return msg.channel.send(message(':exclamation: Please join voice channel first', '#CC0000'));
  if (!serverQueue) return msg.channel.send(message(`:exclamation: Queue is empty!`, '#CC0000'));

  function arrayShuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  try {
    serverQueue.songs = arrayShuffle(serverQueue.songs);
    msg.channel.send(message(`:twisted_rightwards_arrows: Queue has been shuffled!`, '#4BB543'));
  } catch (err) {
    if (dev) console.error(err);
    return msg.channel.send(message(`:x: Something went wrong: ${err.message}`, '#CC0000'));
  }
}

/**
 * Pause voice stream (works correctly only on live streams)
 * @param {Message} msg Discord message which had called function
 * @param {Map<{textChannel: TextChannel,
 * voiceChannel: VoiceChannel,
 * connection: VoiceConnection,
 * songs: Array<{title: String, url: String, thumbnail: String, duration: String, type: String}>,
 * volume: Number,
 * playing: Boolean}>} queue Server queue
 * @return {Void} Messages to chat
 */
function pause(msg, queue) {
  const serverQueue = queue.get(msg.channel.guild.id);

  if (!msg.member.voice.channel)
    return msg.channel.send(message(':exclamation: Please join voice channel first', '#CC0000'));
  if (!serverQueue) return msg.channel.send(message(`:exclamation: Queue is empty!`, '#CC0000'));
  try {
    serverQueue.connection.dispatcher.pause();
    msg.channel.send(message(`:pause_button: Paused successfuly`, '#4BB543'));
  } catch (err) {
    if (dev) console.error(err);
    return msg.channel.send(message(`:x: Something went wrong: ${err.message}`, '#CC0000'));
  }
}

/**
 * Resume voice stream (works correctly only on live streams)
 * @param {Message} msg Discord message which had called function
 * @param {Map<{textChannel: TextChannel,
 * voiceChannel: VoiceChannel,
 * connection: VoiceConnection,
 * songs: Array<{title: String, url: String, thumbnail: String, duration: String, type: String}>,
 * volume: Number,
 * playing: Boolean}>} queue Server queue
 * @return {Void} Messages to chat
 */
function resume(msg, queue) {
  const serverQueue = queue.get(msg.channel.guild.id);
  if (!msg.member.voice.channel)
    return msg.channel.send(message(':exclamation: Please join voice channel first', '#CC0000'));
  if (!serverQueue) return msg.channel.send(message(`:exclamation: Queue is empty!`, '#CC0000'));
  try {
    serverQueue.connection.dispatcher.resume();
    msg.channel.send(message(`:play_pause: Resumed successfuly`, '#4BB543'));
    play(msg, serverQueue.songs[0], queue, config);
  } catch (err) {
    if (dev) console.error(err);
    return msg.channel.send(message(`:x: Something went wrong: ${err.message}`, '#CC0000'));
  }
}

/**
 * Stop voice stream and disconnect
 * @param {Message} msg Discord message which had called function
 * @param {Map<{textChannel: TextChannel,
 * voiceChannel: VoiceChannel,
 * connection: VoiceConnection,
 * songs: Array<{title: String, url: String, thumbnail: String, duration: String, type: String}>,
 * volume: Number,
 * playing: Boolean}>} queue Server queue
 * @param {Client} client Discord client
 * @return {Void} Messages to chat
 */
function stop(msg, queue, client) {
  if (!msg.guild.members.cache.get(client.user.id).voice.channel) {
    return msg.channel.send(message(':exclamation: No need to stop', '#CC0000'));
  }

  const serverQueue = queue.get(msg.channel.guild.id);

  if (!msg.member.voice.channel)
    return msg.channel.send(message(':exclamation: Please join voice channel first', '#CC0000'));
  if (serverQueue) {
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
  } else {
    join(msg)
      .then((connection) => {
        connection.disconnect();
      })
      .catch((err) => {
        return msg.channel.send(message(`:x: Something went wrong: ${err.message}`, '#CC0000'));
      });
  }

  msg.channel.send(
    message(
      `:mailbox_with_no_mail: Disconnected from **${msg.member.voice.channel.name}**`,
      '#4BB543',
    ),
  );
}

module.exports = {
  skip,
  reverse,
  shuffle,
  pause,
  resume,
  stop,
};
