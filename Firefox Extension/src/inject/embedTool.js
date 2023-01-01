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

function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

let callback_store = {};



// Send message to background
function sendMessageToBackground(message, callback) {
    // chrome.runtime.sendMessage(fetchExtensionId(), message, callback);
    let id = guidGenerator();
    callback_store[id] = callback;
    message["callback_id"] = id;
    window.postMessage(message, "*");
}

function processIncomingRequest(event){
    if (event.source == window && event.data && event.data.callback_id && event.data["for_content_script"] === true) {
        let callback = callback_store[event.data.callback_id];
        if(callback){
            callback(event.data);
            delete callback_store[event.data.callback_id];
        }
    }
}

// Listen to message
function listenMessageFromBackground() {
    window.addEventListener("message", processIncomingRequest);
}

// Authorize user
function authorizeUser() {
    // TODO : update oauth token
    const client = google.accounts.oauth2.initTokenClient({
        client_id: '707727329587-7t91s6ri6ob0j01ok04t4iddkectvs0r.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/presentations',
        hint: getLoggedInEmail(),
        callback: function(response){
            var access_token = response.access_token;
            var expires_in = response.expires_in;
            sendMessageToBackground({
                message_type: "USER_AUTHENTICATION_SUCCESSFUL",
                access_token: access_token,
                expires_in: expires_in
            }, function(response) {
                var type = response.message_type;
                if(type === "USER_AUTHENTICATION_SUCCESSFUL"){
                    var email = response.email;
                    updateLoggedinEmail(email);
                    showFormScreen();
                }else if(type === "USER_AUTHENTICATION_FAILED"){
                    console.log("CircuitVerse : Failed User Authentication by Implicit OAuth 2.0")
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
            showAuthorizeScreen();
        }else if(type_ === "USER_LOGGED_IN"){
            updateLoggedinEmail(email_);
            showFormScreen();
        }
    })
}

// Insert Circuit Embed with link
function insertLink() {
    const circuitVerseLink = document.getElementById('circuitverse__link_input').value;
    if(circuitVerseLink === null || circuitVerseLink === undefined || circuitVerseLink === "") return;
    showLoadingScreen();
    sendMessageToBackground({
        message_type: "EMBED_CIRCUIT",
        link_of_page: getCurrentPageUrl(),
        email: getLoggedInEmail(),
        circuitverse_link: circuitVerseLink
    }, function(response) {
        showFormScreen();
        var type_ = response.message_type;
        if(type_ === "INVALID_PRESENTATION_LINK"){
            showMessageOnScreen("Invalid presentation link", false, 5);
        }else if(type_ === "USER_NOT_LOGGED_IN"){
            showMessageOnScreen("User not logged in", false, 5);
            setTimeout(()=>showAuthorizeScreen(), 5000);
        }else if(type_ === "USER_LOGIN_SESSION_EXPIRED"){
            showMessageOnScreen("Login session expired", false, 5);
            setTimeout(()=>showAuthorizeScreen(), 5000);
        }else if(type_ === "CIRCUIT_EMBEDDING_FAILED"){
            showMessageOnScreen("Circuit embedding failed", false, 5);
        }else if(type_ === "CIRCUIT_EMBEDDING_SUCCESSFUL"){
            showMessageOnScreen("Successfully inserted circuit in slide", true, 5);
            document.getElementById('circuitverse__link_input').value = "";
        }
        showFormScreen();
    });
}

function getAbsoluteUrl(path) {
    return "moz-extension://"+fetchExtensionId()+"/"+path
}


//? UI Related functions and variables
// Main window
let circuitverse_embed_tool_window = document.getElementById("circuitverse__embed_tool_window");
// Screens
let circuitverse__embed_tool_window_authorize_screen = document.getElementsByClassName("authorize_screen")[0];
let circuitverse__embed_tool_window_loading_screen = document.getElementsByClassName("loading_container")[0];
let circuitverse__embed_tool_window_form_screen = document.getElementsByClassName("form_screen")[0];
// Components
let circuitverse__msg_box = document.getElementsByClassName("msg_box")[0];
let circuitverse__link_input = document.getElementById("circuitverse__link_input");
let circuitverse__logged_in_email = document.getElementById("circuitverse__logged_in_email");
// Buttons
let circuitverse__embed_tool_open_btn = document.getElementsByClassName("circuitverse__embed_open_btn")[0];
let circuitverse__embed_tool_close_btn = document.getElementsByClassName("circuitverse__embed_close_btn")[0];
let circuitverse__authorize_btn = document.getElementById("circuitverse__authorize_btn");
let circuitverse__embed_btn = document.getElementById("circuitverse__embed_btn");


function onclickOpenButton(){
    // Make sure to disable open button
    circuitverse__embed_tool_open_btn.classList.add("hide");
    // Show close button
    circuitverse__embed_tool_close_btn.classList.remove("hide");
    // Make circuitverse_embed_tool_window visible
    circuitverse_embed_tool_window.classList.remove("hide");
}

function onclickCloseButton(){
    // Make sure to disable open button
    circuitverse__embed_tool_open_btn.classList.remove("hide");
    // Show close button
    circuitverse__embed_tool_close_btn.classList.add("hide");
    // Make circuitverse_embed_tool_window visible
    circuitverse_embed_tool_window.classList.add("hide");
}

function showLoadingScreen(){
    circuitverse__embed_tool_window_authorize_screen.classList.add("hide");
    circuitverse__embed_tool_window_form_screen.classList.add("hide");
    circuitverse__embed_tool_window_loading_screen.classList.remove("hide");
}

function showAuthorizeScreen() {
    circuitverse__embed_tool_window_form_screen.classList.add("hide");
    circuitverse__embed_tool_window_loading_screen.classList.add("hide");    
    circuitverse__embed_tool_window_authorize_screen.classList.remove("hide");
}

function showFormScreen(){
    circuitverse__embed_tool_window_authorize_screen.classList.add("hide");
    circuitverse__embed_tool_window_loading_screen.classList.add("hide");
    circuitverse__embed_tool_window_form_screen.classList.remove("hide");
}

function showMessageOnScreen(message, successful, duration_seconds) {
    if(successful){
        circuitverse__msg_box.classList.remove("error");
        circuitverse__msg_box.classList.add("success");
    }else{
        circuitverse__msg_box.classList.remove("success");
        circuitverse__msg_box.classList.add("error");
    }
    circuitverse__msg_box.innerText = message;
    circuitverse__msg_box.classList.remove("invisible");
    setTimeout(()=>{
        circuitverse__msg_box.classList.add("invisible");
    }, duration_seconds*1000);
}

function updateLoggedinEmail(email) {
    circuitverse__logged_in_email.innerText = email;
}


// Initialization function

function initEmbedTool(){
    var interval = setInterval(function(){
        if(document.readyState === 'complete') {
            clearInterval(interval);
            // Start listening to message from bridge
            listenMessageFromBackground();
            // Insert assets
            let logo_white_url = getAbsoluteUrl("img/logo_white.png");
            document.getElementById("logo_white_1").src = logo_white_url;
            document.getElementById("logo_white_2").src = logo_white_url;
            document.getElementById("logo_white_3").src = logo_white_url;
            document.getElementById("logo_white_4").src = logo_white_url;

            let google_icon_url = getAbsoluteUrl("img/google-icon.png");
            document.getElementById("google_icon").src = google_icon_url;
            
            // Initialize all event listeners
            circuitverse__authorize_btn.addEventListener('click', authorizeUser);
            circuitverse__embed_btn.addEventListener("click", insertLink);
            circuitverse__embed_tool_open_btn.addEventListener("click", onclickOpenButton);
            circuitverse__embed_tool_close_btn.addEventListener("click", onclickCloseButton);

            // Show loading screen by default
            showLoadingScreen();

            // Check for login status
            checkLoginStatus();
        
        }
    }, 10);
}


initEmbedTool();