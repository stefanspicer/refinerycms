var GlassImageEditing = (function ($) {
  var toggle_img_weight_btns = function (e) {
    var $container = $(this).parents('.module-options');
    var is_weight_btn = $(this).parents('.weight-controls-container').length > 0;
    $container.children().hide();
    (is_weight_btn ? $container.children().not('.weight-controls-container') : $container.find('.weight-controls-container')).fadeIn();
  };

  $(document).on('content-ready', function (e, element) {
    var $weight_show_btns = $(element).find('.image-weight-edit-btn');
    var $weight_btns = $(element).find('.weight-controls-container .btn');

    if ($weight_show_btns.length > 0 && $weight_btns.length > 0) {
      $weight_show_btns.click(toggle_img_weight_btns);

      $weight_btns.click(function (e) {
        toggle_img_weight_btns.call(this, e);
        var gravity_mapping = {
          nw: 'bg-t-l',
          n:  'bg-t-c',
          ne: 'bg-t-r',
          w:  'bg-c-l',
          c:  'bg-c-c',
          e:  'bg-c-r',
          sw: 'bg-b-l',
          s:  'bg-b-c',
          se: 'bg-b-r'
        };
        var image_input_id = $(this).parents('.weight-controls-container').data('image-input-id');
        var $preview_divs = $('[data-image-bg-id="' + image_input_id + '"]')
        for (var g in gravity_mapping) {
          $preview_divs.removeClass(gravity_mapping[g]);
        }
        $preview_divs.addClass(gravity_mapping[$(this).data('gravity')]);

        $.ajax({
          url: $('#img-upload-form').attr('action') + '/' + $('#' + image_input_id).val(),
          type: 'PATCH',
          data: { image: { gravity: $(this).data('gravity')}}
        })
        .done(function() {
          console.log("FIXME: updated image - success!");
        })
        .fail(function() {
          console.log("FIXME: updated image - fail :(");
        })
        .always(function() {
        });
      });
    }
  });

  // Return API for other modules
  return {
  };
})(jQuery);
