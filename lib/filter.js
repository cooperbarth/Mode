const Filter = require("bad-words");
const badWordsList = require("badwords-list").array;

let filter = new Filter({list: badWordsList});

const isClean = (word) => {
    return filter.isProfane(word);
}

module.exports = isClean;
