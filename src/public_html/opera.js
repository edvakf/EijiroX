if (window.opera) {

	if (opera.extension) {

		var search_callbacks = {};
		var unite_url = widget.preferences.getItem('unite_url');

		searchRequest = function searchRequest(opt, callback) {
			var reqid = Math.floor((Date.now() + Math.random()) * 1000);
			opera.extension.postMessage({
				action: 'search',
				id: reqid,
				args: [opt, unite_url ? unite_url + 'search?' + serializeToQuery(opt) : '']
			});
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

		window.addEventListener('load', function() {
			var h2 = document.createElement('h2');
			h2.textContent = 'Unite版EijiroXとの通信';
			$('config').appendChild(h2);
			var p = document.createElement('p');
			p.textContent = 'Opera Unite 版の URL (admin は付けない。例: http://home.***.operaunite.com/eijiro/)。空欄の場合は Unite 版と通信しません。';
			$('config').appendChild(p);
			var input = document.createElement('input');
			input.style.width = '20em';
			input.value = unite_url;
			$('config').appendChild(input);
			var button = document.createElement('button');
			button.textContent = 'save';
			button.onclick = function() {
				widget.preferences.setItem('unite_url', input.value);
				unite_url = input.value;
			}
			$('config').appendChild(button);
		}, false);

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
