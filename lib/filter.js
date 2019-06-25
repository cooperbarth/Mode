const Filter = require("bad-words");
const badWordsList = require("badwords-list").array;
const badWordsArray = require("badwords/array");

let filter = new Filter({list: badWordsList + badWordsArray});

const isProfane = (phrase) => {
    for (let word of phrase.split(" ")) {
        if (filter.isProfane(word)) {
            return word;
        }
    }
    return false;
}

module.exports = isProfane;