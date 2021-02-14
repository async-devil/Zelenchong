const cheerio = require('cheerio');
const { VoiceConnection, Channel, Message } = require('discord.js');
const request = require('request');
const ytdl = require('ytdl-core');

class Element {
  constructor(link) {
    if (!this.isValidLink(link)) throw { message: 'Invalid link', path: 'Element' };
    this.link = link;
  }

  /**
   * Set local title
   * @param {string} title title
   */
  setTitle(title) {
    this.title = title;
  }

  /**
   * Get title from title tag from head
   * @returns {Promise<string>}
   */
  getTitle() {
    return new Promise((res, rej) => {
      request(this.link, (error, _response, body) => {
        if (error) rej({ message: error.message, path: 'Element/getTitle' });

        var $ = cheerio.load(body);
        var title = $('title').text();

        res(title);
      });
    });
  }

  /**
   * Get an element
   * @returns {{link: string, title: string}} element
   */
  getElement() {
    if (!this.link || !this.title)
      throw { message: 'One of arguments is not provided', path: 'Element/getElement' };
    return {
      link: this.link,
      title: this.title,
    };
  }

  /**
   * Check ling to be valid
   * @param {string} link checking link
   */
  isValidLink(link) {
    return (
      link.search(
        new RegExp('(\b(https?|ftp|file)://)?[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]'),
      ) != -1
    );
  }
}

class YoutubeVideo extends Element {
  constructor(link) {
    super(link);
  }

  /**
   * Get title from title tag from head
   * @returns {Promise<string>}
   */
  getTitle() {
    return new Promise((res, rej) => {
      request(this.link, (error, _response, body) => {
        if (error) rej({ message: error.message, path: 'Element/getTitle' });

        var $ = cheerio.load(body);
        var title = $('title').text();

        res(title.replace(' - Youtube', ''));
      });
    });
  }

  /**
   * Check if youtube link is valid
   * @param {string} link cheking link
   * @returns {Promise<boolean>} is valid
   */
  isValidYoutubeId(link) {
    return new Promise((res, rej) => {
      if (!this.isValidLink(link)) rej({ message: 'Invalid link', path: 'Video/isValidYoutubeId' });

      const id = link.match(/((?<=youtu.be\/)\S{11})|((?<=watch\?v=)\S{11})/)[0];
      if (!id) rej({ message: 'Invalid youtube link', path: 'Video/isValidYoutubeId' });

      request('http://img.youtube.com/vi/' + id + '/0.jpg', (error, response) => {
        if (error) rej({ message: error.message, path: 'Video/isValidYoutubeId' });
        res(response.statusCode === 200 ? true : false);
      });
    });
  }
}

class Queue {
  /**
   * @param {Array<string>} queue queue array
   */
  queue = [];
  /**
   * Add element to queue
   * @param {Element} element element which adds
   */
  add(element) {
    this.queue.push(element.getElement());
  }

  /**
   * Delete first element
   */
  next() {
    if (this.queue.length == 0) throw { message: 'Queue is empty', path: 'Queue/next' };
    this.queue.shift();
  }

  /**
   * Get first element
   * @returns {Element} first element
   */
  getFirst() {
    if (this.queue.length == 0) throw { message: 'Queue is empty', path: 'Queue/get' };
    return this.queue[0];
  }

  /**
   * Get all queue
   * @returns {Array<Element>} queue
   */
  get() {
    return this.queue;
  }
}

class Player {
  /**
   * @param {boolean} playingYoutube is playing youtube
   */
  playingYoutube = false;

  constructor(client, queue) {
    this.client = client;
    this.queue = queue;
  }

  /**
   * Start function
   */
  init() {
    this.client.on('message', async (msg) => {
      if (!msg.guild) return;

      const channel = this.client.channels.cache.get(msg.channel.id);
      if (msg.content === '=join') {
        this.join(msg).catch((err) => {
          return channel.send(err.message);
        });
      }
      if (msg.content.search(/^=play \S*/gm) != -1) {
        this.youtubePlayer(msg);
      }

      if (msg.content.search(/^=radio \S*/gm) != -1) {
        this.radioPlayer(msg);
      }

      if (msg.content === '=stop') {
        this.join(msg)
          .then((connection) => {
            connection.disconnect();
            channel.send(`Disconnected from \`${msg.member.voice.channel.name}\``);
          })
          .catch((err) => {
            return channel.send(err.message);
          });
      }
    });
  }
  /**
   * Join voice chat
   * @param {Message} msg Discord message
   */
  async join(msg) {
    const channel = this.client.channels.cache.get(msg.channel.id);
    const bot = msg.guild.members.cache.get(this.client.user.id);

    if (!msg.member.voice.channel)
      throw { message: 'Please join voice channel first', path: 'Player/join' };

    let connection;
    if (!bot.voice.channel || bot.voice.channelID != msg.member.voice.channelID) {
      channel.send(`Trying to join \`${msg.member.voice.channel.name}\``);
    }
    try {
      connection = await msg.member.voice.channel.join();
    } catch (err) {
      throw { message: err.message, path: 'Player/join' };
    }

    return connection;
  }

  /**
   * Youtube player
   * @param {Message} msg Discord message
   */
  youtubePlayer = (msg) => {
    const channel = this.client.channels.cache.get(msg.channel.id);
    const link = msg.content.split(' ')[1];
    const newElement = new YoutubeVideo(link);

    newElement.getTitle().then((title) => {
      newElement.setTitle(title);
      this.queue.add(newElement);

      if (!this.playingYoutube) {
        this.join(msg).then((connection) => {
          this.playYoutube(connection, channel);
        });
      } else if (this.playingYoutube) {
        channel.send(`Added to queue \`${this.queue.get()[1].title}\``);
      }
    });
  };

  /**
   *
   * @param {VoiceConnection} connection current voice connection
   * @param {Channel} channel text channel
   */
  playYoutube = (connection, channel) => {
    let dispatcher = connection.play(ytdl(this.queue.getFirst().link, { filter: 'audioonly' }));
    channel.send(`Now playing \`${this.queue.getFirst().title}\``);

    this.playingYoutube = true;
    dispatcher.on('finish', () => {
      this.queue.next();
      try {
        this.playYoutube(connection, channel);
      } catch (err) {
        this.playingYoutube = false;
        channel.send('Queue is empty!');
        return;
      }
    });
  };

  /**
   *  Radio player
   *  @param {Message} msg Discord message
   */
  radioPlayer = (msg) => {
    const channel = this.client.channels.cache.get(msg.channel.id);
    const link = msg.content.split(' ')[1];

    this.join(msg).then((connection) => {
      channel.send(`Now playing \`${link}\``);
      connection.play(link);
    });
  };
}

exports.YoutubeVideo = YoutubeVideo;
exports.Player = Player;
exports.Queue = Queue;
