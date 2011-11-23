/*
 * sshowjs
 * mjhoy | 2011
 * 
 * ermm, beta...
 *
 */

(function ( $, undefined ) {

  // Helper function. Returns the indexes `k` items away from
  // index `n` for an array of length `len`. Useful for
  // getting nearby images in the slideshow to pre-load.
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

  // The classes we will use in constructing new elements.
  var domClass = {
    sshow        : 'sshow',
    wrapper      : 'sshow_wrapper',
    stage        : 'sshow_stage',
    source       : 'sshow_source',
    status       : 'sshow_status',
    caption      : 'sshow_caption',
    navigation   : 'sshow_navigation',
    location     : 'sshow_location',
    nextLink     : 'sshow_nextLink',
    prevLink     : 'sshow_prevLink',
    placeholder  : 'sshow_placeholder',
    imageWrapper : 'sshow_image_wrapper'
  };

  // Same as `domClass` but with the dot in front, for CSS selectors.
  var sel = (function() {
    var obj = {};
    $.each( domClass, function ( k, v ) {
      obj[k] = '.' + v;
    } );
    return obj;
  })();

  // The default DOM set up of status and next/prev indicators.
  var statusSetup = function ( el ) {
    var status     = $( "<div class='" + domClass.status + "'>" ),
        navigation = $( "<div class='" + domClass.navigation + "'>" ),
        next       = $( "<a href='#' class='" + domClass.nextLink + "'>Next</a>" ),
        location   = $( "<span class='" + domClass.location + "'>" ),
        prev       = $( "<a href='#' class='" + domClass.prevLink + "'>Prev</a>" ),
        caption    = $( "<div class='" + domClass.caption + "'>" );
    // status
    // |- caption
    // `- navigation
    //    |- next
    //    |- location
    //    `- prev
    status.prepend( caption ).
      append( navigation.prepend( location ) );
    navigation.prepend( next ).append( prev );
    $( sel.wrapper, el ).prepend( status );
  };

  var handlerSetup = function ( el ) {
    var self = this;
    $( sel.nextLink, el ).click( function() { self.next(); } );
    $( sel.prevLink, el ).click( function() { self.prev(); } );
  };

  // Set the caption
  var setCaption = function ( caption, index ) {
    $( sel.caption, this.el ).html( caption );
  };

  // Set the location (e.g., "2 of 5")
  var setLocation = function ( index ) {
    var num = index + 1,
        total = this.fulls.length;
    $( sel.location, this.el ).text( num + " of " + total );
  };

  // Default options for the sshow function.
  var defaultOptions = {
    statusSetup : statusSetup,
    handlerSetup : handlerSetup,
    prefetch : 3,
    allowLoop : true,
    animationTime : 100,
    setCaption : setCaption,
    setLocation : setLocation
  };

  Sshow = function() {
    // Options are provided to the `init` method.
    this.options = {};

    // The `el` variable contains the jQuery-wrapped DOM element.
    this.el = undefined;

    // Current index displaying.
    this.currentIndex = 0;

    // Array of URLs to the full-sized (non-thumbnail) images.
    this.fulls  = [];

    // Array of URLs to thumbnail images.
    this.thumbs = [];

    // References the original elements if they are anchors to
    // full-sized images.
    this.originalElements = [];

    // Captions
    this.captions = [];
  };

  $.extend( Sshow.prototype, {

    _setupDom : function () {

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

    _setupImages : function() {

      var el = this.el,
          self = this,
          options = this.options,
          source = $( sel.source, el );

      // Finding our images
      // The first type of information we look for are links that wrap
      // images. We assume the link goes to a display (large) version
      // of the image it wraps, which maints a lot of usability with
      // no JavaScript running.
      if ( $( source ).find( 'a' ).length > 0 ) {
        $( source ).find( 'a' ).each( function() {
          var ln = $( this ), // The anchor element
              src = ln.attr( 'href' ),
              caption;

          self.originalElements.push( ln );
          self.fulls.push( src );

          if ( $.isFunction( options.getCaption ) ) { 
            self.captions.push( options.getCaption.call( this, ln ) );
          }
        });
      } else {
      // Just look for all images, and use the `src` attribute as the
      // display src.
        $( source ).find( 'img' ).each( function() {
          var img = $(this),
              src = img.attr( 'src' ),
              caption;
          self.originalElements.push( img );
          self.fulls.push( src );
          if ( $.isFunction( options.getCaption ) ) {
            self.captions.push( options.getCaption.call( this, img ) );
          }

        });
      }

      // Push any `img` elements' `src` atttributes as thumbs.
      $( source ).find( 'img' ).each( function() {
        self.thumbs.push( $( this ).attr( 'src' ) );
      });

    },

    init : function ( el, opts ) {
      var self = this,
          options;

      el = $( el ).addClass( domClass.sshow ).css( { position : 'relative'} );
      this.el = el;
      options = this.options = $.extend( defaultOptions, ( opts || {} ) );

      this._setupDom();
      this._setupImages();

      self.set( 0 );

      return this;
    },

    // Setting an image
    set : function ( index ) {
      var el = this.el,
          // Are we showing the current image?
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

        // If it's a new image, fade out the old one.
        if ( !same ) {
          $( placeholder + ' img.active', el ).fadeOut( options.animationTime , function() {
            $( this ).css( { opacity: 0.0 } );
          });
          $( placeholder + ' img', el ).removeClass( 'active' );
        } 

        // Get the new image.
        _currentImage = $( placeholder + ' img[src="' + href + '"]', el ).
          addClass( 'active' ).css( { display: 'inline' } );

        if ( same ) {
          _currentImage.css( { opacity: 1.0 } );
        } else {
          _currentImage.animate( { opacity: 1.0 }, options.animationTime );
        }

        // Update our status (caption and navigation text)
        this.updateStatus();

        // Call onImageChange.
        if ( $.isFunction( options.onImageChange ) ) options.onImageChange.call( this, _currentImage );

      }
      
      return this;
    },

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
          appendTo( $( placeholder ) ).css( {
            position : 'absolute',
            display  : 'none',
            opacity  : 0
          } ).wrap( '<div class="' + domClass.imageWrapper + '"></div>' );

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

    updateStatus : function() {
      var options = this.options,
          index = this.currentIndex,
          caption = this.captions[index],
          el = this.el,
          total = this.fulls.length;
      if ( $.isFunction( options.setLocation ) ) options.setLocation.call( this, index );
      if ( $.isFunction( options.setCaption ) ) options.setCaption.call( this, caption, index );
    },

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

  // The main sshow function.
  $.fn.sshow = function ( opts ) {
    return this.each( function() {
      $( this ).data( 'sshow', new Sshow().init( this, opts ) );
    });
  };

})( jQuery );
