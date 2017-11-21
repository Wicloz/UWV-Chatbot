import SimpleSchema from 'simpl-schema';

// Collection
export const Answers = new Mongo.Collection('answers');

// Schemas
const Schemas = {};

Schemas.Answer = new SimpleSchema({
  question: {
    type: String
  },
  answer: {
    type: String
  },
  askedTimes: {
    type: SimpleSchema.Integer
  }
}, { tracker: Tracker });

Answers.attachSchema(Schemas.Answer);

// Helpers
Answers.helpers({

});
