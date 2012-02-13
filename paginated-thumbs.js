/*
 * paginated-thumbs
 * oriel plugin
 * http://github.com/mjhoy/sshowjs
 *
 * Michael Hoy | michael.john.hoy@gmail.com | 2012
 */

(function ( $, Oriel, undefined ) {

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

    this.oriel = undefined;
    this.pages = [];
    this.currentIndex = 0;

  };

  $.extend( Plugin.prototype, {

    init : function ( oriel, options ) {
      this.oriel = oriel;
      this.options = options;
      this.setupDom();
      return this;
    },

    makeThumbs : function() {
      var oriel = this.oriel,
          thumbs = $(),
          self = this;
      $.each( oriel.thumbs, function ( i, src ) {
        var full = oriel.fulls[i],
            thumb = $( '<li class="' + domClass.thumbContainer + '">' +
                        '<img class="' + domClass.thumb + '" src="' + src + '"></li>' );
        thumb.data( { full : full } );
        thumbs = thumbs.add( thumb );
        thumb.click( function ( e ) {
          self.setActive( thumb );
          oriel.set( i );
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

  Oriel.bindAll( {

    beforeSet : function ( e ) {
      var oriel = e.oriel,
          options = oriel.options,
          paginatedThumbs;
      if ( options.paginatedThumbs && !oriel.paginatedThumbs ) {
        paginatedThumbs = new Plugin().init( oriel, options );
        $( oriel.el ).append( paginatedThumbs.el );
        paginatedThumbs.calculateWidths();
        oriel.paginatedThumbs = paginatedThumbs;
      }
    },

    afterSet : function( e ) {
      var oriel = e.oriel,
          paginatedThumbs = oriel.paginatedThumbs;
      if ( paginatedThumbs ) {
        var thumbs = paginatedThumbs.thumbs,
            index = oriel.currentIndex;
        paginatedThumbs.setActive( thumbs.eq([ index ]) );
      }
    }
  } );

  $.extend( Oriel.defaultOptions, {
    paginatedThumbs : false,
    thumbsPerPage : 9
  } );

})( jQuery, Oriel );
