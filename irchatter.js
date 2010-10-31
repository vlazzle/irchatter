util = require('util'),
irc = require('irc');
require('underscore');

DEBUG = true;

debug = function (msg) {
  if (DEBUG) {
    util.puts(msg);
  }
};

NS = 'NickServ';

var irchatter = function (spec) {
  var spec = spec || {},
      network = spec.network || 'irc.freenode.net',
      handle = spec.handle || 'irchatter-bot',
      _masters = _(spec.masters || ['vovik']),
      channels = _(spec.channels || ['irchatter1', 'irchatter2']).map(function (cName) {
        return (cName[0] == '#' ? cName : '#' + cName);
      });
  
  var client = new irc.Client(network, handle, {
    channels: channels
  });
  
  var auth = function (user, success, fail) {
    var nickservAccHandler = function (msg) {
      if (msg.nick == NS && msg.user == NS && msg.args[1] && msg.command == 'NOTICE') {
        client.removeListener('raw', nickservAccHandler);
        
        if (msg.args[1] == user + ' ACC 3') {
          success();
        } else {
          fail();
        }
      }
    };
    
    client.addListener('raw', nickservAccHandler);
    client.say('nickserv', 'acc vovik');
  };
  
  var authAndObey = function (channel, from, msg) {
    debug('in authAndObey');
    
    if (channel[0] != '#') {
      debug('prepending #');
      channel = '#' + channel;
    }
    
    var ifSuccess = function () {
      debug('auth success');
      obey(channel, from, msg);
    }
    
    var ifFail = function () {
      debug('auth fail');
      client.say(channel, "You're not the boss of me, " + from + "!");
    }
    
    auth(from, ifSuccess, ifFail);
  };
  
  var obey = function (channel, from, msg) {
    switch(msg) {
      case '!where':
        client.say(channel, "The following bases are belong to us: " + getChannels().join(', '));
        break;
      default:
        client.say(channel, "Not to worry, I'll `" + msg + "` right way.");
    }
  };

  var addMessageListeners = function () {    
    _(channels).each(function (channel) {
      debug('now listening from messages on ' + channel);
      client.addListener('message' + channel, function (from, msg) {
        debug("got message on " + channel);
        if (_masters.include(from)) {
          authAndObey(channel, from, msg);
        }
        else {
          util.puts(from + ' => ' + channel + ': ' + msg);
        }
      });
    });
  };
  
  var getChannels = function () {
    return _.keys(client.chans);
  }
  
  var that = {
    getChannels: getChannels,
    addMessageListeners: addMessageListeners
  };
  
  return that;
};

// main
c = irchatter();
c.addMessageListeners();