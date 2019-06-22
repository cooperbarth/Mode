const responseMarkdown = (channelJSON) => {
    if (!channelJSON.ok) {
        return `Something went wrong (${err}). Try again?`;
    }
    channels = channelJSON.channels;
    if (channels.length === 0) {
        return `No channels found for query '${channelJSON.phrase}'.`;
    } else {
        let returnString = ``;
        for (channel of channels) {
            returnString += `${channel.name}: ${channel.count} mentions.`;
        }
        return returnString;
    }
}

module.exports = responseMarkdown;