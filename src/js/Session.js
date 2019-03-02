WizSession = (function () {
  var self = {};

  statusDictionary = [];
  statusDictionary['available'] = WizardData.config.localisation.available;
  statusDictionary['sold-out'] = WizardData.config.localisation.soldOut;
  statusDictionary['limited'] = WizardData.config.localisation.limited;

  var calendarDayCount = 200;
  var dateSelection = null; // DateWheelSwipe
  var calendarSelection = null; // DatePicker

  var dateAvailabilityData = null;
  var packageAvailabilityRequest = null;

  var $sessionFooterSummary = $('#SessionFooterSummary');

  var initialSessionTime = new Date();
  if (sessionTimeCode) {
    initialSessionTime = DateManager.Parse(sessionTimeCode, 'yyyyMMddHHmm');
  }

  function start() {

    ZLCommon.ShowLoader(true);

    console.log('Wizard session start! ' + WizardData.config.siteId);
    $sessionFooterSummary.find('.location strong').text(WizardData.config.location);
    ZLCommon.GotoStep('ChooseSession');

    // 获取所有的游戏
    populatePackageData(function () {

      updateAvailability();
      updatePackages(DateManager.Format(initialSessionTime, 'yyyyMMdd'), function () {
        updateCost();
      });
      ZLCommon.ShowLoader(false);
    });

    var siteId = WizardData.config.siteId;

    if (!WizardData.Sites[siteId].HasPhone) {
      $('#PhoneNumberSection').remove();
    }

    if (!WizardData.Sites[siteId].RequiresPhone) {
      $('#PhoneNumberSection .required').remove();
      $('#PhoneNumberSection .error-message[data-type="required"]').remove();
    }

    if (!WizardData.Sites[siteId].HasTerms) {
      $('#AgreeToTermsSection').remove();
    }

    $.ajax({
      method: 'post',
      url: WizardData.config.siteConfigUrl,
      data: {
        SiteId: siteId
      }
    }).done(function (data) {
      if (data.BookingSmallPrint) {
        $('#BookingSmallPrint').show();
        $('#BookingSmallPrint').html(data.BookingSmallPrint);
      }
    });


    $('#SessionShareButton').on('click', function () {
      $('#ShareBookingDialogue').toggleClass('show');
    });

    $('#SessionShareCopy').on('click', function () {
      document.getElementById('ShareUrl').select();
      document.execCommand('copy');
    });

    $('#ShareBookingDialogue .shade').on('click', function () {
      $('#ShareBookingDialogue').toggleClass('show');
    });

    // window.addEventListener('hashchange', function () {
    //   self.GotoStep(location.hash.substr(1));
    // });


  }

  function wireEvents() {
    // Set up plugins
    dateSelection = new DateWheelSwipe('SessionDateWheel', {
      selectedDate: WizardData.config.selected.date != null ? WizardData.config.selected.date : DateManager.Date(new Date()),
      firstWeekdayIndex: WizardData.config.localisation.firstDayOfWeek,
      numberOfDays: calendarDayCount,
      onChange: function (e) {
        if (calendarSelection !== null) {
          calendarSelection.setValue(e.newValue);
        }
        updatePackages(e.newValue, function(){
          updateCost();
        });
      },
      onInitComplete: function (initArgs) {
        if (initArgs.pageIndex > 0) {
          $('.prev-week').removeClass('disabled');
        }
      },
      localisation: WizardData.config.localisation.dateWheel
    });

    calendarSelection = new DatePicker('SessionCalendarDate', {
      monthYearFormat: WizardData.config.localisation.yearMonthFormat,
      firstDayOfWeek: WizardData.config.localisation.firstDayOfWeek,
      onChange: function () {
        var date = DateManager.Parse(calendarSelection.getValue(), 'yyyyMMdd');
        dateSelection.setDate(date);
        calendarSelection.$outerDom.find('.calendar-popup').removeClass('show');
        updateDateWheelArrows();
      },
      onBuildCalendar: updateCalendarAvailability
    });

    // Wire up events!
    $('#NotAvailableOk').on('click', function () {
      $('#NotLongerAvailable').removeClass('show');
    });

    $('#DateWeekNav .prev-week').on('click', function () {
      dateSelection.slidePrevious();
      updateDateWheelArrows();
    });
    $('#DateWeekNav .next-week').on('click', function () {
      dateSelection.slideNext();
      updateDateWheelArrows();
    });

    $(document).on('click', function (e) {
      if (!($(e.target).closest('.calendar-popup').length == 1) && !$(e.target).closest('.calendar-button').hasClass('calendar-button')) {
        $('#SessionCalendarButton').removeClass("open");
        calendarSelection.$outerDom.find('.calendar-popup').removeClass('show');
      }
    });

    $('#SessionCalendarButton').on('click', function () {
      $(this).toggleClass("open");
      calendarSelection.$outerDom.find('.calendar-popup').toggleClass('show');
    });

    $('#IntegratedPackageSessionSection').on('mouseenter', 'li', function () {
      $('#IntegratedPackageSessionSection li').removeClass('hover');
      var $li = $(this);

      var $prev = $li.prev();
      while ($prev.length === 1) {
        $prev.addClass('hover');
        $prev = $prev.prev();
      }
    });

    $('#IntegratedPackageSessionSection').on('mouseleave', 'ul', function () {
      $('#IntegratedPackageSessionSection li').removeClass('hover');
    });

    /* 点击触发 */
    $('#IntegratedPackageSessionSection').on('click', 'li', function () {
      var $li = $(this);

      if (!$li.hasClass('sold')) {
        $('#IntegratedPackageSessionSection li').removeClass('active');
        var $prev = $li.prev();
        while ($prev.length === 1) {
          $prev.addClass('active');
          $prev = $prev.prev();
        }
        $li.addClass('active');

        $('#IntegratedPackageSessionSection [data-time]').removeClass('active');
        var $session = $li.closest('[data-time]');
        $session.addClass('active');

        var packageId = $session.closest('[data-packageid]').attr('data-packageid');
        var gameSpaceId = $session.closest('[data-gamespaceid]').attr('data-gamespaceid');
        var time = $session.attr('data-time');
        var players = $('#IntegratedPackageSessionSection li.active').length;
        var price = $session.data('price');
        console.log("time", time);
        WizardData.config.selected.date = DateManager.Parse(time, 'yyyyMMddHHmm');
        WizardData.config.selected.gameSpaceId = gameSpaceId;
        $('#Players').val(players);
        $('#PackageId').val(packageId);
        WizardData.config.perTicketPrice = price;
    /* 点击触发 */

        updateCost();

        dateSelection.toggleSelectionDate(WizardData.config.selected.date);
      }
    });

    $('#IntegratedPackageSessionSection').on('click', '.sessions-toggle', function () {
      var $package = $(this).closest('.package');
      var $sessions = $package.find('.sessions');

      var isCollapsed = $package.hasClass('collapsed');
      if (!isCollapsed) {
        $package.addClass('collapsed');
        $('#IntegratedPackageSessionSection .sessions').slideUp(300);
      } else {
        $('#IntegratedPackageSessionSection .package').addClass('collapsed');
        $('#IntegratedPackageSessionSection .sessions').slideUp(300);

        $package.removeClass('collapsed');
        $sessions.slideDown(300);
      }
    });

    $('#CheckoutButton').on('click', function () {
      if (!$('#CheckoutButton').hasClass('disabled')) {
        if (typeof Analytics !== "undefined") {
          Analytics.trackEvent('booking', 'checkout', 'Checkout');
        }
        ZLCommon.ShowLoader(true);
        $.ajax({
          method: 'post',
          url: WizardData.config.reserveBookingUrl,
          data: {
            SiteId: WizardData.config.siteId,
            Time: DateManager.Format(WizardData.config.selected.date, 'yyyyMMddHHmm'),
            Players: $('#Players').val(),
            PackageId: $('#PackageId').val(),
            GameSpaceId: WizardData.config.selected.gameSpaceId,
            ExistingBookingId: WizardData.config.pendingBookingId
          }
        }).done(function (data) {
          if (data.NotAvailable) {
            $('#NotLongerAvailable').addClass('show');
            updatePackages(DateManager.Format(WizardData.config.selected.date, 'yyyyMMdd'));
          } else {
            WizardData.config.pendingBookingId = data.BookingId; // 订单编号
            WizardData.config.expirationMinutes = data.ExpirationMinutes; //过期时间
            WizInformation.start();
          }
          ZLCommon.ShowLoader(false);
        });
      }
    });

    var $packageViewPopup = $('#PackageViewPopup');
    var $videoFrame = $('#PackageViewPopup .video-frame .video');

    $(document).on('click', function (e) {
      var $target = $(e.target);
      if ($target.closest('.play-video').length === 0 && $target.closest('.video-frame').length === 0) {
        $packageViewPopup.removeClass('show');
        $videoFrame.html('');
      }
    });

    $packageViewPopup.on('click', '.close-video', function () {
      $packageViewPopup.removeClass('show');
      $videoFrame.html('');
    });

    $('#IntegratedPackageSessionSection').on('click', '.hero a', function () {
      var $this = $(this);
      var packageId = $(this).closest('.package').data('packageid');
      var package = WizardData.Packages[packageId];

      if ($(document).width() > 1024) {
        $packageViewPopup.addClass('show');
        $videoFrame.html('<iframe width="100%" height="100%" src="' + package.VideoUrl + '" frameborder="0" title="@game.Title video" allowfullscreen></iframe>');
      } else {
        window.open(package.VideoUrl, '_blank');
      }
    });
  }

  function updateDateWheelArrows() {
    if (dateSelection.page === 0) {
      $('#DateWeekNav .prev-week').addClass('disabled');
    } else {
      $('#DateWeekNav .prev-week').removeClass('disabled');
    }
  }

  function populatePackageData(callback) {
    $.ajax({
      method: 'post',
      url: WizardData.config.getPackagesUrl,
      data: {
        SiteId: WizardData.config.siteId,
        LanguageId: WizardData.config.languageId
      }
    }).done(function (data) {
      //WizardData.config.packages = data;
      data = data.data;
      console.log(data);
      for (var i = 0; i < data.length; i++) {
        WizardData.Packages[data[i].PackageId] = data[i];
      }

      if (callback) {
        callback();
      }
      //console.log(WizardData.Packages);
    });
  }

  function updatePackages(date, callback) {
    var siteId = WizardData.config.siteId;

    $('#SessionLoader').removeClass('hidden');

    $('#IntegratedPackageSessionSection').addClass('loading');

    if (packageAvailabilityRequest && packageAvailabilityRequest.readyState != 4) {
      packageAvailabilityRequest.abort();
    }

    packageAvailabilityRequest = $.ajax({
      method: 'post',
      url: WizardData.config.packageAvailabilityUrl,
      data: {
        SiteId: siteId,
        Date: date,
        AccessCode: WizardData.config.accessCode
      }
    }).done(function (data) {
      console.log(data);
      if (data.code != 200) {
        $('#NoSessionsAvailable').removeClass('hidden');
        $('#IntegratedPackageSessionSection').hide();
      } else {
        $('#NoSessionsAvailable').addClass('hidden');
        $('#IntegratedPackageSessionSection').show();
      }

      var packageHtml = '';

      var packageId = parseInt($('#PackageId').val());
      var playerCount = $('#Players').val();
      var time = WizardData.config.selected.date;
      var timeCode = DateManager.Format(WizardData.config.selected.date, 'yyyyMMddHHmm');
      var gameSpaceId = parseInt(WizardData.config.selected.gameSpaceId);

      for (var i = 0; i < data.data.length; i++) {

        if (data.data[i].Slots.length > 0) {
          var packageAvailability = data.data[i];


          var $package = $('<div class="package collapsed" data-packageId="' + packageAvailability.PackageId + '"></div>');

          $package.addClass(packageAvailability.Availability);
          var $packageDetails = $('<div class="package-details"></div>');
          $package.append($packageDetails);

          var $packageHero = $('<div class="hero"></div>');
          if (packageAvailability.Image1) {
            $packageHero.css('background-image', 'url("' + packageAvailability.Image1 + '")')
          }

          $packageDetails.append($packageHero);
          if (packageAvailability.VideoUrl) {
            $packageHero.append('<a class="play-video"><span>Play</span></a>');
          }

          var $details = $('<div class="details"></div>');
          $packageDetails.append($details);
          $details.append('<h3>' + packageAvailability.Name + '</h3>');
          $details.append('<span class="package-info">' + packageAvailability.Details + '</span>');
          $details.append('<p>' + ZLCommon.ToStringNoNull(packageAvailability.Description) + '</p>');

          // Package availability DOM
          var $packageAvailability = $('<div class="package-availability"></div>');
          $details.append($packageAvailability);
          //var $availabilityTimeRange = $('<span>' + data[i].Slots[0].StartTime + ' - ' + data[i].Slots[data[i].Slots.length - 1].EndTime + '</span>');
          //$packageAvailability.append($availabilityTimeRange);
          var $availableLabel = $('<span class="availability">' + statusDictionary[packageAvailability.Availability] + '</span>');
          $packageAvailability.append($availableLabel);

          //$details.append('<div class="package-availability"><span>9:00 am - 12:00 pm</span><span class="availability available">Available</span></div>');

          var $price = $('<div class="price"></div>');
          $details.append($price);
          $price.append('<span class="from">from </span>');
          var $fromPrice = $('<strong></strong>');
          $price.append($fromPrice);
          $price.append('<span class="per-person">Per Person</span>');

          $details.append('<a class="button ghost sessions-toggle">' + WizardData.config.localisation.sessions + '</a>');

          var $sessions = $('<div class="sessions"></div>');
          $package.append($sessions);

          var lowestPrice = Number.MAX_VALUE;
          for (var j = 0; j < data.data[i].Slots.length; j++) {
            var session = data.data[i].Slots[j];

            lowestPrice = Math.min(lowestPrice, session.Price);
            var $session = $('<div data-gamespaceid="' + session.GameSpaceId + '" data-time="' + session.TimeCode + '" data-price="' + session.Price + '"></div>');
            $sessions.append($session);
            $sessions.hide();

            var isSelectedSession = packageId == packageAvailability.PackageId && gameSpaceId == session.GameSpaceId && timeCode == session.TimeCode;
            
            if (isSelectedSession) {
              $session.addClass('active');
              console.log(session.Price);
              WizardData.config.perTicketPrice = session.Price;
            }

            var actualTime = DateManager.Parse(session.TimeCode, 'yyyyMMddHHmm');
            var formattedTimePart = DateManager.Format(actualTime, WizardData.config.localisation.timeFormat);

            $session.append('<span class="time">' + formattedTimePart + '</span>');
            var $ul = $('<ul></ul>');
            $session.append($ul);

            var slotIndex = 0;
            for (var k = 0; k < session.AvailableSlots; k++) {
              var $slot = $('<li><span>' + (slotIndex + 1) + '</span></li>');
              $ul.append($slot);
              if (isSelectedSession && k < playerCount) {
                $slot.addClass('active');
              }
              slotIndex++;
            }
            for (k = 0; k < session.SoldSlots; k++) {
              $ul.append($('<li class="sold"><span>' + (slotIndex + 1) + '</span></li>'));
              slotIndex++;
            }

            if (session.AvailableSlots == 0) {
              $session.addClass('sold');
            }
            
            $session.append('<span class="price">' + ZLCommon.GetCurrencyFormat(session.Price, WizardData.config.currency) + '</span>');
          }
          $fromPrice.text(ZLCommon.GetCurrencyFormat(lowestPrice, WizardData.config.currency));
          packageHtml += $package[0].outerHTML;
        }
      }

      $('#IntegratedPackageSessionSection').html(packageHtml);

      // Hide loader
      $('#IntegratedPackageSessionSection').removeClass('loading');
      $('#SessionLoader').addClass('hidden');

      var $expandPackage = null;
      // If there is only 1 package available expand it to show sessions
      if (data.data.length === 1) {
        $expandPackage = $('.package');
      } else if (packageId) {
        $expandPackage = $('.package[data-packageid=' + packageId + ']');
      }

      if ($expandPackage !== null) {
        $expandPackage.removeClass('collapsed');
        var $sessions = $expandPackage.find('.sessions');
        $sessions.slideDown(0);
      }
    }).fail(function () {
      console.log('Failed to retrieved availability data.');
      $('#IntegratedPackageSessionSection').removeClass('loading');
      ZLCommon.ShowLoader(false);
    }).always(function () {
      if (callback) {
        callback();
      }
    });
  }

  function clearSelection() {
    $('#Players').val('');
    updateCost();
  }

  /* 更新日期 */
  function updateAvailability(callback) {
    WizardData.availabilityRequest = $.ajax({
      method: 'post',
      url: WizardData.config.dateAvailabilityUrl,
      data: {
        SiteId: WizardData.config.siteId,
        StartDate: DateManager.Format(new Date(), 'yyyyMMdd'),
        EndDate: DateManager.Format(DateManager.Add(new Date(), {
          days: calendarDayCount
        }), 'yyyyMMdd'),
        AccessCode: WizardData.config.accessCode
      }
    }).done(function (data) {

      dateAvailabilityData = data.data;
      console.log(dateSelection);
      console.log(data);
      dateSelection.updateAvailability(data.data);
      updateCalendarAvailability();

      if (callback) {
        callback();
      }
    });
  }

  function updateCalendarAvailability() {
    if (dateAvailabilityData) {
      for (var i = 0; i < dateAvailabilityData.length; i++) {
        var dateAvailability = dateAvailabilityData[i];
        calendarSelection.$outerDom.find('[data-date=' + dateAvailability.Date + ']').addClass(dateAvailability.Status);
      }
    }
  }

  function getShareUrl(dateTime, packageId, gameSpaceId) {
    var timeCode = DateManager.Format(dateTime, 'yyyyMMddHHmm');
    var url = location.origin + location.pathname;
    url += '?s=' + timeCode;
    if (packageId) {
      url += '-' + packageId;
    }
    if (gameSpaceId) {
      url += '-' + gameSpaceId;
    }
    return url;
  };

  function updateCost() {
    var $activeSession = $('#IntegratedPackageSessionSection .sessions div.active');
    if ($activeSession.hasClass('sold')) {
      $('#NotLongerAvailable').addClass('show');
    } else {
      var packageId = $('#PackageId').val();
      if (packageId) {
        var players = parseInt($('#Players').val());
        var price = WizardData.config.perTicketPrice;
        var total = players * price;
        var time = WizardData.config.selected.date;
        var package = WizardData.Packages[packageId];
        var gameSpaceId = WizardData.config.selected.gameSpaceId;
        var url = getShareUrl(WizardData.config.selected.date, packageId, gameSpaceId);
        $('#ShareUrl').val(url);

        // Session footer summary
        $sessionFooterSummary.find('.package strong').html(players + ' <span class="multiply">&times;</span> ' + package.Name);
        
        $sessionFooterSummary.find('.booking strong').text(DateManager.Format(time, WizardData.config.localisation.shortDateTimeFormat));
        
        
        $('#SessionCostTotal').text(ZLCommon.GetCurrencyFormat(total, WizardData.config.currency));

        $('#CheckoutButton').removeClass('disabled');

      } else {
        $sessionFooterSummary.find('.package strong').html('-');
        $sessionFooterSummary.find('.booking strong').text('-');
        $('#SessionCostTotal').text('-');
        $('#CheckoutButton').addClass('disabled');
      }
    }
  }

  self.start = start;
  wireEvents();
  return self;
})();