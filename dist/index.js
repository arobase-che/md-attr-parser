'use strict'; // A valid output which means nothing has been parsed.
// Used as error return / invalid output

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var nothingHappend = {
  prop: {},
  eaten: ''
};
var defaultConfig = {
  defaultValue: function defaultValue() {
    return undefined;
  } // Its a function

}; // Main function

function parse(value, indexNext, userConfig) {
  var letsEat = '';
  var stopOnBrace = false;
  var errorDetected = false;

  var config = _objectSpread({}, defaultConfig, userConfig); // Make defaultValue a function if it isn't


  if (typeof config.defaultValue !== 'function') {
    var defaultValue = config.defaultValue;

    config.defaultValue = function () {
      return defaultValue;
    };
  }

  var prop = {};
  /* They are at least one label and at best two */

  /* ekqsdf <- one label
   * qsdfqsfd=qsdfqsdf <- two */

  var labelFirst = '';
  var labelSecond;

  if (indexNext === undefined) {
    indexNext = 0;
  }
  /* 3 types :
   * .azcv <- class
   * #poi <- id
   * dfgh=zert <- key
   * jkj <- this is also a key but with a user defined value (default is undefined)
   * jkj= <- this is also a key but with a empty value
   */


  var type;
  var forbidenCharacters = '\n\r{}'; // A function that detect if it's time to end the parsing

  var shouldStop = function shouldStop() {
    if (indexNext >= value.length || forbidenCharacters.indexOf(value[indexNext]) > -1) {
      if (stopOnBrace && value[indexNext] !== '}') {
        errorDetected = true;
      }

      return true;
    }

    return value[indexNext] === '}' && stopOnBrace;
  };

  var eaten = ''; // Couple of functions that parse same kinds of characters
  // Used to parse spaces or identifiers

  var eat = function eat(chars) {
    eaten = '';

    while (indexNext < value.length && forbidenCharacters.indexOf(value.charAt(indexNext)) < 0 && chars.indexOf(value.charAt(indexNext)) >= 0) {
      letsEat += value.charAt(indexNext);
      eaten += value.charAt(indexNext);
      indexNext++;
    }

    return shouldStop();
  };

  var eatUntil = function eatUntil(chars) {
    eaten = '';

    while (indexNext < value.length && forbidenCharacters.indexOf(value.charAt(indexNext)) < 0 && chars.indexOf(value.charAt(indexNext)) < 0) {
      letsEat += value.charAt(indexNext);
      eaten += value.charAt(indexNext);
      indexNext++;
    } // Ugly but keep the main loop readable
    // Set the label it should set


    if (labelFirst) {
      labelSecond = eaten;
    } else {
      labelFirst = eaten;
    }

    return shouldStop();
  }; // In quote, every character is valid except the unescaped quotes and CR or LF
  // Same function for single and double quote


  var eatInQuote = function eatInQuote(quote) {
    eaten = ''; // First check so value[indexNext-1] will always be valid

    if (value[indexNext] === quote) {
      return;
    }

    while (indexNext < value.length && !(quote === value[indexNext] && value[indexNext - 1] !== '\\') && value[indexNext] !== '\n' && value[indexNext] !== '\r') {
      letsEat += value.charAt(indexNext);
      eaten += value.charAt(indexNext);
      indexNext++;
    } // If we encounter an EOL, there is an error
    // We are waiting for a quote


    if (value[indexNext] === '\n' || value[indexNext] === '\r' || indexNext >= value.length) {
      errorDetected = true;
      return true;
    } // Ugly but keep the main loop readable


    if (labelFirst) {
      labelSecond = eaten.replace(/\\"/g, '"');
    } else {
      labelFirst = eaten.replace(/\\"/g, '"');
    }

    return shouldStop();
  }; // It's really common to eat only one character so let's make it a function


  var eatOne = function eatOne(c, skipStopCheck) {
    // Miam !
    letsEat += c;
    indexNext++;
    return skipStopCheck ? false : shouldStop();
  }; // Common parsing of quotes


  var eatQuote = function eatQuote(q) {
    eatOne(q, true);
    eatInQuote(q, true);

    if (value.charAt(indexNext) !== q) {
      return nothingHappend;
    }

    if (eatOne(q)) {
      return -1;
    }
  };

  var idSetByKey = false;

  var addAttribute = function addAttribute() {
    switch (type) {
      case 'id':
        // ID
        if (idSetByKey) {
          prop.id = labelFirst;
          idSetByKey = false;
        } else {
          prop.id = prop.id || labelFirst;
        }

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

        if (!(labelFirst in prop)) {
          if (labelSecond === undefined) {
            // Here, we have an attribute without value
            // so it's user defined
            prop[labelFirst] = config.defaultValue(labelFirst);
          } else {
            prop[labelFirst] = labelFirst === 'class' ? [labelSecond] : labelSecond;
          }

          if (labelFirst === 'id') {
            idSetByKey = true;
          }
        } else if (labelFirst === 'class' && Boolean(labelSecond)) {
          prop.class.push(labelSecond);
        }

        break;

      default:
    }

    type = undefined;
    labelFirst = '';
    labelSecond = undefined;
  };
  /** *********************** Start parsing ************************ */
  // Let's check for leading spaces first


  eat(' \t\v');

  if (value[indexNext] === '{') {
    eatOne('{');
    stopOnBrace = true;
  }

  while (!shouldStop()) {
    // Main loop which extract attributes
    if (eat(' \t\v')) {
      break;
    }

    if (value.charAt(indexNext) === '.') {
      // Classes
      type = 'class';

      if (eatOne('.')) {
        errorDetected = true;
        break;
      }
    } else if (value.charAt(indexNext) === '#') {
      // ID
      type = 'id';

      if (eatOne('#')) {
        errorDetected = true;
        break;
      }
    } else {
      // Key
      type = 'key';
    } // Extract name


    if (eatUntil('=\t\b\v  ') || !labelFirst) {
      break;
    }

    if (value.charAt(indexNext) === '=' && type === 'key') {
      // Set labelSecond
      if (eatOne('=')) {
        break;
      }

      if (value.charAt(indexNext) === '"') {
        var ret = eatQuote('"');

        if (ret === -1) {
          break;
        } else if (ret === nothingHappend) {
          return nothingHappend;
        }
      } else if (value.charAt(indexNext) === '\'') {
        var _ret = eatQuote('\'');

        if (_ret === -1) {
          break;
        } else if (_ret === nothingHappend) {
          return nothingHappend;
        }
      } else if (eatUntil(' \t\n\r\v=}')) {
        break;
      }
    } // Add the parsed attribute to the output prop with the ad hoc type


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

  return errorDetected ? nothingHappend : {
    prop: prop,
    eaten: letsEat
  };
}

module.exports = parse;