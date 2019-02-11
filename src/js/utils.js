ZLCommon = {
  ReplaceAll: function (value, find, replacement) {
    return value.split(find).join(replacement);
  },

  ToStringNoNull: function (val) {
    if (val === null) {
      return '';
    }
    return val;
  },

  GetPascalCase: function (str) {
    var res = $.trim(str);
    var bits = res.split(' ');
    var words = [];
    for (var i = 0; i < bits.length; i++) {
      var word = bits[i];
      if (word.length > 0) {
        word = word.toLowerCase();
        word = word[0].toUpperCase() + word.substring(1);
        words.push(word);
      }
    }
    return words.join('');
  },

  PadZeros: function (value, length) {
    var str = value + '';
    while (str.length < length) str = '0' + str;
    return str;
  },

  GetCamelCase: function (str) {
    var pCase = this.GetPascalCase(str);
    return pCase[0].toLowerCase() + pCase.substr(1);
  },

  NumberWithCommas: function (value, character) {
    if (character === undefined) {
      character = ',';
    }
    var parts = value.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, character);
    return parts.join('.');
  },

  GetCurrencyFormat: function (value, currenyType) {
    value = parseFloat(value);

    var isNegative = false;
    if (value < 0) {
      value = Math.abs(value);
      isNegative = true;
    }

    var textValue = value.toString();
    switch (currenyType) {
      case 3: //JPY
        textValue = '¥' + ZLCommon.NumberWithCommas(value.toFixed(0));
        break;
      case 10: //KRW
        textValue = '₩' + ZLCommon.NumberWithCommas(value.toFixed(0));
        break;
      case 4: //EURO
        textValue = ZLCommon.NumberWithCommas(value.toFixed(2), ' ').replace('.', ',') + ' €';
        break;
      case 15: // THB
        textValue = '฿' + ZLCommon.NumberWithCommas(value.toFixed(0));
        break;
      case 11: // GBP
        textValue = '£' + ZLCommon.NumberWithCommas(value.toFixed(2));
        break;
      case 16: // EUR
        textValue = '€' + ZLCommon.NumberWithCommas(value.toFixed(2));
        break;
      case 17:
        textValue = ZLCommon.NumberWithCommas(value.toFixed(2)) + ' ر.س';
        break;
      case 18:
        textValue = ZLCommon.NumberWithCommas(value.toFixed(2)) + ' ر.ق';
        break;
      default:
        textValue = '$' + ZLCommon.NumberWithCommas(value.toFixed(2));
        break;
    }

    if (isNegative) {
      textValue = '-' + textValue;
    }
    return textValue;
  },

  Debounce: function (func, wait, immediate) {
    var timeout;
    return function () {
      var context = this,
        args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  },

  ShowLoader: function (show) {
    if (show) {
      $('#FullLoader').addClass('show');
    } else {
      $('#FullLoader').removeClass('show');
    }
  },
  GotoStep: function (sectionId) {
    location.hash = sectionId;
    $('.wizard-section').removeClass('current-section');
    $('#' + sectionId).addClass('current-section');
    $('html,body').scrollTop(0);

    if (typeof Analytics !== "undefined") {
      Analytics.setSPAPageRel('/' + sectionId);
    }
  }
  
};

