const message = require('./messages/message.embedMessage');

module.exports = async (client, msg, args, color) => {
  if (!msg.channel.permissionsFor(client.user.id).has('MANAGE_MESSAGES')) {
    return msg.channel.send(message(":x: I can't manage messages", '#CC0000'));
  }
  if (msg.member.hasPermission('MANAGE_MESSAGES')) {
    let count = parseInt(args[0]);

    if (isNaN(count))
      return msg.channel.send(
        message(':x: Please mention the amount of message that you want to delete', '#CC0000'),
      );

    if (count >= 100) {
      return msg.channel.send(
        message(':x: Error, you can only delete between 1 and 99 messages at one time!', '#CC0000'),
      );
    } else if (count < 1) {
      return msg.channel.send(
        message(
          ':x: Error, you can only delete between 1 and 100 messages at one time!',
          '#CC0000',
        ),
      );
    } else {
      try {
        await msg.channel.bulkDelete(count + 1);
        msg.channel
          .send(
            message(
              `:recycle: Succsessfuly deleted ${count} message${count === 1 ? '' : 's'}!`,
              '#4BB543',
            ),
          )
          .then((message) => message.delete({ timeout: 1600 }));
      } catch (err) {
        return msg.channel.send(message(`:x: Something went wrong: ${err.message}`, '#CC0000'));
      }
    }
  } else {
    return msg.channel.send(
      message(':x: You need to have rights to manage messages to clear', '#CC0000'),
    );
  }
};
