/*
* Utility
*/
function $(id) {
  return document.getElementById(id);
}

function parseQuery(query) {
  if (!query) return {};
  var ret = {};
  query.split('&').forEach(function(kv) {
    kv = kv.split('=');
    ret[kv[0]] = decodeURIComponent(kv[1]);
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
    if (reallySetHash) try{location.hash = currentId;} catch(e) {} // if opened in Opera Extension's popup location is a protected variable
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


/*
* Controller
*/
$('query').addEventListener('input', input, false);
$('query').addEventListener('keyup', input, false);
$('query').addEventListener('keypress', input, false);
$('query').addEventListener('focus', input, false);
$('fulltext').addEventListener('click', fullsearch, false);
window.addEventListener('scroll', scroll, true);
window.addEventListener('mousemove', select, true);
window.addEventListener('mousedown', mouseDown, true);
window.addEventListener('mouseup', mouseUp, true);

var searchDelay = Debounce(80); // hold 80 ms before searching (when typed in)

var query_string; // serialized query option (will become URL fragment under certain conditions)

function newsearch(opt) {
  var undef;
  if (opt.query === undef) return;

  opt.query = opt.query.replace(/^[▽▼]/g, ''); // for SKK
  if (!opt.page) opt.page = 1;
  opt.full = !!opt.full;

  query_string = serializeToQuery(opt);

  setHashDelay.cancel();

  searchDelay(function() {
  document.title = 'EijiroX: ' + opt.query + (opt.full ? ' (全文)' : '');
    searchRequest(opt, searchFinished);
    $('loading').className = ''; // show loading icon
  });
}

var setHashDelay = DelayHashChange(hashchange, 3000);

function hashchange() {
  var hash = location.hash.replace(/^#/, '');
  if (hash === query_string) return;
  var opt = parseQuery(hash);
  opt.page = 1;
  if ($('query').value !== opt.query && opt.query) $('query').value = opt.query;
  newsearch(opt);
}

function searchFinished(res) {
  //console.log(res);
  if (res.query !== parseQuery(query_string).query) return;

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

var mouseState = 0; // 0 => up, 1 => down
function mouseDown(e) {
  mouseState = 1;
}

function mouseUp(e) {
  select(e);
  mouseState = 0;
}

function select(e) {
  if (document.activeElement === $('query')) return;
  if (mouseState !== 1) return;
  var sel = (window.getSelection() + '').trim();
  var button = $('selection-search');
  if (sel) {
    $('query').value = sel;
    button.className = ''; // show
    button.style.top = (e.pageY - 10) + 'px';
    button.style.left = (e.pageX + 5) + 'px';
  } else {
    var opt = parseQuery(query_string);
    if ($('query').value !== opt.query) $('query').value = opt.query;
    button.className = 'hidden';
  }
}

// clicking a word to do next search
document.addEventListener('click', openSearchLink, true);

function openSearchLink(e) {
  var a = e.target;
  while( !(a instanceof HTMLAnchorElement) && (a = a.parentNode) ) {}
  if (a && a.className.indexOf('searchlink') >= 0 && a.title) {
    e.preventDefault();
    e.stopPropagation();
    var query = a.title;
    if ($('query').value !== query) {
      $('query').value = query;
      $('query').focus();
    }
  }
}

function showResults(res) {
  var dl = $('res-list');
  var m = $('loading');
  if (res.page === 1) {
    dl.innerHTML = '';
  }

  var html = linesToHtml(res.results, res.query);
  var range = document.createRange();
  range.selectNodeContents(dl);
  var df = range.createContextualFragment(html);
  dl.appendChild(df);

  if (res.more) {
    m.className = '';
    m.title = 'page ' + (res.page + 1);
    scroll();
  } else {
    m.className = 'hidden';
  }
}


/*
* initialization
*/

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

// append custom CSS
(function() {
  var n = $('custom-style');
  var c = localStorage['custom-style'];
  var s = document.createElement('style');
  if (c) {
    n.value = s.textContent = c;
  }
  document.querySelector('head').appendChild(s);
  var timer;
  n.addEventListener('input', function(e) {
    clearTimeout(timer);
    timer = setTimeout(function() {
      s.textContent = localStorage['custom-style'] = n.value;
    }, 500);
  }, false);
}());

// selection-search button
$('selection-search').onclick = function() {$('query').focus();};
$('query').addEventListener('focus', function() { $('selection-search').className = 'hidden'; }, false);

// if hash is set already, do search
(function init() {
  var opt = parseQuery(location.hash.replace(/^#/, ''));
  var q = (opt.query || '').split('+').join(' ');
  if (q) $('query').value = q;

  // autofocus on Chrome is very weird, so implement by myself
  $('query').focus(); // starts search
}());

