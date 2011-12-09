/*
 * paginated-thumbs
 * sshowjs plugin
 * http://github.com/mjhoy/sshowjs
 *
 * mjhoy | 2011
 */

(function ( $, S, undefined ) {

  var animations = window.Modernizr && window.Modernizr.cssanimations;

  var domClass = {
    el : 'paginated-thumbs',
    thumb : 'pt-thumb',
    thumbContainer : 'pt-thumb-container',
    page : 'pt-page',
    pagesContainer : 'pt-pages-container',
    next : 'pt-next',
    prev : 'pt-prev',
    navigation : 'pt-navigation'
  };

  var sel = (function() {
    var obj = {};
    $.each( domClass, function ( k, v ) {
      obj[k] = '.' + v;
    } );
    return obj;
  })();

  var Plugin = function() {

    this.sshow = undefined;
    this.pages = [];
    this.currentIndex = 0;

  };

  $.extend( Plugin.prototype, {

    init : function ( sshow, options ) {
      this.sshow = sshow;
      this.options = options;
      this.setupDom();
      return this;
    },

    makeThumbs : function() {
      var sshow = this.sshow,
          thumbs = $(),
          self = this;
      $.each( sshow.thumbs, function ( i, src ) {
        var full = sshow.fulls[i],
            thumb = $( '<li class="' + domClass.thumbContainer + '">' +
                        '<img class="' + domClass.thumb + '" src="' + src + '"></li>' );
        thumb.data( { full : full } );
        thumbs = thumbs.add( thumb );
        thumb.click( function ( e ) {
          self.setActive( thumb );
          sshow.set( i );
        } );
      } );
      return thumbs;
    },

    setActive : function ( thumb ) {
      var page, index;
      this.thumbs.removeClass( 'active' );
      thumb.addClass( 'active' );
      page = thumb.parents( sel.page );
      index = page.data( 'index' );
      this.set( index );
    },

    next : function ( e ) {
      this.set( this.currentIndex + 1 );
    },

    prev : function ( e ) {
      this.set( this.currentIndex - 1 );
    },

    set : function ( index ) {
      var pages = this.pages,
          currentIndex = this.currentIndex,
          width, offset;
      if ( pages.length === 0 ) throw 'set: no pages!';
      if ( currentIndex === index ) return this;
      if ( index >= pages.length ) return this.set( 0 );
      if ( index < 0 ) return this.set( pages.length - index );

      width = this.el.width();
      offset = -( index * width );

      if ( animations ) {
        this.container.css( { left: offset } );
      } else {
        this.container.animate( { left: offset } );
      }
      
      this.currentIndex = index;
      return this;
    },

    setupNavigation : function() {
      var self = this,
          el = this.el,
          navigation = $( '<nav class="' + domClass.navigation + '">' ),
          prev = $( '<a href="#" class="' + domClass.prev + '">&lt;&lt;</a>' ),
          spacer = $( '<span class="' + domClass.spacer + '">&nbsp;</span>' ),
          next = $( '<a href="#" class="' + domClass.next + '">&gt;&gt;</a>' );

      navigation.append( prev, spacer, next );

      prev.bind( 'click', function ( e ) { self.prev( e ); return false; } );
      next.bind( 'click', function ( e ) { self.next( e ); return false; } );

      el.prepend( navigation );
      this.navigation = navigation;
      return this;
    },

    setupDom : function() {
      var el = $( '<div class="' + domClass.el + '">' ),
          thumbs = this.makeThumbs(),
          options = this.options,
          container = $( '<ul class="' + domClass.pagesContainer + '">' );

      this.el = el;
      this.thumbs = thumbs;
      this.container = container;

      this.paginateThumbs( thumbs );

      if ( thumbs.length > options.thumbsPerPage ) {
        this.setupNavigation();
      }

      el.append( container );
      return this;
    },

    calculateWidths : function() {
      var elWidth = this.el.width(),
          n = this.pages.length;
      this.container.css( { width: ( elWidth * n ) + 15 } );
    },

    paginateThumbs : function ( thumbs ) {
      var pages = this.pages,
          container = this.container,
          perPage = this.options.thumbsPerPage,
          rem, page;
      if ( thumbs.length > perPage ) {
        rem = thumbs.slice( perPage );
        thumbs = thumbs.slice( 0, perPage );
      }
      page = $( '<div class="' + domClass.page + '">' ).
        data( { index : pages.length } ).appendTo( container ).append( thumbs );
      pages.push( page );
      if ( rem && rem.length > 0 ) {
        this.paginateThumbs( rem );
      }
    },

  } );

  S.bindAll( {

    beforeSet : function ( e ) {
      var sshow = e.sshow,
          options = sshow.options,
          paginatedThumbs;
      if ( !sshow.paginatedThumbs ) {
        paginatedThumbs = new Plugin().init( sshow, options );
        $( sshow.el ).append( paginatedThumbs.el );
        paginatedThumbs.calculateWidths();
        sshow.paginatedThumbs = paginatedThumbs;
      }
    },

    afterSet : function( e ) {
      var sshow = e.sshow,
          paginatedThumbs = sshow.paginatedThumbs,
          thumbs = paginatedThumbs.thumbs,
          index = sshow.currentIndex;
      paginatedThumbs.setActive( thumbs.eq([ index ]) );
    }
  } );

  $.extend( S.defaultOptions, {
    thumbsPerPage : 9
  } );

})( jQuery, Sshow );
