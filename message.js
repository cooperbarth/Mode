const responseMarkdown = (messageJSON) => {
    if (!messageJSON.ok) {
        return `Something went wrong (${messageJSON.err}). Try again?`;
    }
    const channels = messageJSON.channels;
    const phrase = messageJSON.phrase;
    if (channels.length === 0) {
        return `No channels found for query '${phrase}'.`;
    } else {
        let returnString = `*Channels that mention _"${phrase}"_:*\n`;
        for (let i = 0; i < Math.min(channels.length, 4); i++) {
            const channel = channels[i];
            returnString += `*<#${channel.id}|${channel.name}>:* ${channel.count} mentions.\n`;
        }
        return returnString;
    }
}

module.exports = responseMarkdown;