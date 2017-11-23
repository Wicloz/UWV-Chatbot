import SimpleSchema from 'simpl-schema';

// Collection
export const Conversations = new Mongo.Collection('conversations');

// Schemas
const Schemas = {};

Schemas.Conversation = new SimpleSchema({
  withBot: {
    type: Boolean
  },
  botTalking: {
    type: Boolean
  },
  humanTalking: {
    type: Boolean
  }
}, { tracker: Tracker });

Conversations.attachSchema(Schemas.Conversation);

// Helpers
Conversations.helpers({

});
