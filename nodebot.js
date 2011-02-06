/**
 * Stack Overflow watcher bot.
 *
 * Searches stackoverflow.com for your search terms, and posts them
 * to the IRC channel of your choice.
 *
 * - stores previously-found URLs in a text file
 * - waits 5 seconds between posts to not flood the channel
 * - there's no disconnection (or even error) handling yet
 *
 * Requirements:
 * - npm install node.io
 *
 * Stackbot relies on a couple of minor changes to Jerk, available in my fork,
 * so you can't just install Jerk through npm (yet):
 *
 * https://github.com/autonome/Jerk
 *
 * TODO:
 * - ensure all exceptions are handled
 * - handle disconnects
 *
 */

/****** CONFIGURABLE BITS **********************/

var searchParams = "[jetpack]+mozilla+firefox";
var server = "irc.mozilla.org";
var channel = "#snirfle";
var nick = "stackbot";

// How often to update, in minutes.
// Defaults to once an hour.
var updateInterval = 60;

// Filename pattern to save processed URLs in.
var filename = "/home/dietrich/Dropbox/misc/stackbot-" + channel.replace("#", "") + "-urls.txt";

/****** END CONFIGURABLE BITS ******************/

var util = require("util");

// Load up previous URLs.
var urls = [];
var fs = require('fs')

fs.readFile(filename, function(error, data) {
  if (error)
    util.log("readFile() error: " + error);
  if (data)
    urls = data.toString().split("\n");
});

// Set up bot.
var jerk = require('jerk');

var bot = jerk(function(j) {}).connect({
  server: server,
  nick: nick,
  channels: [channel],
  onConnect: onConnect,
  delayAfterConnect: 3000
});


// Driver.
function onConnect() {
  var processing = false;

  function onScrapeResults(results) {
    util.log("onScrapeResults()");
    // Process the results in chunks, to avoid flooding the channel.
    function processResults() {
      // if there are results to process and the bot is ready
      if (bot && bot.say && results.length) {
        // if the item is not new, immediately move ahead.
        var timeout = 0;

        // process ze item
        var result = results.shift();
        if (isNew(result.url)) {
          bot.say(channel, "Question! " + result.title + ": " + result.url);
          // wait 5 seconds before moving on, so we don't flood the channel.
          timeout = 5000;
        }
        
        setTimeout(processResults, timeout);
        return;
      }
      // if the bot ain't ready but we have results, give it another
      // 5 seconds
      else if (results.length) {
        setTimeout(processResults, 5000);
      }
      // if no results left, restart the engine
      else {
        processing = false;
        // Processing is complete. Kick off the timer for the next round.
        engine();
      }
    }

    processResults();
  }

  // Scrape the query, get the results in [{title:"", URL: ""}].
  function search(searchParams) {
    util.log("search()");
    if (processing)
      return;
    processing = true;

    require('node.io').scrape(function() {
      util.log("scrape()");
      var self = this;
      var searchURL = "http://stackoverflow.com/search?q=" + searchParams;
      this.getHtml(searchURL, function(err, $) {
        util.log("getHTML()");
        if (err) {
          require("util").log("getHtml(): " + err);
          engine();
        } else {
          var results = [];
          $('.question-hyperlink').each(function(question) {
            var url = question.attribs.href;
            results.push({
              title: question.text,
              url: "http://stackoverflow.com" + url
            });
          });
          onScrapeResults(results);
        }
      });
    });
  }

  // Drives the timed searches.
  function engine() {
    util.log("engine()");
    // run search after the update interval
    setTimeout(function() {
      console.log("timeout hit!")
      search(searchParams);
    }, updateInterval * 1000);
  }

  // Kick it off, yo.
  search(searchParams);
}

// Returns bool if URL has been processed already or not.
// If not, adds URL to processed list, saves to file.
function isNew(url) {
  if (urls.indexOf(url) != -1)
    return false;
  else {
    urls.push(url);
    fs.writeFile(filename, urls.join("\n"), function(error) {
      if (error)
        util.log("isNew()->writeFile() error: " + error); 
    });
    return true;
  }
}
