DateManager = {
  // Months and weekdays
  FullMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ShortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  FullWeekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ShortWeekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  VeryShortWeekdays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  i: null,
  m: null,

  PadZeros: function (value, length) {
      var isNegative = value < 0;
      var str = value + '';
      str = str.replace('-', '');
      while (str.length < length) str = '0' + str;

      if (isNegative) {
          str = '-' + str;
      }
      return str;
  },

  RepeatChar: function (character, count) {
      var str = '';
      for (var i = 0; i < count; i++) {
          str += character;
      }
      return str;
  },

  Parse: function (value, format) {
      var index = 0;
      var replaceChar = '#';
      var tempFormat = format;

      if (value) {
          value = value.toString();
      }

      parseReplaceNumber = function (singleFormat, doubleFormat) {
          index = tempFormat.indexOf(doubleFormat);
          if (index !== -1) {
              // still parse for single values if the values suggests
              index = tempFormat.indexOf(doubleFormat);
              if (index !== -1) {
                  if (index < value.length && value[index + 1].match(/[0-9]/) !== null) {
                      tempFormat = tempFormat.replace(doubleFormat, DateManager.RepeatChar(replaceChar, 2));
                      return parseInt(value.substr(index, 2));
                  }
                  else {
                      tempFormat = tempFormat.replace(doubleFormat, replaceChar);
                      return parseInt(value.substr(index, 1));
                  }
              }
          }
          else {
              index = tempFormat.indexOf(singleFormat);
              if (index !== -1) {
                  if (index < value.length && value[index + 1].match(/[0-9]/) !== null) {
                      tempFormat = tempFormat.replace(singleFormat, DateManager.RepeatChar(replaceChar, 2));
                      return parseInt(value.substr(index, 2));
                  }
                  else {
                      tempFormat = tempFormat.replace(singleFormat, replaceChar);
                      return parseInt(value.substr(index, 1));
                  }
              }
          }

          return null;
      };

      var current = new Date();
      var dateConstruct = {
          year: current.getFullYear(),
          month: current.getMonth(),
          date: current.getDate(),
          hour: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0
      };

      // Weekday
      index = tempFormat.indexOf('dddd');
      if (index !== -1) {
          for (i = 0; i < DateManager.FullWeekdays.length; i++) {
              var weekdayStr = value.substr(index, DateManager.FullWeekdays[i].length).toLowerCase();
              if (weekdayStr === DateManager.FullWeekdays[i].toLowerCase()) {
                  tempFormat = tempFormat.replace('dddd', DateManager.RepeatChar(replaceChar, weekdayStr.length));
                  break;
              }
          }
      }
      tempFormat = tempFormat.replace('ddd', DateManager.RepeatChar(replaceChar, 3));

      // Date
      var d = parseReplaceNumber('d', 'dd');
      if (d !== null) {
          dateConstruct.date = d;
      }

      // Month
      index = tempFormat.indexOf('MMMM');
      if (index !== -1) {
          for (i = 0; i < DateManager.ShortMonths.length; i++) {
              var monthValStr = value.substr(index, DateManager.FullMonths[i].length).toLowerCase();
              if (monthValStr === DateManager.FullMonths[i].toLowerCase()) {
                  dateConstruct.month = i;
                  tempFormat = tempFormat.replace('MMMM', DateManager.RepeatChar(replaceChar, monthValStr.length));
                  break;
              }
          }
      }
      else {
          index = tempFormat.indexOf('MMM');
          if (index !== -1) {
              monthValStr = value.substr(index, 3).toLowerCase();
              for (i = 0; i < DateManager.ShortMonths.length; i++) {
                  if (monthValStr === DateManager.ShortMonths[i].toLowerCase()) {
                      dateConstruct.month = i;
                      tempFormat = tempFormat.replace('MMM', DateManager.RepeatChar(replaceChar, 3));
                      break;
                  }
              }
          }
          else {
              m = parseReplaceNumber('M', 'MM');
              if (m !== null) {
                  dateConstruct.month = m;
                  dateConstruct.month -= 1;
              }
          }
      }

      // Year
      index = tempFormat.indexOf('yyyy');
      if (index !== -1) {
          dateConstruct.year = parseInt(value.substr(index, 4));
          tempFormat = tempFormat.replace('yyyy', DateManager.RepeatChar(replaceChar, 4));
      }

      // Hour 24
      var h = parseReplaceNumber('H', 'HH');
      if (h !== null) {
          dateConstruct.hour = h;
      }

      // Hour 12
      h = parseReplaceNumber('h', 'hh');
      if (h !== null) {
          dateConstruct.hour = h;
      }

      // AM / PM
      index = tempFormat.indexOf('tt');
      if (index !== -1) {
          if (value.substr(index, 2).toLowerCase() === 'pm') {
              dateConstruct.hour += 12;
              tempFormat = tempFormat.replace('tt', DateManager.RepeatChar(replaceChar, 2));
          }
      }
      index = tempFormat.indexOf('t');
      if (index !== -1) {
          if (value.substr(index, 1).toLowerCase() === 'p') {
              dateConstruct.hour += 12;
              tempFormat = tempFormat.replace('t', replaceChar);
          }
      }

      // Minutes
      m = parseReplaceNumber('m', 'mm');
      if (m !== null) {
          dateConstruct.minutes = m;
      }

      // Seconds
      var s = parseReplaceNumber('s', 'ss');
      if (s !== null) {
          dateConstruct.seconds = s;
      }

      var date = new Date(dateConstruct.year, dateConstruct.month, dateConstruct.date, dateConstruct.hour, dateConstruct.minutes, dateConstruct.seconds, dateConstruct.milliseconds);

      //console.log(value + '(' + format + ' => ' + tempFormat + ')');
      //console.log(dateConstruct);
      //console.log(date);

      return date;
  },

  Format: function (value, format, useUtc) {
      if (!(value instanceof Date)) {
          return null;
      }

      var fullYear = value.getFullYear();
      var month = value.getMonth();
      var date = value.getDate();
      var hours = value.getHours();
      var minutes = value.getMinutes();
      var seconds = value.getSeconds();
      var milliseconds = value.getMilliseconds();
      var day = value.getDay();

      if (useUtc === true) {
          fullYear = value.getUTCFullYear();
          month = value.getUTCMonth();
          date = value.getUTCDate();
          hours = value.getUTCHours();
          minutes = value.getUTCMinutes();
          seconds = value.getUTCSeconds();
          milliseconds = value.getUTCMilliseconds();
          day = value.getUTCDay();
      }

      var str = format;

      // year
      str = str.replace('yyyy', fullYear);
      str = str.replace('yy', fullYear.toString().substr(2, 2));

      // Month
      str = str.replace('MMMM', '@@@@');
      str = str.replace('MMM', '@@@');
      str = str.replace('MM', DateManager.PadZeros(month + 1, 2));
      str = str.replace('M', month + 1);

      // Day of week
      str = str.replace('dddd', '####');
      str = str.replace('ddd', '###');

      // Date
      str = str.replace('dd', DateManager.PadZeros(date, 2));
      str = str.replace('d', date);

      // Hours
      str = str.replace('HH', DateManager.PadZeros(hours, 2));
      str = str.replace('H', hours);

      var hour12 = hours;
      var amPm = 'AM';
      if (hour12 >= 12) {
          amPm = 'PM';
          if (hour12 > 12) {
              hour12 -= 12;
          }
      }

      if (hour12 === 0) {
          hour12 = 12;
      }
      str = str.replace('hh', DateManager.PadZeros(hour12, 2));
      str = str.replace('h', hour12);

      str = str.replace('tt', amPm);
      str = str.replace('t', amPm.substr(0, 1));

      // Minutes
      str = str.replace('mm', DateManager.PadZeros(minutes, 2));
      str = str.replace('m', minutes);

      // Minutes
      str = str.replace('ss', DateManager.PadZeros(seconds, 2));
      str = str.replace('s', seconds);

      str = str.replace('ffff', DateManager.PadZeros(milliseconds, 4));
      str = str.replace('fff', DateManager.PadZeros(milliseconds, 4).substr(0, 3));
      str = str.replace('ff', DateManager.PadZeros(milliseconds, 4).substr(0, 2));
      str = str.replace('f', milliseconds);

      str = str.replace('####', DateManager.FullWeekdays[day]);
      str = str.replace('###', DateManager.ShortWeekdays[day]);

      str = str.replace('@@@@', DateManager.FullMonths[month]);
      str = str.replace('@@@', DateManager.ShortMonths[month]);

      return str;
  },

  UtcNow: function () {
      var now = new Date();
      return new Date(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          now.getUTCHours(),
          now.getUTCMinutes(),
          now.getUTCSeconds(),
          now.getUTCMilliseconds());
  },

  UtcNowOffset: function (offsetHours) {
      if (offsetHours === undefined) {
          offsetHours = 0;
      }
      return DateManager.Add(DateManager.UtcNow(), { hours: offsetHours });
  },

  Add: function (date, value) {
      var total = date.getTime();
      if (value.milliseconds !== undefined) {
          total += value.milliseconds;
      }
      if (value.seconds !== undefined) {
          total += value.seconds * 1000;
      }
      if (value.minutes !== undefined) {
          total += value.minutes * 1000 * 60;
      }
      if (value.hours !== undefined) {
          total += value.hours * 1000 * 60 * 60;
      }
      if (value.days !== undefined) {
          total += value.days * 1000 * 60 * 60 * 24;
      }
      return new Date(total);
  },

  // Subtract Date b from a (a - b) where a and b are dates
  Subtract: function (a, b) {
      var diff = {
          isNegative: false,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
          totalDays: 0.0,
          totalHours: 0.0,
          totalMinutes: 0.0,
          totalSeconds: 0.0,
          totalMilliseconds: 0.0
      };

      var milliSeconds = a.getTime() - b.getTime();
      diff.isNegative = milliSeconds < 0;
      milliSeconds = Math.abs(milliSeconds);

      diff.totalMilliseconds = milliSeconds;
      diff.totalSeconds = diff.totalMilliseconds / 1000.0;
      diff.totalMinutes = diff.totalSeconds / 60.0;
      diff.totalHours = diff.totalMinutes / 60.0;
      diff.totalDays = diff.totalHours / 24.0;

      var daysInMs = 1000.0 * 60 * 60 * 24;
      var hoursInMs = 1000.0 * 60 * 60;
      var minsInMs = 1000.0 * 60;
      var secsInMs = 1000.0;

      var r = DateManager.GetQuotientAndRemainder(milliSeconds, daysInMs);
      diff.days = r.quotient;

      r = DateManager.GetQuotientAndRemainder(r.remainder, hoursInMs);
      diff.hours = r.quotient;

      r = DateManager.GetQuotientAndRemainder(r.remainder, minsInMs);
      diff.minutes = r.quotient;

      r = DateManager.GetQuotientAndRemainder(r.remainder, secsInMs);
      diff.seconds = r.quotient;
      diff.milliseconds = r.remainder;

      return diff;
  },

  NextWeekday: function (date, weekdayIndex) {
      var curDate = new Date(date.getTime());
      for (var i = 0; i < 8; i++) {
          if (curDate.getDay() === weekdayIndex) {
              return curDate;
          }
          curDate = DateManager.Add(curDate, { days: 1 });
      }
  },

  PreviousWeekday: function (date, weekdayIndex) {
      var curDate = new Date(date.getTime());
      for (var i = 0; i < 8; i++) {
          if (curDate.getDay() === weekdayIndex) {
              return curDate;
          }
          curDate = DateManager.Add(curDate, { days: -1 });
      }
  },

  IsValid: function (date) {
      if (Object.prototype.toString.call(date) === "[object Date]") {
          if (!isNaN(date.getTime())) {
              return true;
          }
      }
      return false;
  },

  // Get date from Date object with time removed
  Date: function (datetime) {
      return new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate());
  },

  NextDay: function (date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  },

  PreviousDay: function (date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  },

  // Check if two dates site on the same date regardless of time
  IsSameDate: function (date1, date2) {
      return date1.getFullYear() === date2.getFullYear() &&
          date1.getMonth() === date2.getMonth() &&
          date1.getDate() === date2.getDate();
  },

  ParseTimeSpan: function (value, format) {
      var ts = {
          isNegative: false,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
          totalDays: 0.0,
          totalHours: 0.0,
          totalMinutes: 0.0,
          totalSeconds: 0.0,
          totalMilliseconds: 0.0
      };

      if (format.indexOf('dd') !== -1) {
          var days = parseInt(value.substr(format.indexOf('dd'), 2));
          ts.days = days;
          ts.totalMilliseconds += days * 24 * 60 * 60 * 1000;
      }
      if (format.indexOf('hh') !== -1) {
          var hours = parseInt(value.substr(format.indexOf('hh'), 2));
          ts.hours = hours;
          ts.totalMilliseconds += hours * 60 * 60 * 1000;
      }
      if (format.indexOf('mm') !== -1) {
          var minutes = parseInt(value.substr(format.indexOf('mm'), 2));
          ts.minutes = minutes;
          ts.totalMilliseconds += minutes * 60 * 1000;
      }
      if (format.indexOf('ss') !== -1) {
          var seconds = parseInt(value.substr(format.indexOf('ss'), 2));
          ts.seconds = seconds;
          ts.totalMilliseconds += seconds * 1000;
      }
      if (format.indexOf('ff') !== -1) {
          var milliseconds = parseInt(value.substr(format.indexOf('ff'), 2));
          ts.milliseconds = milliseconds;
          ts.totalMilliseconds += milliseconds;
      }

      ts.totalSeconds = ts.totalMilliseconds / 1000.0;
      ts.totalMinutes = ts.totalSeconds / 60.0;
      ts.totalHours = ts.totalMinutes / 60.0;
      ts.totalDays = ts.totalHours / 24.0;

      return ts;
  },

  FormatTimeSpan: function (timeSpan, format) {
      if (timeSpan === null) {
          return null;
      }

      var str = format;

      // Negative
      if (timeSpan.isNegative) {
          str = str.replace('g', '-');
      }
      else {
          str = str.replace('g', '');
      }

      // Days
      str = str.replace('dd', DateManager.PadZeros(timeSpan.days, 2));
      str = str.replace('d', timeSpan.days);

      // Hours
      str = str.replace('hh', DateManager.PadZeros(timeSpan.hours, 2));
      str = str.replace('h', timeSpan.hours);

      // Minutes
      str = str.replace('mm', DateManager.PadZeros(timeSpan.minutes, 2));
      str = str.replace('m', timeSpan.minutes);

      // Seconds
      str = str.replace('ss', DateManager.PadZeros(timeSpan.seconds, 2));
      str = str.replace('s', timeSpan.seconds);

      // Milliseconds
      str = str.replace('ffff', DateManager.PadZeros(timeSpan.milliseconds, 4));
      str = str.replace('fff', DateManager.PadZeros(timeSpan.milliseconds, 4).substr(0, 3));
      str = str.replace('ff', DateManager.PadZeros(timeSpan.milliseconds, 4).substr(0, 2));
      str = str.replace('f', timeSpan.milliseconds);

      return str;
  },

  GetQuotientAndRemainder: function (a, b) {
      return {
          quotient: Math.floor(a / b),
          remainder: a % b
      };
  }
};