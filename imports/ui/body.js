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

  let timeName = "";
  const hours = new Date().getHours();

  if (hours >= 19 && hours < 23) {
    timeName = "Goedeavond";
  } else if (hours >= 23 || hours < 7) {
    timeName = "Goedenacht";
  } else if (hours >= 7 && hours < 12) {
    timeName = "Goedemorgen";
  } else if (hours >= 12 && hours < 19) {
    timeName = "Goedemiddag";
  }

  Meteor.setTimeout(() => {
    Meteor.call("conversations.sendMessage", Session.get("ConversationId"), timeName + ", hoe kan ik U helpen?", "text", false);
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

    // Stop on empty value or talking bot
    if (text === "" || conversation().botTalking) {
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
    Meteor.call("conversations.updateTalkingState", Session.get("ConversationId"), Session.get("IsUser"),
      !(event.target.value.length <= 1 && event.keyCode === 8) && event.target.value.length > 1
    );
  }
});
