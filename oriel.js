// Oriel 0.1
//
// Michael Hoy | michael.john.hoy@gmail.com | 2011
//     
// Oriel may be freely distributed under the MIT license.


(function ( $, root, undefined ) {

  // Helpers
  // -------


  // Return true if `o` is a string; false if not.
  // Implementation borrowed from _underscore.js_.
  var isString = function ( o ) {
    return Object.prototype.toString.call( o ) == '[object String]';
  };
  // Capitalize the first letter of a string.
  var capitalize = function ( str ) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Returns the indexes `k` items away from
  // index `n` for an array of length `len`. Useful for
  // getting nearby images in the slideshow to pre-load.
  //
  // e.g.,
  //
  //     indexNeighbors( 1, 2, 10 ); // => [ 9, 0, 1, 2, 3 ]
  //     
  //     indexNeighbors( 5, 1, 10 ); // => [ 4, 5, 6 ]
  var indexNeighbors = function ( n, k, len ) {
    if ( n >= len ) return undefined;
    var arr = [], 
        i, x, r, offset;
    for ( i = 0, x = k * 2; i <= x; i += 1 ) {
      offset = ( i - k ) + n;
      if ( offset < 0 ) {
        r = len + offset;
      } else if ( offset >= len ) {
        r = offset - len;
      } else {
        r = offset;
      }
      if ( ( r >= 0 ) && ( r < len ) && ( arr.indexOf( r ) < 0 ) ) {
        arr.push( r );
      }
      if ( arr.length === len ) {
        break;
      }
    }
    return arr;
  }

  // Hooks
  // ----
  // Oriel defines several jQuery event hooks to bind to.
  // The pattern of 'before' and 'after' hooks is borrowed
  // from Rails.
 

  // For the function at `obj[name]`, return a function that
  // triggers before and after hooks, calling the function in
  // between them, and preserving its return value. The `name`
  // is used to construct the event name that is triggered.
  //
  // e.g.,
  //
  //     makeHook( myObj, 'myFunc' );
  //
  // will return a function that first triggers "beforeMyFunc"
  // (note capitalization), calls myObj.myFunc, triggers
  // "afterMyFunc" and returns the value from the function call.
  var makeHook = function ( obj, name ) {
    var fn = obj[name];
    return function() {
      var value,
          before = 'before' + capitalize( name ),
          after  = 'after'  + capitalize( name );
      this.trigger( before );
      value = fn.apply( this, arguments );
      this.trigger( after );
      return value;
    };
  };

  // Take an array `hooks` of names and make hooks on `obj`.
  var makeHooks = function ( hooks, obj ) {
    $.each( hooks, function() {
      var name = this;
      obj[name] = makeHook( obj, name );
    } );
  };

  // DOM information
  // ---------------
  // Oriel creates many elements, and you may
  // want to use CSS to style them.

  // The classes we will use in constructing new elements.
  var domClass = {
    oriel           : 'oriel',
    wrapper      : 'oriel-wrapper',
    stage        : 'oriel-stage',
    source       : 'oriel-source',
    status       : 'oriel-status',
    caption      : 'oriel-caption',
    navigation   : 'oriel-navigation',
    location     : 'oriel-location',
    nextLink     : 'oriel-next-link',
    prevLink     : 'oriel-prev-link',
    placeholder  : 'oriel-placeholder',
    imageWrapper : 'oriel-image-wrapper',
    active       : 'oriel-active'
  };

  // Same as `domClass` but with the dot in front, for CSS selectors.
  // e.g.,
  // 
  //     domClass.oriel // # => 'oriel'
  //     sel.oriel      // # => '.oriel'
  var sel = (function() {
    var obj = {};
    $.each( domClass, function ( k, v ) {
      obj[k] = '.' + v;
    } );
    return obj;
  })();

  // Default options
  // ---------------
  // Oriel accepts a hash of options, and it provides
  // some sensible defaults to begin with.
  //
  // In any option function that is called, `this` is the
  // Oriel object.

  var defaultOptions = {

    // Set up the "status" elements (next/previous links, the "1 of 2" indication, etc).
    statusSetup : function ( el ) {
      var status     = $( "<div class='" + domClass.status + "'>" ),
          navigation = $( "<div class='" + domClass.navigation + "'>" ),
          next       = $( "<a href='#' class='" + domClass.nextLink + "'>Next</a>" ),
          location   = $( "<span class='" + domClass.location + "'>" ),
          prev       = $( "<a href='#' class='" + domClass.prevLink + "'>Prev</a>" ),
          caption    = $( "<div class='" + domClass.caption + "'>" );
      // status
      // |- caption
      // `- navigation
      //    |- prev
      //    |- location
      //    `- next
      status.prepend( caption ).
        append( navigation.prepend( location ) );
      navigation.prepend( prev ).append( next );
      $( sel.wrapper, el ).prepend( status );
    },

    // Set up event handling.
    handlerSetup : function ( el ) {
      var self = this;
      $( sel.nextLink, el ).click( function() { self.next(); return false; } );
      $( sel.prevLink, el ).click( function() { self.prev(); return false; } );
    },

    // Load 3 "nearby" images when an image is loaded
    prefetch : 3,

    // Allow the user to loop back from the end to the
    // beginning (or vice-versa)
    allowLoop : true,

    // Animate the images at 100ms
    animationTime : 100,

    // Set the caption.
    setCaption : function ( caption, index ) {
      $( sel.caption, this.el ).html( caption );
    },

    // Set the location (e.g., "2 of 5")
    setLocation : function ( index ) {
      var num = index + 1,
          total = this.fulls.length;
      $( sel.location, this.el ).text( num + " of " + total );
    }
  };

  // The Oriel object
  // ----------------------
  // The oriel object is _not_ the element that the
  // oriel() jQuery method is called on, but a controller object
  // that is created in the process and can be referenced
  // from the original element as the 'oriel' data attribute.
  // This approach is borrowed from the  _Galleria_ slideshow 
  // library.
  //
  // e.g.,
  //
  //     $( 'ul.gallery' ).oriel().data( 'oriel' );
  //        // => the Oriel object.
  //
  //
  // In this model, the jQuery-wrapped DOM element (e.g., the
  // original &lt;UL&gt; list of images) is a view, and the
  // Oriel object is a controller, binding to view
  // events and handling them appropriately.

  // Generator function.
  var Oriel = root.Oriel = function() {

    // The `el` variable contains the jQuery-wrapped DOM element.
    this.el = undefined;

    // Current index of the image displaying.
    this.currentIndex = 0;

    // Array of URLs to the full-sized (non-thumbnail) images.
    this.fulls  = [];

    // Array of URLs to thumbnail images.
    this.thumbs = [];

    // References the original elements if they are anchors to
    // full-sized images.
    this.originalElements = [];

    // An array of captions. Will contain `null` references to
    // items without captions.
    this.captions = [];
  };
  
  // Set the `defaultOptions` and `sel` objects public-facing.
  Oriel.defaultOptions = defaultOptions;
  Oriel.sel = sel;


  $.extend( Oriel.prototype, {

    // Trigger passes on `event` to the view, augmenting
    // the jQuery event object with a reference to the
    // Oriel object.
    trigger : function( event ) {
      var prop = { oriel : this };
      if ( isString( event ) ) {
        // create a jQuery event object with some
        // additional properties.
        event = $.Event( event, prop );
        $( this.el ).trigger( event );
      } else {
        // `event` is a jQuery event object.
        event = $.extend( event, prop );
        $( this.el ).trigger( event );
      }
    },

    // Create and insert the DOM elements we will be using,
    // and move the original elements out visibility.
    setupDom : function() {

      var options = this.options,
          el = this.el,
          wrapper, stage, placeholder, source;

      wrapper = $( '<div class="' + domClass.wrapper + '"></div>' );
      stage   = $( '<div class="' + domClass.stage + '"></div>' );
      el.wrapInner( '<div class="' + domClass.source + '"></div>' );

      source = $( sel.source, el );
      wrapper.prepend( stage );
      el.prepend( wrapper );

      // Call "status" setup -- meant for DOM insertion of status elements.
      if ( $.isFunction( options.statusSetup ) ) options.statusSetup.call( this, el );

      // Call "handler" setup -- meant to attach handlers to DOM events.
      if ( $.isFunction( options.handlerSetup ) ) options.handlerSetup.call( this, el );

      placeholder = $( '<div class="' + domClass.placeholder + '"></div>' ).
        appendTo( stage );

      // Hide the original elements.
      $( source ).hide();

    },

    // Query through the view looking for images, parsing out
    // data, like full-size and thumbnails urls, and captions. 
    // Probably the hacky-est part of this show right now.
    // TODO: make more modular. E.g., a `getCaption` function
    // in the options object.
    analyzeImages : function() {

      var el = this.el,
          self = this,
          options = this.options,
          source = $( sel.source, el );

      // The first type of information we look for are links.
      // Assume that an &lt;img&gt; element wrapped by the link
      // is a thumbnail, and the link points to large version.
      if ( $( source ).find( 'a' ).length > 0 ) {
        $( source ).find( 'a' ).each( function() {
          var ln = $( this ),
              src = ln.attr( 'href' ),
              img = ln.find( 'img' ).eq( 0 ),
              thumb = img.attr( 'src' ) || src,
              caption;

          self.originalElements.push( ln );
          self.fulls.push( src );
          self.thumbs.push( thumb );

          if ( $.isFunction( options.getCaption ) ) { 
            self.captions.push( options.getCaption.call( this, ln ) );
          }
        });
      } else {
      // Just look for all images, and use the `src` attribute as the
      // full-size source, as well as the thumbnail source.
        $( source ).find( 'img' ).each( function() {
          var img = $(this),
              src = img.attr( 'src' ),
              caption;
          self.originalElements.push( img );
          self.fulls.push( src );
          self.thumbs.push( src );
          if ( $.isFunction( options.getCaption ) ) {
            self.captions.push( options.getCaption.call( this, img ) );
          }

        });
      }

    },

    // Bind all plugins to the view.
    _bindPlugins : function() {
      var el = this.el;
      $.each( Oriel._pluginsToBind, function() {
        var map = this;
        $.each( map, function ( key, value ) {
          $( el ).bind( key, value );
        } );
      } );
    },

    // Set up the DOM, get our data, and set the slideshow at 0.
    init : function ( el, opts ) {
      var self = this,
          options;

      el = $( el ).addClass( domClass.oriel );
      this.el = el;

      options = this.options = $.extend( Oriel.defaultOptions, ( opts || {} ) );
      this._bindPlugins();

      this.setupDom();
      this.analyzeImages();
      self.set( 0 );

      return this;
    },

    // Set the image at `index`.
    set : function ( index ) {
      var el = this.el,
          same = ( this.currentIndex === index ),
          options = this.options,
          prefetch = options.prefetch,
          neighbors = indexNeighbors(index, prefetch, this.fulls.length ),
          href = this.fulls[index],
          placeholder = sel.placeholder,
          _currentImage, _i, _l;

      // Update currentIndex.
      this.currentIndex = index;

      if ( href ) {
        // Load the image.
        this.load( index );

        // Load neighboring images, too (prefetch for better interaction.)
        if ( neighbors ) {
          for ( _i = 0, _l = neighbors.length; _i < _l; _i+=1 ) { 
            this.load( neighbors[_i] ); 
          }
        }

        // If it's a new image, change classes.
        if ( !same ) {
          $( placeholder + ' img' + sel.active, el ).removeClass( domClass.active );
          $( placeholder + ' img', el ).removeClass( domClass.active );
        } 

        // Get the new image.
        _currentImage = $( placeholder + ' img[src="' + href + '"]', el ).addClass( domClass.active );

        // Update our status (caption and navigation text)
        this.updateStatus();

        // Call onImageChange.
        if ( $.isFunction( options.onImageChange ) ) options.onImageChange.call( this, _currentImage );
      }
      
      return this;
    },

    // Load an image (create the actual DOM element).
    load : function ( index ) {
      var href = this.fulls[index],
          orig = this.originalElements[index],
          self = this,
          el   = this.el,
          options = this.options,
          placeholder = sel.placeholder,
          _newImage, _i, _l, _attr;

      // Check whether this image exists already.
      if ( $( placeholder + ' img[src="' + href + '"]', el ).length === 0 ) {
        // Create an image element for the full-sized image source.
        // Put in the "placeholder" tray and hide it.
        _newImage = $( '<img src="' + href + '"/>' ).
          appendTo( $( placeholder ) ).wrap( '<div class="' + domClass.imageWrapper + '"></div>' );

        // Copy any "data-" attributes from the original link to the image.
        if ( orig ) {
          for ( _i = 0, _l = orig[0].attributes.length; _i < _l; _i+=1 ) {
            _attr = orig[0].attributes[_i];
            if ( _attr.name.indexOf( 'data-' ) === 0 ) {
              _newImage.attr( _attr.name, _attr.value );
            }
          }
        }

        // Call onImageLoad and onImageClick handler setup.
        if ( $.isFunction( options.onImageLoad ) ) options.onImageLoad.call( this, _newImage, index );
        if ( $.isFunction( options.onImageClick ) ) {
          $( _newImage ).click( function ( e ) {
            options.onImageClick.call( self, _newImage, e );
          });
        }
      }

      return this;
    },

    // Refresh our status indicators (location and caption).
    updateStatus : function() {
      var options = this.options,
          index = this.currentIndex,
          caption = this.captions[index],
          el = this.el,
          total = this.fulls.length;
      if ( $.isFunction( options.setLocation ) ) options.setLocation.call( this, index );
      if ( $.isFunction( options.setCaption ) ) options.setCaption.call( this, caption, index );
    },

    // Next image.
    next : function() {
      var canChange = true,
          index = this.currentIndex,
          fulls = this.fulls,
          allowLoop = this.options.allowLoop;
      if ( index < fulls.length - 1 ) {
        index += 1;
      } else if ( allowLoop ) {
        index = 0;
      } else {
        canChange = false;
      }

      if ( canChange ) {
        this.set( index );
      }

      return this;
    },

    // Previous image.
    prev : function() {
      var canChange = true,
          index = this.currentIndex,
          fulls = this.fulls,
          allowLoop = this.options.allowLoop;
      if ( index > 0 ) {
        index -= 1;
      } else if ( allowLoop ) {
        index = fulls.length - 1;
      } else {
        canChange = false;
      }

      if ( canChange ) {
        this.set( index );
      }

      return this;
    },

  });

  // Plugins
  // -------

  Oriel._pluginsToBind = [];

  // The main interface plugins can use to quickly bind to
  // all Oriel instances.
  //
  // Takes an object with event names as its keys
  // and functions as its values, to be called when those
  // events are triggered.
  Oriel.bindAll = function( obj ) {
    Oriel._pluginsToBind = Oriel._pluginsToBind.concat( obj );
  };

  // Define the before/after hooks.
  var hooks = [ 'next', 'prev', 'set', 'init' ];
  makeHooks( hooks, Oriel.prototype );

  // The jQuery Function
  // -------------------
  // Not much to see: create a new Oriel instance,
  // call `init`, and attach a reference to the view.
  $.fn.oriel = function ( opts ) {
    return this.each( function() {
      $( this ).data( 'oriel', new Oriel().init( this, opts ) );
    });
  };

})( jQuery, this );
