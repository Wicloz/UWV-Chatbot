import SimpleSchema from "simpl-schema";
import { Messages } from "./messages";

let natural;
let ss;
let spellChecker;
if (Meteor.isServer) {
  natural = require('natural');
  ss = require('sentence-similarity');
  spellChecker = require('spellchecker');
  spellChecker.setDictionary('nl_NL', spellChecker.getDictionaryPath());
  extraDictionaryWords.forEach((value) => {
    spellChecker.add(value);
  });
}

// Collection
export const Conversations = new Mongo.Collection('conversations');

// Schemas
const Schemas = {};

Schemas.Conversation = new SimpleSchema({
  withBot: {
    type: Boolean
  },
  characterName: {
    type: String
  },
  botTalking: {
    type: Boolean
  },
  userTalking: {
    type: Boolean
  },
  handlingUserMessage: {
    type: SimpleSchema.Integer
  },
  annoyedFactor: {
    type: Number
  }
}, { tracker: Tracker });

Conversations.attachSchema(Schemas.Conversation);

// Helpers
Conversations.helpers({
  getLastUserMessage: function() {
    return Messages.findOne({
      conversationId: this._id,
      fromUser: true
    }, {
      sort: {
        timeSent: -1
      }
    });
  },
  getLastBotMessage: function() {
    return Messages.findOne({
      conversationId: this._id,
      fromUser: false
    }, {
      sort: {
        timeSent: -1
      }
    });
  },
});

// Methods
Meteor.methods({
  'conversations.sendMessage'(conversationId, message, type, forUser, contentMeta, newTalkingState=false) {
    let currentTime = new Date();

    if (forUser) {
      if (Meteor.isServer) {
        contentMeta = determineUserMessageMeta(message, conversationDefinition);
      }

      if ((Meteor.isServer && contentMeta.empty()) || message.split(" ").reduce((previous, current) => {
          return previous || current === current.toUpperCase();
        }, false)) {
        Conversations.update(conversationId, {
          $set: {
            annoyedFactor: Conversations.findOne({_id: conversationId}).annoyedFactor + 1
          }
        });
      } else if (Conversations.findOne({_id: conversationId}).annoyedFactor < annoyedFactorTheshold) {
        Conversations.update(conversationId, {
          $set: {
            annoyedFactor: Math.max(Conversations.findOne({_id: conversationId}).annoyedFactor - 1, 0)
          }
        });
      }

      Conversations.update(conversationId, {
        $set: {
          handlingUserMessage: Conversations.findOne({_id: conversationId}).handlingUserMessage + 1
        }
      });
    }

    Meteor.call("conversations.updateTalkingState", conversationId, forUser, newTalkingState);
    Messages.insert({
      conversationId: conversationId,
      content: message,
      contentType: type,
      contentMeta: contentMeta,
      fromUser: forUser,
      timeSent: currentTime
    });
  },

  'conversations.resetAnnoyedFactor'(conversationId) {
    Conversations.update(conversationId, {
      $set: {
        annoyedFactor: 0
      }
    });
  },

  'conversations.updateBotState'(conversationId, to) {
    Conversations.update(conversationId, {
      $set: {
        withBot: to
      }
    });
  },

  'conversations.updateTalkingState'(conversationId, forUser, to) {
    if (forUser) {
      Conversations.update(conversationId, {
        $set: {
          userTalking: to
        }
      });
    } else {
      Conversations.update(conversationId, {
        $set: {
          botTalking: to
        }
      });
    }
  },

  'conversations.sendBotGreeting'(conversationId) {
    // Set talking state
    Meteor.call("conversations.updateTalkingState", conversationId, false, true);

    // Stop on client
    if (!Meteor.isServer) {
      return;
    }

    // Prepare variables
    let startTime = (new Date()).getTime();
    let conversation = Conversations.findOne({_id: conversationId});

    // Send message
    sendBotMessages(conversationId, conversationGreeting.slice(), conversation.handlingUserMessage, startTime);
  },

  'conversations.botResponse'(conversationId) {
    // Set talking state
    Meteor.call("conversations.updateTalkingState", conversationId, false, true);

    // Stop on client
    if (!Meteor.isServer) {
      return;
    }

    // Prepare variables
    let conversation = Conversations.findOne({_id: conversationId});
    let startTime = conversation.getLastUserMessage().timeSent.getTime();
    let responses = [];

    // Determine response based on previous messages
    let askMore = false;

    conversationDefinition.forEach((value) => {
      if (conversation.getLastUserMessage().contentMeta.includes(value.meta)) {
        value.response.forEach((response) => {
          if (response.type === "trigger" && conversation.getLastBotMessage().contentMeta.includes(response.from)) {
            let contentMetaNew = Messages.findOne({_id: conversation.getLastUserMessage()._id}).contentMeta;
            contentMetaNew.push(response.to);
            Messages.update(conversation.getLastUserMessage()._id, {
              $set: {
                contentMeta: contentMetaNew
              }
            });
          }
        });
      }
    });

    conversationDefinition.forEach((value) => {
      if (conversation.getLastUserMessage().contentMeta.includes(value.meta)) {
        value.response.forEach((response) => {
          if (response.type !== "trigger") {
            askMore = askMore || value.askMore;
            response.meta = value.meta;
            responses.push(response);
          }
        });
      }
    });

    if (askMore) {
      responses = responses.concat(conversationMore);
    }

    // Set response if nothing was found
    if (responses.empty()) {
      responses = responses.concat(conversationUnknown);
    }

    // Send responses
    sendBotMessages(conversationId, responses, conversation.handlingUserMessage, startTime);
  }
});

// Functions
function sendBotMessages(conversationId, messages, userCount, startTime, sentMessages=[]) {
  // Stop if done
  if (messages.empty()) {
    Meteor.call("conversations.updateTalkingState", conversationId, false, false);
    return;
  }

  // Determine wait time
  let startTimeNew = (new Date()).getTime();
  let timeWait = 1000;

  if (!sentMessages.empty()) {
    switch (sentMessages[sentMessages.length - 1].type) {
      case "text":
        const tokenizer = new natural.WordTokenizer();
        timeWait = (tokenizer.tokenize(sentMessages[sentMessages.length - 1].message.replace(/<.*?>/g, "")).length / wordsPerMinute) * 60000;
        break;
      case "video":
        timeWait = 6000;
        break;
      case "iframe":
        timeWait = 3000;
        break;
    }

    if (messages[0].meta.includes("verder")) {
      timeWait *= 2;
    }
  }

  timeWait -= startTimeNew - startTime;
  timeWait = Math.max(timeWait, 0);

  // Move response to sent array
  let message = messages[0];
  messages.splice(0, 1);
  sentMessages.push(message);

  // Wait
  Meteor.setTimeout(() => {
    // Stop if the user typed again
    if (userCount !== Conversations.findOne({_id: conversationId}).handlingUserMessage) {
      return;
    }

    // Send response and call function again
    Meteor.call("conversations.sendMessage", conversationId, processBotMessage(message.message, conversationId), message.type, false, message.meta, true);
    sendBotMessages(conversationId, messages, userCount, startTimeNew + timeWait, sentMessages);
  }, timeWait);
}

function processBotMessage(message, conversationId) {
  let conversation = Conversations.findOne({_id: conversationId});
  return message.replace("%currentTimeGreeting%", currentTimeGreeting).replace("%characterName%", conversation.characterName);
}

function determineUserMessageMeta(userMessage, rules) {
  userMessage = splitAndCorrectSentence(userMessage);

  let rulesScored = rules.map((value) => {
    let score = sentenceSimilarityMultiple(userMessage, value.matching);
    if (score > scoreThreshold) {
      return {
        meta: value.meta,
        exclusive: value.exclusive,
        score: score
      };
    }
  }).filter((value) => {
    return value;
  });

  if (Meteor.isDevelopment) {
    console.log(rulesScored);
  }

  let metaExclusive = rulesScored.filter((value) => {
    return value.exclusive;
  }).reduce((previous, current) => {
    return (!previous || current.score > previous.score ? current : previous);
  }, undefined);

  let metas = rulesScored.filter((value) => {
    return !value.exclusive;
  });

  if (metaExclusive) {
    metas.push(metaExclusive);
  }

  return metas.map((value) => {
    return value.meta;
  });
}

function sentenceSimilarityMultiple(userMessagePrepared, matching=[]) {
  return matching.map((value) => {
    return sentenceSimilarity(userMessagePrepared, value);
  }).max();
}

function sentenceSimilarity(userMessagePrepared, matching) {
  matching = splitAndCorrectSentence(matching);
  let similarity = ss.sentenceSimilarity(userMessagePrepared, matching, { f: ss.similarityScore.winklerMetaphone, options : {threshold: 0} });
  let score = similarity.exact * similarity.order * similarity.size * ((-1 / ((userMessagePrepared.length / 1) + 1)) + 1) * ((-1 / ((matching.length / 1) + 1)) + 1);

  if (Meteor.isDevelopment) {
    console.log([userMessagePrepared, matching, score]);
  }

  return score;
}

function splitAndCorrectSentence(sentence) {
  const tokenizer = new natural.WordTokenizer();

  sentence = tokenizer.tokenize(sentence.toLowerCase());
  let oldSentence = [];

  while (!sentence.equals(oldSentence)) {
    oldSentence = sentence;

    sentence = sentence.map((value, index, array) => {
      let prevValue = index > 0 ? array[index - 1] : "";
      let nextValue = index < array.length - 1 ? array[index + 1] : "";

      preprocessSplitWords.forEach((splitWord) => {
        if (splitWord.replace(" ", "") === value) {
          value = splitWord;
        }
      });

      preprocessPasteWords.forEach((pasteWord) => {
        if (value === pasteWord.split(" ")[0] && nextValue === pasteWord.split(" ")[1]) {
          value = pasteWord.replace(" ", "");
        }
        if (prevValue === pasteWord.split(" ")[0] && value === pasteWord.split(" ")[1]) {
          value = false;
        }
      });

      return value;
    });

    sentence = sentence.filter((value) => {
      return value;
    });

    sentence = sentence.map((value) => {
      if (spellChecker.isMisspelled(value)) {
        let correction = spellChecker.getCorrectionsForMisspelling(value)[0];
        return correction ? correction : value;
      }
      return value;
    });

    sentence = tokenizer.tokenize(sentence.join(" "));
  }

  return sentence;
}
