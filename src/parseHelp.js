const fs = require('fs').promises;

/**
 * @param {string} data readFile output
 * @param {string} prefix Bot prefix
 * @returns {{name: string, value: string}[]} Parsed document
 */
const prepare = (prefix, data) => {
  data = data
    .split('\n')
    .map((line) => line.replace(/\r/gm, '').replace(/=/gm, prefix))
    //! Ignores all except lines which starts from "-"
    .filter((line) => line && line.trim().startsWith('-'));

  /*
  ? - name
  ?   - value
  */

  const names = [...data]
    .filter((line) => line.startsWith('-'))
    //? Deletes list element markdown tag "-"
    .map((line) => line.replace(/^\ *- /gm, ''));

  const values = [...data]
    .filter((line) => line.startsWith(' '))
    //? Deletes list element markdown tag "-", bolding signs "**...**" and next line symbols "\"
    .map((line) => line.replace(/(^\ *- )|(\*\*)|(\\)/gm, ''));

  if (names.length !== values.length)
    throw new Error(
      `Please validate help, there are ${
        names.length > values.length ? 'more' : 'less'
      } names than values`,
    );

  const parsed = [];
  for (let i = 0; i < names.length; i += 1) {
    parsed.push(Object({ name: names[i], value: values[i] }));
  }
  return parsed;
};

/**
 * @param {string} prefix Bot prefix
 */
const parse = async (prefix) => {
  const data = await fs.readFile('./README.md', 'utf8');
  return prepare(prefix, data);
};

module.exports = parse;
