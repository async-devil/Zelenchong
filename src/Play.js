const { VoiceConnection, Channel, Util } = require('discord.js');
const ytdl = require('ytdl-core');
const yts = require('yt-search');

class Player {
  queue = new Map();

  constructor(client, prefix) {
    this.client = client;
    this.prefix = prefix;
  }

  init() {
    this.client.on('message', (msg) => {
      if (msg.author.bot) return;
      if (!msg.content.startsWith(this.prefix)) return;

      const commandBody = msg.content.slice(this.prefix.length);
      const args = commandBody.split(' ');
      const command = args.shift().toLowerCase();

      if (command === 'play') {
        const serverQueue = this.queue.get(msg.guild.id);
        this.execute(msg, args, serverQueue);
        return;
      }
      if (command === 'skip') {
        const serverQueue = this.queue.get(msg.guild.id);
        this.skip(msg, serverQueue);
        return;
      }
      if (command === 'stop') {
        const serverQueue = this.queue.get(msg.guild.id);
        this.stop(msg, serverQueue);
        return;
      }

      if (command === 'radio') {
        this.join(msg).then((connection) => {
          msg.channel.send(`Now playing \`${args[0]}\``);
          connection.play(args[0]);
        });
      }
    });
  }

  join(msg) {
    return new Promise((res, rej) => {
      const bot = msg.guild.members.cache.get(this.client.user.id);

      if (!msg.member.voice.channel) {
        msg.channel.send('Please join voice channel first');
      }

      let connection;
      if (!bot.voice.channel || bot.voice.channelID != msg.member.voice.channelID) {
        msg.channel.send(`Trying to join \`${msg.member.voice.channel.name}\``);
      }
      try {
        connection = msg.member.voice.channel.join();
      } catch (err) {
        rej(err);
      }
      res(connection);
    });
  }

  async execute(msg, args, serverQueue) {
    const voiceChannel = msg.member.voice.channel;

    if (!voiceChannel) return msg.channel.send('Please join voice channel first');

    const permissions = voiceChannel.permissionsFor(msg.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      return msg.channel.send(
        `I can${permissions.has('CONNECT') ? '' : "'t"} connect ${
          !permissions.has('CONNECT') && !permissions.has('SPEAK') ? 'and' : 'but'
        } I can${
          permissions.has('SPEAK') ? '' : "'t"
        } speak, please ask admistrators to give me permissions`,
      );
    }

    let song;
    if (ytdl.validateURL(args[0])) {
      const songInfo = await ytdl.getInfo(args[0]);
      song = {
        title: Util.escapeMarkdown(songInfo.videoDetails.title),
        url: args[0],
      };
    } else {
      const { videos } = await yts(args.join(' '));
      if (!videos.length) return msg.channel.send('No songs were found!');
      song = {
        title: videos[0].title,
        url: videos[0].url,
      };
    }

    if (!serverQueue) {
      const queueContruct = {
        textChannel: msg.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true,
      };
      this.queue.set(msg.guild.id, queueContruct);
      queueContruct.songs.push(song);

      try {
        msg.channel.send(`Trying to connect \`${voiceChannel.name}\``);
        var connection = await voiceChannel.join();
        queueContruct.connection = connection;
        this.play(msg, msg.guild, queueContruct.songs[0]);
      } catch (err) {
        this.queue.delete(msg.guild.id);
        return msg.channel.send('Something went wrong: ' + err.message);
      }
    } else {
      serverQueue.songs.push(song);
      return msg.channel.send(`Added to queue \`${song.title}\``);
    }
  }

  skip(msg, serverQueue) {
    if (!msg.member.voice.channel) return msg.channel.send('Please join voice channel first');
    if (!serverQueue) return msg.channel.send('Queue is empty!');
    serverQueue.connection.dispatcher.end();
  }

  stop(msg, serverQueue) {
    if (!msg.member.voice.channel) return msg.channel.send('Please join voice channel first');
    if (serverQueue) {
      serverQueue.songs = [];
      serverQueue.connection.dispatcher.end();
    } else {
      this.join(msg)
        .then((connection) => {
          connection.disconnect();
        })
        .catch((err) => {
          return channel.send(err.message);
        });
    }

    msg.channel.send(`Disconnected from \`${msg.member.voice.channel.name}\``);
  }

  play(msg, guild, song) {
    const serverQueue = this.queue.get(guild.id);
    if (!song) {
      serverQueue.voiceChannel.leave();
      this.queue.delete(guild.id);
      return;
    }
    const dispatcher = serverQueue.connection
      .play(ytdl(song.url))
      .on('finish', () => {
        msg.channel.send(`Finished playing ${song.title}`)
        serverQueue.songs.shift();
        this.play(msg, guild, serverQueue.songs[0]);
      })
      .on('start', () => msg.channel.send(`Now playing \`${song.title}\``))
      .on('error', (err) => {
        msg.channel.send('Something went wrong: ' + err.message);
        console.error(err);
      });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  }
}

module.exports = Player;
