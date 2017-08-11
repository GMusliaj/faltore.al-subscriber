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

var baseUrl = "https://www.faltore.al/";
var confessionBaseUrl = baseUrl + "confession.php?confession_id=";
scanConfessions();

/*====================================Subscribtion Management======================================*/

/**
 * Subscribe button event handler
 * @param {Object} source - the button element from where the onclick event is triggered
 */
function subscribe(source) {
	source.preventDefault();
	var confessionId = source.target.getAttribute("data-confession-id");
	var confessionUrl = source.target.getAttribute("data-confession-url");
	var lastCommentCount = 0;
	if (!confessionUrl) {
		alert('There is no confession URL present!');
	}

	var commentList = document.querySelector("#commentsList > ul");
	if (commentList) {
		lastCommentCount = commentList.children.length; 
	} else {
		lastCommentCount = source.target.nextElementSibling.innerHTML;
	}

	chrome.runtime.sendMessage({
		"scope": "subscribe",
		"id": confessionId,
		"url": confessionUrl,
		"lastCommentCount": lastCommentCount
	}, function(response) {
		source.target.innerHTML = "Subscribed";
		source.target.style.backgroundColor = "cyan";
		return true;
	});
}

/**
 * Send message to background.js with the scop to reset the storage.
 * @return {Boolean}
 */
function resetStorage() {
	chrome.runtime.sendMessage({
		"scope": "reset"
	}, function(response) {
		console.log('Response: ', response);
		return true;
	});
}

/*====================================DOM Manipulation======================================*/

/**
 * Helper for insertAfter
 * @param {Object} newNode
 * @param {Object} referenceNode
 */
function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

/**
 * Scan the confessions and then append the button to subscribe to the given confesion
 */
function scanConfessions() {
	var confessionsList = [];
	var confessionsListElm = document.querySelector("#confessionsList > ul");
	if (confessionsListElm) {
		var confessionsList = confessionsListElm.children;
		if (confessionsList.length > 0) {
			addSubscribeButtons(confessionsList);
		} else {
			console.error('No confessions present in the page!');
			return;
		}
	}
}

/**
 * Add the subscribe buttons to all the confessions present in the page.
 * @param {Array} elementList - the list of confession blocks
 */
function addSubscribeButtons(confessionBlockList) {
	if (confessionBlockList && confessionBlockList.length > 0) {
		for (var i = confessionBlockList.length - 1; i >= 0; i--) {
			var parent = confessionBlockList[i].querySelector("div");
			var firstButton = confessionBlockList[i].querySelector("div > button");
			var confessionId = (firstButton.id).replace("falje_", "");
			var previousSibling = document.getElementById('denim_' + confessionId);
			addSubscribeButton(confessionId, previousSibling);
		}
	}
}

/**
 * Check the subscribtion status, e.g: the UI with the current status, subscribed or not
 * @param {String} id - the id of the button element
 * @param {Object} opts - the options object
 */
function checkSubscribeStatus(id, opts) {
	var text = "+ Subscribe";
	var style = "background-color: blue; margin-left: 10px;";
	chrome.runtime.sendMessage({
		"scope": "lookup",
		"id": id
	}, function(response) {
		if (response && response.id == id) {
			text = "Subscribed";
			style = "background-color: cyan; margin-left: 10px;";
		}
		opts.success(text, style);
		return true;
	});

	return true;
}

/**
 * Add subscribe button after the previous sibling
 * @param {String} id
 */
function addSubscribeButton(id, previousSibling) {
	var button = document.createElement("BUTTON");
	button.id = "subscribe_" + id;
	button.setAttribute("data-confession-id", id);
	button.setAttribute("data-confession-url", confessionBaseUrl + id);
	checkSubscribeStatus(id, {
		success: function(text, style) {
			button.textContent = text;
			button.style = style;
			button.onclick = subscribe;
			insertAfter(button, previousSibling);
		}
	});
}