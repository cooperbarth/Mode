const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');

const message = require('message');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const serverPort = process.env.PORT || 8081
app.listen(serverPort);
console.log(`Server running on port ${serverPort}.`)

const BOT_TOKEN = "xoxp-672400831732-675015665718-673086614261-85bcc8a4ff7478579c3487d02b73b93e";

app.get('/', (req, res) => {
    res.send("App Running");
})

//input is channel name
app.post('/search', (req, res) => {
    const phrase = req.body.text;

    const channelsUrl = `https://slack.com/api/conversations.list?token=${BOT_TOKEN}&limit=100&exclude_archived=true&types=public_channel`
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
            console.log(body);
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
                const messagesUrl = `https://slack.com/api/channels.history?token=${BOT_TOKEN}&channel=${channel.id}&count=1000`;
                request(messagesUrl, (err, _, body) => {
                    if (!err) { //if this channel broke, we'll just discount the channel
                        body = JSON.parse(body);
                        if (body.ok) { //if not ok, we'll just discount the channel
                            const messages = body.messages;
                            let count = 0
                            for (message of messages) {
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