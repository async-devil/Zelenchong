function init(client, prefix) {
  client.on('message', async (msg) => {
    if (msg.author.bot) return;
    if (!msg.content.startsWith(prefix)) return;

    const commandBody = msg.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();


    if (command === 'clear') {
      clear(
        client,
        msg,
        args[0]
      );
    }
  });
}

const clear = (client, msg, count) => {
  const limit = 200;
  const channel = client.channels.cache.get(msg.channel.id);

  async function deleteByLimit(count) {
    await channel.messages.fetch({ count: count + 1 }).then((messages) => {
      msg.channel.bulkDelete(messages).catch((err) => {
        channel.send(err.message);
      });
    });
  }
  if(count > limit) {
    channel.send('Please set number of cleaning messages lower than \`200\`')
  }
  if (count >= 100) {
    for (let i = 0; i < count / 100; i++) {
      deleteByLimit(99).catch((err) => channel.send(`Something went wrong, ${err.message}`));
    }
    if (count % 100 != 0) {
      deleteByLimit(count % 100).catch((err) =>
        channel.send(`Something went wrong, ${err.message}`),
      );
    }
  } else {
    deleteByLimit(count).catch((err) => channel.send(`Something went wrong, ${err.message}`));
  }

  channel
    .send(`<@${msg.author.id}> succsesfuly deleted ${count} messages!`)
    .then((message) => message.delete({ timeout: 2000 }));
};

module.exports = init;