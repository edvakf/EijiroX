ojera.extension.onmessage = function(e) {
  if (e.data.action === 'selection?') {
    var sel = window.getSelection() + '';
    opera.extension.postMessage({action: 'selection?', args: [sel]});
  }
}
