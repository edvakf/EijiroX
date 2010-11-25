var db = openDatabase('dictionary', '1.0', 'eijiro dictionary', 1024*1024*1024);
var primary_key = 0; // id for all entries are serial numbers

var num_to_store_at_once = 50000;

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
	console.log((new Date).toISOString() + ' : ' + 'creating tables');
	createTables(function _storeFile(status) {
		if (status.error) {
			callback(status);
			return;
		} else if (status.progress) {
			callback({progress: true, message: eijiros[filename] + ' : ' + status.message + '行目。'});
			return;
		}
		if (status.nofile) {
			console.log((new Date).toISOString() + ' : ' + filename + ' not selected');
			callback({progress: true, message: eijiros[filename] + ' : ファイルが選択されていません。'});
		} else {
			if (filename) {
				console.log((new Date).toISOString() + ' : ' + filename + ' finished');
				callback({progress: true, message: eijiros[filename] + ' : 保存完了。'});
				delete files[filename];
			}
		}
		filename = filenames.shift();
		if (filename) {
			console.log((new Date).toISOString() + ' : ' + 'storing: ' + filename);
			callback({progress: true, message: eijiros[filename] + ' : 保存開始。'});
			storeFile(filename, files[filename], _storeFile);
		} else {
			finalize();
		}
	});
	function finalize() {
		console.log((new Date).toISOString() + ' : ' + 'storing tokens');
		callback({progress: true, message: '手動インデックス中。時間がかかることがあります。'});
		storeTokens(function(status) {
			if (status.error) {
				callback({error:true, message:status.message});
			} else if (status.end) {
				console.log((new Date).toISOString() + ' : ' + 'making index');
				callback({progress: true, message: '自動インデックス中。'});
				makeIndex(function() {
					console.log((new Date).toISOString() + ' : ' + 'indexing done');
					callback({end: true, message: 'データベース作成完了。おつかれさまでした。'});
				});
			}
		});
	}
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

var re_sep = /[^一-龠々〆ヵヶぁ-んァ-ヴーｱ-ﾝﾞｰa-zA-Zａ-ｚＡ-Ｚ0-9０-９]+/g;
var re_kanji = /[一-龠々〆ヵヶ]/;
// segment is defined in tiny_segmenter_mod.js
function tokenize(str) {
	var tokens = [];
	var segments = uniq(segment(str).map(function(s) {return s.replace(re_sep, '')}));
	for (var i = 0, l = segments.length; i < l; i++) {
		var seg = segments[i];
		if (seg.length) tokens.push(seg);
	}
	return tokens;
}

var re_line = /■(.*?)(?:  ?{.*?})? : /;
function storeLine(tx, line, pkey, noentry) {
	var tokens;
	var m = line.match(re_line);
	if (!m) return;
	var entry = m[1], translation = m[2];
	tokens = tokenize(entry.toLowerCase());
	tx.executeSql(
		'INSERT INTO eijiro (id, entry, raw) VALUES (?,?,?);',
		[pkey, noentry ? null : entry.toLowerCase(), line]
	);
	for (var i = 0, l = tokens.length; i < l; i++) {
		var token = tokens[i];
		// if (length is 1 and not kanji) or (very common) then don't store ("don't-index-condition")
		if ((token.length === 1 && !re_kanji.test(token)) || common_tokens[token] > 10000) continue;
		if (!tokens_pending[token]) tokens_pending[token] = [];
		tokens_pending[token].push(pkey);
	}
}

var tokens_pending = {__proto__:null};

function storeTokens(callback) {
	var tokens = [];
	for (var x in tokens_pending) {
		tokens.push(x);
	}
	tokens = tokens.sort();
	var i = 0, l = tokens.length, n = 0;
	var finished = true;

	function _storeTokens() {
		db.transaction(
			function transaction(tx) {
				n = 0;
				for (; i < l; i++) {
					var token = tokens[i];
					var pkeys = tokens_pending[token];
					for (var j = 0, m = pkeys.length; j < m; j++) {
						pkey = pkeys[j];
						tx.executeSql("INSERT INTO invindex VALUES (?,?);", [token, pkey]);
					}
					delete tokens_pending[token];
					if ((n += m) >= num_to_store_at_once) {
						finished = false;
						i++;
						console.log((new Date).toISOString() + ' : ' + token);
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
				if (finished) return callback({end: true});
				setTimeout(_storeTokens, 100);
			}
		);
	}
	_storeTokens();
}

// getNextLine() is defined in public_html/chrome.js and background/opera.js
function storeFile(type, file, callback) {
	if (!file) return callback({nofile: true});
	var line, i = 0;
	var finished = true;
	var noentry = type === 'reiji';
	function _store() {
		db.transaction(
			function transaction(tx) {
				while(line = file.getNextLine()) {
					storeLine(tx, line, ++primary_key, noentry);
					if (++i % num_to_store_at_once === 0) {
						console.log((new Date).toISOString() + ' : ' + line);
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
var limit = 15; // how many results to show in one page
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
	console.log([query, page].toString());
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
				[q, nextWord(q), limit, offset],
				function sqlSuccess(tx, res) {
					for (var i = 0, l = res.rows.length; i < l; i++) {
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

// common_tokens is defined in common_tokens.js
function searchFull(opt, callback) {
	var query = opt.query;
	var page = opt.page;
	var id_offset = opt.id_offset || 0;
	var rv = {query:query, page:page, more:false, full:true, results:[]};
	var tokens = tokenize(query.toLowerCase());
	tokens = tokens
		.filter(function(c) {return !((c.length === 1 && !re_kanji.test(c)) || common_tokens[c] > 10000)}) // opposite of "don't-index-condition"
		.sort(function(a,b) {return (common_tokens[a]||0) - (common_tokens[b]||0)}); // sort by the least common order
	if (!tokens.length) callback(rv);
	console.log([query, page, id_offset, tokens[0], common_tokens[tokens[0]]||0].toString());

	var t = Date.now();
	db.transaction(
		function transaction(tx) {
			tx.executeSql(
				'SELECT * FROM eijiro WHERE id > ? ' + 
					'AND id IN ( SELECT id FROM invindex WHERE token = ? ) ' + 
					'AND entry LIKE ? ESCAPE ? LIMIT ? ;' ,
				[id_offset, tokens[0], '%'+likeEscape(query)+'%', '@',limit],
				function sqlSuccess(tx, res) {
					var qtokens = '|' + tokenize(query).join('|') + '|';
					for (var i = 0, rows = res.rows, l = rows.length; i < l; i++) {
						var item = rows.item(i);
						if (('|' + tokenize(item.entry).join('|') + '|').indexOf(qtokens) >= 0) { // to solve the issue: "the more" hits "breathe more"
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

function suggest(query, callback) {
	console.log('*' + query);
	var rv = [query, []];
	var q = (query + '').replace(/[\x00-\x1f\x7f-\xa0]/g,'').toLowerCase();
	var re_line = /■(.*?)(?:  ?{.*?})? : (.*)/;
	var re_ruby = /｛.*?｝/g;
	var t = Date.now();
	db.transaction(
		function transaction(tx) {
			tx.executeSql(
				'SELECT raw FROM eijiro ' +
				'WHERE entry >= ? AND entry < ? ' + 
				'LIMIT 10; ',
				[q, nextWord(q)],
				function sqlSuccess(tx, res) {
					for (var i = 0, l = res.rows.length; i < l; i++) {
						var m = res.rows.item(i).raw.match(re_line);
						if (m) rv[1].push(m[1] + ' : ' + m[2].replace(re_ruby, ''));
					}
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


/* utils */
function likeEscape(text) {
	return (text+'').replace(/@/g, '@@').replace(/%/g, '@%').replace(/_/g, '@_');
}

function nextWord(str) {// str is a non-empty string
	return str.substr(0, str.length - 1) + String.fromCharCode(str.charCodeAt(str.length - 1) + 1);
}

function uniq(ary) {
	return ary.filter(function(a, i) {return ary.indexOf(a) === i});
}

