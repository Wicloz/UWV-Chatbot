import SimpleSchema from 'simpl-schema';
import { Messages } from "./messages";

let natural;
let ss;
if (Meteor.isServer) {
  natural = require('natural');
  ss = require('sentence-similarity');
}

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
  userTalking: {
    type: Boolean
  }
}, { tracker: Tracker });

Conversations.attachSchema(Schemas.Conversation);

// Helpers
Conversations.helpers({

});

// Methods
Meteor.methods({
  'conversations.sendMessage'(conversationId, message, type, forUser, contentBotMeta="") {
    Meteor.call("conversations.updateTalkingState", conversationId, forUser, false);
    Messages.insert({
      conversationId: conversationId,
      content: message,
      contentType: type,
      contentBotMeta: contentBotMeta,
      fromUser: forUser,
      timeSent: new Date()
    });
  },
  'conversations.updateBotState'(conversationId, to) {
    Conversations.update(conversationId, {
      $set: {
        withBot: to
      }
    });
  },
  'conversations.updateTalkingState'(conversationId, forUser, to) {
    if (forUser) {
      Conversations.update(conversationId, {
        $set: {
          userTalking: to
        }
      });
    } else {
      Conversations.update(conversationId, {
        $set: {
          botTalking: to
        }
      });
    }
  },
  'conversations.botResponse'(conversationId, userMessage) {
    // Set talking state and stop on client
    Meteor.call("conversations.updateTalkingState", conversationId, false, true);
    if (!Meteor.isServer) {
      return;
    }

    // Prepare responses
    let responses = [];
    let meta = "unknown";

    // Define and rank possible questions
    let possibilities = [
      ["voorwaarden", sentenceSimilarity(userMessage, "Welke voorwaarden zijn er om een ww-uitkering te krijgen?")],
      ["weerwerken", sentenceSimilarity(userMessage, "Ik ga weer werken. Hoe wordt dit verrekend met mijn ww-uitkering?")],
      ["overmaken", sentenceSimilarity(userMessage, "Wanneer wordt mijn ww-uitkering overgemaakt?")],
      ["dagloon", sentenceSimilarity(userMessage, "Hoe wordt de hoogte van mijn dagloon berekend?")],
      ["wanneer", sentenceSimilarity(userMessage, "Wanneer kan ik een ww-uitkering aanvragen?")],
      ["hoelang", sentenceSimilarity(userMessage, "Hoelang heb ik recht op een ww-uitkering?")],
      ["aanvragen", sentenceSimilarity(userMessage, "Hoe kan ik een ww-uitkering aanvragen?")],
      ["eerstebetaling", sentenceSimilarity(userMessage, "Wanneer krijg ik de eerste betaling van mijn ww-uitkering?")]
    ];

    // Sort possibilities
    possibilities.sort((first, second) => {
      return second[1] - first[1];
    });

    console.log(possibilities);

    // Set responses for the best possibility
    if (possibilities[0][1] > 0.2) {
      meta = possibilities[0][0];
      switch (meta) {

        case "voorwaarden":
          responses.push({
            message: "Als u werkloos wordt en" +
                     "<ul dir=\"rtl\">" +
                     "<li>Verzekerd voor werkloosheid</li>" +
                     "<li>Verlies van minimaal 5 uren per week</li>" +
                     "<li>Direct beschikbaar voor betaald werk</li>" +
                     "<li>In laatste 36 weken voordat u werkloos werd minstens 26 weken gewerkt</li>" +
                     "<li>Geen schuld aan werkloosheid</li>" +
                     "</ul>" +
                     "dan kunt u een WW-uitkering aanvragen bij UWV.",
            type: "text"
          });
          responses.push({
            message: "We hebben een informatieve video gemaakt voor u. Voor meerdere informatie kunt u naar deze film kijken.",
            type: "text"
          });
          responses.push({
            message: "https://uwvvod.download.kpnstreaming.nl/uwvvideo/ww-uitkering-aanvragen/ww-uitkering-aanvragen.mp4",
            type: "video"
          });
          break;

        case "weerwerken":
          responses.push({
            message: "Als u weer (gedeeltelijk) aan het werk gaat, bekijken wij of en hoeveel WW u nog krijgt.",
            type: "text"
          });
          responses.push({
            message: "Wij verrekenen uw inkomsten met uw WW-uitkering. De inkomsten die u naast uw uitkering verdient, trekken wij af van uw WW-maandloon. Uw WW-maandloon vindt u in de beslissingsbrief over uw WW-uitkering.",
            type: "text"
          });
          responses.push({
            message: "De eerste 2 maanden trekken wij 75% van uw inkomsten uit werk af van uw WW-maandloon. Vanaf de derde maand is dat 70%. Zijn uw inkomsten uit werk meer dan 87,5% van het WW-maandloon? Dan stopt uw uitkering.",
            type: "text"
          });
          break;

        case "overmaken":
          responses.push({
            message: "Wij betalen uw WW-uitkering na afloop van iedere kalendermaand, nadat wij van u het formulier Inkomstenopgave hebben ontvangen. Dit formulier staat na afloop van iedere maand voor u klaar. U krijgt alleen betaald als wij dit formulier hebben ontvangen.",
            type: "text"
          });
          responses.push({
            message: "<bold>Let op:</bold> het formulier Inkomstenopgave staat pas voor u klaar als de maand is afgelopen. Eerder kunt u het dus ook niet bekijken of invullen.",
            type: "text"
          });
          responses.push({
            message: "Met het formulier Inkomstenopgave geeft u de inkomsten (inclusief vakantiegeld) van de maand daarvoor door. Had u geen inkomsten? Dan geeft u dit ook door met het formulier.",
            type: "text"
          });
          responses.push({
            message: "Wij betalen de uitkering binnen 10 kalenderdagen nadat wij het formulier hebben ontvangen. Daarna duurt het meestal nog 3 dagen voordat het bedrag op uw rekening staat.",
            type: "text"
          });
          responses.push({
            message: "Houd er rekening mee dat de eerste betaling van uw uitkering langer kan duren. Op Mijn UWV ziet u precies wanneer wij uw uitkering hebben betaald.",
            type: "text"
          });
          responses.push({
            message: "Wilt u nog meer weten over Inkomstenopgave hebben we hier een tutorial video voor u gemaakt.",
            type: "text"
          });
          responses.push({
            message: "https://uwvvod.download.kpnstreaming.nl/uwvvideo/inkomsten-opgeven-eerste-keer/MP4/inkomsten-opgeven-eerste-keer.mp4",
            type: "video"
          });
          break;

        case "dagloon":
          responses.push({
            message: "Het dagloon is de basis voor de berekening van uw WW-uitkering.",
            type: "text"
          });
          responses.push({
            message: "Voor het berekenen van uw dagloon kijken we naar het sv-loon dat u verdiende in een periode van een jaar voordat u werkloos werd.",
            type: "text"
          });
          responses.push({
            message: "Ook als u dit loon bij verschillende werkgevers heeft verdiend.",
            type: "text"
          });
          responses.push({
            message: "Of als u dit loon heeft verdiend in verschillende dienstverbanden bij dezelfde werkgever.",
            type: "text"
          });
          responses.push({
            message: "Het sv-loon (sociale verzekeringsloon) is het loon waarover u belastingen en sociale premies heeft betaald.",
            type: "text"
          });
          responses.push({
            message: "Met de volgende tool kunt u rekenen hoe hoog uw ww-uitkering zal kunnen worden.",
            type: "text"
          });
          responses.push({
            message: "https://responsive.uwvwidget.nl/htmlwidgets/embed/55797a56-8260-4daf-bb10-7945d91a7b43/widget.html",
            type: "iframe"
          });
          break;

        case "wanneer":
          responses.push({
            message: "U kunt dat vanaf 1 week voordat u werkloos wordt en een tot uiterlijk 1 week na uw laatste werkdag doen. Doet u dit later? Dan krijgt u tijdelijk een lagere uitkering.",
            type: "text"
          });
          break;

        case "hoelang":
          responses.push({
            message: "Heeft u 10 jaar of minder dan 10 jaar arbeidsverleden?",
            type: "text"
          });
          responses.push({
            message: "Voor ieder volledig kalenderjaar heeft u recht op 1 maand WW. 7 jaar arbeidsverleden betekent dus 7 maanden WW.",
            type: "text"
          });
          responses.push({
            message: "Heeft u meer dan 10 jaar arbeidsverleden?",
            type: "text"
          });
          responses.push({
            message: "Voor alle volledige kalenderjaren aan arbeidsverleden voor 1 januari 2016 heeft u recht op 1 maand WW. Voor alle volledige kalenderjaren aan arbeidsverleden vanaf 1 januari 2016 heeft u recht op 0,5 maand WW.",
            type: "text"
          });
          responses.push({
            message: "Uw totale arbeidsverleden vindt u op Mijn UWV onder <a href=\"https://werknemer-portaal.uvw.nl/mijnuwv/PersoonlijkeGegevens\">Mijn persoonlijke gegevens<\a>. U kunt de duur ook zelf berekenen.",
            type: "text"
          });
          break;

        case "aanvragen":
          responses.push({
            message: "U kunt uw WW-uitkering online aanvragen.",
            type: "text"
          });
          responses.push({
            message: "U heeft hier een DigiD voor nodig.",
            type: "text"
          });
          responses.push({
            message: "Daarnaast heeft u nog een aantal gegevens nodig als u een WW-uitkering aanvraagt. Veel van uw gegevens zijn bij ons al bekend. De rest vult u zelf in.",
            type: "text"
          });
          responses.push({
            message: "Houd in ieder geval de volgende stukken bij de hand:" +
                     "<ul dir=\"rtl\">" +
                     "<li>uw laatste loonstrook</li>" +
                     "<li>uw laatste arbeidscontract</li>" +
                     "<li>uw rekeningnummer</li>" +
                     "</ul>",
            type: "text"
          });
          responses.push({
            message: "<a href=\"https://www.uwv.nl/particulieren/direct-doen/aanvragen-ww-uitkering.aspx\">Klik hier om naar het ww-aanvraag formulier te gaan.<a>",
            type: "text"
          });
          break;

        case "eerstebetaling":
          responses.push({
            message: "Als u recht heeft op een WW-uitkering moet u na afloop van elke maand uw formulier Inkomstenopgave invullen en versturen via Mijn UWV. Hierop geeft u aan of u wel of geen inkomsten heeft gehad.",
            type: "text"
          });
          responses.push({
            message: "Wij betalen de uitkering binnen 10 kalenderdagen nadat wij het formulier hebben ontvangen. Daarna duurt het meestal nog 3 dagen voordat het bedrag op uw rekening staat.",
            type: "text"
          });
          responses.push({
            message: "Houd er rekening mee dat de eerste betaling van uw uitkering langer kan duren. Op Mijn UWV ziet u precies wanneer wij uw uitkering hebben betaald.",
            type: "text"
          });
          responses.push({
            message: "Wilt u nog meer weten over Inkomstenopgave hebben we hier een tutorial video voor u gemaakt.",
            type: "text"
          });
          responses.push({
            message: "https://uwvvod.download.kpnstreaming.nl/uwvvideo/inkomsten-opgeven-eerste-keer/MP4/inkomsten-opgeven-eerste-keer.mp4",
            type: "video"
          });
          break;

      }
      responses.push({
        message: "Heeft U verder nog vragen?",
        type: "text"
      });
    }

    // Set response if no possibility was found
    else {
      responses.push({
        message: "Het spijt me, maar dat begreep ik niet.",
        type: "text"
      });
      responses.push({
        message: "Probeer iets anders te vragen.",
        type: "text"
      });
    }

    // Send responses
    for (let i = 0; i < responses.length; i++) {
      Meteor.setTimeout(() => {
        Meteor.call("conversations.sendMessage", conversationId, responses[i].message, responses[i].type, false, meta);
        if (i !== responses.length - 1) {
          Meteor.call("conversations.updateTalkingState", conversationId, false, true);
        }
      }, 1000 * (i + 1));
    }
  }
});

// Functions
function sentenceSimilarity(a, b) {
  const tokenizer = new natural.WordTokenizer();

  a = tokenizer.tokenize(a.toLowerCase());
  b = tokenizer.tokenize(b.toLowerCase());

  let similarity = ss.sentenceSimilarity(a, b, { f: ss.similarityScore.winklerMetaphone, options : {threshold: 0} });

  console.log([a, b]);
  console.log(similarity);

  return similarity.score * similarity.exact * similarity.order * similarity.size;
}
