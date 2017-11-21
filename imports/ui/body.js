import './body.html';
import { Messages } from "../api/messages";
import { Conversations } from "../api/conversations";
import { Answers } from "../api/answers";

// Functions
function conversation() {
  return Conversations.findOne({
    _id: Session.get("ConversationId")
  });
}

// On Created
Template.body.onCreated(function() {
  const getId = Conversations.insert({
    withBot: true
  });
  Session.set("ConversationId", getId);
});

// Helpers
Template.body.helpers({
  messages() {
    return Messages.find({
      conversationId: Session.get("ConversationId")
    }, {
      sort: {
        timeSent: 1
      }
    });
  },
  conversation() {
    return conversation();
  }
});

// Events
Template.body.events({
  'submit #form-send-message'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    const target = event.target;
    const text = target.text.value;

    // Stop on empty value
    if (text === "") {
      return;
    }

    // Send user message
    Messages.insert({
      conversationId: Session.get("ConversationId"),
      content: text,
      fromUser: true,
      timeSent: new Date()
    });

    // Send bot message
    if (conversation().withBot) {
      const answerObject = Answers.findOne({
        question: text
      });

      let answerText = "Sorry, dat begreep ik niet, probber iets anders te vragen.";
      if (typeof answerObject !== "undefined") {
        answerText = answerObject.answer;
      }

      Messages.insert({
        conversationId: Session.get("ConversationId"),
        content: answerText,
        fromUser: false,
        timeSent: new Date()
      });
    }

    // Clear form
    target.text.value = '';
  },
  'submit #form-switch-conversation'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    const target = event.target;
    const text = target.text.value;

    // Check if conversation exists
    const conversationCount = Conversations.find({
      _id: text
    }).count();
    if (conversationCount <= 0) {
      return;
    }

    // Switch to conversation
    Session.set("ConversationId", text);
    Conversations.update(text, {
      $set: {
        withBot: false
      }
    });

    // Clear form
    target.text.value = '';
  }
});
