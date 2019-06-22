const userResponse = (ok, err, phrase, users) => {
    if (!ok) {
        return err;
    } else if (users.length === 0) {
        return `Sorry! I couldn't find any mentions of "${phrase}".`;
    } else {
        let returnString = `*Users that frequently mention "${phrase}":*\n`;
        for (let user of users.sort((k1, k2) => {return users[k1] < users[k2];})) {
            const count = user.count;
            returnString += `*<@${user.id}|${user.name}>:* ${count} mention${(count === 1)? '' : 's'}\n`;
        }
        return returnString;
    }
}

module.exports = userResponse;