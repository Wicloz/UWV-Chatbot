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
  getLastMessage: function () {
    return Messages.findOne({
      conversationId: this._id
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
    if (forUser) {
      if (Meteor.isServer) {
        contentMeta = determineUserMessageMeta(message, conversationDefinition);

        let annoyedIncrement = 0;
        if (contentMeta.empty()) {
          annoyedIncrement = 1;
        } else {
          let split = message.split(" ");
          annoyedIncrement = split.reduce((previous, current) => {
            if (current.toUpperCase() === current) {
              return previous + 1;
            }
            return previous;
          }, 0) / split.length;
        }
        Conversations.update(conversationId, {
          $set: {
            annoyedFactor: Conversations.findOne({_id: conversationId}).annoyedFactor + annoyedIncrement
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
      timeSent: new Date()
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
    sendBotMessages(conversationId, [conversationGreeting(conversation.characterName)], conversation.handlingUserMessage, startTime);
  },

  'conversations.botResponse'(conversationId) {
    // Set talking state
    Meteor.call("conversations.updateTalkingState", conversationId, false, true);

    // Stop on client
    if (!Meteor.isServer) {
      return;
    }

    // Prepare variables
    let startTime = (new Date()).getTime();
    let conversation = Conversations.findOne({_id: conversationId});
    let responses = [];

    // Determine if user wants a redirect
    if (conversation.annoyedFactor > 3) {
      responses = responses.concat(conversationRedirect);
      Conversations.update(conversationId, {
        $set: {
          annoyedFactor: 0
        }
      });
    }

    else {
      // Determine response based on previous messages
      conversationDefinition.forEach((value) => {
        if (conversation.getLastMessage().contentMeta.includes(value.meta)) {
          responses = responses.concat(value.response.map((response) => {
            response.meta = value.meta;
            return response;
          }));
        }
      });
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
  if (!sentMessages.empty() && sentMessages[sentMessages.length - 1].type === "text") {
    const tokenizer = new natural.WordTokenizer();
    timeWait = (tokenizer.tokenize(sentMessages[sentMessages.length - 1].message.replace(/<.*?>/g, "")).length / 200) * 60000; // 200 wpm
  } else {
    timeWait -= startTimeNew - startTime;
    timeWait = Math.max(timeWait, 0);
  }

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
    Meteor.call("conversations.sendMessage", conversationId, message.message, message.type, false, message.meta, true);
    sendBotMessages(conversationId, messages, userCount, startTimeNew, sentMessages);
  }, timeWait);
}

function determineUserMessageMeta(userMessage, rules) {
  let rulesScored = rules.map((value) => {
    let score = sentenceSimilarityMultiple(userMessage, value.matching);
    if (score > 0.3) {
      return {
        meta: value.meta,
        exclusive: value.exclusive,
        score: score
      };
    }
  }).filter((value) => {
    return value;
  });

  console.log(rulesScored);

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

function sentenceSimilarityMultiple(a, b=[]) {
  return b.map((value) => {
    return sentenceSimilarity(a, value);
  }).max();
}

function sentenceSimilarity(a, b) {
  a = splitAndCorrectSentence(a);
  b = splitAndCorrectSentence(b);

  let similarity = ss.sentenceSimilarity(a, b, { f: ss.similarityScore.winklerMetaphone, options : {threshold: 0} });
  let score = similarity.exact * similarity.order * similarity.size * ((-1 / ((a.length / 2) + 1)) + 1);

  console.log([a, b, score]);

  return score;
}

function splitAndCorrectSentence(sentence) {
  const tokenizer = new natural.WordTokenizer();

  sentence = tokenizer.tokenize(sentence.toLowerCase());
  let oldSentence = [];

  while (!sentence.equals(oldSentence)) {
    oldSentence = sentence;

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
