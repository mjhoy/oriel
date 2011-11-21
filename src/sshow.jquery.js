/*
 * sshowjs
 * mjhoy | 2011
 * 
 * ermm, beta...
 *
 */

(function ($, undefined) {

  // Helper function. Returns the indexes `k` items away from
  // index `n` for an array of length `len`. Useful for
  // getting nearby images in the slideshow to pre-load.
  var index_neighbors = function (n, k, len) {
    if (n >= len) return undefined;
    var arr = [], 
        i, x, r, offset;
    for (i = 0, x = k * 2; i <= x; i += 1) {
      offset = (i - k) + n;
      if (offset < 0) {
        r = len + offset;
      } else if (offset >= len) {
        r = offset - len;
      } else {
        r = offset;
      }
      if ((r >= 0) && (r < len) && (arr.indexOf(r) < 0)) {
        arr.push(r);
      }
      if (arr.length === len) {
        break;
      }
    }
    return arr;
  }

  // The classes we will use in constructing new elements.
  var domClass = {
    sshow      : 'sshow',
    wrapper    : 'sshow_wrapper',
    stage      : 'sshow_stage',
    status     : 'sshow_status',
    navigation : 'sshow_navigation',
    location   : 'sshow_location',
    nextLink   : 'sshow_nextLink',
    prevLink   : 'sshow_prevLink'
  };

  // Same as `domClass` but with the hash in front.
  var sel = (function () {
    var obj = {};
    $.each(domClass, function (k, v) {
      obj[k] = '.' + v;
    });
    return obj;
  })();

  // The default DOM set up of status and next/prev indicators.
  var statusSetup = function (sshow, el) {
    var status     = $("<div class='" + domClass.status + "'>"),
        navigation = $("<div class='" + domClass.navigation + "'>"),
        next       = $("<a href='#' class='" + domClass.nextLink + "'>Next</a>"),
        location   = $("<span class='" + domClass.location + "'>"),
        prev       = $("<a href='#' class='" + domClass.prevLink + "'>Prev</a>");
    // status
    // `- navigation
    //    |- next
    //    |- location
    //    `- prev
    status.prepend(navigation.prepend(location));
    navigation.prepend(next).append(prev);
    $(sel.wrapper, el).prepend(status);
  };

  var handlerSetup = function (sshow, el) {
    $(sel.nextLink, el).click(function() { sshow.next(); });
    $(sel.prevLink, el).click(function() { sshow.prev(); });
  };

  // Default options for the sshow function.
  var defaultOptions = {
    statusSetup: statusSetup,
    handlerSetup: handlerSetup
  };

  Sshow = function () {
  };

  $.extend(Sshow.prototype, {

    init : function (el, opts) {
      var options, wrapper, stage;

      el = $(el).addClass(domClass.sshow);
      this.el = el;
      options = $.extend(defaultOptions, (opts || {}));

      // The overall wrapper.
      wrapper = $("<div class='" + domClass.wrapper + "'></div>");
      stage   = $("<div class='" + domClass.stage + "'></div>");

      wrapper.prepend(stage);
      el.prepend(wrapper);

      // Call "status" setup -- meant for DOM insertion of status elements.
      if ($.isFunction(options.statusSetup)) options.statusSetup(this, el);
      // Call "handler" setup -- meant to attach handlers to DOM events.
      if ($.isFunction(options.handlerSetup)) options.handlerSetup(this, el);
      return this;
    },

    set : function (index) {
      var el = this.el,
          currentIndex = this.currentIndex,
          // Are we showing the current image?
          same = (currentIndex === index);

      this.loadImage(index);
      return this;
    },

    load : function (index) {

    },

    next : function () {
      console.log('next!');
    },

    prev : function () {
      console.log('prev!');
    }

  });

  // The main sshow function.
  $.fn.sshow = function (opts) {
    return this.each(function () {
      $(this).data('sshow', new Sshow().init(this, opts));
    });
  };

})(jQuery);
