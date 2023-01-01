// On install, open the CircuitVerse Docs in a new tab
chrome.runtime.onInstalled.addListener(function(object) {
  chrome.tabs.create({url: 'https://docs.circuitverse.org/#/chapter2/2cvforeducators?id=embed-circuitverse-simulation-in-google-slides'});
});


function sendResponse(tabId, response, message) {
  var msg = message;
  msg["callback_id"] = response["callback_id"];
  msg["origin"] = response["origin"];  
  chrome.tabs.sendMessage(tabId, msg);
}

// Handle messages from the injected Embed tool
chrome.runtime.onMessage.addListener(async function(request, sender) {
  //? Handle new successful authentication callback
  if (request.message_type === "USER_AUTHENTICATION_SUCCESSFUL") {
    var access_token = request.access_token;
    var expires_in = request.expires_in - 30; // as the internal process takes some time deduct 30 seconds
    var expires_in_timestamp = Date.now() + expires_in * 1000;
    var email;

    // Fetch user profile 
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + access_token);

    var requestOptions = {
      method: 'GET',
      headers: headers,
      redirect: 'follow'
    };

    fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", requestOptions)
      .then(response => response.json())
      .then(async(result) => {
        email = result.email;
        // Store the access token in the local session storage
        // as we dont want to keep temporary tokens permerantly as they have max ttl of 1 hour
        var payload_ = {}
        payload_[email] = {
          access_token: access_token,
          expires_in: expires_in_timestamp,
        };
        await browser.storage.local.set(payload_)
        sendResponse(sender.tab.id, request, {
          "message_type": "USER_AUTHENTICATION_SUCCESSFUL",
          "email": email
        })
      })
      .catch(error => {
        sendResponse(sender.tab.id, request, {
          "message_type": "USER_AUTHENTICATION_FAILED"
        })
      });
  }
  //? Used to check whether the email id is logged in and access_token is still valid 
  else if(request.message_type === "CHECK_LOGIN_STATUS"){
    var email = request.email;
    var result = await browser.storage.local.get(email);
    // If no record in storage, user is not logged in
    if(result[email] === undefined || result[email] === null){
      sendResponse(sender.tab.id, request, {
        "message_type": "USER_NOT_LOGGED_IN",
        "email": email
      })
    }else{
      // If record is present, check if access_token is still valid and expires_in is not expired
      var access_token = result[email].access_token;
      var expires_in = result[email].expires_in;
      if(expires_in <= Date.now() || access_token === "" || access_token === null || access_token === undefined){
        await browser.storage.local.remove(email);
        sendResponse(sender.tab.id, request, {
          "message_type": "USER_NOT_LOGGED_IN",
          "email": email
        })
      }else{
        sendResponse(sender.tab.id, request, {
          "message_type": "USER_LOGGED_IN",
          "email": email
        })
      }
    }
  }
  //? Embed the circuit in slides
  else if(request.message_type === "EMBED_CIRCUIT"){
    var email = request.email;
    var link_of_page = request.link_of_page; // extract page id and presentation id
    var circuitverse_link = request.circuitverse_link;

    // Parse the presentation id and slide id from the link
    var tmp_ = parsePresentationLink(link_of_page);
    var link_parse_status = tmp_[0];
    var presentation_id = tmp_[1];
    var slide_id = tmp_[2];
    if(link_parse_status === false){
      sendResponse(sender.tab.id, request, {
        "message_type": "INVALID_PRESENTATION_LINK"
      })
      return;
    }else{
      // Fetch the access token from the local storage      
      var result = await browser.storage.local.get(email);
      // If no record in storage, user is not logged in
      if(result[email] === undefined || result[email] === null){
        sendResponse(sender.tab.id, request, {
          "message_type": "USER_NOT_LOGGED_IN",
          "email": email
        })
      }else{
        // If record is present, check if access_token is still valid and expires_in is not expired
        var access_token = result[email].access_token;
        var expires_in = result[email].expires_in;
        if(expires_in <= Date.now() || access_token === "" || access_token === null || access_token === undefined){
          browser.storage.local.remove([email]); // we need not to wait for this to complete
          sendResponse(sender.tab.id, request, {
            "message_type": "USER_LOGIN_SESSION_EXPIRED",
            "email": email
          })
        }
        // If access_token is valid, embed the circuit in the slide
        // Step 1: prepare the preview image link and hyperlink
        var circuitverse_project_id = getProjectId(circuitverse_link);
        var preview_image_link = await getCircuitPreviewImagePath(circuitverse_project_id);
        var circuit_hyperlink = getCircuitEmbedPath(circuitverse_project_id);
        // Step 2: fetch revison id of the slide
        var revison_id_request = await fetchPresentationRevisionId(presentation_id, slide_id, access_token);
        if(revison_id_request[0] === false) {
          sendResponse(sender.tab.id, request, {
            "message_type": "CIRCUIT_EMBEDDING_FAILED"
          })
          return;
        }
        var presentation_revision_id = revison_id_request[1];
        // Step 3: insert image
        var insert_image_request = await insertImageInSlide(presentation_id, slide_id, presentation_revision_id, preview_image_link, access_token);
        if(insert_image_request[0] === false) {
          sendResponse(sender.tab.id, request, {
            "message_type": "CIRCUIT_EMBEDDING_FAILED"
          })
          return;
        }
        // Step 4: insert hyperlink
        var insert_hyperlink_request = await insertHyperlinkInImage(presentation_id, slide_id, insert_image_request[2], insert_image_request[1],circuit_hyperlink, access_token);
        if(insert_hyperlink_request[0] === false) {
          sendResponse(sender.tab.id, request, {
            "message_type": "CIRCUIT_EMBEDDING_FAILED"
          })
          return;
        }
        // TODO refetch revison id and give one retry
        // Send success message
        sendResponse(sender.tab.id, request, {
          "message_type": "CIRCUIT_EMBEDDING_SUCCESSFUL"
        })
      }
    }
  }
})

// Parse project id from url
function getProjectId(url) {
  var re1= /https:\/\/circuitverse\.org\/users\/\d*\/projects\/(.*)/;
  var re2 = /"https:\/\/circuitverse\.org\/simulator\/embed\/(.*?)"/;
  var re3 = /https:\/\/circuitverse\.org\/simulator\/edit\/(.*)/;
  var re4 = /https:\/\/circuitverse\.org\/simulator\/embed\/(.*)/;
  var re5 = /https:\/\/circuitverse\.org\/simulator\/(.*)/;
  
  if(re1.test(url)) return url.match(re1)[1];
  if(re2.test(url)) return url.match(re2)[1];
  if(re3.test(url)) return url.match(re3)[1];
  if(re4.test(url)) return url.match(re4)[1];
  if(re5.test(url)) return url.match(re5)[1];
  return "";
}

// Get embed path of circuit from ID
function getCircuitEmbedPath(id) {
  return `https://circuitverse.org/simulator/embed/${id}`;
}

// Get circuit image path from ID
async function getCircuitPreviewImagePath(id) {
  var queryUrl = `https://circuitverse.org/api/v1/projects/${id}/image_preview`;
  var response = await fetch(queryUrl);
  var data = await response.json();
  return data.project_preview;
}

// Parse presentation id and slide id from url of page
function parsePresentationLink(url) {
  // Check whether `link_of_page` is a valid google slides link and consists the slide_id
  var re = /https:\/\/docs\.google\.com\/presentation\/d\/(.*)\/edit#slide=id\.(.*)/;
  if(!re.test(url)){
    returrn [false, null, null];
  }
  // Extract the slide_id and presentation_id from the link
  var presentation_id = url.match(re)[1];
  var slide_id = url.match(re)[2];
  return [true, presentation_id, slide_id];
}

// Fetch Slides Revison Id
async function fetchPresentationRevisionId(presentation_id, slide_id, access_token) {
  var queryUrl = `https://slides.googleapis.com/v1/presentations/${presentation_id}/pages/${slide_id}`;
  var response = await fetch(queryUrl, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    }
  });
  if(response.status !== 200) return [false, null];
  var data = await response.json();
  return [true, data.revisionId];
}

// Insert image in slide
async function insertImageInSlide(presentation_id, slide_id, revision_id, img_link, access_token) {
  // Generate object id for image
  var objectId = generateObjectId();
  // Prepare headers
  var request_headers = new Headers();
  request_headers.append("Authorization", `Bearer ${access_token}`);
  // Prepare body
  var body = {
    "requests": [
      {
          "createImage": {
          "objectId": objectId,
              "elementProperties": {
                  "pageObjectId": slide_id,
                  "size": {
                      "width": {
                          "magnitude": 320,
                          "unit": "pt"
                      },
                      "height": {
                          "magnitude": 240,
                          "unit": "pt"
                      }
                  }
              },
              "url": img_link
          }
      }
    ],
    "writeControl": { 
        "requiredRevisionId": revision_id
    }
  };
  var request_options = {
    method: 'POST',
    headers: request_headers,
    body: JSON.stringify(body),
    redirect: 'follow'
  };
  // Send request
  var request = await fetch(`https://slides.googleapis.com/v1/presentations/${presentation_id}:batchUpdate`, request_options);
  if(request.status !== 200) return [false, null, null];
  var data = await request.json();
  // return [status, image object id, revison id]
  return [true, objectId, data.writeControl.requiredRevisionId];
}

// Insert hyperlink to image
async function insertHyperlinkInImage(presentation_id, slide_id, revision_id,  object_id, hyperlink, access_token) {
  // Prepare headers
  var request_headers = new Headers();
  request_headers.append("Authorization", `Bearer ${access_token}`);
  // body
  var body = {
    "requests": [
      {
          "updateImageProperties": {
              "objectId": object_id,
              "fields": "link",
              "imageProperties": {
                  "link": {
                     "url": hyperlink
                  }
              }
          }
      }
    ],
    "writeControl": { 
        "requiredRevisionId": revision_id
    }
  }
  var request_options = {
    method: 'POST',
    headers: request_headers,
    body: JSON.stringify(body),
    redirect: 'follow'
  }
  // Send request
  var request = await fetch(`https://slides.googleapis.com/v1/presentations/${presentation_id}:batchUpdate`, request_options);
  if(request.status !== 200) return false;
  else return true;  
}

// Generate object id
function generateObjectId() {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-:123456789';
  var charactersLength = Math.floor(Math.random()*(50-10+1)+10); // random number between  10  and 50
  for ( var i = 0; i < charactersLength; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}