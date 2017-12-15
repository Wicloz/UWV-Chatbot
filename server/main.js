import '../imports/api/messages.js';
import '../imports/api/conversations.js';
const natural = require('natural');
const fs = require('fs');

if (!fs.existsSync("../storage/classifier.json")) {
  let classifier = new natural.BayesClassifier();

  classifier.train();
  classifier.save("classifier.json", (err) => {
    if (err) {
      console.error(err);
    }
  });
}
