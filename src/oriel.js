// oriel, the lazy slideshow
// v1.0.0

// (c) Michael Hoy 2011-2014
// Oriel may be freely distributed under the MIT license.
// https://github.com/mjhoy/oriel

(function ($, root) {

  "use strict";

  var version = "1.0.0";

  var _initializing = false;

  // Use jQuery's `inArray` rather than Array.prototype.indexOf
  // for compatibility.
  var inArray = $.inArray;

  // Returns the indexes `k` items away from index `n` for an
  // array of length `len`. Useful for getting nearby images in
  // a slideshow to preload.
  var indexesOfNeighbors = function(n, k, len) {
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
      if ((r >= 0) &&
          (r < len) &&
          (inArray(r, arr) === -1))
        arr.push(r);
      if (arr.length === len)
        break;
    }
    return arr;
  };

  var Oriel = function (selector) {
    this.currentIndex = undefined;
    this.currentItem = undefined;
    this.items = [];
    this.thumbs = [];
    this.captions = [];
    this.originalElements = [];

    if(!_initializing) {
      selector = selector ? selector : this.selector;
      if (!selector) throw("Oriel: no selector set");
      this.selector = selector;
      this.el = $(selector);
      this.init();
    }
  };

  var _hasProp = {}.hasOwnProperty;

  var divWithClass = function(klass) {
    return $('<div class="' + klass +'"></div>');
  };

  var domClass = {
    oriel        : 'oriel',
    wrapper      : 'oriel-wrapper',
    item         : 'oriel-item',
    stage        : 'oriel-stage',
    source       : 'oriel-source',
    status       : 'oriel-status',
    caption      : 'oriel-caption',
    navigation   : 'oriel-navigation',
    location     : 'oriel-location',
    nextLink     : 'oriel-next-link',
    prevLink     : 'oriel-prev-link',
    placeholder  : 'oriel-placeholder',
    active       : 'oriel-active'
  };

  var sel = (function() {
    var obj = {};
    $.each( domClass, function ( k, v ) {
      obj[k] = '.' + v;
    } );
    return obj;
  }());

  Oriel.prototype = {
    selector: undefined,

    itemSelector: 'li',

    prefetch: 3,

    allowLoop: true,

    // Initialize the slideshow.
    init: function() {
      this.setupDom();
      this.analyze();
      this.set(0);
    },

    setupDom: function() {
      var el = this.el,
          wrapper, stage, placeholder, source;

      el.addClass(domClass.oriel);
      el.wrapInner(divWithClass(domClass.source));
      source = $(sel.source, el).hide();

      wrapper = divWithClass(domClass.wrapper);
      stage   = divWithClass(domClass.stage);
      wrapper.prepend(stage);
      el.prepend(wrapper);

      if ($.isFunction(this.statusSetup))
        this.statusSetup();

      if ($.isFunction(this.handlerSetup))
        this.handlerSetup();

      placeholder = divWithClass(domClass.placeholder).
        appendTo(stage);
    },

    load: function(index) {
      var item = this.items[index],
          self = this;
      if (!item.parent()[0]) {
        $(sel.placeholder, this.el).append(item);
        if ($.isFunction(this.onItemLoad))
          this.onItemLoad(item, index);
        if ($.isFunction(this.onItemClick))
          item.click(function (e) {
            self.onItemClick(item, e);
          });
      }
    },

    next: function() {
      var canChange = true,
          index = this.currentIndex,
          items = this.items,
          allowLoop = this.allowLoop;
      if (index < items.length - 1) {
        index += 1;
      } else if (allowLoop) {
        index = 0;
      } else {
        canChange = false;
      }

      if (canChange)
        this.set(index);

      return this;
    },

    prev: function() {
      var canChange = true,
          index = this.currentIndex,
          items = this.items,
          allowLoop = this.allowLoop;
      if (index > 0) {
        index -= 1;
      } else if (allowLoop) {
        index = items.length - 1;
      } else {
        canChange = false;
      }

      if (canChange)
        this.set(index);

      return this;
    },

    set: function(index) {
      var el = this.el,
          same = (this.currentIndex === index),
          prefetch = this.prefetch,
          neighbors = indexesOfNeighbors(index, prefetch, this.items.length),
          item = this.items[index],
          placeholder = sel.placeholder,
          items, i, l;

      if (!item) return this;

      this.currentIndex = index;
      this.currentItem = item;

      this.load(index);

      if (neighbors)
        for (i=0, l=neighbors.length; i<l; i+=1)
          this.load(neighbors[i]);

      if (!same) {
        for (i=0, l=this.items.length; i<l; i++)
          this.items[i].removeClass(domClass.active);
        item.addClass(domClass.active);
        if ($.isFunction(this.onItemChange))
          this.onItemChange(item);
        // call onImageChange (=> onItemChange?)
      }

      this.updateStatus();

      return this;
    },

    updateStatus: function() {

    },

    analyze: function() {
      var el           = this.el,
          self         = this,
          source       = $(sel.source, el),
          elements     = $(this.itemSelector, source),

          originalElements = [],
          fulls    = [],
          items    = [],
          thumbs   = [],
          captions = [];

      elements.each(function() {
        var e = $(this), cap, full, thumb, item;
        if ($.isFunction(self.getCaption)) cap = self.getCaption(e);
        if ($.isFunction(self.getFull))   full = self.getFull(e);
        if ($.isFunction(self.getThumb)) thumb = self.getThumb(e);

        item = self.buildWrappedItem(e);

        fulls.push(full || undefined);
        thumbs.push(thumb || undefined);
        captions.push(cap || undefined);
        items.push(item || undefined);
        originalElements.push(e);
      });

      this.originalElements = originalElements;
      this.fulls = fulls;
      this.items = items;
      this.thumbs = thumbs;
      this.captions = captions;
    },

    // Not meant to be subclassed.
    buildWrappedItem: function(el) {
      var div = divWithClass(domClass.item);
      return div.append(this.buildItem(el));
    },

    // Return the element to be used for an oriel item.
    // This will be wrapped in an .oriel-item div.
    buildItem: function(el) {
      if ($.isFunction(this.getFull))
        return $("<img>").attr({src: this.getFull(el)});
      return el.clone();
    },

    setCaption: function(caption, index) {

    },

    setLocation: function(index) {

    },

    getCaption: function(el) {
      if (el.attr('data-caption'))
        return el.attr('data-caption');
      if (el.find('.caption').length > 0)
        return el.find('.caption').html();
      if (el.find( 'p' ).length > 0)
        return el.find('p').html();

      return undefined;
    },

    statusSetup: function() {
      var el = this.el,
          status     = $( "<div class='" + domClass.status + "'>" ),
          navigation = $( "<div class='" + domClass.navigation + "'>" ),
          statusContent = $( "<a href='#' class='" + domClass.prevLink + "'>Prev</a> " +
                             "<span class='" + domClass.location + "'></span>" +
                             " <a href='#' class='" + domClass.nextLink + "'>Next</a>" ),
          caption    = $( "<div class='" + domClass.caption + "'>" );
      status.prepend( caption ).
        append( navigation.prepend( statusContent ) );
      $( sel.wrapper, el ).prepend( status );
    },

    handlerSetup : function() {
      var self = this,
          el = this.el;
      $(sel.nextLink, el).click(function() { self.next(); return false; });
      $(sel.prevLink, el).click(function() { self.prev(); return false; });
    },

    getFull: function(el) {
      if (el.attr('src'))
        return el.attr('src');
      if (el.attr('href'))
        return el.attr('href');
      if (el.find('img').length > 0 )
        return el.find('img').attr('src');

      return undefined;
    },

    getThumb: function(el) {
      if (el.find('img').length > 0)
        return el.find('img').attr('src');

      return undefined;
    }

  };

  // Simple subclassing.
  Oriel.extend = function(prop) {
    _initializing = true;
    var prototype = new Oriel();
    _initializing = false;
    for (var key in prop)
      if (_hasProp.call(prop, key))
        prototype[key] = prop[key];
    function K() {
      Oriel.apply(this, arguments);
    }
    K.prototype = prototype;
    K.prototype.constructor = K;

    return K;
  };

  Oriel.create = function(proto) {
    return new (Oriel.extend(proto))();
  };

  Oriel.indexesOfNeighbors = indexesOfNeighbors;

  window.Oriel = Oriel;

})(jQuery, this);
