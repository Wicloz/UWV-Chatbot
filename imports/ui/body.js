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
  Session.set("IsUser", true);
  const getId = Conversations.insert({
    withBot: true
  });
  Session.set("ConversationId", getId);
});

// On Rendered
Template.body.onRendered(function() {
  document.getElementById("message-input").focus();
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
      fromUser: Session.get("IsUser"),
      timeSent: new Date()
    });

    // Send bot message
    if (conversation().withBot) {
      const answerObject = Answers.findOne({
        question: text
      });

      let answerText = "Sorry, dat begreep ik niet, probeer iets anders te vragen.";
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
    target.text.value = "";
    target.text.focus();
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
    Session.set("IsUser", false);
    Session.set("ConversationId", text);
    Conversations.update(text, {
      $set: {
        withBot: false
      }
    });

    // Clear form
    target.text.value = "";
    document.getElementById("message-input").value = "";
    document.getElementById("message-input").focus();
  }
});
