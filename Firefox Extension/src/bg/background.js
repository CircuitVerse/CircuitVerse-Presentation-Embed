// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });


// example of using a message handler from the inject scripts

// chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
//   chrome.pageAction.show(sender.tab.id);
//   sendResponse();
// });

chrome.runtime.onInstalled.addListener(function(object) {
  chrome.tabs.create({url: 'https://docs.circuitverse.org/#/embedding_circuits?id=embedding-in-google-slides'});
});
