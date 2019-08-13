/****** CONFIGURABLE BITS **********************/

let options = {

  // IRC server the bot will connect to
  server: 'irc.freenode.net',

  // encrypt the connection
  secure: true,

  // channels the bot will join
  channel: '#dietrich',

  // name of the bot
  nick: 'ipfs-stackbot',

  // usually same as nick. only required if you're registered
  // on the server and are also sending password.
  userName: '',

  // the password, if your nick is registered and you are logging in.
  password: '',

  // StackOverflow tags the bot will msg about
  tags: ['ipfs'],

  // How often to check feeds, in minutes.
  // Defaults to once an hour.
  feedUpdateIntervalMins: 60,

  // How often to process queue, in seconds.
  // Defaults to every 10 seconds
  queueUpdateIntervalSecs: 10,

  // Message from bot when joining a channel
  joinMessage: "Hi! I'll notify you about new questions on StackOverflow about the tags I'm configured with.",

  // Message from bot prefixing a new SO question
  questionMessage: "New question on StackOverflow: ",

  // If someone speaks to the bot in the channel like 'nick: '
  aboutMessage: 'I was set up by dietricha, and my source code is at https://github.com/autonome/Stackbot',

  // if in debug mode, log everything
  debug: false
};

// Process any config parameters
Object.keys(options).forEach(key => {
  let name = 'STACKBOT_' + key.toUpperCase();
  if (process.env[name]) {
    options[key] = process.env[name];
  }
});

let feedURL =
  'https://stackoverflow.com/feeds/tag?sort=newest&tagnames='
  + encodeURIComponent(options.tags.join(' or '));

function log() {
  if (options.debug)
    console.log(...arguments)
}

log('feed url', feedURL)

/****** END CONFIGURABLE BITS ******************/

var irc = require('irc'),
    rooms = [options.channel],
    joined = false,
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
    joined = true
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
  var FeedParser = require('feedparser')
    , request = require('request');

  var req = request(url)
    , feedparser = new FeedParser();

  req.on('error', function (error) {
    // handle any request errors
    log('feedparser: request error', error)
  });

  req.on('response', function (res) {
    var stream = this;

    log('feedparser: response')

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
  client.say(rooms[0], options.questionMessage + item.title + ' - ' + item.link)
}

// Kickoff at script start
parseFeed(feedURL)

// Initiate feed check driver
setInterval(function feedDriver() {
  log('feed driver')
  //parseFeed(feedURL)
}, options.feedUpdateIntervalMins * 60 * 1000)

// Inititate queue processing driver
setInterval(function queueDriver() {
  log('queue driver, queue length:', queue.length)
  if (joined && queue.length) {
    notify(queue.shift())
  }
}, options.queueUpdateIntervalSecs * 1000)
