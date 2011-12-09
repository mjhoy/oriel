/*
 * paginated-thumbs
 * sshowjs plugin
 * http://github.com/mjhoy/sshowjs
 *
 * mjhoy | 2011
 */

(function ( $, S, undefined ) {

  var domClass = {
    el : 'paginated-thumbs',
    thumb : 'pt-thumb',
    thumbContainer : 'pt-thumb-container',
    page : 'pt-page',
    pagesContainer : 'pt-pages-container'
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
          thumbs = $();
      $.each( sshow.thumbs, function ( i, src ) {
        var full = sshow.fulls[i],
            thumb = $( '<li class="' + domClass.thumbContainer + '">' +
                        '<img class="' + domClass.thumb + '" ' +
                              'width="75" src="' + src + '" ' +
                              'data-full="' + full + '"></li>' );
        thumbs = thumbs.add( thumb );
      } );
      return thumbs;
    },

    next : function ( e ) {
      console.log( 'next', e );
    },

    prev : function ( e ) {
      console.log( 'prev', e );
    },

    setupNavigation : function() {
      var self = this,
          el = this.el,
          navigation = $( '<nav class="' + domClass.navigation + '">' ),
          prev = $( '<a class="' + domClass.prev + '">&lt;&lt;</a>' ),
          spacer = $( '<span class="' + domClass.spacer + '">&nbsp;</span>' ),
          next = $( '<a class="' + domClass.next + '">&gt;&gt;</a>' );

      navigation.append( prev, spacer, next );

      prev.bind( 'click', function ( e ) { self.prev( e ); } );
      next.bind( 'click', function ( e ) { self.next( e ); } );

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

      this.container = container;
      this.paginateThumbs( thumbs );

      if ( thumbs.length > options.thumbsPerPage ) {
        this.setupNavigation();
      }

      el.append( container );
      return this;
    },

    paginateThumbs : function( thumbs ) {
      var pages = this.pages,
          container = this.container,
          perPage = this.options.thumbsPerPage,
          rem, page;
      if ( thumbs.length > perPage ) {
        rem = thumbs.slice( perPage );
        thumbs = thumbs.slice( 0, perPage );
      }
      page = $( '<div class="' + domClass.page + '" ' + 
                       ' data-page="' + pages.length + '">' ).
        appendTo( container ).append( thumbs );
      pages.push( page );
      if ( rem && rem.length > 0 ) {
        this.paginateThumbs( rem );
      }
    },

  } );

  S.bindAll( {
    afterInit : function ( e ) {
      var sshow = e.sshow,
          options = sshow.options,
          paginatedThumbs = new Plugin().init( sshow, options );
      $( sshow.el ).append( paginatedThumbs.el );
    }
  } );

  $.extend( S.defaultOptions, {
    thumbsPerPage : 9
  } );

})( jQuery, Sshow );
