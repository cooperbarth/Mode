const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');

const channelResponse = require('./parse/channelResponse');
const userResponse = require('./parse/userResponse');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const serverPort = process.env.PORT || 8081
app.listen(serverPort);
console.log(`Server running on port ${serverPort}.`)

const TIMEOUT = 2500;
const MAX_EXPERTS = 4;

const channelsUrl = `https://slack.com/api/conversations.list?token=${process.env.OAUTH_TOKEN}&limit=500&exclude_archived=true&types=public_channel`;
const messagesUrl = (channelId) => {return `https://slack.com/api/channels.history?token=${process.env.OAUTH_TOKEN}&channel=${channelId}&count=500`;}
const usersUrl = (userId) => {return `https://slack.com/api/users.info?token=${process.env.OAUTH_TOKEN}&user=${userId}`;}

app.post('/find', (req, res) => {
    const phrase = req.body.text;
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
            const timeout = setTimeout(() => { //send whatever we have after 2.5 seconds
                res.send(channelResponse(false, "Request timed out.", phrase, orderedChannels));
            }, TIMEOUT);
            for (let channel of channels) { //get the messages for each channel
                request(messagesUrl(channel.id), (err, _, body) => {
                    if (!err) { //if this channel broke, we'll just discount the channel
                        body = JSON.parse(body);
                        if (body.ok) {
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
                                    count: count
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
    request(channelsUrl, (err, _, body) => {
        if (err) {
            res.send(userResponse(false, err, phrase, []));
        }
        body = JSON.parse(body);
        if (!body.ok) {
            res.send(userResponse(false, body.error, phrase, []));
        } else {
            const channels = body.channels;
            const timeout = setTimeout(() => {
                res.send(userResponse(false, "Request timed out.", phrase, []));
            }, TIMEOUT);

            let seenChannels = 0;
            let users = {}; //maps username to # of messages
            for (let channel of channels) {
                request(messagesUrl(channel.id), (err, _, body) => {
                    if (!err) {
                        body = JSON.parse(body);
                        if (body.ok) {
                            const messages = body.messages;
                            for (let message of messages) {
                                if (message.text.toLowerCase().includes(phrase.toLowerCase())) {
                                    const user = message.user;
                                    if (user in users) {
                                        users[user] = users[user] + 1;
                                    } else {
                                        users[user] = 1;
                                    }
                                }
                            }
                        
                            if (++seenChannels === channels.length) { //this is the last channel
                                clearTimeout(timeout);
                                let keys = Object.keys(users);
                                if (keys.length === 0) {
                                    res.send(userResponse(true, "", phrase, []));
                                }
                                keys.sort((k1, k2) => {
                                    return users[k1] < users[k2];
                                });
                                const MAX_USERS = Math.min(keys.length, MAX_EXPERTS);
                                keys = keys.slice(0, MAX_USERS);

                                let responseUsers = [];
                                let userResponsesSeen = 0;
                                for (let user of keys) {
                                    request(usersUrl(user), (err, _, body) => {
                                        if (!err) { //if this channel broke, we'll just discount the channel
                                            body = JSON.parse(body);
                                            if (body.ok) {
                                                const responseUser = body.user;
                                                responseUsers.push({
                                                    id: user,
                                                    name: responseUser.name,
                                                    count: users[user]
                                                });

                                                if (++userResponsesSeen === keys.length) {
                                                    clearTimeout(timeout);
                                                    res.send(userResponse(true, "", phrase, responseUsers));
                                                }
                                            } else {
                                                console.log("???")
                                                res.send(userResponse(false, "Error retrieving users.", phrase, []));
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }
                });
            }
        }
    });
});