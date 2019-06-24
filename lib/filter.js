const Filter = require("bad-words");
const badWordsList = require("badwords-list").array;

let filter = new Filter({list: badWordsList});

const isProfane = (word) => {
    return filter.isProfane(word);
}

module.exports = isProfane;