# Stackbot

Stack Overflow watcher bot.

Searches stackoverflow.com for your search terms, and posts them to the IRC channel of your choice.

No data persistence required.

## Features

- Easy configuration
- Pull config options from env variables
- Checks feeds every X minutes
- Waits X seconds between posts to not flood the channel

## Options

To use the options below, create environment variables that are all upper case and prefixed with STACKBOT_.

For example, to change the default nick, create an env var like `STACKBOT_NICK`.

* server: IRC server the bot will connect to
* channel: channels the bot will join
* nick: name of the bot
* tags: StackOverflow tags the bot will msg about (comma delimited string)
* feedUpdateIntervalMins: How often to check feeds, in minutes. Defaults to once an hour.
* queueUpdateIntervalSecs: How often to process queue, in seconds. Defaults to every 10 seconds
* joinMessage: Message from bot when joining a channel
* questionMessage: Message from bot prefixing a new SO question
* aboutMessage: If someone speaks to the bot in the channel like 'nick: '
* debug: if debug = true, console.log a bunch of stuff

# TODO

- separate out core into rss irc bot module
- separate out transport and make module for transport agnostic stackbot
- add support for identifying nick
- handle disconnects
- support feed + N room combos (queue entries should contain item+room)
- support un/subscribing from channel (reqs data persistence)
