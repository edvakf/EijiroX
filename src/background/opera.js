if (window.opera) {

	storeHandler = function storeHandler(e) {
		var conn = e.connection;
		var req = conn.request;
		var res = conn.response;

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
}
