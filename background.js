/* (c) 2017 copyright by Gezim Musliaj. All rights reserved.

For support contact gmusliaj@gmail.com

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

  - Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.

  - Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*====================================Initialization======================================*/

var alarmDelay = 1;
var unreadComments = [];
chrome.runtime.onMessage.addListener(onMessage);
chrome.alarms.onAlarm.addListener(onAlarm);
chrome.alarms.create('refresh', {periodInMinutes: alarmDelay});
chrome.alarms.create('subscribedConfessions', {periodInMinutes: alarmDelay});
chrome.browserAction.onClicked.addListener(openUnreadConfessionReplies);
chrome.runtime.onInstalled.addListener(onInstalled);
init();

/**
 * Initialize the extension and check the status of the subscribed confessions.
 */
function init() {
 getConfessions({
 	success: function(confessions) {
 		console.debug('init() => confessions: ', confessions);
 		if (confessions.length === 0) {
	  		chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
	    	chrome.browserAction.setBadgeText({text:"?"});
	  	} else {
		    subscribedConfessionsAlarm();
		}
 	}
 });
}

/**
 * Open the unread confession replies on new tabs and update their status
 */
function openUnreadConfessionReplies() {
	console.log('openUnreadConfessionReplies()');
	if (unreadComments.length === 0) {
		console.log('unreadComments: ', unreadComments);
		subscribedConfessionsAlarm({
			success: function(unreadComments) {
				var toBeUpdated = [];
				var toBeCreated = [];
				chrome.tabs.getAllInWindow(null, function(tabs) {
				for (var i = 0, tab; tab = tabs[i]; i++) {
					for (var j = 0; j< unreadComments.length; j++) {
				      if (tab.url) {
				      	if (tab.url.startsWith(unreadComments[j].url)) {
				      		toBeUpdated.push({'tabId': tab.id, 'selected': true});
				      		//chrome.tabs.update(tab.id, {selected: true});
				      	} else {
				      		toBeCreated.push({'url': unreadComments[j].url});
				      		//chrome.tabs.create({url: unreadComments[j].url});
				      	}
				        unreadComments[j].lastCommentCount = unreadComments[j].currentCommentCount;
						update(unreadComments[j]);
				      }
				    }
				}
			  });

			toBeUpdated = uniq_fast(toBeUpdated);
			for (var l = 0; l < toBeUpdated.length; l++) {
				chrome.tabs.update(toBeUpdated[l].tabId, {selected: toBeUpdated[l].selected});
			}
			toBeCreated = uniq_fast(toBeCreated);
			for (var k = 0; k < toBeCreated.length; k++) {
				chrome.tabs.create({url: toBeCreated[k].url});
			}
			unreadComments = [];
			toBeUpdated = [];
			toBeCreated = [];
			chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
			chrome.browserAction.setBadgeText({text: "" + unreadComments.length + ""});
			return;
			}
		});
	} else {
		var toBeUpdated = [];
		var toBeCreated = [];
		chrome.tabs.getAllInWindow(null, function(tabs) {
			for (var i = 0, tab; tab = tabs[i]; i++) {
				for (var j = 0; j< unreadComments.length; j++) {
			      if (tab.url) {
			      	if (tab.url.startsWith(unreadComments[j].url)) {
			      		toBeUpdated.push({'tabId': tab.id, 'selected': true});
				      	//chrome.tabs.update(tab.id, {selected: true});
			      	} else {
			      		toBeCreated.push({'url': unreadComments[j].url});
				      	//chrome.tabs.create({url: unreadComments[j].url});
			      	}
			        unreadComments[j].lastCommentCount = unreadComments[j].currentCommentCount;
					update(unreadComments[j]);
			      }
			    }
			}
			toBeUpdated = uniq_fast(toBeUpdated);
			for (var l = 0; l < toBeUpdated.length; l++) {
				chrome.tabs.update(toBeUpdated[l].tabId, {selected: toBeUpdated[l].selected});
			}
			toBeCreated = uniq_fast(toBeCreated);
			for (var k = 0; k < toBeCreated.length; k++) {
				chrome.tabs.create({url: toBeCreated[k].url});
			}
			unreadComments = [];
			toBeUpdated = [];
			toBeCreated = [];
			chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
			chrome.browserAction.setBadgeText({text: "" + unreadComments.length + ""});
			return;
		});
	}
}

/**
 * Get the links of the subscribed confession
 * @return {Array}
 */
function getSubscribedConfessions() {
	var confessionsLinks = [];
	chrome.storage.sync.get(['subscribedConfessions'], function(confessionLinks) {
		confessionLinks = confessionLinks;
	});

	if (!confessionLinks) {
		console.error('No confession links!');
	}

	return confessionLinks;
}

/**
 * Store the links of the subscribed confessions to the storage
 * @param {Array} confessionLinks - the links to the subscribed confessions
 */
function setSubscribedConfessions(confessionLinks) {
	chrome.storage.sync.set({'subscribedConfessions': subscribedConfessions}, function(confessionLinks) {
		confessionLinks = confessionLinks;
	});
}

/**
 * On Alarm event handler
 * @param {Object} alarm
 */
function onAlarm(alarm) {
	console.debug('alarm: ', alarm);
	if (alarm) {
		switch (alarm.name) {
			case "subscribedConfessions":
				subscribedConfessionsAlarm();
				break;
			case "refresh":
				refreshAlarm();
				break;
		}
	}
}

/**
 * On Installed event handler
 * @param {Object} details
 */
function onInstalled(details) {
	console.debug('onInstalled() => details: ', details);
	reset({
		success: function(response) {
			console.log('Previously subsribed confessions removed!');
			return;
		}
	})
}

/**
 * Subscribed confessions alarm handler
 */
function subscribedConfessionsAlarm(opts) {
	var confessions = [];
	chrome.storage.sync.get(null, function(data) {
		console.debug('subscribedConfessionsAlarm() => data: ', data);
		var normalizedData = normalizeData(data);
		if (normalizedData.length === 0) {
			chrome.tabs.getAllInWindow(null, function(tabs) {
				for (var i = 0, tab; tab = tabs[i]; i++) {
					if (tab.url) {
						if (tab.url.startsWith('https://www.faltore.al')) {
							chrome.tabs.update(tab.id, {selected: true});
							chrome.tabs.reload(tab.id);
							return;
						}
					}
				}
				chrome.tabs.create({url: 'https://www.faltore.al'})
				return;
			});
		}
		var newComments = 0;
		var counter = 0;
		unreadComments = [];
		for (var i = 0; i < normalizedData.length; i++ ) {
			var confession = normalizedData[i];
			counter++;
			(function(confession) {
				getSubscribedConfessionCommentsCount(confession, {
					success: function(parsedBody) {
						var commentList = parsedBody.querySelector("#commentsList > ul");
						var currentCommentCount = 0;
						var message = '';
						if (commentList) {
							currentCommentCount = commentList.children.length;
							if (confession.lastCommentCount < currentCommentCount) {
								confession.currentCommentCount = currentCommentCount;
								unreadComments.push(confession);
								newComments++;
							} 
						}
						if (normalizedData.length === counter) {
							chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
							chrome.browserAction.setBadgeText({text: "" + newComments + ""});
							console.log('newComments: ', newComments);
							if (opts && opts.success) {
								opts.success(unreadComments);
							}
						}
					}
				});
			})(confession);
		}
	});
}

/**
 * Refresh alarm handler
 */
function refreshAlarm() {
	console.debug('refreshAlarm()');
}

/**
 * Get the subscribed confessions comment counts
 * @param {Object} confession - the confession object
 */
function getSubscribedConfessionCommentsCount(confession, opts) {
	if (!confession.url) {
		console.error('Confession: ', confession + ' doesnt have a url!');
		return;
	}

	http({
		url: confession.url,
		success: function(htmlResponse) {
			var doc = parseHTML(htmlResponse);
			var body = doc.body;
			opts.success(body);
		}
	})
}

/**
 * Get the confessions from chrome storage
 * @param {Object} opts - the options object
 */
function getConfessions(opts) {
	chrome.storage.sync.get(null, function(confessions) {
		var confs = [];
	  	for (var confession in confessions) {
	  		if (confession.match(/^confession-/)){
	  			confs.push(confessions[confession]);
	  		}
	  	}
	  	opts.success(confs);
	});
}

/**
 * Store a subscription to chrome storage
 * @param {Object} message
 * @param {Callback} sendResponse
 */
function subscribe(message, sendResponse) {
	var obj = {};
	obj['confession-'+message.id] = message;
	chrome.storage.sync.set(obj, function() {
		sendResponse(obj);
		return true;
	});
}

/**
 * Update the subscription in the chrome storage
 * @param {Object} message
 * @param {Callback} sendResponse
 */
function update(confession) {
	var obj = {};
	obj['confession-'+confession.id] = confession;
	chrome.storage.sync.set(obj, function() {
		console.log('Successfully updated: ', 'confession-'+confession.id);
		return true;
	});
}

/**
 * Lookup for a subscribtions on chrome storage
 * @param {Object} message
 * @param {Callback} sendResponse
 */
function lookup(message, sendResponse) {
	chrome.storage.sync.get('confession-'+message.id, function(data) {
		if (sendResponse) {
			sendResponse(data['confession-'+message.id]);
		}
		return true;
	});
}

/**
 * Remove previous confessions from chrome storage
 * @param {Object} opts - the options object
 */
function reset(opts) {
	chrome.storage.sync.get(null, function(confessions) {
		if (!confessions) {
			console.debug('reset() => Nothing to clear!')
			return;
		}
		var confs = [];
	  	for (var confession in confessions) {
	  		if (confession.match(/^confession-/)){
	  			confs.push(confession);
	  		}
	  	}
	  	chrome.storage.sync.remove(confs, function(response) {
	  		opts.success(response);
	  		return true;
	  	});
	  	return true;
	});
}

/**
 * Message event handler
 * @param {Object} message
 * @param {Object} sender
 * @param {Callback} sendResponse
 */
function onMessage(message, sender, sendResponse) {
	if (message.scope) {
		switch (message.scope) {
			case "subscribe":
				subscribe(message, sendResponse);
				break;
			case "lookup":
				lookup(message, sendResponse);
				break;
			case "reset":
				reset(message, sendResponse);
				break;
		}
	} else {
		sendResponse({"status": "error", "reason": "no scope specified"});
	}
  	return true;
}

/**
 * All HTTP operations related functionalities are wrapped in this one function
 * @param {Object} opts - the different options for the HTTP connections
 */
function http(opts) {
  var xmlHttp = new XMLHttpRequest();

  opts = opts || {};
  opts.method = opts.method || 'GET';
  opts.async = opts.async || true;
  opts.success = opts.success || function(response) { return response; };
  opts.fail = opts.fail || function(response) {return response; };
  opts.timeout = opts.timeout || 10000;

  xmlHttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        opts.success(this.responseText);
      } else if (this.status >= 400 && this.status < 500) {
        opts.fail(this.responseText); // client issues, e.g: HTTP 4**
      } else if (this.status >= 500) {
        opts.fail(this.responseText); // server errors, e.g: HTTP 5**
      } else {
        opts.fail(this.responseText); // other errors
      }
    }
  };
  xmlHttp.open(opts.method, opts.url, opts.async);
  xmlHttp.timeout = opts.timeout;
  xmlHttp.send();
}

/**
 * Normalize the data from chrome storage, e.g: move the property value outside as an entire object
 * @param {Array} data - array of objects, e.g: {"confession-298": {"id": 298, "url": "http://...", ....}}
 *
 * @return {Array} the array with the parsed objects, e.g: {"id": 298, "url": "http://...", ....}}
 */
function normalizeData(data) {
	var newArray = [];
	if (!data) {
		console.warn('normalizeData() => data empty!');
		return [];
	}

	for (var dt in data) {
		if (dt) {
			newArray.push(data[dt]);
		}
	}

	if (newArray.length === 0) {
		console.warn('normalizeData() => data empty!');
	}

	return newArray;
}

/**
 * Parse HTML from string to DOM
 * @param {String} html - the html as string
 * @return {Object} the document object
 */
function parseHTML(html) {
	if (!html) {
		console.error('Nothing to parse!');
		return;
	}

	var parser = new DOMParser();
	var doc = parser.parseFromString(html, "text/html");
	return doc;
}

/**
 * Make array unique
 * @param {Array} a
 */
function uniq_fast(a) {
    return Array.from(new Set(a.map(JSON.stringify))).map(JSON.parse)
}
