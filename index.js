'use strict';

module.exports = function(opts) {

  let options = {

    // IRC server the bot will connect to
    server: opts.server || 'irc.freenode.net',

    // encrypt the connection
    secure: opts.secure || true,

    // channels the bot will join
    channel: opts.channel || '#feed-to-irc-bot',

    // name of the bot
    nick: opts.nick || 'feed-to-irc-bot',

    // usually same as nick. only required if you're registered
    // on the server and are also sending password.
    userName: opts.userName || '',

    // the password, if your nick is registered and you are logging in.
    password: opts.password || '',

    // StackOverflow tags the bot will msg about
    feedURL: opts.feedURL || '',

    // How often to check feeds, in minutes.
    // Defaults to once an hour.
    feedUpdateIntervalMins: opts.feedUpdateIntervalMins || 60,

    // How often to process queue, in seconds.
    // Defaults to every 10 seconds
    msgSendIntervalSecs: opts.msgSendIntervalSecs || 10,

    // Message from bot when joining a channel
    joinMessage: opts.joinMessage || '',

    // Prefix new feed items with this
    itemMessagePrefix: opts.itemMessagePrefix || 'New feed item: ',

    // If someone speaks to the bot in the channel like 'nick: '
    aboutMessage: opts.aboutMessage || 'My original source code is at https://github.com/autonome/feed-to-irc-bot',

    // if in debug mode, log everything
    debug: opts.debug || false
  };

  function log() {
    if (options.debug)
      console.log(...arguments)
  }

  log('feed url', options.feedURL)

  /****** END CONFIGURABLE BITS ******************/

  let irc = require('irc'),
      rooms = [options.channel],
      transportReady = false,
      queue = [],
      lastFeedCheck = null

  let client = new irc.Client(options.server, options.nick, {
    sasl: !!options.password,
    userName: options.userName || options.nick,
    password: options.password,
    debug: options.debug
  });

  client.on('registered', function() {
    log('bot registered on network')
    client.join(rooms[0], function() {
      log('bot joined room', rooms[0])
      client.say(rooms[0], options.joinMessage)
      transportReady = true
    })
  })

  client.addListener('message' + rooms[0], function(from, message) {
    if (message.indexOf(options.nick + ': ') == 0) {
      client.say(rooms[0], options.aboutMessage)
    }
  });

  client.addListener('error', function(message) {
    log('error: ', message);
  })

  function parseFeed(url) {
    let FeedParser = require('feedparser')
      , request = require('request');

    let reqOptions = {
      url,
      headers: {
        'User-Agent': 'npm:feed-to-irc'
      }
    }

    log('parseFeed():', url)
    var req = request(reqOptions)
      , feedparser = new FeedParser();

    req.on('error', function (error) {
      // handle any request errors
      log('feedparser: request error', error)
    });

    req.on('response', function (res) {
      var stream = this;

      log('feedparser: response!', res.statusCode, res.statusMessage)

      if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

      stream.pipe(feedparser);
    });


    feedparser.on('error', function(error) {
      // handle any feedparser errors
      log('feedparser error', error)
    });

    feedparser.on('readable', function() {
      // This is where the action is!
      var stream = this
        , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
        , item;

      while (item = stream.read()) {
        onItem(item)
      }
    });
  }

  // Process an item found in a feed
  //
  // If item is newer than configured feed check interval
  // then add it to the queue.
  function onItem(item) {
    var pubDate = new Date(item.pubdate),
        diff = Date.now() - pubDate.getTime(),
        diffInMins = (diff / 1000) / 60
    //log(diffInMins, '<', options.feedUpdateIntervalMins, '?')
    if (diffInMins < options.feedUpdateIntervalMins) {
      log('added item to queue:', item.title)
      queue.push(item)
    }
  }

  // Notify registered channels of item
  function notify(item) {
    client.say(rooms[0], options.itemMessagePrefix + item.title + ' - ' + item.link)
  }

  // Kickoff at script start
  parseFeed(options.feedURL)

  // Initiate feed check driver
  setInterval(function feedDriver() {
    log('feed driver')
    parseFeed(options.feedURL)
  }, options.feedUpdateIntervalMins * 60 * 1000)

  // Inititate queue processing driver
  setInterval(function queueDriver() {
    log('queue driver, queue length:', queue.length)
    if (transportReady && queue.length) {
      notify(queue.shift())
    }
  }, options.msgSendIntervalSecs * 1000)
}
