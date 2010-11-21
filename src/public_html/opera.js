if (window.opera) {

	if (opera.extension) {

		var search_callbacks = {};

		searchRequest = function searchRequest(opt, callback) {
			var reqid = Math.floor((Date.now() + Math.random()) * 1000);
			opera.extension.postMessage({action: 'search', id: reqid, args: [opt]});
			search_callbacks[reqid] = callback;
		}

		opera.extension.onmessage = function(e) {
			var data = e.data;
			if (data.action === 'search') {
				if (search_callbacks[data.id]) {
					search_callbacks[data.id](data.ret);
					delete search_callbacks[data.id];
				}
			} else if (data.action === 'get_selection') {
				var q = $('query').value = (data.ret || '').trim();
				newsearch({query: q});
			}
		};

		opera.extension.postMessage({action:'get_selection'});

	} else {

		searchRequest = function searchRequest(opt, callback) {
			var xhr = new XMLHttpRequest;
			xhr.open('GET', 'search?'+serializeToQuery(opt), true);
			xhr.onload = function() {
				callback(JSON.parse(xhr.responseText));
			};
			xhr.send();
		}

	}

}
