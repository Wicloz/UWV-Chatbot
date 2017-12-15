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
  contentType: {
    type: String,
    allowedValues: ["text", "video", "iframe"]
  },
  contentMeta: {
    type: Array
  },
  'contentMeta.$': {
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
  isText: function () {
    return this.contentType === "text";
  },
  isVideo: function () {
    return this.contentType === "video";
  },
  isIframe: function () {
    return this.contentType === "iframe";
  }
});
