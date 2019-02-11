function DatePicker(id, options, initialValue) {
  var self = {};

  // Options
  self.options = {
      hasDate: true,
      hasTime: false,
      valueFormat: 'yyyyMMdd',
      format: 'd MMMM yyyy', // display format
      monthYearFormat: 'MMMM yyyy',
      allowClick: null,
      monthsArr: DateManager.FullMonths,
      shortMonths: DateManager.ShortMonths,
      dayArr: DateManager.VeryShortWeekdays,
      firstDayOfWeek: 0,
      allowBlank: false,
      onChange: null,
      onBuildCalendar: null
  };
  if (typeof options === 'object') {
      self.options = $.extend(self.options, options);
  }

  // Private variables
  self.id = id;
  self.datetimeValue = new Date();
  self.$elementDom;
  self.$displayTextbox;
  self.$outerDom;

  self.month = 0;
  self.year = 0;

  self.init = function() {
      self.$elementDom = $('#' + id).wrap('<div class="date-picker"></div>');
      self.$elementDom.hide();

      self.$elementDom.addClass('date-picker-value');
      self.$outerDom = self.$elementDom.closest('.date-picker');

      if (initialValue) {
          self.$elementDom.val(initialValue);
      }

      var hasExistingValue = false;
      if (self.$elementDom.val() && self.$elementDom.val() !== '') {
          self.datetimeValue = DateManager.Parse(self.$elementDom.val(), self.options.valueFormat);
          hasExistingValue = true;
      }

      self.month = self.datetimeValue.getMonth();
      self.year = self.datetimeValue.getFullYear();

      if (self.options.hasDate) {
          var calendarPopHtml = '';

          var displayValueStr = '';

          if (self.datetimeValue) {
              displayValueStr = DateManager.Format(self.datetimeValue, self.options.format);
          }

          if (self.options.allowBlank && !self.$elementDom.val()) {
              displayValueStr = '';
          }

          if (!hasExistingValue) {
              displayValueStr = '';
          }

          if (self.$elementDom.attr('type') === 'hidden') {
              calendarPopHtml += '<input type="hidden" class="display-value" value="' + displayValueStr + '" style="display:none;" />';
          }
          else {
              calendarPopHtml += '<input type="text" class="display-value" value="' + displayValueStr + '" />';
          }

          if (self.options.allowBlank) {
              if (displayValueStr.length > 0) {
                  calendarPopHtml += '<span class="clear"></span>';
              }
              else {
                  calendarPopHtml += '<span class="clear hide"></span>';
              }
          }

          calendarPopHtml += '<div class="calendar-popup">';
          calendarPopHtml += '<div class="date-selection">';
          calendarPopHtml += '<header>';
          calendarPopHtml += '<a class="prev" title="Previous month"><span>Prev</span></a>';
          calendarPopHtml += '<span class="month-year">-</span>';
          calendarPopHtml += '<a class="next" title="Next month"><span>Next</span></a>';
          calendarPopHtml += '</header>';
          calendarPopHtml += '<div class="calendar-body"></div>';
          if (self.options.hasTime) {
              calendarPopHtml += '<div class="time-picker">';
              calendarPopHtml += '<input type="text" class="time-input" />';
              calendarPopHtml += '<a class="ok-button">OK</a>';
              calendarPopHtml += '</div>';
          }
          calendarPopHtml += '</div>';

          // Month selection
          calendarPopHtml += '<div class="month-selection">';
          calendarPopHtml += '<header>';
          calendarPopHtml += '<a class="prev-year" title="Previous year"><span>Prev</span></a>';
          calendarPopHtml += '<span class="year">' + self.year + '</span>';
          calendarPopHtml += '<a class="next-year" title="Next year"><span>Next</span></a>';
          calendarPopHtml += '</header>';
          calendarPopHtml += '<div class="months">';
          for (var i = 0; i < 12; i++) {
              var monthCssClass = 'month-cell';
              if (self.datetimeValue.getMonth() === i) {
                  //monthCssClass += ' current';
              }
              calendarPopHtml += '<div class="' + monthCssClass + '" data-month="' + i + '">' + self.options.shortMonths[i] + '</div>';
          }
          calendarPopHtml += '</div>';
          calendarPopHtml += '</div>';

          calendarPopHtml += '</div>';

          self.$outerDom.append(calendarPopHtml);
          self.buildCalendar(self.month, self.year);
      }
      else if (self.options.hasTime) {
          console.log('Time only - Not implemented');
      }
      else {
          console.log(self.id + ' does not have date or time options enable');
          return null;
      }

      self.$displayTextbox = self.$outerDom.find('.display-value');

      self.wireEvents();
  }

  self.wireEvents = function() {

      // Events
      self.$outerDom.find('.calendar-body').on('click', '[data-date]', function() {
          var $this = $(this);

          var val = DateManager.Parse($this.attr('data-date'), self.options.valueFormat);

          if (self.options.hasTime) {
              val = $this.attr('data-date') + ' ' + self.$outerDom.find('.time-picker input').val();
          }

          self.$elementDom.val(DateManager.Format(val, self.options.valueFormat));
          self.$displayTextbox.val(DateManager.Format(val, self.options.format));

          self.datetimeValue = val;
          self.month = self.datetimeValue.getMonth();
          self.year = self.datetimeValue.getFullYear();

          self.$outerDom.find('[data-date]').removeClass('current');
          $this.addClass('current');

          self.$outerDom.removeClass('invalid');

          if (!self.options.hasTime) {
              self.hidePopup();
              self.callOnChange();
          }
      });

      self.$outerDom.find('.month-year').on('click', function() {
          self.$outerDom.addClass('show-month-selection');
      });

      self.$outerDom.find('.next').on('click', function() {
          self.month++;
          if (self.month > 11) {
              self.month = 0;
              self.year++;
          }
          self.buildCalendar(self.month, self.year);
      });

      self.$outerDom.find('.prev').on('click', function() {
          self.month--;
          if (self.month < 0) {
              self.month = 11;
              self.year--;
          }
          self.buildCalendar(self.month, self.year);
      });

      self.$outerDom.find('.month-cell').on('click', function() {
          self.month = $(this).attr('data-month');
          self.$outerDom.removeClass('show-month-selection');
          self.buildCalendar(self.month, self.year);
      });

      self.$displayTextbox.on('keyup', function() {
          if (self.options.allowBlank && $.trim(self.$displayTextbox.val()) === '') {
              self.$outerDom.find('.date-picker-value').val('');
              self.callOnChange();
          }
          else {
              var date = DateManager.Parse(self.$displayTextbox.val(), self.options.format);
              if (DateManager.IsValid(date)) {
                  self.datetimeValue = date;
                  self.month = self.datetimeValue.getMonth();
                  self.year = self.datetimeValue.getFullYear();
                  self.buildCalendar(self.month, self.year);
                  self.$outerDom.removeClass('invalid');
                  self.callOnChange();
              }
              else {
                  self.$outerDom.addClass('invalid');
              }
          }
      });

      self.$displayTextbox.on('focus', function() {
          self.showPopup();
      });

      self.$displayTextbox.on('blur', function() {
          var date = DateManager.Format(self.$displayTextbox.val(), self.options.format);
          if (DateManager.IsValid(date)) {
              self.$displayTextbox.val(DateManager.Format(self.datetimeValue, self.options.format));
          }
      });

      // When you click on anything thats not the current calendar
      $(document).on('click', function(e) {
          var $target = $(e.target);

          if (self.options.allowClick !== null) {
              if ($target.closest(self.options.allowClick).length !== 1 && $target.closest('.calendar-popup').length !== 1 && !$target.hasClass('display-value')) {
                  self.$outerDom.removeClass('show-popup');
              }
          }
          else {
              if ($target.closest('.calendar-popup').length !== 1 && !$target.hasClass('display-value')) {
                  self.$outerDom.removeClass('show-popup');
              }
          }
      });

      self.$outerDom.find('.clear').on('click', function() {
          self.$outerDom.find('.date-picker-value').val('');
          self.$displayTextbox.val('');
          self.hidePopup();
          self.callOnChange();
      });
  };

  self.showPopup = function() {
      // hide all other calendars
      $('.date-picker').removeClass('show-popup');
      self.$outerDom.addClass('show-popup');
      self.$outerDom.removeClass('show-month-selection');

      self.month = self.datetimeValue.getMonth();
      self.year = self.datetimeValue.getFullYear();

      self.buildCalendar(self.month, self.year);
      self.$outerDom.find('.time-picker input').val(DateManager.Format(self.datetimeValue, 'h:mm tt'));
  };

  self.hidePopup = function() {
      self.$outerDom.removeClass('show-popup');
  };

  self.buildCalendar = function(month, year) {
      if (isNaN(month) || isNaN(year)) {
          var today = new Date();
          month = today.getMonth();
          year = today.getFullYear();
      }

      var firstDateOfMonth = new Date(year, month, 1);

      self.$outerDom.find('.month-year').text(DateManager.Format(firstDateOfMonth, self.options.monthYearFormat));

      var $calendarBody = self.$outerDom.find('.calendar-body');

      var html = '';

      html += '<table class="date-picker-table">';
      html += '<thead><tr>';
      for (var i = self.options.firstDayOfWeek; i < 7; i++) {
          html += '<th>' + self.options.dayArr[i] + '</td>';
      }
      for (var i = 0; i < self.options.firstDayOfWeek; i++) {
          html += '<th>' + self.options.dayArr[i] + '</td>';
      }
      html += '</tr></thead>';

      var firstDisplayDate = DateManager.PreviousWeekday(firstDateOfMonth, self.options.firstDayOfWeek);

      var curDate = firstDisplayDate;
      var endDate = DateManager.NextWeekday(new Date(year, month + 1, 1), self.options.firstDayOfWeek);

      html += '<tbody>';

      var week = 0;
      html += '<tr>';
      var weekRec = 0;

      var today = DateManager.Date(new Date());

      while (curDate.getTime() < endDate.getTime()) {
          if (weekRec > 6) {
              html += '</tr><tr>';
              weekRec = 0;
          }
          var cssClass = '';

          if (DateManager.IsSameDate(curDate, self.datetimeValue)) {
              cssClass += 'current ';
          }
          if (curDate.getMonth() !== self.month) {
              cssClass += 'different-month ';
          }
          if (DateManager.IsSameDate(curDate, today)) {
              cssClass += 'today ';
          }
          if (curDate.getTime() < today.getTime()) {
              cssClass += 'past ';
          }
          if (curDate.getTime() > today.getTime()) {
              cssClass += 'future ';
          }
          if (cssClass !== '') {
              html += '<td class="' + $.trim(cssClass) + '"';
          }
          else {
              html += '<td';
          }
          html += ' data-date="' + DateManager.Format(curDate, self.options.valueFormat) + '">' + curDate.getDate() + '</td>';
          weekRec++;
          curDate = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate() + 1);
      }
      html += '</tr>';

      html += '</tbody>';
      html += '</table>';

      $calendarBody.html(html);

      if (self.options.onBuildCalendar) {
          self.options.onBuildCalendar({ month: month, year: year, startDate: firstDisplayDate, endDate: curDate });
      }
  };

  self.callOnChange = function() {
      if (self.getValue().length === 0) {
          self.$outerDom.find('.clear').addClass('hide');
      }
      else {
          self.$outerDom.find('.clear').removeClass('hide');
      }

      if (self.options.onChange !== null) {
          self.options.onChange();
      };
  };

  self.getValue = function() {
      return $.trim(self.$outerDom.find('.date-picker-value').val());
  };

  self.setValue = function(value) {
      var displayValueStr = '';
      var valueStr = '';

      if (!(value === null || value === undefined || value.length == 0)) {
          self.datetimeValue = DateManager.Parse(value, self.options.valueFormat);

          self.month = self.datetimeValue.getMonth();
          self.year = self.datetimeValue.getFullYear();
          valueStr = DateManager.Format(self.datetimeValue, self.options.valueFormat);

          if (self.datetimeValue) {
              displayValueStr = DateManager.Format(self.datetimeValue, self.options.format);
          }
      }

      self.$outerDom.find('.date-picker-value').val(valueStr);
      self.$outerDom.find('.display-value').val(displayValueStr);

      self.buildCalendar(self.month, self.year);
  }

  self.init();
  return self;
}