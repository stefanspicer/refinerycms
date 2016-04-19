function initBlockquote($new_elem) {
  $new_elem.addClass('blockquote');
  var $footer = $new_elem.find('footer');
  if ($footer.length == 0) {
    $footer = $('<footer glass-placeholder="Optional Source work or person"></footer>');
    $new_elem.append($footer);
  }
  $footer.addClass('blockquote-footer');
}

GlassControl.on('global', 'pre-init', function() {
  grande.setMenuCallback("blockquote", function (option, context) {
    var this_module = GlassContentEditing.getParentModule($(context['parent_element']));
    var $elem = this_module.element();
    if ($elem.prop("nodeName") == "BLOCKQUOTE") {
      var $new_elem = $("<p />");
      $new_elem.insertBefore($elem).append($elem.contents());
      $new_elem.find('footer').remove();
      $elem.remove();
    }
    else {
      var $new_elem = $("<blockquote />");
      $new_elem.insertBefore($elem).append($elem.contents());
      initBlockquote($new_elem);
      $elem.remove();
    }
    grande.hideMenu();
  });

  GlassHtmlEditor.preserveAttrs('blockquote', ['class'], '.blockquote');
  GlassHtmlEditor.preserveAttrs('footer',     ['class'], '.blockquote-footer');
});

GlassModule.on('blockquote', 'init', function(this_module) {
  initBlockquote(this_module.element());
});

GlassModule.on('global', 'serialize', function($wrapper) {
  $wrapper.find('.blockquote-footer').filter(function(i) {
    return $(this).text().trim().length < 2;
  }).remove();
});
