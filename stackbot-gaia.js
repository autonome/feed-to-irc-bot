/**
 * Stack Overflow watcher bot.
 *
 * Searches stackoverflow.com for your search terms, and posts them
 * to the IRC channel of your choice.
 *
 * - checks feeds every X minutes
 *
 * - waits X seconds between posts to not flood the channel
 *
 * TODO
 *
 * - support feed + N room combos (queue entries should contain item+room)
 *
 * - support un/subscribing from channel (reqs data persistence)
 * 
 */

/****** CONFIGURABLE BITS **********************/

var server = "irc.mozilla.org";
var channel = "#fxos";
var nick = "fxos-stackbot";

var feedURL = 'http://stackoverflow.com/feeds/tag?tagnames=firefox-os&sort=newest'

// How often to check feeds, in minutes.
// Defaults to once an hour.
var feedUpdateIntervalMins = 60

// How often to process queue, in seconds.
// Defaults to every 10 seconds
var queueUpdateIntervalSecs = 10


/****** END CONFIGURABLE BITS ******************/

var irc = require('irc'),
    client = new irc.Client(server, nick, { }),
    rooms = [channel],
    joined = false,
    queue = [],
    lastFeedCheck = null

client.on('registered', function() {
  client.join(rooms[0], function() {
    joined = true
  })
})

client.addListener('error', function(message) {
  console.log('error: ', message);
})

function parseFeed(url) {
  var FeedParser = require('feedparser')
    , request = require('request');

  var req = request(url)
    , feedparser = new FeedParser();

  req.on('error', function (error) {
    // handle any request errors
  });
  req.on('response', function (res) {
    var stream = this;

    if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

    stream.pipe(feedparser);
  });


  feedparser.on('error', function(error) {
    // always handle errors
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
  if (diffInMins < feedUpdateIntervalMins) {
    queue.push(item)
  }
}

// Notify registered channels of item
function notify(item) {
  client.say(rooms[0], 'New question: ' + item.title + ' - ' + item.link)
}

// Initiate feed check driver
setInterval(function feedDriver() {
  parseFeed(feedURL)
}, feedUpdateIntervalMins * 60 * 1000)

// Kickoff at script start
parseFeed(feedURL)

// Inititate queue processing driver
setInterval(function queueDriver() {
  if (queue.length) {
    notify(queue.shift())
  }
}, queueUpdateIntervalSecs * 1000)
