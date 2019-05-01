const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { WebClient } = require("@slack/web-api");

admin.initializeApp(functions.config().firebase);

const web = new WebClient(functions.config().gslack.api_token);
const runtimeOpts = {
  timeoutSeconds: 30,
  memory: "256MB"
};

const rules = [];
admin
  .firestore()
  .collection("gSlack")
  .where("disabled", "==", false)
  .onSnapshot(querySnapshot => {
    querySnapshot.docChanges().forEach(change => {
      const rule = {
        id: change.doc.id,
        ...change.doc.data()
      };
      if (change.type === "added") {
        rules.splice(change.newIndex, 0, rule);
      }
      if (change.type === "modified") {
        rules.splice(change.newIndex, 1, rule);
      }
      if (change.type === "removed") {
        rules.splice(change.oldIndex, 1);
      }
    });
  });

function evalTest(data, test) {
  try {
    $ = data;
    return eval(`'use strict';(${test});`);
  } catch (err) {
    console.error(err, test);
    return false;
  }
}

function evalMessageText(data, message) {
  if (message) {
    try {
      $ = data;
      return eval(`'use strict';\`${message}\`;`);
    } catch (err) {
      console.error(err, message);
      return `Error: ${err} in rule message:\n ${message}`;
    }
  }
}

function evalMessageAttachments(data, attachments) {
  if (attachments) {
    try {
      $ = data;
      return JSON.parse(
        eval(`'use strict';\`${JSON.stringify(attachments)}\`;`)
      );
    } catch (err) {
      console.error(err, attachments);
      return [
        {
          title: "GSLACK ERROR",
          text: `Error: ${err} in rule attachments`
        }
      ];
    }
  }
}

function sendSlack(data, rule) {
  return web.chat.postMessage({
    as_user: true,
    channel: rule.channel,
    text: evalMessageText(data, rule.message),
    attachments: evalMessageAttachments(data, rule.attachments)
  });
}

exports.gSlack = functions
  .runWith(runtimeOpts)
  .pubsub.topic("gslack")
  .onPublish((message, context) => {
    const data = message.json;
    return Promise.all(
      rules.map(rule => {
        if (evalTest(data, rule.test)) {
          return sendSlack(data, rule);
        }
        return Promise.resolve();
      })
    );
  });
