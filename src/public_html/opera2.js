if (window.opera) {

searchRequest = function searchRequest(opt, callback) {
	var xhr = new XMLHttpRequest;
	xhr.open('GET', 'search?'+serializeToQuery(opt), true);
	xhr.onload = function() {
		callback(JSON.parse(xhr.responseText));
	};
	xhr.send();
}

}
