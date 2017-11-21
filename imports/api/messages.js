import SimpleSchema from 'simpl-schema';

// Collection
export const Messages = new Mongo.Collection('messages');

// Schemas
const Schemas = {};

Schemas.Message = new SimpleSchema({
  conversationId: {
    type: String
  },
  content: {
    type: String
  },
  fromUser: {
    type: Boolean
  },
  timeSent: {
    type: Date
  }
}, { tracker: Tracker });

Messages.attachSchema(Schemas.Message);

// Helpers
Messages.helpers({

});
