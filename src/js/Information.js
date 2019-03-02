WizInformation = (function () {
  var self = {};

  var playerEmailCheckTimeout = null;
  var expirationTime = null;
  var expirationIntervalId = null;
  var requiresPayment = null;
  var inputTimeout = 400;
  var $expirationContainer = $('#ExpirationContainer');
  var emailLoaderTimeoutId = null;

  function start() {
      updateCost();

      $expirationContainer.removeClass('show');

      startCountdownTimer(WizardData.config.expirationMinutes);

      setLoggedInUi(WizardData.config.isLoggedIn);
      ZLCommon.GotoStep('PersonalInfo');
  }

  function wireEvents() {
      // Wire events
      $('#EditSessionButton,#InfoBackButton').on('click', function () {
          if (typeof Analytics !== "undefined") {
              Analytics.trackEvent('booking', 'edit', 'Edit Session');
          }
          ZLCommon.ShowLoader(true);
          ZLCommon.DeletePendingBooking(function () {
            ZLCommon.GotoStep('ChooseSession');
            ZLCommon.ShowLoader(false);
          });
      });

      $('#UseLoginAccountButton').on('click', function () {
          $('#Login').removeClass('disabled');
          $('#PasswordResetConfirmation').hide();
          $('#ForgotPassword').show();
          $('#EmptyEmailError').hide();
          $('#LoginPopup').addClass('show');
          $('#LoginEmail').val('');
          $('#LoginEmail').focus();
          $('#LoginPassword').val('');
      });

      $('#ProcessBooking').on('click', function () {
          if (typeof Analytics !== "undefined") {
              Analytics.trackEvent('booking', 'confirm', 'Confirm Booking');
          }
          updateCost(performRegistration);
      });

      $('#EmailAddress').on('keyup cut paste blur', ZLCommon.Debounce(checkPlayerEmail, inputTimeout));

      $('#DiscountCode').on('change cut paste', ZLCommon.Debounce(updateCost, inputTimeout));

      $('#Login').on('click', login);

      $('#ForgotPassword').one('click', forgotPassword);

      $('#LoginPopup input').on('keyup', function (e) {
          if (e.which === 13) {
              login();
          }
      });

      $('#Logout').on('click', function () {
          setLoggedInUi(false);

          $('#EmailAddress').val('');
          $('#Name').val('');
          $('#PhoneNumber').val('');
          $('#EmailAddress').focus();

          $.ajax({
              method: 'post',
              url: WizardData.config.logoutUrl,
              data: {}
          }).done(function (data) {
              WizardData.config.isLoggedIn = false;
              updateCost();
          });
      });

      $('#UseDifferentEmail').on('click', function () {
          hidePopup('LoginOrClearEmailPopup');
          $('#EmailAddress').val('');
          $('#EmailAddress').focus();
      });

      $('#LoginWithEmail').on('click', function () {
          showPopup('LoginPopup');
          //console.log('Login with email: ' + $('#EmailAddress').val());
          $('#LoginEmail').val($('#EmailAddress').val());
          $('#EmailAddress').val('');
          $('#LoginEmail').focus();
      });

      $('#CancelLogin').on('click', function () {
          hidePopup('LoginPopup');
      });

      $('#SkipLogin').on('click', function () {
          WizardData.SkipLogin = true;
          hidePopup('LoginOrClearEmailPopup');

          $('#CreatePasswordContainer').hide();
          validation.setElementActive('CreatePassword', false);

          $('#NameSection').hide();
          validation.setElementActive('Name', false);

          $('#PhoneNumberSection').hide();
          validation.setElementActive('PhoneNumber', false);
      });

      validation.groupValidationChangeHook('#PersonalInfo', function () {
          //console.log('Do stuff!?');
      });

      // Agree to terms popup links
      $('#AgreeToTerms a').on('click', function (e) {
          var popupName = $(this).data('popup');
          var popupBodyId = popupName + 'Body';
          var key = $(this).data('content-key');

          showPopup(popupName);
          $('#' + popupBodyId).html('Loading...');
          $.ajax({
              method: 'post',
              url: WizardData.config.getSiteContentUrl,
              data: {
                  SiteId: WizardData.config.siteId,
                  Language: WizardData.config.language,
                  Key: key
              }
          }).done(function (data) {
              $('#' + popupBodyId).html(data);
          });
      });
      $('.terms-popup-container a.button').on('click', function () {
          $('.terms-popup-container').removeClass('show');
      });

      $('#MarketingOptIn').on('click', function () {
          $('#MarketingOptIn').toggleClass('checked');
      });

      // Click span will toggle checkbox
      $('#AgreeToTerms span').on('click', function () {
          $('#AgreeToTerms').toggleClass('checked');
          $('#AgreeToTermRequired').hide();
      });
  }

  function forgotPassword() {
      var email = $.trim($('#LoginEmail').val());

      if (email === '') {
          $('#EmptyEmailError').show();
          return;
      }

      $('#EmptyEmailError').hide();
      $('#Login').addClass('disabled');
      $('#CancelLogin').addClass('disabled');
      $("#ForgotPassword").addClass('disabled');
      $.ajax({
          method: 'post',
          url: WizardData.config.forgotPasswordUrl,
          data: {
              "Email": email
          }
      }).done(function (data) {
          $('#Login').removeClass('disabled');
          $('#CancelLogin').removeClass('disabled');

          $('#ForgotPassword').hide();
          $('#PasswordResetConfirmation').show();
      });
  }

  function login() {
      if (!$('#Login').hasClass('disabled')) {
          $('#Login').addClass('disabled');
          $('#IncorrectPasswordError').hide();
          $.ajax({
              method: 'post',
              url: WizardData.config.loginUrl,
              data: {
                  Email: $.trim($('#LoginEmail').val()),
                  Password: $('#LoginPassword').val(),
                  SiteId: WizardData.config.siteId
              }
          }).done(function (data) {
              if (data.Success) {
                  var email = $.trim($('#LoginEmail').val());
                  $('#EmailAddress').val(email);
                  $('#Name').val(data.Name);

                  if (data.PhoneNumber !== null) {
                      $('#PhoneNumber').val(data.PhoneNumber.replace($('#CountryCode > option:selected').text(), "").trim());
                  } else {
                      $('#PhoneNumber').val("");
                  }


                  hidePopup('LoginPopup');
                  $('#LoggedInAccountEmail').text(email);

                  validation.clearValidators('#PersonalInfo');

                  WizardData.config.isLoggedIn = true;
                  setLoggedInUi(true);

                  updateCost();
              } else {
                  $('#IncorrectPasswordError').show();
              }
          }).always(function () {
              $('#Login').removeClass('disabled');
          });
      }
  }

  function setLoggedInUi(isLoggedIn) {
      // Enable/disable validation
      validation.setElementActive('PhoneNumber', !isLoggedIn);
      validation.setElementActive('Name', !isLoggedIn);
      validation.setElementActive('CreatePassword', !isLoggedIn);
      validation.setElementActive('EmailAddress', !isLoggedIn);

      $('#NameSection').hide();
      if (WizardData.Sites[WizardData.config.siteId].HasPhone) {
          $('#PhoneNumberSection').hide();
      }

      if (isLoggedIn) {
          $('#UseLoginAccountContainer').hide();
          $('#EmailAddressContainer').hide();
          $('#LoggedInAccountContainer').show();
          $('#CreatePasswordContainer').hide();

          if ($('#Name').val().length == 0) {
              $('#NameSection').show();
          }

          if (WizardData.Sites[WizardData.config.siteId].HasPhone && $('#PhoneNumber').val().length == 0) {
              $('#PhoneNumberSection').show();
          }
      } else {
          $('#UseLoginAccountContainer').show();
          $('#EmailAddressContainer').show();
          $('#LoggedInAccountContainer').hide();
          $('#CreatePasswordContainer').hide();
      }
  }

  function setFastTrackUi(isFastTrack) {
      if (isFastTrack) {
          $("#UseAccountSection").hide();
          $("#SkipAccountSection").show();

          $("#UseDifferentEmail").hide();
          $("#SkipLogin").show();

          $('#NameSection').hide();
          $('#PhoneNumberSection').hide();
      } else {
          $("#UseAccountSection").show();
          $("#SkipAccountSection").hide();
      }
  }

  function checkPlayerEmail(e) {
      var email = '';
      if (e.type === 'paste') {
          email = e.originalEvent.clipboardData.getData('text');
      } else {
          email = $.trim($('#EmailAddress').val());
      }

      $('strong#LoginPopupEmailLabel').text(email);
      WizardData.SkipLogin = (email == WizardData.LastValidatedEmail) && WizardData.SkipLogin;

      clearTimeout(emailLoaderTimeoutId);
      $('#EmailSpinner').addClass('on');

      $.ajax({
          method: 'post',
          url: WizardData.config.checkEmailUrl,
          data: {
            Email: email,
            SiteId: WizardData.config.siteId,
          }
      }).done(function (data) {
          if (data.EmailInUse) {
              if (!WizardData.SkipLogin) {
                  showPopup('LoginOrClearEmailPopup');
                  setFastTrackUi(data.FastTrack);

                  validation.setElementActive('CreatePassword', false);
                  $('#CreatePasswordContainer').hide();
              }
          } else {
              if (email === '' || !validation.validateElement($("#EmailAddress"))) {
                  setLoggedInUi(false);
              } else {
                  validation.setElementActive('CreatePassword', true);
                  $('#CreatePasswordContainer').show();

                  $('#NameSection').show();
                  validation.setElementActive('Name', true);

                  if (WizardData.Sites[WizardData.config.siteId].HasPhone) {
                      validation.setElementActive('PhoneNumber', true);
                      $('#PhoneNumberSection').show();
                  }
              }
          }

          WizardData.LastValidatedEmail = email;

          clearTimeout(emailLoaderTimeoutId);
          emailLoaderTimeoutId = setTimeout(function () {
              $('#EmailSpinner').removeClass('on');
          }, 200);
      });

  }

  function showPopup(popupContainerId) {
      $('.popup-container').removeClass('show');
      $('#' + popupContainerId).addClass('show');
      $('[data-step] input, [data-step] select').prop('disabled', true);
  }

  function hidePopup(popupContainerId) {
      $('#' + popupContainerId).removeClass('show');
      $('[data-step] input, [data-step] select').prop('disabled', false);
  }

  function cancelLoader() {
    ZLCommon.ShowLoader(false);
      $('#ProcessBooking').removeClass('disabled');
      $('#FullLoader').removeClass('show');
  }

  function performRegistration(e) {
      if (e.validCode) {
          var paymentGateway = WizardData.Sites[WizardData.config.siteId].PaymentGateway;

          var $agreeToTerms = $('#AgreeToTerms');
          var isValid = true;
          if ($agreeToTerms.length === 1 && !$agreeToTerms.hasClass('checked')) {
              $('#AgreeToTermRequired').show();
              isValid = false;
          }

          if (!$('#ProcessBooking').hasClass('disabled') && validation.validateForm('#PersonalInfo') && isValid) {
              $('#ProcessBooking').addClass('disabled');

              if (paymentGateway.toLowerCase() === "stripe") {
                ZLCommon.ShowLoader(true);
                  stripe.createToken(card).then(function (result) {
                      if (result.error) {
                          $('#card-errors').show();
                          // Inform the customer that there was an error.
                          var errorElement = document.getElementById('card-errors');
                          errorElement.textContent = result.error.message;
                          cancelLoader();
                      } else {
                          $('#card-errors').hide();
                          // Send the token to your server.
                          postBooking(result.token.id);
                      }
                  });
              } else {
                  if (requiresPayment) {
                      $('#RedirectingToPaymentGateway').addClass('show ' + paymentGateway.toLowerCase());
                  } else {
                    ZLCommon.ShowLoader(true);
                  }

                  postBooking(null);
              }
          }
      }
  }

  function postBooking(stripeToken) {
      // Post to process
      post(WizardData.config.processBookingUrl, {
          AccessCode: null,
          BookingId: WizardData.config.pendingBookingId,
          Language: WizardData.config.language,
          SiteId: WizardData.config.siteId,
          Players: $('#Players').val(),
          Time: DateManager.Format(WizardData.config.selected.date, 'yyyyMMddHHmm'),
          Name: $('#Name').val(),
          Email: $('#EmailAddress').val(),
          Password: $('#CreatePassword').val(),
          PhoneNumber: $('#CountryCode option:selected').text() + ' ' + $('#PhoneNumber').val(),
          DiscountCode: $('#DiscountCode').val(),
          StripeToken: stripeToken,
          MarketingOptIn: $('#MarketingOptIn').hasClass('checked')
      });
  }

  function updateCost(callback) {
      var players = parseInt($('#Players').val());
      var price = WizardData.config.perTicketPrice;
      var total = players * price;
      var location = WizardData.config.location;
      var time = WizardData.config.selected.date;
      var package = WizardData.Packages[$('#PackageId').val()];

      // Personal info summary
      $('#SummaryHero').css('background-image', 'url("' + package.Image1 + '")');
      $('#SummaryLocation').text(location);
      $('#SummaryPackage').html(players + ' <span class="multiply">×</span> ' + package.Name);
      $('#SummaryBooking').text(DateManager.Format(time, WizardData.config.localisation.shortDateTimeFormat));

      var $costSummary = $('#CostSummary');

      $costSummary.addClass('loading');

      // Get summary from ajax
      $.ajax({
          method: 'post',
          url: WizardData.config.getSummaryUrl,
          data: {
              SiteId: WizardData.config.siteId,
              Time: DateManager.Format(WizardData.config.selected.date, 'yyyyMMddHHmm'),
              Players: parseInt($('#Players').val()),
              PackageId: $('#PackageId').val(),
              Language: 'English',
              EmailAddress: $('#EmailAddress').val(),
              DiscountCode: $('#DiscountCode').val()
          }
      }).done(function (data) {
          requiresPayment = data.PaymentRequired;

          // Discount errors
          $('[data-disacount-err]').hide();
          $('[data-disacount-err=' + data.DiscountResponse + ']').show();
          $('#DiscountCodeContainer').removeClass('success');

          if (data.DiscountResponse === 'NotSupplied' || data.DiscountResponse === 'Available') {
              $('#DiscountCode').removeClass('field-error');
          } else {
              $('#DiscountCode').addClass('field-error');
          }

          if (data.DiscountResponse === 'Available') {
              $('#DiscountCodeContainer').addClass('success');
          }

          $costSummary.html('');
          for (var i = 0; i < data.LineItems.length; i++) {
              var lineItem = data.LineItems[i];
              $costSummary.append('<div class="line-item"><span class="description" price-item="' + lineItem.Type +
                  '">' + lineItem.Title + '<span class="price">' + lineItem.Price + '</span></div>');
          }
          $costSummary.append('<div class="line-item total"><span class="description">' + WizardData.config.localisation
              .total + '</span><span class="price">' + data.Total + '</span></div>');

          if (callback && typeof (callback) === 'function') {
              callback({
                  validCode: (data.DiscountResponse === 'NotSupplied' || data.DiscountResponse === 'Available')
              });
          }

      }).always(function () {
          $costSummary.removeClass('loading');
      });
  }

  function post(path, parameters) {
      var form = $('<form style="display:none"></form>');
      form.attr("method", "post");
      form.attr("action", path);

      $.each(parameters, function (key, value) {
          var field = $('<input></input>');
          field.attr("type", "hidden");
          field.attr("name", key);
          field.attr("value", value);
          form.append(field);
      });

      var data = form.serialize();
      $.post(path, data, function (ret) {
          if (ret.Success) {
              window.location.href = ret.ReturnUrl;
          } else {
              $('#card-errors').show();
              $('#card-errors').text(ret.CardDeclineMessage);
              cancelLoader();
          };
      });
  }

  function startCountdownTimer(minutes) {
      expirationTime = DateManager.Add(new Date(), {
          minutes: minutes
      });
      $expirationContainer.addClass('show');

      clearInterval(expirationIntervalId);
      expirationIntervalId = setInterval(updateTimer, 500);

      updateTimer();
  }

  function updateTimer() {
      time = DateManager.Subtract(expirationTime, new Date());

      $('#ExpirationTime').text(DateManager.FormatTimeSpan(time, 'gm:ss'));

      $expirationContainer.removeClass('expire-warning expire-critical');
      if (time.totalMinutes < 5) {
          $expirationContainer.addClass('expire-warning');
      }
      if (time.totalMinutes < 2) {
          $expirationContainer.addClass('expire-critical');
      }
      if (time.totalMinutes <= 0 || time.isNegative) {
          if (typeof Analytics !== "undefined") {
              Analytics.trackEvent('booking', 'expired', 'Booking Expired');
          }
          clearInterval(expirationIntervalId);
          showPopup('ExpiredPopup');
          $('#ExpirationTime').text('0:00');
      }
  }

  self.start = start;
  wireEvents();
  return self;
})();