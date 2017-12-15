import './body.html';
import { Messages } from "../api/messages";
import { Conversations } from "../api/conversations";

// Functions
function conversation() {
  return Conversations.findOne({
    _id: Session.get("ConversationId")
  });
}

function fixMessageScroll() {
  Tracker.afterFlush(function () {
    let chat = $(".chat-area-messages");
    chat.scrollTop(chat.prop("scrollHeight"));
  });
}

function startConversation(characterName) {
  const getId = Conversations.insert({
    withBot: true,
    characterName: characterName,
    botTalking: true,
    userTalking: false,
    handlingUserMessage: 0
  });
  Session.set("ConversationId", getId);
  Meteor.call("conversations.sendGreeting", Session.get("ConversationId"));
}

// On Created
Template.body.onCreated(function() {
  Session.set("IsUser", true);
  Session.set("ChatActive", true);
  Session.set("ConversationId", false);
  startConversation("Alex");
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
  },
  chatActive() {
    return Session.get("ChatActive");
  },
  chatOpen() {
    return Session.get("ChatActive") && conversation();
  },
  charactersOpen() {
    return Session.get("ChatActive") && !conversation();
  }
});

// Autorun
Tracker.autorun(function() {
  Conversations.find({
    _id: Session.get("ConversationId")
  }).observeChanges({
    changed: function(id, fields) {
      fixMessageScroll();
    }
  });
  Messages.find({
    conversationId: Session.get("ConversationId")
  }).observeChanges({
    added: function(id, fields) {
      fixMessageScroll();
    }
  });
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
    Meteor.call("conversations.incrementUserCount", Session.get("ConversationId"));

    // Handle bot message
    if (conversation().withBot) {
      Meteor.call("conversations.botResponse", Session.get("ConversationId"), text);
    } else {
      Meteor.call("conversations.updateTalkingState", Session.get("ConversationId"), false, false);
    }

    // Reset form
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

    // Reset forms
    target.text.value = "";
    document.getElementById("message-input").value = "";
    document.getElementById("message-input").focus();
  },

  'keydown #message-input'(event) {
    Meteor.call("conversations.updateTalkingState", Session.get("ConversationId"), Session.get("IsUser"),
      !(event.target.value.length <= 1 && event.keyCode === 8) && event.keyCode !== 13
    );
  },

  'click .btn-open'(event) {
    Session.set("ChatActive", true);
    Tracker.afterFlush(function () {
      document.getElementById("message-input").focus();
    });
  },
  'click .btn-close'(event) {
    Session.set("ChatActive", false);
    $("video").each(function() {
      $(this)[0].pause();
    });
  },

  'click .btn-exit'(event) {
    Session.set("ConversationId", false);
  },

  'click #btn-character-alex'(event) {
    startConversation("Alex");
  },
  'click #btn-character-iris'(event) {
    startConversation("Iris");
  },
  'click #btn-character-jelger'(event) {
    startConversation("Jelger");
  }
});
