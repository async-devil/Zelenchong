/**
 * @param {Number} color Decimal color of left vertical line
 * @param {{name: string, value: string}[]} commands Commands
 */
module.exports = (color, commands) => {
  return {
    embed: {
      title: 'Help page',
      description: 'Here is list of existing commands: ',
      url: 'https://github.com/async-devil/Zelenchong',
      color: color,
      footer: {
        text: 'Thanks for using!',
      },
      thumbnail: {
        url: 'https://img.icons8.com/ios/452/help.png',
      },
      fields: commands,
    },
  };
};
