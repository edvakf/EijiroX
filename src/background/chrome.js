if (this.chrome) {
  chrome.extension.onRequestExternal.addListener(function(request, sender, sendResponse) {
    if (request.action === 'search') {
      var opt = {
        query: ((request.query || '') + '').trim(),
        limit: Math.floor(request.limit) > 0 ? Math.floor(request.limit) : 0,
        page: Math.floor(request.page) > 0 ? Math.floor(request.page) : 1,
        full: !!request.full
      };
      search(opt, function callback(response) {
        if (request.html) {
          response.results = linesToHtml(response.results, response.query);
        }
        response.html = !!request.html;
        response.action = 'search';
        sendResponse(response);
      });
    }
  });
}
