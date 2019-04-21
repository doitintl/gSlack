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
    console.error(`Rule test error in '${test}': ${err}`);
    return false;
  }
}

function evalMessage(data, message) {
  try {
    $ = data;
    return eval(`'use strict';\`${message}\`;`);
  } catch (err) {
    console.error(`Rule message error in '${message}': ${err}`);
    return "";
  }
}

function sendSlack(data, rule) {
  const { channel, message } = rule;
  const text = evalMessage(data, message);
  return web.chat.postMessage({
    as_user: true,
    channel,
    text
  });
}

exports.gSlack = functions
  .runWith(runtimeOpts)
  .pubsub.topic("gslack")
  .onPublish(async (message, context) => {
    const messageJSON = message.json;
    return Promise.all(
      rules.map(rule => {
        if (evalTest(messageJSON, rule.test)) {
          return sendSlack(messageJSON, rule);
        }
        return Promise.resolve();
      })
    );
  });
