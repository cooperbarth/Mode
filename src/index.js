const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');

const channelResponse = require('./channelResponse');
const userResponse = require('./userResponse');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const serverPort = process.env.PORT || 8081
app.listen(serverPort);
console.log(`Server running on port ${serverPort}.`)

app.post('/search', (req, res) => {
    const phrase = req.body.text;
    const channelsUrl = `https://slack.com/api/conversations.list?token=${process.env.OAUTH_TOKEN}&limit=500&exclude_archived=true&types=public_channel`
    request(channelsUrl, (err, _, body) => {
        if (err) {
            res.send(channelResponse(false, err, phrase, []));
        }
        body = JSON.parse(body);
        if (!body.ok) {
            res.send(channelResponse(false, body.error, phrase, []));
        } else {
            const channels = body.channels;
            let orderedChannels = [];
            let seenChannels = 0;
            const timeout = setTimeout(() => { //send whatever we have after 3 seconds
                res.send(channelResponse(false, "Request timed out.", phrase, orderedChannels));
            }, 3000);
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
                                orderedChannels.push({
                                    id: channel.id,
                                    name: channel.name,
                                    count: count,
                                });
                            }

                            if (++seenChannels === channels.length) { //this is the last channel
                                clearTimeout(timeout);
                                orderedChannels.sort((c1, c2) => {
                                    return c1.count < c2.count;
                                })
                                res.send(channelResponse(true, "", phrase, orderedChannels));
                            }
                        }
                    }
                });
            }
        }
    });
});

app.post('/experts', (req, res) => {
    const phrase = req.body.text;
    const channelsUrl = `https://slack.com/api/conversations.list?token=${process.env.OAUTH_TOKEN}&limit=500&exclude_archived=true&types=public_channel`
    request(channelsUrl, (err, _, body) => {
        if (err) {
            res.send(userResponse(false, err, phrase, {}));
        }
        body = JSON.parse(body);
        if (!body.ok) {
            res.send(userResponse(false, body.error, phrase, {}));
        } else {
            const channels = body.channels;
            let seenChannels = 0;
            let users = {}; //maps username to # of messages
            
            const timeout = setTimeout(() => { //send whatever we have after 3 seconds
                res.send(userResponse(false, "Request timed out.", phrase, users));
            }, 3000);

            for (let channel of channels) { //get the messages for each channel
                const messagesUrl = `https://slack.com/api/channels.history?token=${process.env.OAUTH_TOKEN}&channel=${channel.id}&count=1000`;
                request(messagesUrl, (err, _, body) => {
                    if (!err) { //if this channel broke, we'll just discount the channel
                        body = JSON.parse(body);
                        if (body.ok) { //if not ok, we'll just discount the channel
                            const messages = body.messages;
                            for (let message of messages) {
                                if (message.text.toLowerCase().includes(phrase.toLowerCase())) {
                                    if (message.user in users) {
                                        users.user = users.user + 1;
                                    } else {
                                        users.user = 1;
                                    }
                                }
                            }
                            
                            if (++seenChannels === channels.length) { //this is the last channel
                                clearTimeout(timeout);
                                let keys = Object.keys(users);
                                keys.sort((k1, k2) => {
                                    return users[k1] < users[k2];
                                });
                                const MAX_USERS = 4;
                                keys = keys.slice(0, MAX_USERS);
                                users = keys.reduce((key, val) => (key[val] = users[val], key), {});

                                res.send(userResponse(true, "", phrase, users));
                            }
                        }
                    }
                });
            }
        }
    });
});