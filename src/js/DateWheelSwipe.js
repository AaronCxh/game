function DateWheelSwipe(id, options) {
  var self = {};

  // Functions
  self.init = function () {
      self.isMobile = true;

      self.offsetX = null;
      self.gripX = null;

      // Option defaults
      self.options = {
          selectedDate: DateManager.Date(new Date()),
          numberOfDays: 105, // 15 pages 15 * 7
          firstWeekdayIndex: 0, // Sunday by default
          getAvailabilityUrl: '/book-wizard-date-availability',
          dateValueFormat: 'yyyyMMdd',
          onChange: null,
          onInitComplete: null,
          slideTime: 300,
          localisation: {
              soldOut: 'Sold Out',
              open: 'Open',
              limited: 'Limited',
              closed: 'Closed',
              comingSoon: 'Coming Soon'
          }
      };
      if (typeof options === 'object') {
          self.options = $.extend(self.options, options);
      }

      self.rebuildTimeoutId = null;

      // Date status localisation
      self.options.statusLocalisation = [];
      self.options.statusLocalisation['sold'] = self.options.localisation.soldOut;
      self.options.statusLocalisation['open'] = self.options.localisation.open;
      self.options.statusLocalisation['limited'] = self.options.localisation.limited;
      self.options.statusLocalisation['closed'] = self.options.localisation.closed;
      self.options.statusLocalisation['soon'] = self.options.localisation.comingSoon;

      self.availabilityRequest = null;

      self.cellIndex = 0;
      self.page = 0;
      self.pageSize = 7;
      self.dateCellWidth = 134;

      self.$valueElement = $('#' + id);
      self.$dateSelector = $('<div class="date-wheel date-selection"></div>');

      self.$slider = $('<div class="date-slider"></div>');
      self.$slider.width(self.dateCellWidth * self.options.numberOfDays + 2);
      self.$dateSelector.append(self.$slider);
      console.log();
      self.$valueElement.after(self.$dateSelector);

      $(window).on('resize', self.resize);

      self.buildDates();

      self.resize();

      // Event wiring
      self.$slider.on('click', '[data-index]', function (eventArgs, skipAnimationArgs) {
          self.$dateSelector.removeClass('no-animation');
          if (skipAnimationArgs && skipAnimationArgs.skipAnimation) {
              self.$dateSelector.addClass('no-animation');
          }

          var $this = $(this);
          var oldVal = self.$valueElement.val();

          self.$valueElement.val($this.data('date'));

          self.$slider.find('[data-index]').removeClass('active');
          $this.addClass('active');

          if (self.options.onChange) {
              self.options.onChange({
                  oldValue: oldVal,
                  newValue: self.$valueElement.val()
              });
          }

          self.cellIndex = $this.index();
          var pageIndex = Math.floor(self.cellIndex / self.pageSize);

          if (self.isMobile) {
              self.scrollCentreIndex(self.cellIndex);
          }
          else {
              self.slideToPage(pageIndex);
          }
      });

      // Touch
      self.$dateSelector[0].addEventListener('touchstart', function (e) {
          self.$slider.addClass('no-transition');
          if (e.touches.length === 1) {
              self.gripX = e.touches[0].screenX - self.$slider.offset().left;
          }
      }, { passive: true });

      self.$dateSelector[0].addEventListener('touchmove', function (e) {
          if (e.touches.length === 1) {
              var amount = e.touches[0].screenX - self.gripX;
              self.$slider.css('transform', 'translatex(' + amount + 'px)');
          }
      }, { passive: true });

      self.$dateSelector[0].addEventListener('touchend', function (e) {
          self.$slider.removeClass('no-transition');
          self.gripX = null;
          var calculatedIndex = Math.max(0, Math.round(self.$slider.offset().left / self.dateCellWidth * -1) + 1);
          self.$slider.find('[data-index=' + calculatedIndex + ']').trigger('click');
      }, false);

      self.options.selectedDate = DateManager.Date(self.options.selectedDate);

      // setDate is called in aysnc because some undetermined execution order issues
      setTimeout(function () {
          self.setDate(self.options.selectedDate, true);
          if (self.options.onInitComplete) {
              self.options.onInitComplete({ pageIndex: self.page });
          }
      }, 0);
  };

  self.resize = function () {
      var prevIsMobile = self.isMobile;
      self.isMobile = $(document).width() <= 1024;
      self.dateCellWidth = self.$slider.find('div').first().outerWidth();

      if (prevIsMobile !== self.isMobile && !self.isMobile) {
          self.slideToPage(self.page);
      }

      if (self.isMobile) {
          self.scrollCentreIndex(self.cellIndex);
      }

      self.dateSelectionWidth = self.$dateSelector.width();
  };

  self.buildDates = function (selectedDate) {
      if (!selectedDate) {
          selectedDate = self.options.selectedDate;
      }

      var startDate = DateManager.PreviousWeekday(new Date(), self.options.firstWeekdayIndex);
      var iterationDate = startDate;

      self.$slider.html('');

      for (var i = 0; i < self.options.numberOfDays; i++) {
          var datesHtml = '';
          if(iterationDate > selectedDate)
              datesHtml += '<div class="date-cell closed" data-index="' + i + '" data-date="' + DateManager.Format(iterationDate, self.options.dateValueFormat) + '">';
          else
              datesHtml += '<div class="date-cell past" data-index="' + i + '" data-date="' + DateManager.Format(iterationDate, self.options.dateValueFormat) + '">';
          datesHtml += '<span class="weekday">' + DateManager.Format(iterationDate, 'ddd') + '</span>';
          datesHtml += '<span class="month">' + DateManager.Format(iterationDate, 'MMM') + '</span>';
          datesHtml += '<span class="date">' + iterationDate.getDate() + '</span>';
          if(iterationDate >= selectedDate)
              datesHtml += '<span class="status">' + self.options.statusLocalisation['soon'] + '</span>';
          datesHtml += '</div>';
          var $dateCell = $(datesHtml);
          if (DateManager.IsSameDate(iterationDate, selectedDate)) {
              $dateCell.addClass('active');
          }
          self.$slider.append($dateCell);

          iterationDate = DateManager.NextDay(iterationDate);
      }

  };

  self.setDate = function (date, skipAnimation) {
      self.options.selectedDate = date;
      var $cell = self.$slider.find('[data-date=' + DateManager.Format(date, self.options.dateValueFormat) + ']');

      var animationArgs = {};
      if (skipAnimation) {
          animationArgs.skipAnimation = true;
      }
      $cell.trigger('click', animationArgs);
  };

  self.toggleSelectionDate = function (date) {
      self.$slider.find('[data-date]').removeClass('selected');
      self.$slider.find('[data-date=' + DateManager.Format(date, self.options.dateValueFormat) + ']').addClass('selected');
  };

  self.updateAvailability = function (data) {
      var selectedDateFormat = DateManager.Format(self.options.selectedDate, self.options.dateValueFormat);

      for (var i = 0; i < data.length; i++) {
          var cellData = data[i];

          var $cell = self.$slider.find('[data-date=' + cellData.Date + ']');
          $cell.attr('class', '');
          $cell.addClass(cellData.Status);

          if (cellData.Date === selectedDateFormat) {
              $cell.addClass('active');
          }
          $cell.find('.status').text(self.options.statusLocalisation[cellData.Status]);
      }
  };

  self.slideNext = function () {
      self.$dateSelector.removeClass('no-animation');
      var slideFrac = ((self.page + 1) * self.pageSize) / self.options.numberOfDays;
      if (slideFrac < 1) {
          self.page++;
          self.slideToPage(self.page);
      }
  };

  self.slidePrevious = function () {
      self.$dateSelector.removeClass('no-animation');
      if (self.page > 0) {
          self.page--;
          self.slideToPage(self.page);
      }
  };

  self.slideToPage = function (pageIndex) {
      var sliderWidth = (self.$dateSelector.outerWidth() + self.$dateSelector.width()) / 2; //938
      var amount = sliderWidth * pageIndex * -1;
      self.$slider.css('transform', 'translatex(' + amount + 'px)');
      self.page = pageIndex;
  };

  self.scrollCentreIndex = function (index) {
      var amount = self.dateCellWidth * index * -1;

      // Centre
      amount += $(document).width() / 2 - self.dateCellWidth / 2;
      self.$slider.css('transform', 'translatex(' + amount + 'px)');
      self.page = Math.floor(index / self.pageSize);
  };

  self.init();
  return self;
  
}