chrome.extension.sendMessage({}, function(response) {
  var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);

      function getEmbedLocation() {
        return document.getElementsByClassName('punch-full-screen-element')[0];
      }

      function getSlideIframe() {
        return document.getElementsByClassName('punch-present-iframe')[0];
      }

      function getSlideSvgViewDimensions() {
        var svgContainer =
            getSlideIframe().contentWindow.document.getElementsByClassName(
                'punch-viewer-svgpage-svgcontainer')[0];
        var svg = svgContainer.children[0];
        console.log(svg.getAttribute('viewBox'));
        var viewBox = svg.getAttribute('viewBox').split(' ');

        return {
          slideW: parseFloat(viewBox[2]), slideH: parseFloat(viewBox[3])
        }
      }

      function extractPositionFromPath(path) {
        var svgLinkPath = path.getAttribute('d');
        var pathRegexExp =
            /M ([\S]*) ([\S]*) L ([\S]*) ([\S]*) ([\S]*) ([\S]*) ([\S]*) ([\S]*) Z/;
        var matches = svgLinkPath.match(pathRegexExp);
        var x1 = parseFloat(matches[1]);
        var y1 = parseFloat(matches[2]);
        var x2 = parseFloat(matches[3]);
        var y3 = parseFloat(matches[6]);
        var widthInSvg = x2 - x1;
        var heightInSvg = y3 - y1;
        return {
          svgX: x1, svgY: y1, svgW: widthInSvg, svgH: heightInSvg
        }
      }

      function getSlideDimensions() {
        var slideDiv =
            getSlideIframe().contentWindow.document.getElementsByClassName(
                'punch-viewer-content')[0];
        var metadata = {
          xOffsetPx: parseFloat(slideDiv.style.left),
          yOffsetPx: parseFloat(slideDiv.style.top),
          slideWidthPx: parseFloat(slideDiv.style.width),
          slideHeightPx: parseFloat(slideDiv.style.height),
        };
        return metadata;
      }

      function createEmbedIframe(anchorTag) {
        var url =
            anchorTag.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
        var {svgX, svgY, svgW, svgH} =
            extractPositionFromPath(anchorTag.children[0]);
        var {slideW, slideH} = getSlideSvgViewDimensions();
        var {xOffsetPx, yOffsetPx, slideWidthPx, slideHeightPx} =
            getSlideDimensions();

		var svg2px = slideWidthPx / slideW;

        var absoluteXoffSetPx = xOffsetPx + svgX * svg2px;
        var absoluteYoffSetPx = yOffsetPx + svgY * svg2px;
        var widthPx = svgW * svg2px;
		var heightPx = svgH * svg2px;
		absoluteXoffSetPx = Math.round(absoluteXoffSetPx);
		absoluteYoffSetPx = Math.round(absoluteYoffSetPx);
		widthPx = Math.round(widthPx);
		heightPx = Math.round(heightPx);

        var ifrm = document.createElement('iframe');
        ifrm.setAttribute('id', 'circuitverse-iframe');     // assign an id
        ifrm.setAttribute('class', 'circuitverse-iframe');  // assign a class
        ifrm.setAttribute('style', `position:fixed;z-index:100;
			width:${widthPx}px;
			height:${heightPx}px;
			top:${absoluteYoffSetPx}px;
			left:${absoluteXoffSetPx}px`);
        // assign url
        ifrm.setAttribute('src', url);

        return ifrm;
      }

      function embed(anchorTag) {
        var iframe = createEmbedIframe(anchorTag);
        var url =
            anchorTag.getAttributeNS('http://www.w3.org/1999/xlink', 'href');

        var location = getEmbedLocation();
        if (location == undefined) {
          return;
        }
        location.appendChild(iframe);  // to place at end of document

        iframe_embedded = true;
        url_embedded = url;
      }

      function removeEmbed() {
        if (!iframe_embedded) return;
        iframe_embedded = false;
        var iframe = document.getElementById('circuitverse-iframe');
        if (iframe) iframe.parentNode.removeChild(iframe);
      }

      var url_embedded = undefined;
      var iframe_embedded = false;

      function main() {
        var iframeDocument = getSlideIframe();
        if (!iframeDocument) {
          removeEmbed();
          return;
        }
        if (iframe_embedded) {
          iframeDocument.contentWindow.document.body.focus();
        }

        var anchorTags =
            iframeDocument.contentWindow.document.getElementsByTagName('a');
        for (var i = 0; i < anchorTags.length; i++) {
          var url = anchorTags[i].getAttributeNS(
              'http://www.w3.org/1999/xlink', 'href');
          if (url.includes('circuitverse.org')) {
            if (iframe_embedded && url_embedded == url) return;
            if (iframe_embedded && url_embedded != url) {
              removeEmbed();
            }
            embed(anchorTags[i]);
            return;
          }
        }

        removeEmbed();
      }

      setInterval(main, 1000);
    }
  }, 10);
});