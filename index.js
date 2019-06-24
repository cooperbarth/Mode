const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const request = require("request");

const channelResponse = require("./parse/channelResponse");
const userResponse = require("./parse/userResponse");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const serverPort = process.env.PORT || 8081
app.listen(serverPort);
const aliveMessage = `Server running on port ${serverPort}.`;
console.log(aliveMessage);

const TIMEOUT = 2500;
const MAX_RETURN_OBJECTS = 4;

const apiUrl = "https://mode-bot.herokuapp.com/";
const channelsUrl = `https://slack.com/api/conversations.list?token=${process.env.OAUTH_TOKEN}&limit=500&exclude_archived=true&types=public_channel`;
const messagesUrl = (channelId) => {return `https://slack.com/api/channels.history?token=${process.env.OAUTH_TOKEN}&channel=${channelId}&count=500`;}
const usersUrl = (userId) => {return `https://slack.com/api/users.info?token=${process.env.OAUTH_TOKEN}&user=${userId}`;}

//keep awake by pinging every 29 mins
const PING_INTERVAL = 1740000;
setInterval(() => {
    request(apiUrl, (err) => {
        if (err) {
            console.log("Mode is down.");
        }
    })
}, PING_INTERVAL);

app.get("/", (req, res) => {
    res.send(aliveMessage);
})

app.post("/find", (req, res) => {
    const phrase = req.body.text;
    //get all channels, then get all messages in each
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
                            //add channels that have >=1 messages with mention to orderedChannels
                            const messages = body.messages;
                            let count = 0
                            for (let message of messages) {
                                const text = message.text.toLowerCase();
                                const lowerPhrase = phrase.toLowerCase();
                                if (text.includes(lowerPhrase)) {
                                    const regex = new RegExp(lowerPhrase, "g");
                                    count += (text.match(regex) || []).length;
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

app.post("/experts", (req, res) => {
    const phrase = req.body.text;
    //get all channels, then get all messages in each
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
            for (let channel of channels) { //get all messages from each channel and modify JSON
                request(messagesUrl(channel.id), (err, _, body) => {
                    if (!err) {
                        body = JSON.parse(body);
                        if (body.ok) {
                            const messages = body.messages;
                            for (let message of messages) {
                                const text = message.text.toLowerCase();
                                const lowerPhrase = phrase.toLowerCase();
                                if (text.includes(lowerPhrase)) {
                                    const regex = new RegExp(lowerPhrase, "g");
                                    const matchCount = (text.match(regex) || []).length;
                                    const user = message.user;
                                    if (user in users) {
                                        users[user] = users[user] + matchCount;
                                    } else {
                                        users[user] = matchCount;
                                    }
                                }
                            }
                        
                            if (++seenChannels === channels.length) { //we've seen all messages from all channels
                                clearTimeout(timeout); //shouldn't worry about timeout anymore; we have our user list
                                //build list of MAX_RETURN_OBJECTS users with max # of mentions
                                let keys = Object.keys(users);
                                if (keys.length === 0) {
                                    res.send(userResponse(true, "", phrase, []));
                                }
                                keys.sort((k1, k2) => {
                                    return users[k1] < users[k2];
                                });
                                keys = keys.slice(0, Math.min(keys.length, MAX_RETURN_OBJECTS));

                                //we only have the IDs of each user; now we need their names
                                let responseUsers = [];
                                let userResponsesSeen = 0;
                                clearTimeout(timeout); 
                                for (let user of keys) {
                                    request(usersUrl(user), (err, _, body) => {
                                        if (!err) {
                                            body = JSON.parse(body);
                                            if (body.ok) {
                                                const responseUser = body.user;
                                                responseUsers.push({
                                                    id: user,
                                                    name: responseUser.name,
                                                    count: users[user]
                                                });
                                                if (++userResponsesSeen === keys.length) {
                                                    res.send(userResponse(true, "", phrase, responseUsers));
                                                }
                                            } else {
                                                res.send(userResponse(false, "Error retrieving users.", phrase, []));
                                            }
                                        } else {
                                            res.send(userResponse(false, "Error retrieving users.", phrase, []));
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