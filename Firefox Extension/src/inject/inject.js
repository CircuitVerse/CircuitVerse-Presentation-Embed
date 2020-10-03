chrome.runtime.sendMessage({}, function(response) {
  var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);

      // Specific location which allows the iframe embedded to be visible
      function getEmbedLocation() {
        return document.getElementsByClassName('punch-viewer-container')[0];
      }

      // Extract slide number from the presentation
      function getSlideNumber() {
        var labelElement = document.getElementsByClassName(
            'punch-viewer-svgpage-a11yelement')[0];
        if (!labelElement) return -1;
        var label = labelElement.getAttribute('aria-label');
        return parseInt(label.match(/Slide (\d*)/)[1]);
      }

      // Get the slide dimensions in svg values
      function getSlideSvgViewDimensions() {
        var svgContainer = document.getElementsByClassName(
            'punch-viewer-svgpage-svgcontainer')[0];
        var svg = svgContainer.children[0];
        var viewBox = svg.getAttribute('viewBox').split(' ');

        return {
          slideW: parseFloat(viewBox[2]), slideH: parseFloat(viewBox[3])
        }
      }

      // Extract position and size of embedded image in SVG
      // Needed for identifying exact location to embed the iframe
      function extractPositionFromPath(path) {
        var svgLinkPath = path.getAttribute('d');

        var pathRegexExp =
            /m([\S]*) ([\S]*)l([\S]*) ([\S]*)l([\S]*) ([\S]*)l([\S]*) ([\S]*)z/;
        var matches = svgLinkPath.match(pathRegexExp);

        var x1 = parseFloat(matches[1]);
        var y1 = parseFloat(matches[2]);
        var x2 = x1 + parseFloat(matches[3]);
        var y2 = y1 + parseFloat(matches[4]);
        var x3 = x2 + parseFloat(matches[5]);
        var y3 = y2 + parseFloat(matches[6]);
        var svgX = Math.min(x1, x2, x3);
        var svgY = Math.min(y1, y2, y3);
        var svgW = Math.max(x1, x2, x3) - svgX;
        var svgH = Math.max(y1, y2, y3) - svgY;
        return {
          svgX, svgY, svgW, svgH
        }
      }

      // Get slide dimensions and offsets in pixels
      function getSlideDimensions() {
        var slideDiv =
            document.getElementsByClassName('punch-viewer-content')[0];
        var metadata = {
          xOffsetPx: parseFloat(slideDiv.style.left),
          yOffsetPx: parseFloat(slideDiv.style.top),
          slideWidthPx: parseFloat(slideDiv.style.width),
          slideHeightPx: parseFloat(slideDiv.style.height),
        };
        return metadata;
      }


      // Url in anchor tag in firefox is as follows
      // https://www.google.com/url?q=https://circuitverse.org/simulator/embed/247&sa=D&ust=1601725669371000&usg=AFQjCNHjRBTGCOn7qQbamqK5YYcQ9AXgmA
      // Helper function to extract actual circuitverse url only
      function cleanUrl(url) {
        return url.match(/q=([^&]*)\&/)[1];
      }

      // Create circuitverse iframe from anchor tag
      // Calculates exact position and places the iframe
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
        ifrm.classList.add('circuitverse-iframe');  // assign a class
        ifrm.setAttribute('style', `position:fixed;z-index:100;
			width:${widthPx}px;
			height:${heightPx}px;
			top:${absoluteYoffSetPx}px;
			left:${absoluteXoffSetPx}px`);
        // assign url
        ifrm.setAttribute('src', cleanUrl(url));
        return ifrm;
      }

      // Embeds iframe given link
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

      // Removes all embedded iframes
      function removeEmbed() {
        var iframes = document.getElementsByClassName('circuitverse-iframe');
        while (iframes[0]) {
          iframes[0].parentNode.removeChild(iframes[0]);
        }
      }

      // Keeps track of current frame

      var slideNumber = -1;

      // Setting slideNumber = -1 will reset everything
      function reset() {
        slideNumber = -1;
      }

      // Driver logic
      function main() {
        // Bring slide into focus - necessary for slide transitions to work!
        if (slideNumber != -1) {
          document.body.focus();
        }

        if (slideNumber == getSlideNumber()) return;

        // New Slide
        removeEmbed();  // remove previous iframes
        slideNumber = getSlideNumber();

        var anchorTags = document.getElementsByTagName('a');

        var prevUrl = undefined;
        for (var i = 0; i < anchorTags.length; i++) {
          var url = anchorTags[i].getAttributeNS(
              'http://www.w3.org/1999/xlink', 'href');

          // Google Slides has 2 anchor tags for every link for some reason;
          // Hence ensuring no duplicate embeds!
          if (url != prevUrl && url.includes('circuitverse.org')) {
            prevUrl = url
            embed(anchorTags[i]);
          }
        }
      }

      // Call driver logic repeatedly
      setInterval(main, 300);

      // Force reset after 3 seconds - needed for window resizing
      // Also needed if first slide has circuit
      window.addEventListener('resize', () => {
        setTimeout(reset, 3000);
      });
    }
  }, 10);
});
