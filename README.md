# Feed-to-IRC Bot

RSS feed watcher bot.

Monitors an RSS feed, and posts new items to the IRC channel of your choice.

No data persistence required.

## Features

- Easy configuration
- Pull config options from env variables
- Checks feeds every X minutes
- Waits X seconds between posts to not flood the channel

See example.js for a StackOverflow bot that notifies on new questions for given tags.

## Options


* server: IRC server the bot will connect to
* secure: bool to encrypt the connection, default true
* channel: channels the bot will join
* nick: name of the bot
* userName: if logging in, and different than nick
* password: required if logging in
* feedUpdateIntervalMins: How often to check feeds, in minutes. Defaults to once an hour.
* msgSendIntervalSecs: How often to process queue, in seconds. Defaults to every 10 seconds
* joinMessage: Message from bot when joining a channel
* itemMessagePrefix: Prefix new items with this message
* aboutMessage: If someone speaks to the bot in the channel like 'nick: '
* debug: if debug = true, console.log a bunch of stuff

# TODO

- separate out core into rss irc bot module
- separate out transport and make module for transport agnostic stackbot
- add support for identifying nick
- handle disconnects
- support feed + N room combos (queue entries should contain item+room)
- support un/subscribing from channel (reqs data persistence)
