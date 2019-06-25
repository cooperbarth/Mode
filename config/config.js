module.exports = {
    "dev": {
        "host": "https://mode-bot.herokuapp.com/",
        "oauth": process.env.OAUTH_TOKEN_TEST
    },
    "bt": {
        "host": "https://mode-bot.herokuapp.com/",
        "oauth": process.env.OAUTH_TOKEN_TEST
    }/*,
    "bt": {
        "host": "NEW HEROKU DYNO",
        "oauth": process.env.OAUTH_TOKEN_BT
    }
    */

}