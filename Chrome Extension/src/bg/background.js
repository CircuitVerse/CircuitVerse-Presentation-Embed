// On install, open the CircuitVerse Docs in a new tab
chrome.runtime.onInstalled.addListener(function(object) {
  chrome.tabs.create({url: 'https://docs.circuitverse.org/#/chapter2/2cvforeducators?id=embed-circuitverse-simulation-in-google-slides'});
});
