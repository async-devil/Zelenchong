/**
 * @param {String} description Description of error
 * @param {Number} color Decimal color of left vertical line
 */
module.exports = (description, color) => {
  return {
    embed: {
      description: description,
      color: color,
    },
  };
}