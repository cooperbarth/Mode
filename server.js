const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');

const message = require('./message.js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const serverPort = process.env.PORT || 8081
app.listen(serverPort);
console.log(`Server running on port ${serverPort}.`)

app.get('/', (req, res) => {
    res.send("App Running");
})

//input is channel name
app.post('/search', (req, res) => {
    const phrase = req.body.text;

    const channelsUrl = `https://slack.com/api/conversations.list?token=${process.env.BOT_OAUTH_TOKEN}&limit=100&exclude_archived=true&types=public_channel`
    request(channelsUrl, (err, _, body) => {
        if (err) {
            res.send(message({
                ok: false,
                err: err,
                phrase: phrase,
                channels: [],
                finished: false
            }));
        }
        body = JSON.parse(body);
        if (!body.ok) {
            res.send(message({
                ok: false,
                err: body.error,
                phrase: phrase,
                channels: [],
                finished: false
            }));
        } else {
            const channels = body.channels;
            let orderedChannels = [];
            let seenChannels = 0;
            const timeout = setTimeout(() => { //send whatever we have after 5 seconds
                res.send(message({
                    ok: true,
                    err: "",
                    phrase: phrase,
                    channels: orderedChannels,
                    finished: false
                }));
            }, 5000);
            for (let channel of channels) { //get the messages for each channel
                const messagesUrl = `https://slack.com/api/channels.history?token=${process.env.OAUTH_TOKEN}&channel=${channel.id}&count=1000`;
                request(messagesUrl, (err, _, body) => {
                    if (!err) { //if this channel broke, we'll just discount the channel
                        body = JSON.parse(body);
                        if (body.ok) { //if not ok, we'll just discount the channel
                            const messages = body.messages;
                            let count = 0
                            for (let message of messages) {
                                if (message.text.toLowerCase().includes(phrase.toLowerCase())) {
                                    count++;
                                }
                            }
                            if (count !== 0) {
                                const channelJSON = {
                                    id: channel.id,
                                    name: channel.name,
                                    count: count,
                                };
                                orderedChannels.push(channelJSON);
                            }
                            seenChannels++;
                            if (seenChannels === channels.length) { //this is the last channel
                                clearTimeout(timeout);
                                orderedChannels.sort((c1, c2) => {
                                    return c1.count < c2.count;
                                })
                                res.send(message({
                                    ok: true,
                                    err: "",
                                    phrase: phrase,
                                    channels: orderedChannels,
                                    finished: true
                                }));
                            }
                        }
                    }
                });
            }
        }
    });
});