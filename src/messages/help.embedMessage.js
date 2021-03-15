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
          value: `${prefix}play _or_ ${prefix}p \`stream link or something to search on Youtube\``,
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
          value: `${prefix}shuffle _or_ ${prefix}mix`,
        },
        {
          name: 'Message cleaner',
          value: `${prefix}clear _or_ ${prefix}c \`number of messages to clear, from 1 to 99\``,
        },
        {
          name: 'Change color of messages',
          value: `${prefix}color \`hex color in format like #000000 or 000000\``,
        },
        {
          name: "Bot's birthday",
          value: `${prefix}birthday`,
        },
        {
          name: "Bot's current ping",
          value: `${prefix}ping`,
        },
        {
          name: 'Call help message',
          value: `${prefix}help _or_ ${prefix}h`,
        },
      ],
    },
  };
};
