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
