currentTimeGreeting = function() {
  const hours = new Date().getHours();
  if (hours >= 19 && hours < 23) {
    return "Goedenavond";
  } else if (hours >= 23 || hours < 7) {
    return "Goedenacht";
  } else if (hours >= 7 && hours < 12) {
    return "Goedemorgen";
  } else if (hours >= 12 && hours < 19) {
    return "Goedemiddag";
  }
};

conversationGreeting = function(characterName) {
  return{
    message: currentTimeGreeting() + ", ik ben Uw virtuele assistent " + characterName + ". Hoe kan ik u helpen?",
    type: "text",
    meta: ["groet"],
  };
};

conversationRedirect = [
  {
    message: "Het lijkt erop dat de chatbot U niet goed kan helpen.",
    type: "text",
    meta: ["doorsturen"],
  },
  {
    message: "Omdat wij U toch van dienst willen zijn kunt U ons telefonish bereiken op '0900 9294'.",
    type: "text",
    meta: ["doorsturen"],
  }
];

conversationUnknown = [
  {
    message: "Sorry, maar dat begreep ik niet.",
    type: "text",
    meta: ["onbekend"],
  },
  {
    message: "Ik wil U graag verder helpen, probeer het op een andere manier te vragen.",
    type: "text",
    meta: ["onbekend"],
  }
];

conversationDefinition = [
  {meta: "dank", exclusive: false, matching: [
      "bedankt",
      "dank",
    ], response: [
      {
        message: "Graag gedaan.",
        type: "text",
      }
    ]},

  {meta: "groet", exclusive: false, matching: [
      "hallo",
      "groeten",
      "hi",
      "hoi",
      "hai",
      "goedenavond",
      "goedenacht",
      "goedemiddag",
      "goedemorgen",
      "goeden ochtend",
    ], response: [
      {
        message: currentTimeGreeting() + ".",
        type: "text",
      }
    ]},

  {meta: "klaar", exclusive: false, matching: [
      "Ik ben voldoende geholpen.",
      "Die heb ik niet.",
      "Ik heb verder geen vragen meer.",
    ], response: [
      {
        message: "Hopelijk heb ik U hiermee voldoende kunnen informeren.",
        type: "text",
      }
    ]},

  {meta: "help", exclusive: true, matching: [
      "Ik heb hulp nodig.",
      "help",
      "Ik wil een vraag stellen.",
    ], response: [
      {
        message: "Stel een vraag en ik zal mijn best doen hem te beantwoorden.",
        type: "text",
      }
    ]},

  {meta: "voorwaarden", exclusive: true, matching: [
      "Welke voorwaarden zijn er om een ww-uitkering te krijgen?",
      "Mag ik een ww-uitkering krijgen?",
    ], response: [
      {
        message: "Als u werkloos wordt en" +
                 "<ul>" +
                 "<li>Verzekerd voor werkloosheid</li>" +
                 "<li>Verlies van minimaal 5 uren per week</li>" +
                 "<li>Direct beschikbaar voor betaald werk</li>" +
                 "<li>In laatste 36 weken voordat u werkloos werd minstens 26 weken gewerkt</li>" +
                 "<li>Geen schuld aan werkloosheid</li>" +
                 "</ul>" +
                 "dan kunt u een WW-uitkering aanvragen bij UWV.",
        type: "text",
      },
      {
        message: "We hebben ook een informatieve video gemaakt voor U.",
        type: "text",
      },
      {
        message: "https://uwvvod.download.kpnstreaming.nl/uwvvideo/ww-uitkering-aanvragen/ww-uitkering-aanvragen.mp4",
        type: "video",
      }
    ]},

  {meta: "weerwerken", exclusive: true, matching: [
      "Ik ga weer werken. Hoe wordt dit verrekend?",
      "Wat als ik weer ga werken?",
      "Hoe beinvloed werken mijn ww-uitkering?",
    ], response: [
      {
        message: "",
        type: "",
      }
    ]},

  {meta: "overmaken", exclusive: true, matching: [
      "Wanneer wordt mijn ww-uitkering overgemaakt?",
    ], response: [
      {
        message: "",
        type: "",
      }
    ]},

  {meta: "dagloon", exclusive: true, matching: [
      "Hoe wordt de hoogte van mijn dagloon berekend?",
      "Hoeveel uitkering kan ik verwachten te krijgen?",
    ], response: [
      {
        message: "",
        type: "",
      }
    ]},

  {meta: "wanneer", exclusive: true, matching: [
      "Wanneer kan ik een ww-uitkering aanvragen?",
    ], response: [
      {
        message: "",
        type: "",
      }
    ]},

  {meta: "hoelang", exclusive: true, matching: [
      "Hoelang heb ik recht op een ww-uitkering?",
    ], response: [
      {
        message: "",
        type: "",
      }
    ]},

  {meta: "aanvragen", exclusive: true, matching: [
      "Hoe kan ik een ww-uitkering aanvragen?",
      "Wat moet ik doen om een ww-uitkering te krijgen?",
    ], response: [
      {
        message: "",
        type: "",
      }
    ]},

  {meta: "eerstebetaling", exclusive: true, matching: [
      "Wanneer krijg ik de eerste betaling van mijn ww-uitkering?",
    ], response: [
      {
        message: "",
        type: "",
      }
    ]},

  {meta: "raakkwijt", exclusive: true, matching: [
      "Ik raak binnenkort mogelijk mijn baan kwijt.",
      "Wat moet ik doen als ik werkloos wordt?",
      "Ik wordt werkloos.",
    ], response: [
      {
        message: "",
        type: "",
      }
    ]}
];
