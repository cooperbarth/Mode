const MAX_CHANNELS = 5;

const responseMarkdown = (ok, err, phrase, channels) => {
    if (!ok) {
        return `Something went wrong (${err}). Try again?`;
    }
    if (channels.length === 0) {
        return `Sorry! I couldn't find any mentions of "${phrase}".`;
    } else {
        let returnString = '';

        const supportServiceChannels = channels.filter(channel => {
            const channelName = channel.name.toLowerCase();
            return channelName.includes('support') || channelName.includes('service');
        });
        if (supportServiceChannels.length !== 0) {
            returnString += `*Support/Service Channels that mention "${phrase}":*\n`;
            for (let i = 0; i < Math.min(supportServiceChannels.length, MAX_CHANNELS); i++) {
                const channel = supportServiceChannels[i];
                const count = channel.count;
                returnString += `*<#${channel.id}|${channel.name}>:* ${count} mention${(count === 1)? '' : 's'}\n`;
            }
            returnString += `\n`;
        }
        
        const otherChannels = channels.filter(channel => !supportServiceChannels.includes(channel));
        if (otherChannels.length !== 0) {
            returnString += `*${supportServiceChannels.length > 0 ? 'Other ' : ''}Channels that mention "${phrase}":*\n`;
            for (let i = 0; i < Math.min(otherChannels.length, Math.max(MAX_CHANNELS - supportServiceChannels.length, 0)); i++) {
                const channel = otherChannels[i];
                const count = channel.count;
                returnString += `*<#${channel.id}|${channel.name}>:* ${count} mention${(count === 1)? '' : 's'}\n`;
            }
        }

        return returnString;
    }
}

module.exports = responseMarkdown;