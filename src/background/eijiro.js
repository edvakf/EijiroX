var db = openDatabase('dictionary', '1.0', 'eijiro dictionary', 1024*1024*1024);
var primary_key = 0; // id for all entries are serial numbers

function store(files, callback) {
	console.log(files);
	var filenames = ['eiji', 'ryaku', 'waei', 'reiji'];
	primary_key = 0;
	createTables(function _storeFile() {
		var filename = filenames.shift();
		if (filename) {
			console.log('storing: ' + filename);
			storeFile(filename, files[filename], _storeFile);
		} else {
			console.log('making index');
			makeIndex(function() {
				console.log('indexing done');
				if (callback) callback();
			});
		}
	});
}

function createTables(callback) {
	db.transaction(
		function transaction(tx) {
			tx.executeSql('DROP TABLE IF EXISTS eiji;');
			tx.executeSql('DROP INDEX IF EXISTS eiji_i;');
			tx.executeSql('DROP TABLE IF EXISTS waei;');
			tx.executeSql('DROP INDEX IF EXISTS waei_i;');
			tx.executeSql('DROP INDEX IF EXISTS waei_first_i;');
			tx.executeSql('DROP TABLE IF EXISTS ryaku;');
			tx.executeSql('DROP INDEX IF EXISTS ryaku_i;');
			tx.executeSql('DROP TABLE IF EXISTS reiji;');
			//tx.executeSql('DROP INDEX IF EXISTS reiji_i;');
			tx.executeSql(
				'CREATE TABLE eiji (' + 
					'id INTEGER PRIMARY KEY, ' +
					'entry TEXT, ' + /* dictionary word */
					'normalized TEXT, ' + /* normalized by removing ◆ and so on */
					'raw TEXT ' + /* raw line */
				');'
			);
			tx.executeSql(
				'CREATE TABLE ryaku (' +
					'id INTEGER PRIMARY KEY, ' +
					'entry TEXT, ' +
					'normalized TEXT, ' +
					'raw TEXT ' +
				');'
			);
			tx.executeSql(
				'CREATE TABLE waei (' +
					'id INTEGER PRIMARY KEY, ' +
					'entry TEXT, ' +
					'first TEXT, ' +
					'normalized TEXT, ' +
					'raw TEXT ' +
				');'
			);
			tx.executeSql(
				'CREATE TABLE reiji (' +
					'id INTEGER PRIMARY KEY, ' +
					'normalized TEXT, ' +
					'raw TEXT ' +
				');'
			);
		},
		function transactionError(err) {
			console.log(err);
		},
		function transactionSuccess(tx) {
			if (callback) callback();
		}
	);
}

function makeIndex(callback) {
	db.transaction(
		function transaction(tx) {
			tx.executeSql('CREATE INDEX eiji_i ON eiji (entry);');
			tx.executeSql('CREATE INDEX ryaku_i ON ryaku (entry);');
			tx.executeSql('CREATE INDEX waei_i ON waei (entry);');
			tx.executeSql('CREATE INDEX waei_first_i ON waei (first);');
		},
		function transactionError(err) {
			console.log(err);
		},
		function transactionSuccess(tx) {
			if (callback) callback();
		}
	);
}

var re_ascii = /([\x00-\xf7]+)/;
var re_break = /(?:^|■・?|●|◆(?:file:\S+)?|、?【(?:発音！?|＠|レベル|分節|URL)】[^【]+|、?【.+?】|{.*?}|《.+?》|〈.+?〉|: ＝|<→?|[,.;:!?'"\/>\[\]{}()|&=+_#~`*\@-]|$)+/g;
var re_delete = /(?:[\x00-\x1f\x7f-\xa0]|｛.+?｝|〔|〕|（|）)+/g; // control characters, rubies, eijiro formats
var re_space = /\s+/g;
var re_braceslast = /^(.*)〔〜(.*?)〕$/;
function eijiroNormalize(entry, translation) {
	return [
		entry.replace(re_braceslast, '$2$1'),
		translation
	].join(' ')
	.replace(re_delete, '')
	.replace(re_break, ' ')
	.split(re_ascii).join(' ')
	.replace(re_space, ' ')
	.toLowerCase();
}

function storeFile(type, file, callback) {
	if (!file) return callback && callback();
	var m, i = 0;
	var re_line = /■(.*?)(?:  {.*?})? : (.*?)\r?\n/g;
	var finished = false;
	var store_first = type === 'waei'; // store first character as well
	var no_entry = type === 'reiji'; // don't store entry column
	var sql = 
		no_entry ? 
			'INSERT INTO ' + type + ' (id, normalized, raw) VALUES (?,?,?);' :
		store_first ? 
			'INSERT INTO ' + type + ' (id, entry, first, normalized, raw) VALUES (?,?,?,?,?);' :
			'INSERT INTO ' + type + ' (id, entry, normalized, raw) VALUES (?,?,?,?);';
	function _store() {
		db.transaction(
			function transaction(tx) {
				while(m = re_line.exec(file.result)) {
					//if (i % 10000 === 0) console.log(eijiroNormalize(m[0]));
					tx.executeSql(
						sql,
						no_entry ? 
							[++primary_key, likeEscape(eijiroNormalize(m[1], m[2])), m[0]] :
						store_first ? 
							[++primary_key, likeEscape(m[1]).toLowerCase(), likeEscape(m[1].charAt(0)).toLowerCase(), likeEscape(eijiroNormalize(m[0])), m[0]] :
							[++primary_key, likeEscape(m[1]).toLowerCase(), likeEscape(eijiroNormalize(m[1], m[2])), m[0]]
					);
					if (++i % 100000 === 0) {
						console.log(m[0]);
						finished = false;
						break;
					}
					finished = true;
				}
			},
			function transactionError(err) {
				console.log(err);
			},
			function transactionSuccess(tx) {
				if (!finished) return setTimeout(_store, 500);
				if (callback) return callback();
			}
		);
	}
	_store();
}

// search
var limit = 20; // how many results to show in one page
var limit_full = 10; // how many results to show in one page (for full search)
var optlist = ['query', 'page', 'full', 'id_offset'];

function search(opt, callback) {
	console.log(opt);
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
	//if (/[^-\w~!@#$%^&*()+={}\[\]\\'"<>&:;.,?\/ ]/.test(query)) {
	if (/[^\x00-\x7f]/.test(query)) {
		searchJa(opt, callback);
	} else {
		searchEng(opt, callback);
	}
}

function searchEng(opt, callback) {
	var query = opt.query;
	var page = opt.page;
	console.log([query, page]);
	var rv = {query:query, page:page, more:false, full:false, results:[]};
	var offset = (page - 1) * limit;
	var q = likeEscape((query + '').replace(/[\x00-\x1f\x7f-\xa0]/g,'').toLowerCase());
	var sql = 
		"SELECT raw FROM eiji " + 
			"WHERE entry >= '"+sqlEscape(q)+"' " +
			"AND entry < '"+sqlEscape(nextWord(q))+"' " +
			"AND entry LIKE '"+sqlEscape(q)+"%' " +
		"UNION ALL " +
		"SELECT raw FROM ryaku " + 
			"WHERE entry >= '"+sqlEscape(q)+"' " +
			"AND entry < '"+sqlEscape(nextWord(q))+"' " +
			"AND entry LIKE '"+sqlEscape(q)+"%' ";
	//console.log(sql);
	var t = Date.now();
	db.transaction(
		function transaction(tx) {
			tx.executeSql(
				sql + "LIMIT ? OFFSET ?;",
				[limit, offset], 
				function sqlSuccess(tx, res) {
					var results = [];
					for (var i = 0; i < res.rows.length; i++) {
						results.push(res.rows.item(i).raw);
					}
					if (i === limit) rv.more = true;
					rv.results = results;
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

function searchJa(opt, callback) {
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
				'SELECT raw FROM waei ' +
				'WHERE first = ? AND entry LIKE ? ' + 
				'LIMIT ? OFFSET ?;', 
				[q.charAt(0), likeEscape(q)+'%', limit, offset],
				function sqlSuccess(tx, res) {
					var results = [];
					for (var i = 0; i < res.rows.length; i++) {
						results.push(res.rows.item(i).raw);
					}
					if (i === limit) rv.more = true;
					rv.results = results;
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
	console.log([query, page, id_offset]);
	var rv = {query:query, page:page, more:false, full:true, results:[]};
	var q = '%' + likeEscape(eijiroNormalize('', query + '')) + '%';
	var t = Date.now();
	db.transaction(
		function transaction(tx) {
			tx.executeSql(
				'SELECT id, raw FROM eiji WHERE id > ? AND normalized LIKE ? ' + 
				'UNION ALL ' +
				'SELECT id, raw FROM ryaku WHERE id > ? AND normalized LIKE ? ' +
				'UNION ALL ' +
				'SELECT id, raw FROM waei WHERE id > ? AND normalized LIKE ? ' +
				'UNION ALL ' +
				'SELECT id, raw FROM reiji WHERE id > ? AND normalized LIKE ? ' +
				'LIMIT ?;',
				[id_offset, q, id_offset, q, id_offset, q, id_offset, q, limit_full],
				function sqlSuccess(tx, res) {
					var results = [];
					var idmax = 0;
					for (var i = 0; i < res.rows.length; i++) {
						results.push(res.rows.item(i).raw);
						idmax = Math.max(idmax, res.rows.item(i).id);
					}
					rv.id_offset = idmax;
					if (i === limit_full) rv.more = true;
					rv.results = results;
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
