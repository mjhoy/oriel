(function ( $, undefined ) {

  $(function() {

    $( 'a.toggle-source' ).each( function ( i, e ) {

      var ln = $( this ),
          // Start out hiding the source target
          target = $(ln.attr('href')).hide(),
          slideshow = $(ln.data('slideshow')),
          targetHidden = true;

      ln.click( function ( e ) {

        var text = $( this ).html();

        if ( targetHidden ) {
          target.fadeIn(100);
          slideshow.hide();
          text = text.replace('source', 'slideshow')
        } else {
          target.fadeOut(100, function() {
            slideshow.show();
          });
          text = text.replace('slideshow', 'source')
        }
        $( this ).html( text );
        targetHidden = !targetHidden;
        return false;

      });


    });

  });

})(jQuery);

