// store dictionary data (chrome specific)
var BG = chrome.extension.getBackgroundPage();
function storeRequest(files, callback) {
	BG.store(files, callback);
}
$('dictionaries').addEventListener('submit', store, false);

var ids = ['eiji', 'waei', 'reiji', 'ryaku'];
function store(e) {
	e.preventDefault();
	ids.forEach(function(id) {$(id).disabled = true;});
	$('store').disabled = true;

	var m = 'Please wait';
	var p = ['.', '..', '...'];
	$('store').value = m;
	var t = setInterval(function() {p.push(p.shift()); $('store').value = m + p[0]}, 1000);

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
	})();
	function upload() {
		console.log(files);
		if (ids.some(function(id) {return files[id] === void 0})) return;
		// all 4 files are collected
		if (ids.every(function(id) {return files[id] === null})) {
			clearInterval(t);
			$('store').value = 'Storing failed: no files are selected';
			return;
		}
		storeRequest(files, function() {
			clearInterval(t);
			$('store').value = 'Storing finished!!!';
		});
	}
}

// search
// chrome specific
function searchRequest(opt, callback) {
	BG.search(opt, callback);
}

