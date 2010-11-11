// handle hashchange as it is, but when doing frequent action, delay hashchange
var delayHashChange = function(hashchange, wait) {
	var currentId = null;
	if (!wait) wait = 5000;
	var timer;
	var reallySetHash;
	function doAction(id, action) {
		timer = clearTimeout(timer); // clearTimeout returns undefined
		currentId = id;
		action();
		timer = setTimeout(setHash, wait);
		reallySetHash = true;
	}
	function _hashchange(e) {
		if (timer) reallySetHash = false;
		hashchange(e);
	}
	window.addEventListener('hashchange', _hashchange, false);
	function setHash() {
		window.removeEventListener('hashchange', _hashchange, false);
		if (reallyHashChange) location.hash = currentId;
		window.addEventListener('hashchange', _hashchange, false);
	}
	return doAction;
};

// debouncing
var Debounce = function(wait) {
	var timer;
	function doAction(action) {
		clearTimeout(timer);
		timer = setTimeout(action, wait);
	}
	return doAction;
}
