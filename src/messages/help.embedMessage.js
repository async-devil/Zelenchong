/**
 * @param {String | Number} prefix Command prefix
 * @param {Number} color Decimal color of left vertical line
 */
module.exports = (prefix, color) => {
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
      fields: [
        {
          name: 'Video or audio player',
          value: `${prefix}play \`stream link or something to search on Youtube\``,
        },
        {
          name: 'Stop player',
          value: `${prefix}stop`,
        },
        {
          name: 'Skip current song',
          value: `${prefix}skip`,
        },
        {
          name: 'Pause player',
          value: `${prefix}pause \`works correct only on radio streams\``,
        },
        {
          name: 'Resume player',
          value: `${prefix}resume \`works correct only on radio streams\``,
        },
        {
          name: 'Reverse queue',
          value: `${prefix}reverse`,
        },
        {
          name: 'Shuffle queue',
          value: `${prefix}shuffle`,
        },
        {
          name: 'Message cleaner',
          value: `${prefix}clear \`number of messages to clear\``,
        },
      ],
    },
  };
};
