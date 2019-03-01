# heise-reader
## A feed reader for the Google assistant

heise-reader is a voice action for Google assistant. The code is supposed to be deployed on Firebase and called by a Dialogflow intent. If you have no idea what I'm talking about, take a few hours and read through https://developers.google.com/actions/extending-the-assistant.

This voice action retrieves the Atom feed of IT news website https://heise.de and reads out the latest three headlines. The user can browse through the latest 12 headlines and hear the summary of each news story. This voice action is **in German** but the code (functions/index.js) is easy enough to be modified quickly.

This is a demo project built for a tutorial in [c't Magazin](https://ct.de/) due to appear ca. in April 2019.
