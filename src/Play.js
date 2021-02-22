const { VoiceConnection, Channel, Util } = require('discord.js');
const ytdl = require('ytdl-core');
const yts = require('yt-search');

class Player {
  queue = new Map();

  constructor(client, prefix) {
    this.client = client;
    this.prefix = prefix;
  }

  validURL(str) {
    var pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', // fragment locator
      'i',
    );
    return !!pattern.test(str);
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
        if (this.validURL(args[0])) {
          this.join(msg).then((connection) => {
            msg.channel.send({
              embed: {
                title: 'Unknown radio',
                url: `${args[0]}`,
                color: 942019,
                author: {
                  name: 'Started playing radio',
                  url: 'https://github.com/async-devil/Zelenchong',
                  icon_url: `${msg.author.displayAvatarURL()}`,
                },
                fields: [
                  {
                    name: '`Stream duration:`',
                    value: '¯\\_(ツ)_/¯',
                  },
                  {
                    name: '`Requested by:`',
                    value: `${msg.author.username}`,
                  },
                ],
              },
            });

            const dispatcher = connection.play(args[0])
            dispatcher.setVolumeLogarithmic(1);
          });
        } else {
          msg.channel.send('**Link is not valid**');
        }
      }
    });
  }

  async join(msg) {
    const bot = msg.guild.members.cache.get(this.client.user.id);

    if (!msg.member.voice.channel) {
      msg.channel.send('**Please join voice channel first**');
    }

    let connection, joinMessage;
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
      } else {
        msg.channel.send(`**Joined** \`${msg.member.voice.channel.name}\``);
      }
    } catch (err) {
      throw err;
    }
    return connection;
  }

  async execute(msg, args, serverQueue) {
    const voiceChannel = msg.member.voice.channel;

    if (!voiceChannel) return msg.channel.send('**Please join voice channel first**');

    const permissions = voiceChannel.permissionsFor(msg.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      return msg.channel.send(
        `I can${permissions.has('CONNECT') ? '' : "'t"} connect ${
          !permissions.has('CONNECT') && !permissions.has('SPEAK') ? 'and' : 'but'
        } I can${permissions.has('SPEAK') ? '' : "'t"} speak also I can${
          permissions.has('SEND_MESSAGES') ? '' : "'t"
        } send messages, please ask admistrators to give me permissions`,
      );
    }

    let song;
    if (ytdl.validateURL(args[0])) {
      const songInfo = await ytdl.getInfo(args[0]);

    function fancyTimeFormat(duration) {
      // Hours, minutes and seconds
      var hrs = ~~(duration / 3600);
      var mins = ~~((duration % 3600) / 60);
      var secs = ~~duration % 60;

      // Output like "1:01" or "4:03:59" or "123:03:59"
      var ret = '';

      if (hrs > 0) {
        ret += '' + hrs + ':' + (mins < 10 ? '0' : '');
      }

      ret += '' + mins + ':' + (secs < 10 ? '0' : '');
      ret += '' + secs;
      return ret;
    }
    
      song = {
        title: Util.escapeMarkdown(songInfo.videoDetails.title),
        url: args[0],
        thumbnail: songInfo.videoDetails.thumbnails[0].url,
        duration: fancyTimeFormat(parseInt(songInfo.videoDetails.lengthSeconds)),
      };
    } else {
      const { videos } = await yts(args.join(' '));
      if (!videos.length) return msg.channel.send('**No songs were found!**');
      song = {
        title: videos[0].title,
        url: videos[0].url,
        thumbnail: videos[0].thumbnail,
        duration: videos[0].duration.timestamp,
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
        let joinMessage;
        await msg.channel.send(`**Trying to join** \`${voiceChannel.name}\``).then((message) => {
          joinMessage = message;
        });
        var connection = await voiceChannel.join();
        joinMessage.edit(`**Joined** \`${msg.member.voice.channel.name}\``);

        queueContruct.connection = connection;
        this.play(msg, msg.guild, queueContruct.songs[0]);
      } catch (err) {
        this.queue.delete(msg.guild.id);
        return msg.channel.send(`**Something went wrong:** \`${err.message}\``);
      }
    } else {
      serverQueue.songs.push(song);
      return msg.channel.send({
        embed: {
          title: `${song.title}`,
          url: `${song.url}`,
          color: 942019,
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
              value: `${this.queue.get(msg.guild.id).songs.length - 1}`,
            },
          ],
        },
      });
    }
  }

  skip(msg, serverQueue) {
    if (!msg.member.voice.channel) return msg.channel.send('**Please join voice channel first**');
    if (!serverQueue) return msg.channel.send('**Queue is empty!**');
    serverQueue.connection.dispatcher.end();
  }

  stop(msg, serverQueue) {
    if (!msg.member.voice.channel) return msg.channel.send('**Please join voice channel first**');
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

    msg.channel.send(`**Disconnected from** \`${msg.member.voice.channel.name}\``);
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
        serverQueue.songs.shift();
        this.play(msg, guild, serverQueue.songs[0]);
      })
      .on('start', () =>
        msg.channel.send({
          embed: {
            title: 'Now Playing',
            description: `[${song.title}](${song.url})`,
            url: 'https://github.com/async-devil/Zelenchong',
            color: 942019,
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
                value: `${serverQueue.songs[1] ? serverQueue.songs[1].title : 'Nothing'}`,
              },
            ],
          },
        }),
      )
      .on('error', (err) => {
        msg.channel.send(`**Something went wrong:** \`${err.message}\``);
        console.error(err);
      });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  }
}

module.exports = Player;
