// Get current page url
function getCurrentPageUrl() {
    return window.location.href || document.location.href;
}
// Get the extension id
function fetchExtensionId() {
    return document.getElementById('circuitverse-extension-id').innerText;
}

// Get logged in user e-mail id -> returnn empty string if not found
function getLoggedInEmail() {
    let email  = null;
    try {
        email = gbar_.CONFIG[0][4]["ya"][5]
    }catch(err) {
        try {
            email = IJ_values[32];
        } catch (error) {
            email = null;
        }
    }
    return (email === null || email === undefined) ? "unknown" : email
}

// Send message to background
function sendMessageToBackground(message, callback) {
    chrome.runtime.sendMessage(fetchExtensionId(), message, callback);
}

// Authorize user
function authorizeUser() {
    // TODO : update oauth token
    const client = google.accounts.oauth2.initTokenClient({
        client_id: '707727329587-7t91s6ri6ob0j01ok04t4iddkectvs0r.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/presentations',
        hint: getLoggedInEmail(),
        callback: function(response){
            var access_token = response.access_token;
            console.log(access_token);
            var expires_in = response.expires_in;
            sendMessageToBackground({
                message_type: "USER_AUTHENTICATION_SUCCESSFUL",
                access_token: access_token,
                expires_in: expires_in
            }, function(response) {
                var type = response.message_type;
                if(type === "USER_AUTHENTICATION_SUCCESSFUL"){
                    var email = response.email;
                    console.log(email);
                    // TODO
                }else if(type === "USER_AUTHENTICATION_FAILED"){
                    // TODO
                }
            })
        }
      });
    client.requestAccessToken()
}

// Check login status
function checkLoginStatus() {
    sendMessageToBackground({
        message_type: "CHECK_LOGIN_STATUS",
        email: getLoggedInEmail()
    }, function(response) {
        var type_ = response.message_type;
        var email_ = response.email;
        if(type_ === "USER_NOT_LOGGED_IN"){
            // TODO
        }else if(type_ === "USER_LOGGED_IN"){
            // TODO
        }
    })
}

// Insert Circuit Embed with link
function insertLink() {
    const circuitVerseLink = document.getElementById('circuitverse-embed-task-link').value;
    sendMessageToBackground({
        message_type: "EMBED_CIRCUIT",
        link_of_page: getCurrentPageUrl(),
        email: getLoggedInEmail(),
        circuitverse_link: circuitVerseLink
    }, function(response) {
        var type_ = response.message_type;
        if(type_ === "INVALID_PRESENTATION_LINK"){
            // TODO
        }else if(type_ === "USER_NOT_LOGGED_IN"){
            // TODO
        }else if(type_ === "USER_LOGIN_SESSION_EXPIRED"){
            // TODO
        }else if(type_ === "CIRCUIT_EMBEDDING_FAILED"){
            // TODO
        }else if(type_ === "CIRCUIT_EMBEDDING_SUCCESSFUL"){
            // TODO
        }
    });
}



function initEmbedTool(){
    var interval = setInterval(function(){
        if(document.readyState === 'complete') {
            document.getElementById('yujkujhk').addEventListener('click', insertLink);
            document.getElementById("auth-btn-circuitverse").addEventListener("click", authorizeUser);
            clearInterval(interval);
        }
    }, 10);
}

initEmbedTool();