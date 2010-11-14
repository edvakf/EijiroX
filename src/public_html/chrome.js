// store dictionary data (chrome specific)
if (window.chrome) {

var BG = chrome.extension.getBackgroundPage();
function storeRequest(files, callback) {
	BG.store(files, callback);
}

var ids = ['eiji', 'waei', 'reiji', 'ryaku'];

store = function store(e) {
	e.preventDefault();
	ids.forEach(function(id) {$(id).disabled = true;});
	$('store').disabled = true;
	$('store').value = 'ファイル読込中';

	var files = {};
	var i = 0;
	(function getFile() {
		var id = ids[i++];
		if (!id) return upload();
		var file = $(id).files[0];
		if (!file) {
			files[id] = null;
			getFile();
			return;
		}
		var reader = new FileReader();
		reader.onload = function() {
			files[id] = reader;
			getFile();
		};
		reader.readAsText(file, 'shift_jis');

		// define getNextLine which will be used in the background page (background/eijiro.js)
		var re_line = /(.*?)\r?\n/g;
		reader.getNextLine = function FileReader_getNextLine() {
			var m = re_line.exec(reader.result);
			return m && m[1];
		}
	})();

	function upload() {
		if (ids.some(function(id) {return files[id] === void 0})) return;
		// all 4 files are collected
		if (ids.every(function(id) {return files[id] === null})) {
			clearInterval(t);
			$('store').value = 'ファイルが選択されていません';
			return;
		}
		storeRequest(files, function callback(status) {
			$('store').value = status.message;
		});
	}
}

$('dictionaries').addEventListener('submit', store, false);


// search
searchRequest = function searchRequest(opt, callback) {
	BG.search(opt, callback);
}


// if opened in a popup, get selected text of selected window
chrome.tabs.getSelected(null, function(tab) { // getCurrent doesn't work. (maybe because popup is open?)
	chrome.tabs.executeScript(tab.id, {
		allFrames: true,
		code: [
			'(function() {',
				'var sel = window.getSelection() + "";',
				'if (sel) chrome.extension.sendRequest({query: sel});',
			'}());'
		].join('\n')
	});
});

chrome.extension.onRequest.addListener(function(req) {
	if (req.query) newsearch({query: req.query});
});


}
