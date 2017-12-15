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

Array.prototype.equals = function(array) {
  if (!array || this.length !== array.length) {
    return false;
  }

  for (let i = 0; i < this.length; i++) {
    if (this[i] instanceof Array && array[i] instanceof Array) {
      if (!this[i].equals(array[i])) {
        return false;
      }
    }
    else if (this[i] !== array[i]) {
      return false;
    }
  }

  return true;
};

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};
