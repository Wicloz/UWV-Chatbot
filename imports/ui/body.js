import './body.html';
import { Messages } from "../api/messages";
import { Conversations } from "../api/conversations";
let autosize = require("autosize");

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
    handlingUserMessage: 0,
    annoyedFactor: 0
  });
  Session.set("ConversationId", getId);
  Session.set("AnnoyedRetracted", false);
  Meteor.call("conversations.sendBotGreeting", Session.get("ConversationId"));
}

function submitMessageForm() {
  // Get value from form element
  const target = document.getElementById("form-send-message");
  const text = target.text.value;

  // Stop on empty value
  if (text.trim() === "") {
    return;
  }

  // Remove talking flag
  Meteor.call("conversations.updateTalkingState", Session.get("ConversationId"), Session.get("IsUser"), false);

  // Send user message
  Meteor.call("conversations.sendMessage", Session.get("ConversationId"), text, "text", Session.get("IsUser"), []);

  // Handle bot message
  if (conversation().withBot) {
    Meteor.call("conversations.botResponse", Session.get("ConversationId"));
  } else {
    Meteor.call("conversations.updateTalkingState", Session.get("ConversationId"), false, false);
  }

  // Reset form
  target.text.value = "";
  if (conversation().annoyedFactor < annoyedFactorTheshold) {
    target.text.focus();
  } else {
    target.text.blur();
  }
  autosize.update(target.text);
}

// On Created
Template.body.onCreated(function() {
  Session.set("IsUser", true);
  Session.set("ChatActive", false);
  Session.set("ConversationId", false);
});

// On Rendered
Template.body.onRendered(function() {
  autosize(document.getElementById("message-input"));
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
  userAnnoyed() {
    return conversation() && conversation().annoyedFactor >= annoyedFactorTheshold;
  },
  chatActive() {
    return Session.get("ChatActive");
  },
  chatOpen() {
    return Session.get("ChatActive") && conversation();
  },
  charactersOpen() {
    return Session.get("ChatActive") && !conversation();
  },
  duringWorkHours() {
    let date = new Date();
    return date.getDay() >= 1 && date.getDay() <= 5 && date.getHours() >= 8 && date.getHours() < 17;
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
      if (!Session.get("AnnoyedRetracted") && conversation().annoyedFactor >= annoyedFactorTheshold) {
        document.getElementById("message-input").blur();
        Session.set("AnnoyedRetracted", true);
      }
    }
  });
});

// Events
Template.body.events({
  'submit #form-send-message'(event) {
    event.preventDefault();
    submitMessageForm();
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
    autosize.update(document.getElementById("message-input"));
  },

  'keydown #message-input'(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      submitMessageForm();
    }
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

  'click .btn-unannoy'(event) {
    Meteor.call("conversations.resetAnnoyedFactor", Session.get("ConversationId"));
    Session.set("AnnoyedRetracted", false);
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
