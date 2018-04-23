'use strict';

// A valid output which mean nothing has been parsed.
// Used as error return / invalid output
const nothingHappend = {
  prop: {
    key: undefined,
    class: undefined,
    id: undefined,
  },
  eaten: '',
};

// Main function
function parse(value, indexNext = 0) {
  let letsEat = '';
  let stopOnBrace = false;
  let errorDetected = false;

  const prop = {key: undefined /* {} */, class: undefined /* [] */, id: undefined};

  /* They is at leat one label and at best two */
  /* ekqsdf <- one label
   * qsdfqsfd=qsdfqsdf <- two */
  let labelFirst = '';
  let labelSecond;

  /* 3 types :
   * .azcv <- class
   * #poi <- id
   * dfgh=zert <- key
   * lkj <- this is also a key but with a undefined value
   */
  let type;
  const forbidenCharacters = '\n\r{}';

  // A function that detect if it's time to end the parsing
  const shouldStop = () => {
    if (indexNext >= value.length || forbidenCharacters.indexOf(value[indexNext]) > -1) {
      if (stopOnBrace && value[indexNext] !== '}') {
        errorDetected = true;
      }
      return true;
    }
    return value[indexNext] === '}' && stopOnBrace;
  };

  let eaten = '';
  // Couple of functions that parse same kinds of characters
  // Used to parse spaces or identifiers
  const eat = chars => {
    eaten = '';

    while (indexNext < value.length &&
            forbidenCharacters.indexOf(value.charAt(indexNext)) < 0 &&
            chars.indexOf(value.charAt(indexNext)) >= 0) {
      letsEat += value.charAt(indexNext);
      eaten += value.charAt(indexNext);
      indexNext++;
    }

    return shouldStop();
  };
  const eatUntil = (chars, shouldSave) => {
    eaten = '';

    while (indexNext < value.length &&
            forbidenCharacters.indexOf(value.charAt(indexNext)) < 0 &&
            chars.indexOf(value.charAt(indexNext)) < 0) {
      letsEat += value.charAt(indexNext);
      eaten += value.charAt(indexNext);
      indexNext++;
    }

    // Ugly but keep the main loop readable
    if (shouldSave) {
      if (labelFirst) {
        labelSecond = eaten;
      } else {
        labelFirst = eaten;
      }
    }

    return shouldStop();
  };

  const eatInQuote = quote => {
    eaten = '';
    if (value[indexNext] === quote) {
      return;
    }

    while (indexNext < value.length &&
          !(quote === value[indexNext] && value[indexNext - 1] !== '\\') &&
          value[indexNext] !== '\n' && value[indexNext] !== '\r') {
      letsEat += value.charAt(indexNext);
      eaten += value.charAt(indexNext);
      indexNext++;
    }
    if (value[indexNext] === '\n' || value[indexNext] === '\r' || indexNext >= value.length) {
      errorDetected = true;
      return true;
    }

    // Ugly but keep the main loop readable
    if (labelFirst) {
      labelSecond = eaten.replace(/\\"/g, '"');
    } else {
      labelFirst = eaten.replace(/\\"/g, '"');
    }

    return shouldStop();
  };

  // It's realy commun to eat only one character so let's make it a function
  const eatOne = c => {
    letsEat += c;
    indexNext++;
    return shouldStop();
  };

  const addAttribute = () => {
    switch (type) {
      case 'id': // ID
        prop.id = prop.id || labelFirst;
        break;
      case 'class':
        if (!prop.class) {
          prop.class = [];
        }

        if (prop.class.indexOf(labelFirst) < 0) {
          prop.class.push(labelFirst);
        }

        break;
      case 'key':
        if (!labelFirst) {
          return nothingHappend;
        }
        if (labelFirst !== 'id' && labelFirst !== 'class') {
          prop[labelFirst] = labelSecond;
        }
        break;
      default:
    }
    type = undefined;
    labelFirst = '';
    labelSecond = undefined;
  };

  /** *********************** Start parsing ************************ */

  // Let's check for trelling spaces first
  eat(' \t\v');

  if (value[indexNext] === '{') {
    eatOne('{');
    stopOnBrace = true;
  }

  while (!shouldStop()) {
    if (eat(' \t\v')) {
      break;
    }

    if (value.charAt(indexNext) === '.') { // Classes
      type = 'class';
      if (eatOne('.')) {
        errorDetected = true;
        break;
      }
    } else if (value.charAt(indexNext) === '#') { // ID
      type = 'id';
      if (eatOne('#')) {
        errorDetected = true;
        break;
      }
    } else { // Key
      type = 'key';
    }

    // Extract name
    if (eatUntil('=\t\b\v  ', true) || !labelFirst) {
      break;
    }
    if (value.charAt(indexNext) === '=' && type === 'key') { // Set labelSecond
      if (eatOne('=')) {
        break;
      }

      if (value.charAt(indexNext) === '"') {
        if (eatOne('"')) {
          break;
        }

        if (eatInQuote('"')) {
          break;
        }

        if (value.charAt(indexNext) === '"') {
          if (eatOne('"')) {
            break;
          }
        } else {
          return nothingHappend;
        }
      } else if (value.charAt(indexNext) === '\'') {
        if (eatOne('\'')) {
          break;
        }
        if (eatInQuote('\'')) {
          break;
        }

        if (value.charAt(indexNext) === '\'') {
          if (eatOne('\'')) {
            break;
          }
        } else {
          return nothingHappend;
        }
      } else if (eatUntil(' \t\n\r\v=}', true)) {
        break;
      }
    }

    // Add the parsed attribute to the output prop with the ad hoc type
    addAttribute();
  }
  addAttribute();
  if (stopOnBrace) {
    if (indexNext < value.length && value[indexNext] === '}') {
      stopOnBrace = false;
      eatOne('}');
    } else {
      return nothingHappend;
    }
  }

  if (errorDetected) {
    return nothingHappend;
  }

  return {prop, eaten: letsEat};
}

module.exports = parse;
