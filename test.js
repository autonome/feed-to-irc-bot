'use strict';

/*

Example IRC bot that posts new StackOverflow questions
for a given set of tags to an IRC channel.

*/

const feedToIRC = require('./index.js');

// StackOverflow RSS feed for tags
let feedURL = 'https://infinite-rss.glitch.me?itemCount=1';

// Bot config
let botConfig = {

  // IRC server the bot will connect to
  server: 'irc.freenode.net',

  // encrypt the connection
  secure: true,

  // channels the bot will join
  channel: '#feed-to-irc-bot',

  // name of the bot
  nick: 'feed-to-irc-testbot',

  // usually same as nick. only required if you're registered
  // on the server and are also sending password.
  userName: '',

  // the password, if your nick is registered and you are logging in.
  password: '',

  // URL to an RSS feed
  feedURL: feedURL,

  // How often to check feeds, in minutes.
  // Defaults to once an hour.
  feedUpdateIntervalMins: 1, //60,

  // How often to msg the IRC channel, in seconds.
  // Defaults to every 10 seconds
  msgSendIntervalSecs: 10,

  // Message from bot when joining a channel
  joinMessage: "Hi! I'll notify you about new feed items for the feed I'm configured with.",

  // Message from bot prefixing a new SO question
  itemMessagePrefix: "New feed item: ",

  // If someone speaks to the bot in the channel like 'nick: '
  aboutMessage: 'My source code is at https://github.com/autonome/feed-to-irc-bot',

  // if in debug mode, log everything
  debug: true
};

// Process any environment parameters
// Eg, create environment variables that are all
// upper case and prefixed with STACKBOT_.
//
// For example, to change the default nick, create an env var STACKBOT_NICK.

Object.keys(botConfig).forEach(key => {
  let name = 'STACKBOT_' + key.toUpperCase();
  if (process.env[name]) {
    botConfig[key] = process.env[name];
  }
});

feedToIRC(botConfig);
