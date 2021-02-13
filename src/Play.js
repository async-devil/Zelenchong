const cheerio = require('cheerio');
const request = require('request');

class Element {
  constructor(link) {
    this.link = link;
  }
  setTitle() {
    this.getTitle(this.link)
      .then((title) => {
        this.title = title;
      })
      .catch((err) => {
        throw err;
      });
  }
  getTitle(link) {
    return new Promise((res, rej) => {
      if (!this.isValidLink(link)) rej({ message: 'Invalid link', path: 'Element/getTitle' });

      request(link, function (error, response, body) {
        if (error) rej({ message: error.message, path: 'Element/getTitle' });

        var $ = cheerio.load(body);
        var title = $('title').text();

        res(title);
      });
    });
  }
  getElement() {
    if (!this.link || !this.title)
      throw { message: 'One of arguments is not provided', path: 'Element/getElement' };
    return {
      link: this.link,
      title: this.title,
    };
  }

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

  setTitle() {
    this.getTitle(this.link)
      .then((title) => {
        this.title = title.replace(' - Youtube', '');
      })
      .catch((err) => {
        throw err;
      });
  }

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
  queue = [];
  add(video) {
    this.queue.push(video.getVideo());
  }
  next() {
    if (this.queue.length == 0) throw { message: 'Queue is empty', path: 'Queue/next' };
    this.queue.shift();
  }
  get() {
    if (this.queue.length == 0) throw { message: 'Queue is empty', path: 'Queue/get' };
    this.queue[0];
  }
}

class Player {
  dev = false;
  constructor(client, queue) {
    this.client = client;
    this.queue = queue;

    client.on('message', async (msg) => {
      if (msg.content === '=join') {
        this.join(msg);
      }
      if (msg.content.search(/^=play \S*/gm) != -1) {
      }
    });
  }

  async join(msg) {
    const channel = client.channels.cache.get(msg.channel.id);
    const bot = msg.guild.members.cache.get(client.user.id);

    if (!msg.member.voice.channel)
      throw { message: 'Please join voice channel first', path: 'Player/join' };
    
    let connection;

    if (!bot.voice.channel || bot.voice.channelID != msg.memeber.voice.channelID) {
      try {
        connection = await msg.member.voice.channel.join();
      } catch(err) {
        throw { message: err.message, path: 'Player/join' };
      }
      channel.send(`Joined \`${msg.member.voice.channel.name}\``);
    } else {
      try {
        connection = await msg.member.voice.channel.connection // Don`t sure about that
      } catch(err) {
        throw { message: err.message, path: 'Player/join' };
      }
    }

    return connection
  }
}
