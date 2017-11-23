import './body.html';
import { Messages } from "../api/messages";
import { Conversations } from "../api/conversations";

// Functions
function conversation() {
  return Conversations.findOne({
    _id: Session.get("ConversationId")
  });
}

function updateConversation(data) {
  Conversations.update(Session.get("ConversationId"), {
    $set: data
  });
}

function botSendAfterDelay(message) {
  updateConversation({botTalking: true});
  Meteor.setTimeout(() => {
    updateConversation({botTalking: false});
    Messages.insert({
      conversationId: Session.get("ConversationId"),
      content: message,
      fromUser: false,
      timeSent: new Date()
    });
  }, 800);
}

function startTalking() {
  if (Session.get("IsUser")) {
    updateConversation({humanTalking: true});
  } else {
    updateConversation({botTalking: true});
  }
}

function stopTalking() {
  if (Session.get("IsUser")) {
    updateConversation({humanTalking: false});
  } else {
    updateConversation({botTalking: false});
  }
}

// On Created
Template.body.onCreated(function() {
  Session.set("IsUser", true);
  const getId = Conversations.insert({
    withBot: true,
    botTalking: true,
    humanTalking: false,
  });
  Session.set("ConversationId", getId);
});

// On Rendered
Template.body.onRendered(function() {
  document.getElementById("message-input").focus();
  botSendAfterDelay("Hoe kan ik U helpen.");
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
    stopTalking();

    // Send user message
    Messages.insert({
      conversationId: Session.get("ConversationId"),
      content: text,
      fromUser: Session.get("IsUser"),
      timeSent: new Date()
    });

    // Send bot message
    if (conversation().withBot) {
      botSendAfterDelay("Sorry, dat begreep ik niet, probeer iets anders te vragen.");
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
    stopTalking();

    // Switch to conversation
    Session.set("IsUser", false);
    Session.set("ConversationId", text);
    updateConversation({withBot: false});

    // Clear form
    target.text.value = "";
    document.getElementById("message-input").value = "";
    document.getElementById("message-input").focus();
  },
  'keydown #message-input'(event) {
    startTalking();
  }
});
