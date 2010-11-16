var db = openDatabase('dictionary', '1.0', 'eijiro dictionary', 1024*1024*1024);
var primary_key = 0; // id for all entries are serial numbers

var debug = true;
if (!debug) {
	console = {log:function(){}};
}

function store(files, callback) {
	var filenames = ['eiji', 'ryaku', 'waei', 'reiji'];
	var filename;
	var eijiros = {eiji: '英辞郎', ryaku: '略語郎', waei: '和英辞郎', reiji: '例辞郎'};
	primary_key = 0;
	callback({progress: true, message: 'データベース初期化中。'});
	console.log('creating tables');
	createTables(function _storeFile(status) {
		if (status.error) {
			callback(status);
			return;
		} else if (status.progress) {
			callback({progress: true, message: eijiros[filename] + ' : ' + status.message + '行目。'});
			return;
		}
		if (status.nofile) {
			console.log(filename + ' not selected');
			callback({progress: true, message: eijiros[filename] + ' : ファイルが選択されていません。'});
		} else {
			console.log(filename + ' finished');
			if (filename) callback({progress: true, message: eijiros[filename] + ' : 保存完了。'});
		}
		filename = filenames.shift();
		if (filename) {
			console.log('storing: ' + filename);
			callback({progress: true, message: eijiros[filename] + ' : 保存開始。'});
			storeFile(filename, files[filename], _storeFile);
		} else {
			console.log('making index');
			callback({progress: true, message: 'インデックス作成中。時間がかかることがあります。'});
			makeIndex(function() {
				console.log('indexing done');
				callback({end: true, message: 'データベース作成完了。おつかれさまでした。'});
			});
		}
	});
}

function createTables(callback) {
	db.transaction(
		function transaction(tx) {
			tx.executeSql('DROP TABLE IF EXISTS eijiro;');
			tx.executeSql('DROP INDEX IF EXISTS eijiro_i;');
			tx.executeSql('DROP TABLE IF EXISTS invindex;')
			tx.executeSql('DROP INDEX IF EXISTS invindex_i;')
			tx.executeSql(
				'CREATE TABLE eijiro (' + 
					'id INTEGER PRIMARY KEY, ' +
					'entry TEXT, ' + /* dictionary word */
					'raw TEXT ' + /* raw line */
				');'
			);
			tx.executeSql(
				'CREATE TABLE invindex (' + 
					'token TEXT, ' + 
					'id INTEGER ' + 
				');'
			);
		},
		function transactionError(err) {
			console.log(err);
			callback({error: true, message: err.message});
		},
		function transactionSuccess(tx) {
			callback({end: true});
		}
	);
}

function makeIndex(callback) {
	db.transaction(
		function transaction(tx) {
			tx.executeSql('CREATE INDEX eijiro_i ON eijiro (entry);');
			tx.executeSql('CREATE INDEX invindex_i ON invindex (token);');
		},
		function transactionError(err) {
			console.log(err);
			callback({error: true, message: err.message});
		},
		function transactionSuccess(tx) {
			callback({end: true});
		}
	);
}

var re_sep = /[^一二三四五六七八九十百千万億兆一-龠々〆ヵヶぁ-んァ-ヴーｱ-ﾝﾞｰa-zA-Zａ-ｚＡ-Ｚ0-9０-９]+/g;
var re_kanji = /[一-龠々〆ヵヶ]/;
var re_common = /^(?:the|be|to|of|and|in|that|have|it|for|not|on|with|he|as|you|do|at|this|but|his|by|from|they|we|say|her|she|or|an|will|my|one|all|would|there)$/;
function tokenize(str) {
	var tokens = [];
	var segments = uniq(segment(str).map(function(s) {return s.replace(re_sep, '')}));
	for (var i = 0, l = segments.length; i < l; i++) {
		var seg = segments[i];
		switch(seg.length) {
			case 0:
				break;
			case 1:
				if (re_kanji.test(seg)) tokens.push(seg);
				break;
			default:
				if (!re_common(seg)) tokens.push(seg);
				break;
		}
	}
	return tokens;
}

var re_line = /■(.*?)(?:  {.*?})? : ＝?(.*)/;
var re_trivial = /【(?:レベル|発音！?|＠|大学入試|分節|変化)】/;
var re_henka = /【変化】([^【]+)/;
var re_break = /(?:●|◆(?:file:\S+)?|【.+?】|{.*?}|《.+?》|〈.+?〉)+/g;
var re_delete = /(?:[\x00-\x1f\x7f-\xa0]|｛.+?｝)+/g;
function storeLine(tx, line, pkey, noentry) {
	var tokens;
	var m = line.match(re_line);
	if (!m) return;
	var entry = m[1], translation = m[2];
	if (re_trivial.test(translation)) {
		var n;
		if (n = translation.match(re_henka)) {
			tokens = [entry].concat(n[1].split('、'));
		} else {
			tokens = [entry];
		}
	} else {
		tokens = tokenize((entry + ' ' + translation).replace(re_delete, '').replace(re_break, ' ').toLowerCase());
	}
	tx.executeSql(
		'INSERT INTO eijiro (id, entry, raw) VALUES (?,?,?);',
		[pkey, noentry ? null : likeEscape(entry).toLowerCase(), line]
	);
	for (var i = 0, l = tokens.length; i < l; i++) {
		tx.executeSql("INSERT INTO invindex VALUES (?,?);", [tokens[i], pkey]);
	}
	return [entry, tokens, line];
}

function storeFile(type, file, callback) {
	if (!file) return callback({nofile: true});
	var line, i = 0;
	var finished = true;
	var noentry = type === 'reiji';
	function _store() {
		db.transaction(
			function transaction(tx) {
				while(line = file.getNextLine()) { // getNextLine() is defined in public_html/chrome.js and background/opera.js
					var r = storeLine(tx, line, ++primary_key, noentry);
					if (++i % 50000 === 0) {
						console.log(r);
						callback({progress: true, message: i});
						finished = false;
						break;
					}
					finished = true;
				}
			},
			function transactionError(err) {
				console.log(err);
				callback({error: true, message: err.message});
			},
			function transactionSuccess(tx) {
				if (!finished) return setTimeout(_store, 300);
				callback({end: true});
			}
		);
	}
	_store();
}

// search
var limit = 30; // how many results to show in one page
var optlist = ['query', 'page', 'full', 'id_offset'];

function search(opt, callback) {
	//console.log(opt);
	var query = opt.query;
	var page = opt.page;
	var full = opt.full;
	for (var x in opt) {
		if (optlist.indexOf(x) < 0) delete opt[x];
	}
	var rv = {query:query, page:page, more:false, full:full, results:[]};
	if (query === '') return setTimeout(function() {callback(rv)}, 0);
	if (full) {
		return searchFull(opt, callback);
	}
	searchEntry(opt, callback);
}

function searchEntry(opt, callback) {
	var query = opt.query;
	var page = opt.page;
	console.log([query, page]);
	var rv = {query:query, page:page, more:false, full:false, results:[]};
	var offset = (page - 1) * limit;
	var q = (query + '').replace(/[\x00-\x1f\x7f-\xa0]/g,'').toLowerCase();
	var t = Date.now();
	db.transaction(
		function transaction(tx) {
			tx.executeSql(
				'SELECT raw FROM eijiro ' +
				'WHERE entry >= ? AND entry < ? ' + 
				'LIMIT ? OFFSET ?;', 
				[likeEscape(q), likeEscape(nextWord(q)), limit, offset],
				function sqlSuccess(tx, res) {
					for (var i = 0, l = res.rows.length; i < res.rows.length; i++) {
						rv.results.push(res.rows.item(i).raw);
					}
					if (i === limit) rv.more = true;
					console.log('took ' + (Date.now() - t) + ' ms');
					if (callback) callback(rv);
				},
				function sqlError(tx, err) {
					if (callback) callback(rv);
					console.log(err);
				}
			);
		}
	)
}

function searchFull(opt, callback) {
	var query = opt.query;
	var page = opt.page;
	var id_offset = opt.id_offset || 0;
	var rv = {query:query, page:page, more:false, full:true, results:[]};
	var tokens = tokenize(query.toLowerCase());
	console.log([query, tokens, page, id_offset]);
	if (!tokens.length) callback(rv);
	var longesttoken = '', longesttoken2 = '';
	for (var i = 0, l = tokens.length; i < l; i++) {
		if (longesttoken.length <= tokens[i].length) {
			longesttoken2 = longesttoken;
			longesttoken = tokens[i];
		}
	}

	var t = Date.now();
	db.transaction(
		function transaction(tx) {
			tx.executeSql(
				longesttoken2.length ?
					'SELECT eijiro.id, eijiro.raw FROM eijiro JOIN invindex AS idx1 USING (id) JOIN invindex AS idx2 USING (id) ' +
						'WHERE eijiro.id > ? AND idx1.token = ? AND idx2.token = ? LIMIT ? ;' :
					'SELECT id, raw FROM eijiro JOIN invindex USING (id) ' + 
						'WHERE id > ? AND invindex.token = ? LIMIT ? ;',
				longesttoken2.length ?
					[id_offset, longesttoken, longesttoken2, limit] :
					[id_offset, longesttoken, limit],
				function sqlSuccess(tx, res) {
					var q = query.toLowerCase();
					for (var i = 0, rows = res.rows, l = rows.length; i < l; i++) {
						var item = rows.item(i);
						if (item.raw.toLowerCase().indexOf(q) >= 0) {
							rv.results.push(item.raw);
						}
						id_offset = item.id;
					}
					if (l === limit) rv.more = true;
					rv.id_offset = id_offset;
					console.log('took ' + (Date.now() - t) + ' ms');
					callback(rv);
				},
				function sqlError(tx, err) {
					if (callback) callback(rv);
					console.log(err);
				}
			);
		}
	)
}


/* utils */
function sqlEscape(text) {
	return (text+'').replace(/'/g,"''");
}

function likeEscape(text) {
	return (text+'').replace(/&/, '&amp;').replace(/%/g, '&#37;').replace(/_/g, '&#95;');
}

function likeUnescape(text) {
	return (text+'').replace(/&#95;/g, '_').replace(/&#37;/g, '%').replace(/&amp;/g, '&');
}

function nextWord(str) {// str is a non-empty string
	return str.substr(0, str.length - 1) + String.fromCharCode(str.charCodeAt(str.length - 1) + 1);
}

function uniq(ary) {
	return ary.filter(function(a, i) {return ary.indexOf(a) === i});
}
