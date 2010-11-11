function $(id) {
	return document.getElementById(id);
}

// autofocus on Chrome is very weird, so implement by myself
$('query').focus();


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

// general
$('query').addEventListener('input', search, false);
$('query').addEventListener('keyup', search, false);
$('query').addEventListener('keypress', search, false);
$('fulltext').addEventListener('click', fullsearch, false);
window.addEventListener('load', load, false);
window.addEventListener('hashchange', hashchange, false);
$('more').addEventListener('click', more, true);
window.addEventListener('scroll', scroll,true);

function newhash(hash) {
	var undef;
	if (hash.query === undef) return;
	if (!hash.page) hash.page = 1;
	location.hash = serializeToQuery(hash);
}

var timer;
var query;
var fullsearch_id_offset;
function hashchange() {
	clearTimeout(timer);
	var undef;
	var h = location.hash;
	var hash = parseQuery(h.replace(/^#/, ''));
	if (hash.query === undef) return;

	timer = setTimeout(function() {
		if (location.hash !== h) return;
		query = hash.query;
		if ($('query').value !== query) $('query').value = query;
		hash.page *= 1;
		hash.full = !!hash.full;
		if (hash.full && hash.page > 1) hash.id_offset = fullsearch_id_offset || 0;
		searchRequest(hash, showResults);
		$('loading').className = '';
	}, 90);
}

function search() {
	if ($('query').value === query) return;
	newhash({query: $('query').value});
}

function fullsearch() {
	newhash({query: $('query').value, full: true});
}

function load() {
	console.log(location.hash);
	var h = parseQuery(location.hash.replace(/^#/, ''));
	console.log(h);
	if (h.page == 1) {
		hashchange();
	} else {
		h.page = 1;
		newhash(h);
	}
}

function more() {
	$('more').className = 'hidden';
	var h = parseQuery(location.hash.replace(/^#/, ''));
	++h.page;
	newhash(h);
}

function scroll(e) {
	var box = $('more').getBoundingClientRect();
	if ((box.top || box.bottom || box.left || box.right) && box.top < window.innerHeight) {
		if ($('more').className !== 'hidden') more();
	}
}

function eijiroToListItems(lines) {
	return lines.map(function(r) {
		var li = document.createElement('li');
		li.innerHTML =  parseLine(r);
		return li;
	});
}

function showResults(res) {
	console.log(res);
	if (res.query !== query) return;
	if (res.id_offset) fullsearch_id_offset = res.id_offset;
	$('loading').className = 'hidden';
	var ul = $('res-list');
	var more = $('more');
	ul.className = 'hidden';
	if (res.page === 1) {
		ul.innerHTML = '';
	}
	eijiroToListItems(res.results).forEach(function(li) {
		ul.appendChild(li);
	});
	ul.className = '';
	if (res.more) {
		more.className = '';
		$('tinydiv').className = '';
		more.title = 'page ' + (res.page + 1);
	} else {
		more.className = 'hidden';
		$('tinydiv').className = 'hidden';
	}
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
	text = text.replace(/file:\S+$/,'');
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


// clicking a word to do next search
document.addEventListener('click', openSearchLink, true);

function openSearchLink(e) {
	if (e.target.className.indexOf('searchlink') >= 0 && e.target.title) {
		e.preventDefault();
		e.stopPropagation();
		query = $('query').value = e.target.title;
		searchRequest(query, 1, false, showResults);
	}
}

// whether to show ruby or not
window.addEventListener('load', function() {
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
}, false);

// whether to use normal size font or not
window.addEventListener('load', function() {
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
}, false);

// utility
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
	for (var x in obj) if (obj.hasOwnProperty && obj[x] !== undef) {
		ret.push(x + '=' + encodeURIComponent(obj[x]));
	}
	return ret.join('&');
}
