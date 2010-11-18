function $(id) {
	return document.getElementById(id);
}

// Controller
$('query').addEventListener('input', input, false);
$('query').addEventListener('keyup', input, false);
$('query').addEventListener('keypress', input, false);
$('query').addEventListener('focus', input, false);
$('fulltext').addEventListener('click', fullsearch, false);
window.addEventListener('scroll', scroll, true);
window.addEventListener('mouseup', select, true);
window.addEventListener('mousemove', select, true);

var searchDelay = Debounce(80); // hold 80 ms before searching (when typed in)

var fullsearch_id_offset; // when the last search was full text search, remember the offset

var query_string; // serialized query option (will become URL fragment under certain conditions)

function newsearch(opt) {
	var undef;
	if (opt.query === undef) return;

	opt.query = opt.query.replace(/^▽|▼/g, ''); // for SKK
	if (!opt.page) opt.page = 1;
	opt.full = !!opt.full;
	if (opt.full && opt.page > 1) opt.id_offset = fullsearch_id_offset || 0;

	query_string = serializeToQuery(opt);

	setHashDelay.cancel();

	searchDelay(function() {
		searchRequest(opt, searchFinished);
		$('loading').className = ''; // show loading icon
	});
}

var setHashDelay = DelayHashChange(hashchange, 3000);

function hashchange() {
	var hash = location.hash.replace(/^#/, '');console.log(hash);
	if (hash === query_string) return;
	var opt = parseQuery(hash);
	newsearch(opt);
}

function searchFinished(res) {
	//console.log(res);
	if (res.query !== parseQuery(query_string).query) return;
	if (res.id_offset) fullsearch_id_offset = res.id_offset;

	setHashDelay(query_string, function() {
		showResults(res);
	});
}

var last_query; // only used in input() function
function input() {
	var q = $('query').value;
	if (q === last_query) return;
	last_query = q;
	newsearch({query: q});
}

function fullsearch() {
	$('res-list').innerHTML = '';
	newsearch({query: $('query').value, full: true});
}

function more() {
	var opt = parseQuery(query_string);
	++opt.page;
	newsearch(opt);
}

function scroll(e) {
	var m = $('loading');
	if (m.className !== 'hidden') {
		if (m.getBoundingClientRect().top < window.innerHeight) {
		 	 more();
		}
	}
}

function select(e) {
	if (document.activeElement === $('query')) return;
	var sel = (document.getSelection() + '').replace(/^\s+|\s+$/g, '');
	if (sel !== '') $('query').value = sel;
}


// View
function showResults(res) {
	var ul = $('res-list');
	var m = $('loading');
	ul.className = 'hidden';
	if (res.page === 1) {
		ul.innerHTML = '';
	}
	eijiroToListItems(res.results).forEach(function(li) {
		ul.appendChild(li);
	});
	ul.className = '';
	if (res.more) {
		m.className = '';
		m.title = 'page ' + (res.page + 1);
		scroll();
	} else {
		m.className = 'hidden';
	}
}

function eijiroToListItems(lines) {
	return lines.map(function(r) {
		var li = document.createElement('li');
		li.innerHTML =  parseLine(r);
		return li;
	});
}

function parseLine(line) {
	var m = /■(.*?)(  {.*?})? : (.*)/.exec(line);
	if (!m)	return htmlEscape(m);
	var n = m[3].split('■・');
	var p = n.shift();
	return '<span class="word">' + makeImplicitSearchLinks(htmlEscape(m[1])) + '</span>' + 
		(!m[2] ? '' : '  <span class="kind">' + htmlEscape(m[2].slice(2)) + '</span>') + ' : ' +
		'<span class="translation">' + parseTranslation(p) + '</span>' +
		(!n.length ? '' : '<ul>' + n.map(function(q) {return '<li>' + parseTranslation(q) + '</li>';}).join('\n') + '</ul>');
}

var KANJIs = '(?:[々〇〻\u3400-\u9FFF\uF900-\uFAFF]|[\uD840-\uD87F][\uDC00-\uDFFF])+';
function parseTranslation(text) {
	if (/【(?:レベル|発音！?|＠|大学入試|分節|変化)】/.test(text)) return htmlEscape(text).replace(/【変化】[^【]+/, makeImplicitSearchLinks);
	text = text.replace(/◆file:\S+$/,'');
	// else
	var html = htmlEscape(text)
		.replace(/(.*?)｛(.*?)｝/g, function($0, head, ruby) {
			var m, okuri = '', kanji;
			if (m = head.match(/(.*?)([ぁ-ん]+)$/)) { // TODO: check regexp
				// 心得る｛こころえる｝ -> <ruby>心得<rp>｛</rp><rt>こころえ</rt><rp>｝</rp></ruby>る
				okuri = m[2]; // === 'る'
				var l = ruby.length - okuri.length; // === 'こころえ'.length === 4
				if (ruby.lastIndexOf(okuri) === l) {
					head = m[1]; // '心得'
					ruby = ruby.slice(0, l); // 'こころえる'.slice(0, 4)
				} else {
					// TODO
					console.log(text);
					return head + '<span class="ruby">｛' + ruby + '｝</span>';
				}
			}
			// "density" => 密集（度）｛みっしゅう（ど）｝
			var re = RegExp('(.*?)(' + 
				ruby.split(/(（.*?）)/).map(function(m){
					return !m.length ? '' : 
						m.charAt(0) === '（' ? '（' + KANJIs + '）' : 
						KANJIs;
				}).join('') + ')$'
			);
			if (m = head.match(re)) { // http://tama-san.com/?p=196
				head = m[1];
				kanji = m[2];
				return head + '<ruby>' + kanji + '<rp>｛</rp><rt>' + ruby + '</rt><rp>｝</rp></ruby>' + okuri;
			} else {
				// TODO
				console.log(text);
				return head + kanji + '<span class="ruby">｛' + ruby + '｝</span>' + okuri;
			}
		})
		.replace(/&lt;→(.*?)&gt;/g, '&lt;→<a title="$1" href="#" class="explicit searchlink">$1</a>&gt;')
		.replace(/(【(?:[反対名類動同略]|参考|語源)】)([-a-zA-Z'.? ;]+)/g, function($0, $1, $2) {
			return $1 + $2.split(/ *; */).map(function(l) {
				return '<a title="' + l + '" href="#" class="explicit searchlink">' + l + '</a>';
			}).join(' ; ');
		})
		.replace(/【URL】([^ ]+(?: ; (?:[^ ]+))*)/g, function($0, $1) {
			return '【URL】' + $1.split(/ *; */).map(function(l) {
					return '<a href="' + l + '">' + l + '</a>';
				}).join(' ; ');
		});
	return makeImplicitSearchLinks(html);

}

function makeImplicitSearchLinks(html) {
	return html.split(/(<a.*?<\/a>|<.*?>|&(?:quot|lt|gt|amp);)/).map(function(m, i) {
			return (i % 2 === 0) ? m.replace(/[a-zA-Z][-a-zA-Z']*/g, '<a title="$&" href="#" class="implicit searchlink">$&</a>') : m;
		}).join('');
}


// clicking a word to do next search
document.addEventListener('click', openSearchLink, true);

function openSearchLink(e) {
	if (e.target.className.indexOf('searchlink') >= 0 && e.target.title) {
		e.preventDefault();
		e.stopPropagation();
		var query = e.target.title;
		if ($('query').value !== query) $('query').value = query;
		newsearch({query: query});
	}
}

var htmlEscapePattern = {
	'>': '&gt;',
	'<': '&lt;',
	'&': '&amp;',
	'"': '&quot;',
	"'": '&apos;'
};

function htmlEscape(text) {
	//return (text+'').replace(/[&'"><]/g, function(m){return htmlEscapePattern[m];});
		// omit the apostrophe because I have to deal with apostrophes by regexp
	return (text+'').replace(/[&"><]/g, function(m){return htmlEscapePattern[m];});
}



// Initialize
// switch views
$('switch').addEventListener('click', sw, false);

function sw() {
	if ($('config').className.indexOf('hidden') >= 0) {
		$('config').className = $('config').className.replace('hidden', '');
		$('main').className += 'hidden';
	} else {
		$('main').className = $('main').className.replace('hidden', '');
		$('config').className += 'hidden';
	}
}

// whether to show ruby or not
(function() {
	var n = $('noruby');
	if (localStorage['noruby']) {
		n.checked = true;
		$('results').className += ' noruby';
	}
	n.addEventListener('change', function(e) {
		if (n.checked) {
			localStorage['noruby'] = true;
			$('results').className += ' noruby';
		} else {
			localStorage.removeItem('noruby');
			$('results').className = $('results').className.replace(' noruby', '');
		}
	}, false);
}());

// whether to use normal size font or not
(function() {
	var n = $('largefont');
	if (localStorage['largefont']) {
		n.checked = true;
		$('results').className += ' largefont';
	}
	n.addEventListener('change', function(e) {
		if (n.checked) {
			localStorage['largefont'] = true;
			$('results').className += ' largefont';
		} else {
			localStorage.removeItem('largefont');
			$('results').className = $('results').className.replace(' largefont', '');
		}
	}, false);
}());

// if hash is set already, do search
(function init() {
	// autofocus on Chrome is very weird, so implement by myself
	$('query').focus();

	console.log(location.hash);
	var q = parseQuery(location.hash.replace(/^#/, ''));
	if ($('query').value !== q.query) $('query').value = q.query;
	newsearch(q);
}());


// Utility
function parseQuery(query) {
	if (!query) return {};
	var ret = {};
	query.split('&').forEach(function(kv) {
		kv = kv.split('=');
		ret[kv[0]] = decodeURI(kv[1]);
	});
	return ret;
}

function serializeToQuery(obj) {
	var ret = [], undef;
	for (var x in obj) if (obj.hasOwnProperty && obj[x] !== undef && obj[x] !== false && obj[x] !== null) {
		ret.push(x + '=' + encodeURIComponent(obj[x]));
	}
	return ret.join('&');
}


// handle hashchange as it is, but when doing frequent action, delay hashchange
function DelayHashChange (hashchange, wait) {
	var currentId = null;
	if (!wait) wait = 5000;
	var timer;
	var reallySetHash;
	function doAction(id, action) {
		timer = clearTimeout(timer); // clearTimeout returns undefined
		currentId = id;
		action();
		timer = setTimeout(setHash, wait);
		reallySetHash = true;
	}
	doAction.cancel = function() {timer = clearTimeout(timer)};
	function _hashchange(e) {
		if (timer) reallySetHash = false;
		hashchange(e);
	}
	window.addEventListener('hashchange', _hashchange, false);
	function setHash() {
		window.removeEventListener('hashchange', _hashchange, false);
		if (reallySetHash) location.hash = currentId;
		window.addEventListener('hashchange', _hashchange, false);
	}
	return doAction;
};

// debouncing
function Debounce(wait) {
	var timer;
	function doAction(action) {
		clearTimeout(timer);
		timer = setTimeout(action, wait);
	}
	return doAction;
}
