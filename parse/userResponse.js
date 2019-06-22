const userResponse = (ok, err, phrase, users) => {
    console.log(ok, err, phrase, users)
    if (!ok) {
        return err;
    } else {
        let returnString = `*Users that frequently mention "${phrase}":*\n`;
        for (let user of users) {
            const count = user.count;
            returnString += `*<@${user.id}|${user.name}>:* ${count} mention${(count === 1)? '' : 's'}\n`;
        }
        return returnString;
    }
}

module.exports = userResponse;