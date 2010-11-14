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

  /*
	var m = '変換中';
	var p = ['.', '..', '...'];
	$('store').value = m;
	var t = setInterval(function() {p.push(p.shift()); $('store').value = m + p[0]}, 1000);
  */

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
		console.log(files);
		if (ids.some(function(id) {return files[id] === void 0})) return;
		// all 4 files are collected
		if (ids.every(function(id) {return files[id] === null})) {
			clearInterval(t);
			$('store').value = 'ファイルが選択されていません';
			return;
		}
		storeRequest(files, function callback(status) {
			//clearInterval(t);
			//$('store').value = '終了しました';
			$('store').value = status.message;
		});
	}
}

$('dictionaries').addEventListener('submit', store, false);


// search
// chrome specific
searchRequest = function searchRequest(opt, callback) {
	BG.search(opt, callback);
}

}
