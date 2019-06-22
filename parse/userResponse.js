const userResponse = (ok, err, phrase, users) => {
    if (!ok) {
        return err;
    } else if (users.length === 0) {
        return `Sorry! I couldn't find any mentions of "${phrase}".`;
    } else {
        let returnUsers = users.sort((u1, u2) => {
            return u1.count < u2.count;
        })
        let returnString = `*Users that frequently mention "${phrase}":*\n`;
        for (let user of returnUsers) {
            const count = user.count;
            returnString += `*<@${user.id}|${user.name}>:* ${count} mention${(count === 1)? '' : 's'}\n`;
        }
        return returnString;
    }
}

module.exports = userResponse;