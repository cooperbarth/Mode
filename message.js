const responseMarkdown = (channelJSON) => {
    if (!channelJSON.ok) {
        return `Something went wrong (${channelJSON.err}). Try again?`;
    }
    channels = channelJSON.channels;
    if (channels.length === 0) {
        return `No channels found for query '${channelJSON.phrase}'.`;
    } else {
        let returnString = ``;
        for (let i = 0; i < Math.min(channels.length, 4); i++) {
            const channel = channels[i];
            returnString += `*<#${channel.id}|${channel.name}>:* ${channel.count} mentions.\n`;
        }
        return returnString;
    }
}

module.exports = responseMarkdown;