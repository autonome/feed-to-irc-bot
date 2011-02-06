# Stackbot

Stack Overflow watcher bot.

Searches stackoverflow.com for your search terms, and posts them to the IRC channel of your choice.

* stores previously-found URLs in a text file
* waits 5 seconds between posts to not flood the channel
* there's no disconnection (or even error) handling yet

# Requirements:

Node.io:

npm install node.io

Jerk:

Stackbot relies on a couple of minor changes to Jerk, available in my fork, so you can't just install Jerk through npm (yet).

https://github.com/autonome/Jerk

# TODO
* ensure all exceptions are handled
* handle disconnects
