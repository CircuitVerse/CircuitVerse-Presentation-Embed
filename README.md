

# CircuitVerse Presentation Embed
![download](https://github.com/CircuitVerse/CircuitVerse/raw/master/public/img/cvlogo.svg?sanitize=true)

## About the project
The project is an extension that allows the user to embed CircuitVerse circuit's in a Google Slide. Unfortunately, Google Slides does not embed iframe. However, it is possible to achieve that by using a combination of Google Slides Add-On on and chrome extension.

## Clone this repo
First things first. Make a local clone of this repo so you can work on it from your own computer.
```
git clone https://github.com/CircuitVerse/CircuitVerse-Presentation-Embed.git
cd CircuitVerse-Presentation-Embed
```
## Installation: Browser Extension

### Chrome
1. Goto chrome://extensions/, enable developer mode
1. Click load unpacked extension and select the chrome extension folder

### Firefox
1. Goto about:debugging#/runtime/this-firefox on Firefox
1. Click on "Load Temporary AddOn" and select `manifest.json` in the firefox extension folder

### Reloading the extension
#### Chrome
1. Goto chrome://extensions on Chrome
1. Click on the reload icon just below your extension to reload
#### Firefox
1. Goto about:debugging#/runtime/this-firefox on Firefox
1. Click on the "Reload" just below your extension to reload

## Installation: Google Docs Add - On

1. Install clasp tool: `npm install -g @google/clasp`
1. Then enable the Google Apps Script API: https://script.google.com/home/usersettings
1. Login: `clasp login`
1. Goto to the Add on folder: `cd Google\ Slides\ Add\ On`
1. Run `clasp create --type slides --title "CircuitVerse Embed Project"`
1. Run `clasp push` to push changes from local system to Google Docs
1. Run `clasp pull` to pull changes from google docs to local system

For more information on how to use clasp, check the main [repo](https://github.com/google/clasp). 
