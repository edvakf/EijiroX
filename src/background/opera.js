if (window.opera) {
	db.transaction(function(tx) {
		tx.executeSql('CREATE TABLE IF NOT EXISTS invindex (token TEXT, id INTEGER);'); // this creates a database file which I can look for and replace with Chrome's
	});


	if (opera.io && opera.io.webserver) {
	/*
	 * Unite
	 */

		storeHandler = function storeHandler(e) {
			var conn = e.connection;

			var req = conn.request;
			var res = conn.response;

			if (!conn.isLocal) {
				res.setStatusCode(404);
				res.setResponseHeader('Content-Type', 'text/html');
				res.write('<!DOCTYPE html><meta charset="utf-8"/><title></title><p>Not Found</p>');
				res.close();
				return;
			}

			res.setResponseHeader('Content-Type', 'text/html');

			res.implicitFlush = true;
			res.write(
				['<!DOCTYPE html>'
				,'<head>'
					,'<meta charset="utf-8"/>'
					,'<title>EijiroX</title>'
				,'</head>'
				,'<body>'
				].join('\n'));

			res.message = function(msg) {
				//res.write('<script>document.getElementById("message").textContent = "' + msg + '";</script>'); // doesn't look good with Delayed Script Execution
				res.write(msg + '<br>');
			};

			if (req.files.length === 0) {
				res.message('ファイルが選択されていません。');
				return res.close();
			}

			var files = {};
			var ids = ['eiji', 'waei', 'reiji', 'ryaku'];
			for (var i = 0, file; file = req.files[i++];) {
      	console.log(file.metaData.headers['Content-Disposition'][0]);
				// only accept files submitted using the right form
				ids.some(function(id) {
					if (file.metaData.headers['Content-Disposition'][0].indexOf('form-data; name="'+id+'";') >= 0) {
						files[id] = file;
						var stream = file.stream = file.open(null, 1); // 1: read only

						// define getNextLine for compatibility (used in background/eijiro.js)
						file.getNextLine = function File_getNextLine() {
							return stream.readLine('shift_jis');
						}

						return true;
					}
				});
			}

			// store() is defined in eijiro.js
			store(files, function callback(status) {
				res.message(status.message);

				if (status.end || status.error) {
					ids.forEach(function(id) {
						var file = files[id];
						if (file) file.stream.close();
					});
					res.close();
				}
			});

		};

		searchHandler = function searchHandler(e) {
			var conn = e.connection;
			var req = conn.request;
			var res = conn.response;

			if (!conn.isLocal) {
				res.setStatusCode(404);
				res.setResponseHeader('Content-Type', 'text/html');
				res.write('<!DOCTYPE html><meta charset="utf-8"/><title></title><p>Not Found</p>');
				res.close();
				return;
			}

			res.setResponseHeader('Content-Type', 'text/plain');

			var opt = {};
			opt.query = req.queryItems.query ? decodeURIComponent(req.queryItems.query[0]) : '';
			opt.page = req.queryItems.page ? req.queryItems.page[0] * 1 : 1;
			opt.full = req.queryItems.full ? true : false;
			opt.id_offset = req.queryItems.id_offset ? req.queryItems.id_offset[0] * 1 : 0;
			search(opt, function(ret) {
				res.write(JSON.stringify(ret));
				res.close();
			});
		};

		opera.io.webserver.addEventListener('store', storeHandler, false);
		opera.io.webserver.addEventListener('search', searchHandler, false);

	} else if (opera.extension) {
	/*
	 * Extension
	 */

		var listening;

		opera.extension.onmessage = function(e) {
			var data = e.data; // data is {action: 'search' / 'store', id: 000000, args: []}
			//opera.postError(JSON.stringify(data));

			switch(data.action) {
				case 'store':
					e.source.postMessage({action: 'store', id: data.id, ret: {error: true, message: 'upload is not supported yet'}});
					break;
				case 'search':
					var opt = data.args[0];
					var url = data.args[1];
					if (url) { // use Opera Unite
						var xhr = new XMLHttpRequest();
						xhr.open('GET', url, true);
						xhr.onload = function() {
							var res;
							try{
								res = JSON.parse(xhr.responseText);
							} catch(e) {
								opera.postError(e);
								res = JSON.parse(JSON.stringify(url));
								res.results = [];
							}
							e.source.postMessage({action: 'search', id: data.id, ret: res});
						};
						xhr.send('');
					} else { // use this Extension
						search(opt, function(ret) {
							e.source.postMessage({action: 'search', id: data.id, ret: ret});
						});
					}
					break;
				case 'get_selection':
					var tab = opera.extension.tabs.getFocused();
					if (tab) tab.postMessage({action: 'selection?'}); // not working
					listening = e.source;
					break;
				case 'selection?':
					if (listening) listening.postMessage({action: 'get_selection', ret: data.args[0]});
					break;
			}
		};

		var button = opera.contexts.toolbar.createItem({
			disabled: false,
			title: 'EijiroX',
			icon: 'public_html/icons/icon18.png',
			popup: {
				href: 'public_html/index.html',
				width: 350,
				height: 350,
			}
		});
		opera.contexts.toolbar.addItem(button);

	} else if (this.widget) {
	/*
	 * Widget
	 */

		this.onmessage = function(e) {
			var data = e.data; // data is {action: 'search' / 'store', id: 000000, args: []}
			//console.log(JSON.stringify(data));

			switch(data.action) {
				case 'store':
					e.source.postMessage({action: 'store', id: data.id, ret: {error: true, message: 'upload is not supported yet'}}, '*');
					break;
				case 'search':
					var opt = data.args[0];
					search(opt, function(ret) {
						e.source.postMessage({action: 'search', id: data.id, ret: ret}, '*');
					});
					break;
			}
		};
	}
}
