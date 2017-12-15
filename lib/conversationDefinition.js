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
    message: currentTimeGreeting() + ", ik ben uw virtuele assistent " + characterName + ". Hoe kan ik u helpen?",
    type: "text",
    meta: ["groet"],
  };
};

conversationRedirect = [
  {
    message: "Het lijkt erop dat de chatbot u niet goed kan helpen.",
    type: "text",
    meta: ["doorsturen"],
  },
  {
    message: "Omdat wij u toch van dienst willen zijn kunt u ons telefonish bereiken op '0900-9294'.",
    type: "text",
    meta: ["doorsturen"],
  },
  {
    message: "Wij zijn bereikbaar op werkdagen van 8.00 tot 17.00 uur.",
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
    message: "Ik wil u graag verder helpen, probeer het op een andere manier te vragen.",
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
        message: "Hopelijk heb ik u hiermee voldoende kunnen informeren.",
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
        message: "We hebben ook een informatieve video gemaakt voor u.",
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
        message: "De eerste 2 maanden trekken wij 75% van uw inkomsten uit werk af van uw WW-maandloon. Vanaf de derde maand is dat 70%.",
        type: "text",
      },
      {
        message: "Zijn uw inkomsten uit werk meer dan 87,5% van het WW-maandloon? Dan stopt uw uitkering.",
        type: "text",
      }
    ]},

  {meta: "overmaken", exclusive: true, matching: [
      "Wanneer wordt mijn ww-uitkering overgemaakt?",
      "Wat is het formulier Inkomstenopgave?",
    ], response: [
      {
        message: "Wij betalen uw WW-uitkering na afloop van iedere kalendermaand, nadat wij van u het formulier Inkomstenopgave hebben ontvangen.",
        type: "text",
      },
      {
        message: "U krijgt alleen betaald als wij dit formulier hebben ontvangen.",
        type: "text",
      },
      {
        message: "We hebben ook een informatieve video gemaakt voor u.",
        type: "text",
      },
      {
        message: "https://uwvvod.download.kpnstreaming.nl/uwvvideo/inkomsten-opgeven-eerste-keer/MP4/inkomsten-opgeven-eerste-keer.mp4",
        type: "video",
      }
    ]},

  {meta: "dagloon", exclusive: true, matching: [
      "Hoe wordt de hoogte van mijn dagloon berekend?",
      "Hoeveel uitkering kan ik verwachten te krijgen?",
    ], response: [
      {
        message: "Voor het berekenen van uw dagloon kijken we naar het sv-loon dat u verdiende in een periode van een jaar voordat u werkloos werd.",
        type: "",
      },
      {
        message: "Met de volgende tool kunt u zelf berekenen hoe hoog uw WW-uitkering zal kunnen worden.",
        type: "",
      },
      {
        message: "https://responsive.uwvwidget.nl/htmlwidgets/embed/55797a56-8260-4daf-bb10-7945d91a7b43/widget.html",
        type: "iframe",
      }
    ]},

  {meta: "wanneer", exclusive: true, matching: [
      "Wanneer kan ik een ww-uitkering aanvragen?",
    ], response: [
      {
        message: "U kunt dat vanaf 1 week voordat u werkloos wordt en een tot uiterlijk 1 week na uw laatste werkdag doen.",
        type: "text",
      },
      {
        message: "Doet u dit later? Dan krijgt u tijdelijk een lagere uitkering.",
        type: "text",
      },
    ]},

  {meta: "hoelang", exclusive: true, matching: [
      "Hoelang heb ik recht op een ww-uitkering?",
    ], response: [
      {
        message: "Voor ieder volledig kalenderjaar arbeidsverleden heeft u recht op 1 of 0.5 maand uitkering.",
        type: "text",
      },
      {
        message: "Uw totale arbeidsverleden vindt u op Mijn UWV onder <a target=\"uwvFrame\" href=\"https://werknemer-portaal.uwv.nl/mijnuwv/PersoonlijkeGegevens\">Mijn persoonlijke gegevens<\a>. U kunt de duur daar ook zelf berekenen.",
        type: "text",
      }
    ]},

  {meta: "aanvragen", exclusive: true, matching: [
      "Hoe kan ik een ww-uitkering aanvragen?",
      "Wat moet ik doen om een ww-uitkering te krijgen?",
    ], response: [
      {
        message: "U kunt uw WW-uitkering online aanvragen.",
        type: "text",
      },
      {
        message: "Hier heeft u onder andere een DigiD voor nodig.",
        type: "text",
      },
      {
        message: "<a target=\"uwvFrame\" href=\"https://www.uwv.nl/particulieren/direct-doen/aanvragen-ww-uitkering.aspx\">Klik hier om naar het ww-aanvraag formulier te gaan.<a>",
        type: "text",
      }
    ]},

  {meta: "eerstebetaling", exclusive: true, matching: [
      "Wanneer krijg ik de eerste betaling van mijn ww-uitkering?",
    ], response: [
      {
        message: "Wij betalen de uitkering binnen 10 kalenderdagen nadat wij het formulier Inkomstenopgave hebben ontvangen. Daarna duurt het meestal nog 3 dagen voordat het bedrag op uw rekening staat.",
        type: "text",
      },
      {
        message: "Houd er rekening mee dat de eerste betaling van uw uitkering langer kan duren.",
        type: "text",
      },
      {
        message: "We hebben ook een informatieve video gemaakt voor u.",
        type: "text",
      },
      {
        message: "https://uwvvod.download.kpnstreaming.nl/uwvvideo/inkomsten-opgeven-eerste-keer/MP4/inkomsten-opgeven-eerste-keer.mp4",
        type: "video",
      }
    ]},

  {meta: "raakkwijt", exclusive: true, matching: [
      "Ik raak binnenkort mogelijk mijn baan kwijt.",
      "Wat moet ik doen als ik werkloos wordt?",
      "Ik wordt werkloos.",
    ], response: [
      {
        message: "Dat is vervelend om te horen.",
        type: "text",
      },
      {
        message: "Uw beste optie is om direct een nieuwe baan te vinden.",
        type: "text",
      },
      {
        message: "Lukt dit niet, dan kunt u een WW-uitkering aanvragen bij UWV.",
        type: "text",
      }
    ]}
];
