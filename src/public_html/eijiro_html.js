var linesToHtml = (function () {
  /*
  * convert eijiro line to <dt> <dd> pair
  */
  var re_line = /■(.*?)(?:  ?{(.*?)})? : (.*)/;
  var re_sep = /■・|●/;
  function parseLine(line, query) {
    var m = re_line.exec(line);
    if (!m) {
      console.log(m);
      return '';
    }
    var word = m[1];
    var kind = m[2];
    var trans = m[3].split(re_sep);
    return '<dt class="entry-box">' +
        '<span class="entry">' + highlightQuery(query, makeImplicitSearchLinks(htmlEscape(word))) + "</span>" +
        (!kind ? '' : ' <span class="kind"><span class="bracket">{</span>' + htmlEscape(kind) + '<span class="bracket">}</span></span>') + 
        ' <span class="separator">:</span> ' +
      '</dt>' +
      trans.map(function(t) {
          return '<dd class="translation">' + parseTranslation(t) + '</dd>';
        }).join('');
  }

  /*
  * highlight searched word in an entry
  */
  var re_htmltag = /(<.*?>)/;
  var re_alphabet = /[a-z]/;
  function highlightQuery(query, html) {
    var segments = html.split(re_htmltag);
    var whole = segments.filter(function(text, i) {return i % 2 === 0;}).join('').toLowerCase();

    var q = htmlEscape(query).toLowerCase();
    var qlen = q.length;

    var offset = whole.indexOf(q);
    if (offset > 0) {
      while (re_alphabet.test(whole.charAt(offset - 1))) {
        offset = whole.indexOf(q, offset + 1);
      }
    }
    var pos = 0;

    return segments.map(function(text, i) {
      if (i % 2) return text; // if it's an html tag, do nothing
      if (offset < 0) return text; // if query string not found or highlight is finished
      var ret = '';
      if (offset > pos) {
        if (pos + text.length <= offset) {
          pos += text.length;
          return text;
        } else {
          ret = text.slice(0, offset - pos);
          text = text.slice(offset - pos);
          pos = offset;
        }
      }
      if (offset <= pos) {
        if (qlen >= text.length) {
          ret += (text.trim()) ? '<span class="query-highlight">' + text + '</span>' : text; // if text is non-visible, don't highlight
          qlen -= text.length;
          pos += text.length;
        } else {
          var rest = text.slice(qlen);
          text = text.slice(0, qlen);
          ret += (text.trim()) ? '<span class="query-highlight">' + text + '</span>' : text; // if text is non-visible, don't highlight
          ret += rest;
          offset = -1; // finish
        }
        return ret;
      }
    }).join('');
  }

  /*
  * make semantic HTML of translation part
  */
  var re_kanji = '(?:[々〇〻\u3400-\u9FFF\uF900-\uFAFF]|[\uD840-\uD87F][\uDC00-\uDFFF])+'; // http://tama-san.com/?p=196
  var re_trivial = /【(?:レベル|発音！?|＠|大学入試|分節|変化|読み方)】/;
  var re_henka = /【変化】[^【]+/;
  var re_hatsuon = /(【発音！?】)([^【]+)/;
  var re_hatsuon_sep = / *(、|《.*?》)+ */;
  var re_redirect = /<→(.*?)>/;
  var re_file = /◆file:\S+$/;
  var re_synonym = /(【(?:[反対名類動同略]|参考|語源|標準英語)】)([-a-zA-Z'.? ;]+)/g;
  var re_semicolon = / *; */;
  var re_url = /【URL】([^ ]+(?: ; (?:[^ ]+))*)/g;
  var re_bracket = /([【〈])(.*?)([】〉])/g;
  function parseTranslation(text) {
    if (re_trivial.test(text)) {
      return htmlEscape(text)
        .replace(re_henka, makeImplicitSearchLinks)
        .replace(re_hatsuon, function($0, $1, $2) {
          return $1 + $2.split(re_hatsuon_sep).map(function(l, i) {
              if (i % 2 !== 0) return l;
              return convertPhonetic(l);
            }).join('');
        })
        .replace(re_bracket, function($0, $1, $2, $3) {
          return ' <span class="info"><span class="bracket">' + $1 +
            '</span>' + ($2 === '＠' ? 'カナ' : $2) + '<span class="bracket">' +
            $3 + '</span></span> ';
        });
    }
    if (re_redirect.test(text)) {
      return text.replace(re_redirect, function(_, word) {
          return '&lt;→<a title="'+htmlEscape(word)+'" href="#" class="explicit searchlink">'+htmlEscape(word)+'</a>&gt;'
        });
    }
    if (text.indexOf('＝') === 0) {
      return '＝' + text.slice(1).split(re_semicolon).map(function(l) {
          return '<a href="#" title="' + htmlEscape(l) + '" class="explicit searchlink">' + htmlEscape(l) + '</a>';
        }).join(' ; ');
    }

    text = text.replace(re_file,'');
    // else
    var html = convertRuby(htmlEscape(text))
      .replace(re_synonym, function($0, $1, $2) {
        return $1 + $2.split(re_semicolon).map(function(l) {
          return '<a title="' + l + '" href="#" class="explicit searchlink">' + l + '</a>';
        }).join(' ; ');
      })
      .replace(re_url, function($0, $1) {
        return '【URL】' + $1.split(re_semicolon).map(function(l) {
            return '<a href="' + l + '">' + l + '</a>';
          }).join(' ; ');
      })
      .replace(re_bracket,' <span class="info"><span class="bracket">$1</span>$2<span class="bracket">$3</span></span> ');
    return makeImplicitSearchLinks(html);
  }

  /*
  * put <ruby> tags
  */
  var re_ruby = /(.*?)｛(.*?)｝/g;
  var re_okuri = /(.*?)([ぁ-ん]+)$/;
  var re_additional = /(（.*?）)/;
  function convertRuby(html) {
    return html.replace(re_ruby, function($0, head, ruby) {
      var m, okuri = '', kanji;
      if (m = head.match(re_okuri)) {
        // 心得る｛こころえる｝ -> <ruby>心得<rp>｛</rp><rt>こころえ</rt><rp>｝</rp></ruby>る
        okuri = m[2]; // === 'る'
        var l = ruby.length - okuri.length; // === 'こころえ'.length === 4
        if (ruby.lastIndexOf(okuri) === l) {
          head = m[1]; // '心得'
          ruby = ruby.slice(0, l); // 'こころえる'.slice(0, 4)
        } else {
          // maybe this case does not exist
          console.log(text);
          return head + '<span class="ruby">｛' + ruby + '｝</span>';
        }
      }
      // "density" => 密集（度）｛みっしゅう（ど）｝
      var re = RegExp('(.*?)(' + 
        ruby.split(re_additional).map(function(m){
          return !m.length ? '' : (m.charAt(0) === '（' ? '（' + re_kanji + '）' : re_kanji);
        }).join('') + ')$'
      );
      if (m = head.match(re)) {
        head = m[1];
        kanji = m[2];
        return head + '<ruby>' + kanji + '<rp>｛</rp><rt>' + ruby + '</rt><rp>｝</rp></ruby>' + okuri;
      } else {
        // maybe this case does not exist
        console.log(text);
        return head + kanji + '<span class="ruby">｛' + ruby + '｝</span>' + okuri;
      }
    })
  }

  /*
  * convert eijiro phonetic symbols to IPA
  */
  var phonetic = {'ae':'æ', 'i`':'ì', "i'":'í', '∫':'ʃ', 'η':'ŋ', 'з':'ʒ', 'δ':'ð', "'":'\u0301', '`':'\u0300', 'α':'ɑ', 'э':'ə', 'Λ':'ʌ', 'ｏ':'ɔ', ':':'ː', 'g':'ɡ', '(':'<i>', ')':'</i>'};
  var re_phonetic = /(ae|i['`]|[∫ηзδ'`αэΛｏ:g()])/g;
  function convertPhonetic(text) {
    if (!text) return '';
    return '<span class="phonetic">' + text.replace(re_phonetic, function(m) {return phonetic[m];}) + '</span>';
  }

  /*
  * make all english words into links (note: argument is HTML string)
  */
  var re_htmlspecial = /(<a.*?<\/a>|<.*?>|&(?:quot|lt|gt|amp);)/;
  var re_englishword = /[a-zA-Z][-a-zA-Z']*/g;
  function makeImplicitSearchLinks(html) {
    return html.split(re_htmlspecial).map(function(m, i) {
        return (i % 2 === 0) ? m.replace(re_englishword, '<a title="$&" href="#" class="implicit searchlink">$&</a>') : m;
      }).join('');
  }

  /*
  * usual HTML escape
  */
  var htmlEscapePattern = {'>':'&gt;', '<':'&lt;', '&':'&amp;', '"':'&quot;', "'":'&apos;'};
  // omit the apostrophe because I have to deal with apostrophes by regexp
  var re_htmlunsafe = /[&"><]/g;
  function htmlEscape(text) {
    return (text+'').replace(re_htmlunsafe, function(m){return htmlEscapePattern[m];});
  }

  /*
  * main body
  */
  function linesToHtml(lines, query) {
    return lines.map(function(line) {
      return parseLine(line, query);
    }).join('\n');
  }

  return linesToHtml;
}());
