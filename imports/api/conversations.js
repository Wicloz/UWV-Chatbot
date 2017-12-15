import SimpleSchema from 'simpl-schema';
import { Messages } from "./messages";

let natural;
let ss;
let spellChecker;
if (Meteor.isServer) {
  natural = require('natural');
  ss = require('sentence-similarity');
  spellChecker = require('spellchecker');
  spellChecker.setDictionary('nl_NL', spellChecker.getDictionaryPath());
}

// Collection
export const Conversations = new Mongo.Collection('conversations');

// Schemas
const Schemas = {};

Schemas.Conversation = new SimpleSchema({
  withBot: {
    type: Boolean
  },
  characterName: {
    type: String
  },
  botTalking: {
    type: Boolean
  },
  userTalking: {
    type: Boolean
  },
  handlingUserMessage: {
    type: SimpleSchema.Integer
  }
}, { tracker: Tracker });

Conversations.attachSchema(Schemas.Conversation);

// Helpers
Conversations.helpers({

});

// Methods
Meteor.methods({
  'conversations.incrementUserCount'(conversationId) {
    Conversations.update(conversationId, {
      $set: {
        handlingUserMessage: Conversations.findOne({_id: conversationId}).handlingUserMessage + 1
      }
    });
  },

  'conversations.sendMessage'(conversationId, message, type, forUser, contentBotMeta="", newTalkingState=false) {
    Meteor.call("conversations.updateTalkingState", conversationId, forUser, newTalkingState);
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
    // Set talking state
    Meteor.call("conversations.updateTalkingState", conversationId, false, true);

    // Stop on client
    if (!Meteor.isServer) {
      return;
    }

    // Prepare responses
    let responses = [];
    let meta = "unknown";
    let userCount = Conversations.findOne({_id: conversationId}).handlingUserMessage;
    let responded = false;

    // Check for non question flags
    if (sentenceSimilarityMultiple(userMessage, [
        "bedankt",
        "dank"
      ]) > 0.4) {
      responses.push({
        message: "Graag gedaan.",
        type: "text"
      });
      responded = true;
    }
    if (sentenceSimilarityMultiple(userMessage, [
        "hallo",
        "groeten",
        "hi",
        "hoi",
        "hai",
        "goedenavond",
        "goedenacht",
        "goedemiddag",
        "goedemorgen",
        "goeden ochtend"
      ]) > 0.4) {
      responses.push({
        message: currentTimeGreeting() + ".",
        type: "text"
      });
      responded = true;
    }
    if (sentenceSimilarityMultiple(userMessage, [
        "Ik heb hulp nodig.",
        "help",
        "Ik wil een vraag stellen."
      ]) > 0.4) {
      responses.push({
        message: "Stel een vraag en ik zal mijn best doen hem te beantwoorden.",
        type: "text"
      });
      responded = true;
    }
    if (sentenceSimilarityMultiple(userMessage, [
        "Ik ben voldoende geholpen.",
        "Die heb ik niet.",
        "Ik heb verder geen vragen meer."
      ]) > 0.4) {
      responses.push({
        message: "Hopelijk heb ik U hiermee voldoende kunnen informeren.",
        type: "text"
      });
      responded = true;
    }

    // Define and rank possible questions
    let possibilities = [
      ["voorwaarden", sentenceSimilarityMultiple(userMessage, [
        "Welke voorwaarden zijn er om een ww-uitkering te krijgen?",
        "Mag ik een ww-uitkering krijgen?",
      ])],
      ["weerwerken", sentenceSimilarityMultiple(userMessage, [
        "Ik ga weer werken. Hoe wordt dit verrekend?",
        "Wat als ik weer ga werken?",
        "Hoe beinvloed werken mijn ww-uitkering?",
      ])],
      ["overmaken", sentenceSimilarityMultiple(userMessage, [
        "Wanneer wordt mijn ww-uitkering overgemaakt?",
      ])],
      ["dagloon", sentenceSimilarityMultiple(userMessage, [
        "Hoe wordt de hoogte van mijn dagloon berekend?",
        "Hoeveel uitkering kan ik verwachten te krijgen?",
      ])],
      ["wanneer", sentenceSimilarityMultiple(userMessage, [
        "Wanneer kan ik een ww-uitkering aanvragen?",
      ])],
      ["hoelang", sentenceSimilarityMultiple(userMessage, [
        "Hoelang heb ik recht op een ww-uitkering?",
      ])],
      ["aanvragen", sentenceSimilarityMultiple(userMessage, [
        "Hoe kan ik een ww-uitkering aanvragen?",
        "Wat moet ik doen om een ww-uitkering te krijgen?",
      ])],
      ["eerstebetaling", sentenceSimilarityMultiple(userMessage, [
        "Wanneer krijg ik de eerste betaling van mijn ww-uitkering?",
      ])],
      ["raakkwijt", sentenceSimilarityMultiple(userMessage, [
        "Ik raak binnenkort mogelijk mijn baan kwijt.",
        "Wat moet ik doen als ik werkloos wordt?",
        "Ik wordt werkloos.",
      ])]
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
                     "<ul>" +
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
            message: "Uw totale arbeidsverleden vindt u op Mijn UWV onder <a href=\"https://werknemer-portaal.uwv.nl/mijnuwv/PersoonlijkeGegevens\">Mijn persoonlijke gegevens<\a>. U kunt de duur ook zelf berekenen.",
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
                     "<ul>" +
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

        case "raakkwijt":
          responses.push({
            message: "Dat is vervelend om te horen.",
            type: "text"
          });
          responses.push({
            message: "Zie <a href=\"https://www.uwv.nl/particulieren/werkloos/ik-word-werkloos/detail/stappenplan-ww-wegwijzer-ww-app\">deze pagina<a> voor een stappenplan.",
            type: "text"
          });
          responses.push({
            message: "We hebben ook een informatieve video gemaakt voor je.",
            type: "text"
          });
          responses.push({
            message: "https://uwvvod.download.kpnstreaming.nl/uwvvideo/ww-uitkering-aanvragen/ww-uitkering-aanvragen.mp4",
            type: "video"
          });
          break;

      }
      responses.push({
        message: "Heeft U verder nog vragen?",
        type: "text"
      });
    }

    // Set response if no possibility was found and no flag was set
    else if (!responded) {
      responses.push({
        message: "Sorry, maar dat begreep ik niet.",
        type: "text"
      });
      responses.push({
        message: "Ik wil U graag verder helpen, probeer het op een andere manier te vragen.",
        type: "text"
      });
    }

    // Send responses
    sendResponses(conversationId, responses, meta, userCount);
  }
});

// Functions
function sendResponses(conversationId, responses, meta, userCount, sentResponses=[]) {
  // Stop if done
  if (responses.length <= 0) {
    Meteor.call("conversations.updateTalkingState", conversationId, false, false);
    return;
  }

  // Determine wait time
  let timeWait = 1000;
  if (sentResponses.length > 0 && sentResponses[sentResponses.length - 1].type === "text") {
    const tokenizer = new natural.WordTokenizer();
    timeWait = (tokenizer.tokenize(sentResponses[sentResponses.length - 1].message.replace(/<.*?>/g, "")).length / 200) * 60000; // 200 wpm
  }

  // Move response to sent array
  let response = responses[0];
  responses.splice(0, 1);
  sentResponses.push(response);

  // Wait
  Meteor.setTimeout(() => {
    // Stop if the user typed again
    if (userCount !== Conversations.findOne({_id: conversationId}).handlingUserMessage) {
      return;
    }

    // Send response and call function again
    Meteor.call("conversations.sendMessage", conversationId, response.message, response.type, false, meta, true);
    sendResponses(conversationId, responses, meta, userCount, sentResponses);
  }, timeWait);
}

function sentenceSimilarityMultiple(a, b=[]) {
  let results = [];
  b.forEach((value) => {
    results.push(sentenceSimilarity(a, value));
  });
  results.sort((first, second) => {
    return second - first;
  });
  return results[0];
}

function sentenceSimilarity(a, b) {
  a = splitAndCorrectSentence(a);
  b = splitAndCorrectSentence(b);

  let similarity = ss.sentenceSimilarity(a, b, { f: ss.similarityScore.winklerMetaphone, options : {threshold: 0} });
  let score = similarity.exact * similarity.order * similarity.size * ((-1 / ((a.length / 2) + 1)) + 1);

  console.log([a, b, score]);

  return score;
}

function splitAndCorrectSentence(sentence) {
  const tokenizer = new natural.WordTokenizer();

  sentence = tokenizer.tokenize(sentence.toLowerCase());
  let oldSentence = "";

  while (sentence.join(" ") !== oldSentence) {
    oldSentence = sentence.join(" ");
    sentence = sentence.map((value) => {
      if (spellChecker.isMisspelled(value)) {
        let correction = spellChecker.getCorrectionsForMisspelling(value)[0];
        return correction ? correction : value;
      }
      return value;
    });
    sentence = tokenizer.tokenize(sentence.join(" "));
  }

  return sentence;
}
