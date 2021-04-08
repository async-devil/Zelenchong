/*
! ytfps response
? https://github.com/Caier/ytfps
{
  "title": "testowa4ytfps",
  "url": "https://youtube.com/playlist?list=PLXJzeXpFb-pDFQSy6EK7JEFRM1b8I1TTW",
  "id": "PLXJzeXpFb-pDFQSy6EK7JEFRM1b8I1TTW",
  "video_count": 1,
  "view_count": 0,
  "description": "this is a test",
  "isUnlisted": true,
  "thumbnail_url": "https://i.ytimg.com/vi/2chfsFTNEXw/hqdefault.jpg",
  "author": {
    "name": "アヌス",
    "url": "https://youtube.com/channel/UC2tC7wR16hJ5ddYpymiKdBQ",
    "avatar_url": "https://yt3.ggpht.com/a/AATXAJzo5HwQCdKBgZivys-2Kvbc2skKyPYKMaSyN_ci=s176-c-k-c0xffffffff-no-rj-mo"
  },
  "videos": [
    {
      "title": "alternative songs to take a break from whatever you're listening now (maybe it'll help u)/ playlist",
      "url": "https://youtube.com/watch?v=2chfsFTNEXw",
      "id": "2chfsFTNEXw",
      "length": "2:02:10",
      "milis_length": 7330000,
      "thumbnail_url": "https://i.ytimg.com/vi/2chfsFTNEXw/hqdefault.jpg",
      "author": {
        "name": "hasoyi",
        "url": "https://youtube.com/channel/UCw_5z6HhKttOmcWgVgZ8tcg"
      }
    }
  ]
}
*/

/**
 * @param {{title: String,
 * url: String,
 * id: String,
 * video_count: Number,
 * view_count: Number,
 * description: String,
 * isUnlisted: Boolean,
 * thumbnail_url: String,
 * author: {
 *  name: String,
 *  url: String,
 *  avatar_url: String
 * },
 * videos: Array<{
 *  title: String,
 *  url: String,
 *  length: String,
 *  milis_length: Number,
 *  thumbnail_url: String,
 *  author: {name: String, url: String}
 * }>
 * }} playlist ytfps playlist response
 */
module.exports = (playlist, color) => {
  return {
    embed: {
      title: 'Added playlist to queue',
      description: `[${playlist.title}](${playlist.url})`,
      url: 'https://github.com/async-devil/Zelenchong',
      color: color,
      thumbnail: {
        url: `${playlist.thumbnail_url}`,
      },
      fields: [
        {
          name: '`Description:`',
          value: `${playlist.description ? playlist.description : 'No description provided'}`,
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
  };
};
