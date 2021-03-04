const { VoiceConnection, Util, Message, TextChannel, VoiceChannel, Client } = require('discord.js');
const ytdl = require('ytdl-core');
const yts = require('yt-search');
const ytfps = require('ytfps');

class Player {
  /** @param {Boolean} dev Enable dev logs*/
  dev = true;
  /** @param {Map} queue Server queue */
  queue = new Map();
  /** @param {Number} color Decimal color */
  color = 10;

  /**
   * @param {Client} client Discord client
   * @param {String | Number} prefix Command prefix
   */
  constructor(client, prefix) {
    this.client = client;
    this.prefix = prefix;
  }

  /**
   * Check is valid URL
   * @param {String} url URL to check
   * @return {Boolean} Is valid URL
   */
  validURL(url) {
    var pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', // fragment locator
      'i',
    );
    return !!pattern.test(url);
  }

  /**
   * Get playlist ID or null
   * @param {String} url URL to check
   * @return {String | null} Playlist ID or null
   */
  getYoutubePlaylistOrNull(url) {
    var pattern = /^.*(youtu.be\/|list=)([^#\&\?]*).*/;
    var match = url.match(pattern);
    if (match && match[2]) {
      return match[2];
    }
    return null;
  }

  /*------------------------------------------------------------------------------------------*/

  /**
   * Initialize bot commands
   */
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
      if (command === 'pause') {
        const serverQueue = this.queue.get(msg.guild.id);
        this.pause(msg, serverQueue);
        return;
      }
      if (command === 'resume') {
        const serverQueue = this.queue.get(msg.guild.id);
        this.resume(msg, serverQueue);
        return;
      }
    });
  }

  /*------------------------------------------------------------------------------------------*/

  /**
   * Join voice channel where message author has been connected
   * @param {Message} msg Discord message which had called function
   * @return {Promise<VoiceConnection>} Voice connection of joined channel
   */
  async join(msg) {
    const bot = msg.guild.members.cache.get(this.client.user.id);

    if (!msg.member.voice.channel) {
      msg.channel.send('**Please join voice channel first**');
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
      if (this.dev) console.error(err);
      msg.channel.send(`**Something went wrong:** \`${err.message}\``);
    }
    return connection;
  }

  /*------------------------------------------------------------------------------------------*/

  /**
   * Declare song info, queue and start play function
   * @param {Message} msg Discord message which had called function
   * @param {Array<string>} args Arguments of user command
   * @param {{textChannel: TextChannel,
   * voiceChannel: VoiceChannel,
   * connection: VoiceConnection,
   * songs: Array<{title: String, url: String, thumbnail: String, duration: String, type: String}>,
   * volume: Number,
   * playing: Boolean}} serverQueue Server queue
   *
   * @return {Promise<Void>} Messages to chat
   */
  async execute(msg, args, serverQueue) {
    const voiceChannel = msg.member.voice.channel;

    if (!voiceChannel) return msg.channel.send('**Please join voice channel first**');

    const permissions = voiceChannel.permissionsFor(msg.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      //* I can('t) connect (but||and) I can('t) speak, please ask admistrators to give me permissions
      return msg.channel.send(
        `I can${permissions.has('CONNECT') ? '' : "'t"} connect ${
          !permissions.has('CONNECT') && !permissions.has('SPEAK') ? 'and' : 'but'
        } I can${
          permissions.has('SPEAK') ? '' : "'t"
        } speak, please ask admistrators to give me permissions`,
      );
    }

    let song;
    //* If argument is a link
    if (this.validURL(args[0])) {
      //* If youtube link
      if (ytdl.validateURL(args[0])) {
        if (this.dev) console.log('youtube link');
        const songInfo = await ytdl.getInfo(args[0]);

        function fancyTimeFormat(duration) {
          var hrs = ~~(duration / 3600);
          var mins = ~~((duration % 3600) / 60);
          var secs = ~~duration % 60;
          var ret = '';
          if (hrs > 0) {
            ret += '' + hrs + ':' + (mins < 10 ? '0' : '');
          }
          ret += '' + mins + ':' + (secs < 10 ? '0' : '');
          ret += '' + secs;
          return ret;
          // Output like "1:01" or "4:03:59" or "123:03:59"
        }

        song = {
          title: Util.escapeMarkdown(songInfo.videoDetails.title),
          url: args[0],
          thumbnail: songInfo.videoDetails.thumbnails[0].url,
          duration: fancyTimeFormat(parseInt(songInfo.videoDetails.lengthSeconds)),
          type: 'Youtube',
        };
      } else if (this.getYoutubePlaylistOrNull(args[0])) {
        if (this.dev) console.log('youtube playlist');

        const id = this.getYoutubePlaylistOrNull(args[0]);
        try {
          const playlist = await ytfps(id);

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
            serverQueue = queueContruct;
          }

          playlist.videos.forEach((song) => {
            serverQueue.songs.push({
              title: song.title,
              url: song.url,
              thumbnail: song.thumbnail_url,
              duration: song.length,
              type: 'Youtube',
            });
          });

          msg.channel.send({
            embed: {
              title: 'Added playlist to queue',
              description: `[${playlist.title}](${playlist.url})`,
              url: 'https://github.com/async-devil/Zelenchong',
              color: this.color,
              thumbnail: {
                url: `${playlist.thumbnail_url}`,
              },
              fields: [
                {
                  name: '`Description:`',
                  value: `${playlist.description}`,
                },
                {
                  name: '`Author:`',
                  value: `[${playlist.author.name}](${playlist.author.url})`,
                },
                {
                  name: '`Number of videos:`',
                  value: `${playlist.video_count}`,
                },
              ],
            },
          });
          console.log(this.queue.get(msg.guild.id));
        } catch (err) {
          msg.channel.send(`**Something went wrong:** \`${err.message}\``);
          if (this.dev) console.error(err);
          return;
        }
      } else {
        //* If regular link
        if (this.dev) console.log('radio');
        song = {
          title: 'Unknown radio',
          url: args[0],
          thumbnail: 'https://img.icons8.com/ios/452/radio.png',
          duration: '¯\\_(ツ)_/¯',
          type: 'Radio',
        };
      }
    } else {
      //* If not, search in youtube for argument and get first one
      const { videos } = await yts(args.join(' '));
      if (!videos.length) return msg.channel.send('**No songs were found!**');
      song = {
        title: videos[0].title,
        url: videos[0].url,
        thumbnail: videos[0].thumbnail,
        duration: videos[0].duration.timestamp,
        type: 'Youtube',
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

      if (song) queueContruct.songs.push(song);

      try {
        let joinMessage;
        await msg.channel.send(`**Trying to join** \`${voiceChannel.name}\``).then((message) => {
          joinMessage = message;
        });
        var connection = await voiceChannel.join();
        joinMessage.edit(`**Joined** \`${msg.member.voice.channel.name}\``);

        queueContruct.connection = connection;
        this.play(msg, queueContruct.songs[0]);
      } catch (err) {
        this.queue.delete(msg.guild.id);

        if (this.dev) console.error(err);
        return msg.channel.send(`**Something went wrong:** \`${err.message}\``);
      }
    } else {
      //* If add song exists
      if (song) {
        serverQueue.songs.push(song);
        return msg.channel.send({
          embed: {
            title: `${song.title}`,
            url: `${song.url}`,
            color: this.color,
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
      } else { //* If it is a playlist
         try {
           if (!serverQueue.connection) {
             let joinMessage;
             await msg.channel
               .send(`**Trying to join** \`${voiceChannel.name}\``)
               .then((message) => {
                 joinMessage = message;
               });
             var connection = await voiceChannel.join();
             joinMessage.edit(`**Joined** \`${msg.member.voice.channel.name}\``);

             this.queue.get(msg.guild.id).connection = connection;
           }
           this.play(msg, serverQueue.songs[0]);
         } catch (err) {
           this.queue.delete(msg.guild.id);

           if (this.dev) console.error(err);
           return msg.channel.send(`**Something went wrong:** \`${err.message}\``);
         }
      }
    }
  }

  /*------------------------------------------------------------------------------------------*/
  /**
   * Skip current song
   * @param {Message} msg Discord message which had called function
   * @param {{textChannel: TextChannel,
   * voiceChannel: VoiceChannel,
   * connection: VoiceConnection,
   * songs: Array<{title: String, url: String, thumbnail: String, duration: String, type: String}>,
   * volume: Number,
   * playing: Boolean}} serverQueue Server queue
   * @return {Void} Messages to chat
   */
  skip(msg, serverQueue) {
    if (!msg.member.voice.channel) return msg.channel.send('**Please join voice channel first**');
    if (!serverQueue) return msg.channel.send('**Queue is empty!**');
    try {
      serverQueue.connection.dispatcher.end();
    } catch (err) {
      if (this.dev) console.error(err);
      return msg.channel.send(`**Something went wrong:** \`${err.message}\``);
    }
  }

  /**
   * Pause voice stream (works correctly only on live streams)
   * @param {Message} msg Discord message which had called function
   * @param {{textChannel: TextChannel,
   * voiceChannel: VoiceChannel,
   * connection: VoiceConnection,
   * songs: Array<{title: String, url: String, thumbnail: String, duration: String, type: String}>,
   * volume: Number,
   * playing: Boolean}} serverQueue Server queue
   * @return {Void} Messages to chat
   */
  pause(msg, serverQueue) {
    if (!msg.member.voice.channel) return msg.channel.send('**Please join voice channel first**');
    if (!serverQueue) return msg.channel.send('**Queue is empty!**');
    try {
      serverQueue.connection.dispatcher.pause();
      msg.channel.send('**Paused successfully**');
    } catch (err) {
      if (this.dev) console.error(err);
      return msg.channel.send(`**Something went wrong:** \`${err.message}\``);
    }
  }

  /**
   * Resume voice stream (works correctly only on live streams)
   * @param {Message} msg Discord message which had called function
   * @param {{textChannel: TextChannel,
   * voiceChannel: VoiceChannel,
   * connection: VoiceConnection,
   * songs: Array<{title: String, url: String, thumbnail: String, duration: String, type: String}>,
   * volume: Number,
   * playing: Boolean}} serverQueue Server queue
   * @return {Void} Messages to chat
   */
  resume(msg, serverQueue) {
    if (!msg.member.voice.channel) return msg.channel.send('**Please join voice channel first**');
    if (!serverQueue) return msg.channel.send('**Queue is empty!**');
    try {
      serverQueue.connection.dispatcher.resume();
      msg.channel.send('**Resumed successfully**');
      this.play(msg, serverQueue.songs[0]);
    } catch (err) {
      if (this.dev) console.error(err);
      return msg.channel.send(`**Something went wrong:** \`${err.message}\``);
    }
  }

  /**
   * Stop voice stream and disconnect
   * @param {Message} msg Discord message which had called function
   * @param {{textChannel: TextChannel,
   * voiceChannel: VoiceChannel,
   * connection: VoiceConnection,
   * songs: Array<{title: String, url: String, thumbnail: String, duration: String, type: String}>,
   * volume: Number,
   * playing: Boolean}} serverQueue Server queue
   * @return {Void} Messages to chat
   */
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

  /*------------------------------------------------------------------------------------------*/

  /**
   * Create stream to voice channel
   * @param {Message} msg Discord message which had called function
   * @param {{title: String, url: String, thumbnail: String, duration: String, type: String}} song Song to play
   * @return {Void} Messages to chat
   */
  play(msg, song) {
    const serverQueue = this.queue.get(msg.channel.guild.id);
    if (!song) {
      serverQueue.voiceChannel.leave();
      this.queue.delete(msg.channel.guild.id);
      return;
    }

    const selectStreamType = (song) => {
      switch (song.type) {
        case 'Youtube':
          return ytdl(song.url);
        case 'Radio':
          return song.url;
      }
    };

    const dispatcher = serverQueue.connection
      .play(selectStreamType(song))
      .on('finish', () => {
        serverQueue.songs.shift();
        this.play(msg, serverQueue.songs[0]);
      })
      .on('start', () =>
        msg.channel.send({
          embed: {
            title: 'Now Playing',
            description: `[${song.title}](${song.url})`,
            url: 'https://github.com/async-devil/Zelenchong',
            color: this.color,
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
        if (this.dev) console.error(err);
        msg.channel.send(`**Something went wrong:** \`${err.message}\``);
      });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  }
}

module.exports = Player;
