# CircuitVerse Presentation Embed
![download](https://github.com/CircuitVerse/CircuitVerse/raw/master/public/img/cvlogo.svg?sanitize=true)
## About the project
The project is an extension that allows the user to embed CircuitVerse circuit's in a Google Slide. Unfortunately, Google Slides does not allow the users to embed iframe. However, it is possible to achieve that by using a combination of Google Slides Add-On on and the CircuitVerse chrome extension.
## Clone this repo!
First things first. Make a local clone of this repo so you can work on it from your own computer.
```
git clone https://github.com/CircuitVerse/CircuitVerse-Presentation-Embed.git
cd CircuitVerse-Presentation-Embed
```
## Extension Installation
##### Chrome
- Goto chrome://extensions/, enable developer mode
- Click load unpacked extension and select the chrome extension repo folder

##### Firefox
- Compress the Firefox extension repo folder (.xpi,.jar,.zip)
- Goto about:debugging#/runtime/this-firefox on Firefox
- Click on "Load Temporary AddOn" and upload the compressed file

#### Reloading the extension
##### Chrome
- Goto chrome://extensions on Chrome
- Click on the reload icon just below your extension to reload
##### Firefox
- Goto about:debugging#/runtime/this-firefox on Firefox
- Click on the "Reload" just below your extension to reload

## Plugin Installation
##### Set it up
- Go to your **Google Slide** Presentation
- From within your document, select the menu item **Tools > Script** editor. If you are presented with a welcome screen, click **Blank Project**.
- Delete any code in the script editor and rename Code.gs to translate.gs.
- Create a new HTML file by selecting the menu item **File > New > HTML file**. Name this file **sidebar** (Apps Script adds the .html extension automatically).
- Drag and drop  **Google Slides Add On/Code.js** from your local cloned repo to translate.gs
- Drag and drop **Google Slides Add On/sidebar.html** from your local cloned repo to sidebar.html
- Select the menu item **File > Save all**. Name your new script **"Translate Quickstart"** and click **OK** (The script's name is shown to end users in several places, including the authorization dialog.)
- Switch back to your document and reload the page.
- After a few seconds, a **CircuitVerse** element will appear on the menu.
- Done!

## How To Use It
After installing both the extension and plugin (instructions above) to use it 
- Click **Embed Circuit** sub-menu on the **CircuitVerse**
- Enter the circuit's url and click **Embed!**
- Now when in presentation mode, users will be able to interact with image embed
