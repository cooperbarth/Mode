# Mode

## A Help-Seeking Slackbot designed for newcomers to large organizations.

Coming into a large Slack workspace, it can be near-impossible to find the channels or people to reach out to in order to gain relevant info. This app attempts to alleviate this through frequency analysis: in this system, mentions map directly to relevancy.

In Slack, a user can type `/find <query>` to search for the public channels where `query` is most frequently mentioned. Similarly, one can use `/experts <query>` to find the users who most frequently mention `query`.

When a query is made, the bot will return the top few channels or users and the mention count of each.

### Implementation Instructions:

1. [Create a Slack App.](https://api.slack.com)
2. Set Slash Commands to call your routes (e.g. `/find`, `/experts`).
3. Generate an OAuth Access Token.
4. Add the following Permission Scopes: *channels:history*, *channels:read*, *users:read*, *incoming-webhook*.
5. Set the appropriate Environment Variables in your Heroku app (or wherever you choose to run your server) to the Access Token generated in Step 3.
6. Run your server.
