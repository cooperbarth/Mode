const MAX_CHANNELS = 5;

const responseMarkdown = (ok, err, phrase, data) => {
    if (!ok) {
        return `Something went wrong (${err}). Try again?`;
    }
    console.log(data);
    const channels = data.channels;
    if (channels.length === 0) {
        return `Sorry! I couldn't find any mentions of "${phrase}".`;
    } else {
        let returnString = `*Channels that mention "${phrase}":*\n`;
        for (let i = 0; i < Math.min(channels.length, MAX_CHANNELS); i++) {
            const channel = channels[i];
            const count = channel.count;
            returnString += `*<#${channel.id}|${channel.name}>:* ${count} mention${(count === 1)? '' : 's'}\n`;
        }
        return returnString;
    }
}

module.exports = responseMarkdown;