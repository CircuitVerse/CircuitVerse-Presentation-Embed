chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		// ----------------------------------------------------------
		// This part of the script triggers when page is done loading
		console.log("Hello. This message was sent from scripts/inject.js");
		// ----------------------------------------------------------

		function getEmbedLocation() {
			return document.getElementsByClassName("punch-full-screen-element")[0];
		}
		
		function embed(url) {
			var ifrm = document.createElement('iframe');
			ifrm.setAttribute('id', 'circuitverse-iframe'); // assign an id
			ifrm.setAttribute('class', 'circuitverse-iframe'); // assign an id
			ifrm.setAttribute('style','width:100%;height:100%;position:fixed;top:0px;left:0px;z-index:100')
		
			var location = getEmbedLocation();
			if(location == undefined) {return;}
			location.appendChild(ifrm); // to place at end of document
		
			// assign url
			ifrm.setAttribute('src', url);
			iframe_embedded = true;
			url_embedded = url;
		}
		
		function removeEmbed() {
			if(!iframe_embedded)return;
			iframe_embedded = false;
			var iframe = document.getElementById('circuitverse-iframe');
			if(iframe) iframe.parentNode.removeChild(iframe);
		}
		
		var url_embedded = undefined;
		var iframe_embedded = false;
		
		function main() {
			var iframes = document.getElementsByClassName('punch-present-iframe');
			if(iframes.length == 0) {
				removeEmbed();
				return;
			} 
			iframeDocument = iframes[0];
			if(iframe_embedded) {
				document.getElementsByClassName("punch-present-iframe")[0].contentWindow.document.body.focus();
			}
			
			var text = iframeDocument.contentWindow.document.body.innerHTML;
		
			var re = /xlink:href="([(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))"/g;
			var m;
			do {
				m = re.exec(text);
				if (m) {
					var url = m[1];
					if(url.includes("circuitverse.org")) {
						if(iframe_embedded && url_embedded == url) return;
						if(iframe_embedded && url_embedded != url) {
							removeEmbed();
						}
						embed(url);
						return;
					}
				}
			} while (m);
			removeEmbed();
		}
		
		setInterval(main, 1000);
	}
	}, 10);
});