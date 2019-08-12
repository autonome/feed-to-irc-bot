# Stackbot

Stack Overflow watcher bot.

Searches stackoverflow.com for your search terms, and posts them to the IRC channel of your choice.

No data persistence required.

## Features

- checks feeds every X minutes
- waits X seconds between posts to not flood the channel

# TODO

- add support for identifying nick
- modularize out core into rss irc bot and stackbot is just an SO specialized version
- modularize out transport, and stackbot is an IRC specialized version

- handle disconnects
- support feed + N room combos (queue entries should contain item+room)
- support un/subscribing from channel (reqs data persistence)
