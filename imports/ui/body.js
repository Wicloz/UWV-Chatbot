import './body.html';
import { Messages } from "../api/messages";
import { Conversations } from "../api/conversations";

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
    withBot: true,
    botTalking: true,
    userTalking: false,
  });
  Session.set("ConversationId", getId);
});

// On Rendered
Template.body.onRendered(function() {
  document.getElementById("message-input").focus();
  Meteor.setTimeout(() => {
    Meteor.call("conversations.sendMessage", Session.get("ConversationId"), "Hoe kan ik U helpen?", "text", false);
  }, 1000);
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

    // Remove talking flag
    Meteor.call("conversations.updateTalkingState", Session.get("ConversationId"), Session.get("IsUser"), false);

    // Send user message
    Meteor.call("conversations.sendMessage", Session.get("ConversationId"), text, "text", Session.get("IsUser"));

    // Handle bot message
    if (conversation().withBot) {
      Meteor.call("conversations.botResponse", Session.get("ConversationId"), text);
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

    // Clean up this conversation
    Meteor.call("conversations.updateTalkingState", Session.get("ConversationId"), Session.get("IsUser"), false);
    Meteor.call("conversations.updateBotState", Session.get("ConversationId"), true);

    // Switch to conversation
    Session.set("IsUser", false);
    Session.set("ConversationId", text);
    Meteor.call("conversations.updateBotState", Session.get("ConversationId"), false);

    // Clear form
    target.text.value = "";
    document.getElementById("message-input").value = "";
    document.getElementById("message-input").focus();
  },
  'keydown #message-input'(event) {
    Meteor.call("conversations.updateTalkingState", Session.get("ConversationId"), Session.get("IsUser"), true);
  }
});
