function Layout() {
  var showMenu = false;
  var docWidth = 0;
  var mainLinkCount = navLinkCount;

  var useLargeNav = isLargeNav();
  var largeNavWidth = 1025;

  $('#MenuSlider').width(320 * mainLinkCount);

  $('#ToggleMenu').on('click', function (e) {
      scrollMenu(e.pageX);
      $('body').toggleClass('show-nav');
      showMenu = !showMenu;
  });

  $(document).on('mousemove', function (e) {
      if (showMenu) {
          scrollMenu(e.pageX);
      }
  });

  $('.social').on('click', function (e) {
      if (typeof Analytics !== "undefined") {
          Analytics.trackEvent('social', 'click', e.target.text);
      }
  });

  function scrollMenu(pageX) {
      if (useLargeNav) {
          var p = (pageX / docWidth); // input percentage
          var r = docWidth * 0.2; // padding (20%)
          var a = (320 * mainLinkCount); // slider length
          var b = a + 2 * r;
          var x = p * (b - docWidth) - r;
          $('#MenuSlider').css({ 'transform': 'translateX(' + (0 - x) + 'px)' });
      }
  }

  $(window).on('resize', resize);
  resize();

  function resize() {
      if (hasTouchSupport()) {
          $('body').addClass('touch');
          $('body').removeClass('no-touch');
      }
      else {
          $('body').removeClass('touch');
          $('body').addClass('no-touch');
      }

      docWidth = $(document).width() * 1.0;
      useLargeNav = isLargeNav();
      if (useLargeNav) {
          $('#MenuSlider').width(320 * mainLinkCount);
      }
      else {
          $('#MenuSlider').width('auto');
          $('#MenuSlider').css({ 'transform': 'translateX(0)' });
      }
  }

  function isLargeNav() {
      return (window.matchMedia('(min-width: ' + largeNavWidth + 'px)').matches) && !hasTouchSupport();
  }

  function hasTouchSupport() {
      var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
      var mq = function (query) {
          return window.matchMedia(query).matches;
      }

      if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
          return true;
      }

      // include the 'heartz' as a way to have a non matching MQ to help terminate the join
      // https://git.io/vznFH
      var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
      return mq(query);
  };

  var capabilities = {
      touchSupport: 'ontouchstart' in document.documentElement
  };
};

var layout = Layout();

var $navArrows = $('#GamesSection .nav-arrows');
if($('#GameItems').length && !$navArrows.hasClass("no-fixed")){
  $(window).on('scroll', function () {
    var elementTop = $('#GameItems').offset().top;
    var scrollPos = $(document).scrollTop();
    if (scrollPos > elementTop) {
        $navArrows.addClass('fixed');
    }
    else {
        $navArrows.removeClass('fixed');
    }
});
}

$('.game-discover-more').on('click', function () {
  $('html, body').animate({ scrollTop: $('.intro-section').height() * 2 }, 600);
});
$('#EscapeButton').on('click', function () {
  if (typeof Analytics !== "undefined") {
      Analytics.trackEvent('button', 'click', 'Enter');
  }
  $('html, body').animate({ scrollTop: $('.intro-section').height() }, 600);
});


