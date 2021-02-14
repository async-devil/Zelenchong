/*---------------------------------------------------------------------------------------------------*/

function init(client) {
  client.on('message', async (msg) => {
    if (msg.content.search(/^=clear \d+$/gm) != -1) {
      clear(
        client,
        msg,
        msg.content.split(' ')[1] != undefined ? parseInt(msg.content.split(' ')[1]) : 1,
      );
    }
  });
}

/*---------------------------------------------------------------------------------------------------*/

const clear = (client, msg, limit) => {
  const channel = client.channels.cache.get(msg.channel.id);

  async function deleteByLimit(limit) {
    await channel.messages.fetch({ limit: limit + 1 }).then((messages) => {
      msg.channel.bulkDelete(messages).catch((err) => {
        channel.send(err.message);
      });
    });
  }
  if (limit >= 100) {
    for (let i = 0; i < limit / 100; i++) {
      deleteByLimit(99).catch((err) => channel.send(`Something went wrong, ${err.message}`));
    }
    if (limit % 100 != 0) {
      deleteByLimit(limit % 100).catch((err) =>
        channel.send(`Something went wrong, ${err.message}`),
      );
    }
  } else {
    deleteByLimit(limit).catch((err) => channel.send(`Something went wrong, ${err.message}`));
  }

  channel
    .send(`<@${msg.author.id}> succsesfuly deleted ${limit} messages!`)
    .then((message) => message.delete({ timeout: 2000 }));
};

module.exports = init;

/*---------------------------------------------------------------------------------------------------*/
