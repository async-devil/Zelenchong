const { VoiceConnection, Util, Message, TextChannel, VoiceChannel } = require('discord.js');
const ytdl = require('ytdl-core');
const yts = require('yt-search');
const ytfps = require('ytfps');

const play = require('./play');

const addToQueue = require('../messages/addedToQueue.embedMessage');
const addPlaylist = require('../messages/addedPlaylistToQueue.embedMessage');
const message = require('../messages/message.embedMessage');

/*------------------------------------------------------------------------------------------*/
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

/**
 * Get playlist ID or null
 * @param {String} url URL to check
 * @return {String | null} Playlist ID or null
 */
function getYoutubePlaylistOrNull(url) {
  var pattern = /^.*(youtu.be\/|list=)([^#\&\?]*).*/;
  var match = url.match(pattern);
  if (match && match[2]) {
    return match[2];
  }
  return null;
}

/**
 * Check is valid URL
 * @param {String} url URL to check
 * @return {Boolean} Is valid URL
 */
function validURL(url) {
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
/*------------------------------------------------------------------------------------------*/

/**
 * Declare song info, queue and start play function
 * @param {Message} msg Discord message which had called function
 * @param {Array<string>} args Arguments of user command
 * @param {Map<{textChannel: TextChannel,
 * voiceChannel: VoiceChannel,
 * connection: VoiceConnection,
 * songs: Array<{title: String, url: String, thumbnail: String, duration: String, type: String}>,
 * volume: Number,
 * playing: Boolean}>} queue Bot queue
 * @param {{color: Number, prefix: String | Number, dev: Boolean}} config Bot configuration settings
 * @return {Promise<Void>} Messages to chat
 */
module.exports = async function execute(msg, args, queue, config) {
  const dev = config.dev;
  let serverQueue = queue.get(msg.guild.id);
  const voiceChannel = msg.member.voice.channel;

  if (!voiceChannel)
    return msg.channel.send(message(':exclamation: Please join voice channel first', '#CC0000'));

  /*------------------------------------------------------------------------------------------*/
  //! Permisions part
  const permissions = voiceChannel.permissionsFor(msg.client.user);
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    //* I can('t) connect (but||and) I can('t) speak, please ask admistrators to give me permissions
    return msg.channel.send(
      message(
        `:no_entry_sign: I can${permissions.has('CONNECT') ? '' : "'t"} connect ${
          !permissions.has('CONNECT') && !permissions.has('SPEAK') ? 'and' : 'but'
        } I can${
          permissions.has('SPEAK') ? '' : "'t"
        } speak, please ask admistrators to give me permissions`,
        '#CC0000',
      ),
    );
  }
  /*------------------------------------------------------------------------------------------*/

  let song;
  //* If argument is a link
  if (validURL(args[0])) {
    /*------------------------------------------------------------------------------------------*/
    //! If youtube link
    if (ytdl.validateURL(args[0])) {
      if (this.dev) console.log('Youtube link');
      const songInfo = await ytdl.getInfo(args[0]);

      song = {
        title: Util.escapeMarkdown(songInfo.videoDetails.title),
        url: args[0],
        thumbnail: songInfo.videoDetails.thumbnails[0].url,
        duration: fancyTimeFormat(parseInt(songInfo.videoDetails.lengthSeconds)),
        type: 'Youtube',
      };
    } else if (getYoutubePlaylistOrNull(args[0])) {
      if (dev) console.log('Youtube playlist');

      const id = getYoutubePlaylistOrNull(args[0]);
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
          queue.set(msg.guild.id, queueContruct);
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

        msg.channel.send(addPlaylist(playlist, config.color));
      } catch (err) {
        msg.channel.send(message(`:x: Something went wrong: ${err.message}`, '#CC0000'));

        if (dev) console.error(err);
        return;
      }
      /*------------------------------------------------------------------------------------------*/
    } else {
      /*------------------------------------------------------------------------------------------*/
      //! If regular link
      if (dev) console.log('Radio');
      song = {
        title: 'Unknown radio',
        url: args[0],
        thumbnail: 'https://img.icons8.com/ios/452/radio.png',
        duration: '¯\\_(ツ)_/¯',
        type: 'Radio',
      };
      /*------------------------------------------------------------------------------------------*/
    }
  } else {
    /*------------------------------------------------------------------------------------------*/
    //! If not, search in youtube for argument and get first one
    if (args.length === 0)
      return msg.channel.send(message(':exclamation: No arguments were given!', '#CC0000'));
    if (dev) console.log('Search by name: ' + args.join(' '));

    const { videos } = await yts(args.join(' '));
    if (!videos.length)
      return msg.channel.send(message(':exclamation: No songs were found!', '#CC0000'));

    song = {
      title: videos[0].title,
      url: videos[0].url,
      thumbnail: videos[0].thumbnail,
      duration: videos[0].duration.timestamp,
      type: 'Youtube',
    };
  }
  /*------------------------------------------------------------------------------------------*/

  if (!serverQueue) {
    /*------------------------------------------------------------------------------------------*/
    //! If server queue doen`t exists
    const queueContruct = {
      textChannel: msg.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true,
    };
    queue.set(msg.guild.id, queueContruct);

    if (song) queueContruct.songs.push(song);

    try {
      let joinMessage;
      await msg.channel
        .send(message(`:hourglass: Trying to join **${voiceChannel.name}**`, config.color))
        .then((message) => {
          joinMessage = message;
        });
      var connection = await voiceChannel.join();
      joinMessage.edit(
        message(`:white_check_mark: Joined **${msg.member.voice.channel.name}**`, '#4BB543'),
      );

      queueContruct.connection = connection;
      play(msg, queueContruct.songs[0], queue, config);
    } catch (err) {
      queue.delete(msg.guild.id);

      if (dev) console.error(err);
      return msg.channel.send(message(`:x: Something went wrong: ${err.message}`, '#CC0000'));
    }
    /*------------------------------------------------------------------------------------------*/
  } else {
    /*------------------------------------------------------------------------------------------*/
    //! If add song exists (not a playlist)
    if (song) {
      serverQueue.songs.push(song);
      return msg.channel.send(addToQueue(msg, song, serverQueue, config.color));
      /*------------------------------------------------------------------------------------------*/
    } else {
      /*------------------------------------------------------------------------------------------*/
      //! If it is a playlist
      try {
        if (!serverQueue.connection) {
          let joinMessage;
          await msg.channel
            .send(message(`:hourglass: Trying to join **${voiceChannel.name}**`, config.color))
            .then((message) => {
              joinMessage = message;
            });
          var connection = await voiceChannel.join();
          joinMessage.edit(
            message(`:white_check_mark: Joined **${msg.member.voice.channel.name}**`, '#4BB543'),
          );

          serverQueue.connection = connection;
        }
        play(msg, serverQueue.songs[0], queue, config);
      } catch (err) {
        //* Deletes queue to prevent errors with connection
        queue.delete(msg.guild.id);

        if (dev) console.error(err);
        return msg.channel.send(message(`:x: Something went wrong: ${err.message}`, '#CC0000'));
      }
    }
    /*------------------------------------------------------------------------------------------*/
  }
};
