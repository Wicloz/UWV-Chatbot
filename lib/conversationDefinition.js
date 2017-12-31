annoyedFactorTheshold = 3;
scoreThreshold = 0.2;
wordsPerMinute = 160;

currentTimeGreeting = function() {
  const hours = (new Date()).getHours();
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

preprocessSplitWords = [
  "hoe vaak",
  "hoe lang",
];

preprocessPasteWords = [];

extraDictionaryWords = [
  "DigiD",
  "Alex",
  "Iris",
  "Jelger",
];

conversationGreeting = [
  {
    message: "%currentTimeGreeting%, ik ben uw virtuele assistent %characterName%.",
    type: "text",
    meta: ["groet"],
  },
  {
    message: "Ik zal U proberen te helpen wanneer de medewerkers niet beschikbaar zijn.",
    type: "text",
    meta: ["groet"],
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

conversationMore = [
  {
    message: "Heeft u verder nog vragen?",
    type: "text",
    meta: ["verder"],
  }
];

conversationDefinition = [
  {meta: "dank", exclusive: false, askMore: false, matching: [
      "bedankt",
      "dank",
      "dankjewel",
      "dankuwel",
    ], response: [
      {
        message: "Graag gedaan.",
        type: "text",
      }
    ]},

  {meta: "groet", exclusive: false, askMore: false, matching: [
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
        message: "%currentTimeGreeting%.",
        type: "text",
      }
    ]},

  {meta: "vaarwel", exclusive: false, askMore: false, matching: [
      "doei",
      "bye",
      "vaarwel",
      "fijne dag",
    ], response: [
      {
        message: "Ik wens u ook een fijne dag verder en veel success.",
        type: "text",
      }
    ]},

  {meta: "klaar", exclusive: true, askMore: false, matching: [
      "Ik ben voldoende geholpen.",
      "Ik heb verder geen vragen meer.",
    ], response: [
      {
        message: "Hopelijk heb ik u hiermee voldoende kunnen informeren.",
        type: "text",
      }
    ]},

  {meta: "help", exclusive: false, askMore: false, matching: [
      "hulp",
      "help",
      "vraag",
      "vragen",
    ], response: [
      {
        message: "Stel een vraag en ik zal mijn best doen hem te beantwoorden.",
        type: "text",
      }
    ]},

  {meta: "voorwaarden", exclusive: true, askMore: true, matching: [
      "Welke voorwaarden zijn er om een WW-uitkering te krijgen?",
      "Mag ik een WW-uitkering krijgen?",
      "Waneer heb ik recht op WW-uitkering?",
    ], response: [
      {
        message: "Als u werkloos wordt en" +
                 "<ul>" +
                 "<li>verzekerd voor werkloosheid</li>" +
                 "<li>verlies van minimaal 5 uren per week</li>" +
                 "<li>direct beschikbaar voor betaald werk</li>" +
                 "<li>in laatste 36 weken voordat u werkloos werd minstens 26 weken gewerkt</li>" +
                 "<li>geen schuld aan werkloosheid</li>" +
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

  {meta: "weerwerken", exclusive: true, askMore: true, matching: [
      "Ik ga weer werken. Hoe wordt dit verrekend?",
      "Wat als ik weer ga werken?",
      "Hoe beïnvloed werken mijn WW-uitkering?",
      "Wanneer krijg ik geen uitkering meer?",
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

  {meta: "inkomstenopgave", exclusive: true, askMore: true, matching: [
      "Wat is het formulier Inkomstenopgave?",
      "Hoe vul ik het formulier Inkomstenopgave de eerste keer in?",
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

  {meta: "dagloon", exclusive: true, askMore: true, matching: [
      "Hoe wordt de hoogte van mijn dagloon berekend?",
      "Hoeveel uitkering kan ik verwachten te krijgen?",
      "Hoeveel uitkering krijg ik?",
    ], response: [
      {
        message: "Voor het berekenen van uw dagloon kijken we naar het sv-loon dat u verdiende in een periode van een jaar voordat u werkloos werd.",
        type: "text",
      },
      {
        message: "Met de volgende tool kunt u zelf berekenen hoe hoog uw WW-uitkering zal kunnen worden.",
        type: "text",
      },
      {
        message: "https://responsive.uwvwidget.nl/htmlwidgets/embed/55797a56-8260-4daf-bb10-7945d91a7b43/widget.html",
        type: "iframe",
      }
    ]},

  {meta: "svloon", exclusive: true, askMore: true, matching: [
      "Wat is het sv-loon?",
      "Hoeveel sv-loon heb ik verdiend?",
      "sv-loon",
    ], response: [
      {
        message: "Het sv-loon (sociale verzekeringsloon) is het loon waarover u belastingen en sociale premies heeft betaald.",
        type: "text",
      }
    ]},

  {meta: "digid", exclusive: true, askMore: true, matching: [
      "Wat is een DigiD?",
      "Hoe kan ik een DigiD krijgen?",
      "DigiD",
    ], response: [
      {
        message: "DigiD staat voor Digitale identiteit. Met uw DigiD kunt u inloggen op websites van de overheid en in de zorg. Zo weten organisaties wie u bent.",
        type: "text",
      },
      {
        message: "U kunt dit aanvragen via <a target=\"_blank\" href=\"https://digid.nl/aanvragen\">de website van DigiD</a>.",
        type: "text",
      }
    ]},

  {meta: "wanneer", exclusive: true, askMore: true, matching: [
      "Wanneer kan ik een WW-uitkering aanvragen?",
      "laatste werkdag",
      "contract niet verlengt",
    ], response: [
      {
        message: "U kunt een WW-aanvraag doen vanaf 1 week voordat u werkloos wordt en tot uiterlijk 1 week na uw laatste werkdag.",
        type: "text",
      },
      {
        message: "Doet u dit later? Dan krijgt u tijdelijk een lagere uitkering.",
        type: "text",
      },
    ]},

  {meta: "verleden", exclusive: true, askMore: true, matching: [
      "Waar vind ik mijn totale arbeidsverleden?",
      "Hoe bepaalt mijn arbeidsverleden mijn WW-uitkering?",
    ], response: [
      {
        message: "Voor ieder volledig kalenderjaar arbeidsverleden heeft u recht op 1 of 0,5 maand WW-uitkering.",
        type: "text",
      },
      {
        message: "Uw totale arbeidsverleden vindt u op Mijn UWV onder <a class=\"btn-close\" target=\"uwvFrame\" href=\"https://werknemer-portaal.uwv.nl/mijnuwv/PersoonlijkeGegevens\">Mijn persoonlijke gegevens<\a>. U kunt de duur daar ook zelf berekenen.",
        type: "text",
      }
    ]},

  {meta: "hoelang1", exclusive: true, askMore: false, matching: [
      "Heb ik recht op 1 of 0,5 maand WW-uitkering per jaar?",
      "Hoelang krijg ik een WW-uitkering?",
      "Hoelang duurt mijn WW-uitkering?",
    ], response: [
      {
        message: "Heeft u 10 jaar of minder dan 10 jaar arbeidsverleden?",
        type: "text",
      }
    ]},

  {meta: "hoelang2", exclusive: true, askMore: false, matching: [
      "Ik heb minder dan 10 jaar arbeidsverleden.",
    ], response: [
      {
        message: "Voor ieder volledig kalenderjaar aan arbeidsverleden heeft u recht op 1 maand WW-uitkering.",
        type: "text",
      }
    ]},

  {meta: "hoelang3", exclusive: true, askMore: false, matching: [
      "Ik heb meer dan 10 jaar arbeidsverleden.",
    ], response: [
      {
        message: "Voor alle volledige kalenderjaren aan arbeidsverleden voor 1 januari 2016 heeft u recht op 1 maand WW-uitkering.",
        type: "text",
      },
      {
        message: "Voor alle volledige kalenderjaren aan arbeidsverleden vanaf 1 januari 2016 heeft u recht op 0,5 maand WW-uitkering.",
        type: "text",
      }
    ]},

  {meta: "ja", exclusive: true, askMore: true, matching: [
      "ja",
      "minder",
    ], response: [
      {
        type: "trigger",
        from: "hoelang1",
        to: "hoelang2",
      },
      {
        type: "trigger",
        from: "verder",
        to: "help",
      },
      {
        type: "trigger",
        from: "klaar",
        to: "vaarwel",
      }
    ]},

  {meta: "nee", exclusive: true, askMore: true, matching: [
      "nee",
      "niet",
      "meer",
    ], response: [
      {
        type: "trigger",
        from: "hoelang1",
        to: "hoelang3",
      },
      {
        type: "trigger",
        from: "verder",
        to: "klaar",
      },
      {
        type: "trigger",
        from: "klaar",
        to: "help",
      }
    ]},

  {meta: "aanvragen", exclusive: true, askMore: true, matching: [
      "Hoe kan ik een WW-uitkering aanvragen?",
      "Wat moet ik doen om een WW-uitkering te krijgen?",
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
        message: "<a class=\"btn-close\" target=\"uwvFrame\" href=\"https://www.uwv.nl/particulieren/direct-doen/aanvragen-WW-uitkering.aspx\">Klik hier om naar het WW-aanvraag formulier te gaan.<a>",
        type: "text",
      }
    ]},

  {meta: "nodig", exclusive: true, askMore: true, matching: [
      "Wat heb ik nog meer nodig?",
      "Wat heb ik allemaal nodig om een WW-uitkering te krijgen?",
    ], response: [
      {
        message: "Om een WW-uitkering aan te vragen heeft u een DigiD nodig.",
        type: "text",
      },
      {
        message: "Daarnaast heeft u nog een aantal gegevens nodig. Veel van uw gegevens zijn bij ons al bekend.",
        type: "text",
      },
      {
        message: "Houd in ieder geval de volgende stukken bij de hand:" +
                 "<ul>" +
                 "<li>uw laatste loonstrook</li>" +
                 "<li>uw laatste arbeidscontract</li>" +
                 "<li>uw rekeningnummer</li>" +
                 "</ul>",
        type: "text",
      }
    ]},

  {meta: "betaling", exclusive: true, askMore: true, matching: [
      "Wanneer krijg ik de eerste betaling van mijn WW-uitkering?",
      "Wanneer krijg ik mijn WW-uitkering?",
      "Wanneer wordt mijn WW-uitkering overgemaakt?",
    ], response: [
      {
        message: "Wij betalen uw WW-uitkering na afloop van iedere kalendermaand.",
        type: "text",
      },
      {
        message: "Wij betalen de uitkering binnen 10 kalenderdagen nadat wij het formulier Inkomstenopgave hebben ontvangen. Daarna duurt het meestal nog 3 dagen voordat het bedrag op uw rekening staat.",
        type: "text",
      },
      {
        message: "Houd er rekening mee dat de eerste betaling van uw uitkering langer kan duren.",
        type: "text",
      }
    ]},

  {meta: "raakkwijt", exclusive: true, askMore: true, matching: [
      "Ik raak binnenkort mogelijk mijn baan kwijt.",
      "Wat moet ik doen als ik werkloos wordt?",
      "Ik wordt werkloos.",
    ], response: [
      {
        message: "Wij zijn hier om u daarmee verder te helpen.",
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
