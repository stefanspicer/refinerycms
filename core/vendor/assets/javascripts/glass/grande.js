(function() {
  /*jshint multistr:true */
  var EDGE = -999;

  var root = this,   // Root object, this is going to be the window for now
      document = this.document, // Safely store a document here for us to use
      editableNodes = document.querySelectorAll(".highlight-menu-wrapper article"),
      editNode = editableNodes[0], // TODO: cross el support for imageUpload
      isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
      options = {
        animate: true
      },
      menu_meta = {
        "b":          {"tagname": "b",          "position": 10, "icon_slug": "bold"},
        "i":          {"tagname": "i",          "position": 15, "icon_slug": "italic"},
        "h2":         {"tagname": "h2",         "position": 22, "icon_slug": "heading", "extra_html": "<sub>1</sub>"},
        "h3":         {"tagname": "h3",         "position": 23, "icon_slug": "heading", "extra_html": "<sub>2</sub>"},
        "blockquote": {"tagname": "blockquote", "position": 30, "icon_slug": "quote"},
      },
      textMenu,
      optionsNode,
      //previouslySelectedText,
      imageTooltip,
      imageInput,
      imageBound;

      grande = {
        bind: function(bindableNodes, opts) {
          if (bindableNodes) {
            editableNodes = bindableNodes;
          }

          options = opts || options;

          attachToolbarTemplate();
          bindTextSelectionEvents();
          recreateAndBindHighlightMenu();
        },
        select: function() {
          triggerTextSelection();
        },
        hideMenu: function() {
          textMenu.className = "highlight-menu hide";
        },
        addMenuItem: function(item_id, item) {
          menu_meta[item_id] = item;
          recreateAndBindHighlightMenu();
        },
        setMenuCallback: function(item_id, cb) {
          if (!(item_id in menu_meta)) {
            menu_meta[item_id] = {};
          }
          menu_meta[item_id]["callback"] = cb;
        },
      };

  function attachToolbarTemplate() {
    var div = document.createElement("div"),
        toolbarTemplate = "<div class='highlight-menu-inner glass-ui'> \
          <span class='menu-buttons'> \
          </span> \
        </div>",
        imageTooltipTemplate = document.createElement("div"),
        toolbarContainer = document.createElement("div");


    toolbarContainer.className = "highlight-menu-wrapper";
    document.body.appendChild(toolbarContainer);

    imageTooltipTemplate.innerHTML = "<div class='pos-abs file-label'>Insert image</div> \
                                        <input class='file-hidden pos-abs' type='file' id='files' name='files[]' accept='image/*' multiple/>";
    imageTooltipTemplate.className = "image-tooltip hide";

    div.className = "highlight-menu hide";
    div.innerHTML = toolbarTemplate;

    if (document.querySelectorAll(".highlight-menu").length === 0) {
      toolbarContainer.appendChild(div);
      toolbarContainer.appendChild(imageTooltipTemplate);
    }

    imageInput = document.querySelectorAll(".file-label + input")[0];
    imageTooltip = document.querySelectorAll(".image-tooltip")[0];
    textMenu = document.querySelectorAll(".highlight-menu")[0];
    optionsNode = document.querySelectorAll(".highlight-menu .highlight-menu-inner")[0];
  }

  function bindTextSelectionEvents() {
    var i,
        len,
        node;

    // Trigger on both mousedown and mouseup so that the click on the menu
    // feels more instantaneously active
    //document.onmousedown = triggerTextSelection;
    //document.onmouseup = function(event) {
    //  setTimeout(function() {
    //    triggerTextSelection(event);
    //  }, 1);
    //};

    document.onkeydown = preprocessKeyDown;

    $(editableNodes).on('keyup', function(event){
      var sel = window.getSelection();

      // FF will return sel.anchorNode to be the parentNode when the triggered keyCode is 13
      if (sel.anchorNode && sel.anchorNode.nodeName !== "ARTICLE") {
        triggerNodeAnalysis(event);

        if (sel.isCollapsed) {
          triggerTextParse(event);
        }
      }
    });

    // Handle window resize events
    root.onresize = triggerTextSelection;

    if (options.allowImages) {
      imageTooltip.onmousedown = triggerImageUpload;
      imageInput.onchange = uploadImage;
      document.onmousemove = triggerOverlayStyling;
    }

    for (i = 0, len = editableNodes.length; i < len; i++) {
      node = editableNodes[i];
      node.contentEditable = true;
      node.onmousedown = node.onkeyup = node.onmouseup = triggerTextSelection;
    }
  }

  function triggerOverlayStyling(event) {
    toggleImageTooltip(event, event.target);
  }

  function triggerImageUpload(event) {
    // Cache the bound that was originally clicked on before the image upload
    var childrenNodes = editNode.children,
        editBounds = editNode.getBoundingClientRect();

    imageBound = getHorizontalBounds(childrenNodes, editBounds, event);
  }

  function uploadImage(event) {
    // Only allow uploading of 1 image for now, this is the first file
    var file = this.files[0],
        reader = new FileReader(),
        figEl;

    reader.onload = (function(f) {
      return function(e) {
        figEl = document.createElement("figure");
        figEl.innerHTML = "<img src=\"" + e.target.result + "\"/>";
        editNode.insertBefore(figEl, imageBound.bottomElement);
      };
    }(file));

    reader.readAsDataURL(file);
  }

  function toggleImageTooltip(event, element) {
    var childrenNodes = editNode.children,
        editBounds = editNode.getBoundingClientRect(),
        bound = getHorizontalBounds(childrenNodes, editBounds, event);

    if (bound) {
      imageTooltip.style.left = (editBounds.left - 90 ) + "px";
      imageTooltip.style.top = (bound.top - 17) + "px";
    } else {
      imageTooltip.style.left = EDGE + "px";
      imageTooltip.style.top = EDGE + "px";
    }
  }

  function getHorizontalBounds(nodes, target, event) {
    var bounds = [],
        bound,
        i,
        len,
        preNode,
        postNode,
        bottomBound,
        topBound,
        coordY;

    // Compute top and bottom bounds for each child element
    for (i = 0, len = nodes.length - 1; i < len; i++) {
      preNode = nodes[i];
      postNode = nodes[i+1] || null;

      bottomBound = preNode.getBoundingClientRect().bottom - 5;
      topBound = postNode.getBoundingClientRect().top;

      bounds.push({
        top: topBound,
        bottom: bottomBound,
        topElement: preNode,
        bottomElement: postNode,
        index: i+1
      });
    }

    coordY = event.pageY - root.scrollY;

    // Find if there is a range to insert the image tooltip between two elements
    for (i = 0, len = bounds.length; i < len; i++) {
      bound = bounds[i];
      if (coordY < bound.top && coordY > bound.bottom) {
        return bound;
      }
    }

    return null;
  }

  function iterateTextMenuButtons(callback) {
    var textMenuButtons = document.querySelectorAll(".highlight-menu button"),
        i,
        len,
        node,
        fnCallback = function(n) {
          callback(n);
        };

    for (i = 0, len = textMenuButtons.length; i < len; i++) {
      node = textMenuButtons[i];

      fnCallback(node);
    }
  }

  function recreateAndBindHighlightMenu() {
    // create a new menu
    var menu_btns = $.map(menu_meta, function(v, k) { return $.extend({"id": k}, v); })
                    .sort(function(a, b) {return a.position - b.position})
                    .map(function(o) {
                      return [
                        "<button data-option-id='" + o['id'] + "'>",
                          "<i class='icon icon-" + o['icon_slug'] + "'></i>",
                          ('extra_html' in o) ? o['extra_html'] : '',
                        "</button>"
                      ].join('');
                    })
                    .join('');
    $('.highlight-menu-inner .menu-buttons').html(menu_btns);

    // bind events
    iterateTextMenuButtons(function(node) {
      node.onmousedown = function(event) {
        triggerTextStyling(node);
      };
    });
  }

  function getFocusNode() {
    return root.getSelection().focusNode;
  }

  function reloadMenuState() {
    var className,
        focusNode = getFocusNode(),
        tagClass,
        reTag;

    // for each menu_item
    iterateTextMenuButtons(function(menu_item) {
      $(menu_item).removeClass('active');

      var option = menu_meta[$(menu_item).data('option-id')];
      if ("tagname" in option && hasParentWithTag(focusNode, option["tagname"])) {
        $(menu_item).addClass('active');
      }
    });
  }

  function preprocessKeyDown(event) {
    var sel = window.getSelection(),
        parentParagraph = getParentWithTag(sel.anchorNode, "p"),
        p,
        isHr;

    if (event.keyCode === 13 && parentParagraph) {
      prevSibling = parentParagraph.previousSibling;
      isHr = prevSibling && prevSibling.nodeName === "HR" &&
        !parentParagraph.textContent.length;

      // Stop enters from creating another <p> after a <hr> on enter
      if (isHr) {
        event.preventDefault();
      }
    }
  }

  function triggerNodeAnalysis(event) {
    var sel = window.getSelection(),
        anchorNode,
        parentParagraph;

    if (event.keyCode === 13) { // || event.keyCode === 8) { // When first module is an <ol>
      // Enters should replace it's parent <div> with a <p>
      if (sel.anchorNode.nodeName === "DIV") {
        toggleFormatBlock("p");
        $(document).trigger('new-p');
      }

      parentParagraph = getParentWithTag(sel.anchorNode, "p");

      if (parentParagraph) {
        insertHorizontalRule(parentParagraph);
      }
    }
  }

  function insertHorizontalRule(parentParagraph) {
    var prevSibling,
        prevPrevSibling,
        hr;

    prevSibling = parentParagraph.previousSibling;
    if (prevSibling.nodeName === "A") {
      prevSibling = prevSibling.previousSibling;
    }
    prevPrevSibling = prevSibling.previousSibling;

    if (!parentParagraph.textContent.length && prevSibling.nodeName === "P" && !prevSibling.textContent.length && prevPrevSibling.nodeName !== "HR") {
      hr = document.createElement("hr");
      hr.contentEditable = false;
      parentParagraph.parentNode.replaceChild(hr, prevSibling);
    }
  }

  function getTextProp(el) {
    var textProp;

    if (el.nodeType === Node.TEXT_NODE) {
      textProp = "data";
    } else if (isFirefox) {
      textProp = "textContent";
    } else {
      textProp = "innerText";
    }

    return textProp;
  }

  function insertListOnSelection(sel, textProp, listType) {
    var execListCommand = listType === "ol" ? "insertOrderedList" : "insertUnorderedList",
        nodeOffset = listType === "ol" ? 3 : 2;

    document.execCommand(execListCommand);
    sel.anchorNode[textProp] = sel.anchorNode[textProp].substring(nodeOffset);

    return getParentWithTag(sel.anchorNode, listType);
  }

  function triggerTextParse(event) {
    var sel = window.getSelection(),
        textProp,
        subject,
        insertedNode,
        unwrap,
        node,
        parent,
        range;

    // FF will return sel.anchorNode to be the parentNode when the triggered keyCode is 13
    if (!sel.isCollapsed || !sel.anchorNode || sel.anchorNode.nodeName === "ARTICLE") {
      return;
    }

    textProp = getTextProp(sel.anchorNode);
    subject = sel.anchorNode[textProp];

    if (subject.match(/^[-*]\s/) && sel.anchorNode.parentNode.nodeName !== "LI") {
      insertedNode = insertListOnSelection(sel, textProp, "ul");
    }

    if (subject.match(/^1\.\s/) && sel.anchorNode.parentNode.nodeName !== "LI") {
      insertedNode = insertListOnSelection(sel, textProp, "ol");
    }

    unwrap = insertedNode &&
            ["ul", "ol"].indexOf(insertedNode.nodeName.toLocaleLowerCase()) >= 0 &&
            ["p", "div"].indexOf(insertedNode.parentNode.nodeName.toLocaleLowerCase()) >= 0 &&
            !$(insertedNode.parentNode).hasClass('glass-edit')

    if (unwrap) {
      node = sel.anchorNode;
      parent = insertedNode.parentNode;
      parent.parentNode.insertBefore(insertedNode, parent);
      parent.parentNode.removeChild(parent);
      moveCursorToBeginningOfSelection(sel, node);
    }
  }

  function moveCursorToBeginningOfSelection(selection, node) {
    range = document.createRange();
    range.setStart(node, 0);
    range.setEnd(node, 0);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function triggerTextStyling(menu_item) {
    var option = menu_meta[$(menu_item).data('option-id')],
        sel = window.getSelection(),
        selNode = sel.anchorNode;

    switch(option["tagname"]) {
      case "b":
        if (selNode && !hasParentWithTag(selNode, "h1") && !hasParentWithTag(selNode, "h2")) {
          document.execCommand("bold", false);
        }
        break;
      case "i":
        document.execCommand("italic", false);
        break;
      case "h1":
      case "h2":
      case "h3":
        toggleFormatBlock(option["tagname"]);
        break;
    }

    if ("callback" in option) {
      var p = getParent(getFocusNode(), function(n) {return n.nodeName != "#text";}, function(n) {return n;});
      option["callback"](option, {"selection": sel, "parent_element": p});
    }

    reloadMenuState();
  }

  function toggleFormatBlock(tag) {
    if (hasParentWithTag(getFocusNode(), tag)) {
      document.execCommand("formatBlock", false, "p");
      document.execCommand("outdent");
    } else {
      document.execCommand("formatBlock", false, tag);
    }
  }

  function getParent(node, condition, returnCallback) {
    if (node === null) {
      return;
    }

    while (node.parentNode) {
      if (condition(node)) {
        return returnCallback(node);
      }

      node = node.parentNode;
    }
  }

  function getParentWithTag(node, nodeType) {
    var checkNodeType = function(node) { return node.nodeName.toLowerCase() === nodeType; },
        returnNode = function(node) { return node; };

    return getParent(node, checkNodeType, returnNode);
  }

  function hasParentWithTag(node, nodeType) {
    return !!getParentWithTag(node, nodeType);
  }

  function getParentHref(node) {
    var checkHref = function(node) { return typeof node.href !== "undefined"; },
        returnHref = function(node) { return node.href; };

    return getParent(node, checkHref, returnHref);
  }

  function triggerTextSelection(e) {
    var selectedText = root.getSelection(),
        range,
        clientRectBounds,
        target = e.target || e.srcElement;

    // The selected text is not editable
    if (!target.isContentEditable) {
      reloadMenuState();
      return;
    }

    // The selected text is collapsed, push the menu out of the way
    if (selectedText.isCollapsed) {
      setTextMenuPosition(EDGE, EDGE);
      textMenu.className = "highlight-menu hide";

      // if (hasParentWithTag(getFocusNode(), 'a')) // TODO - show the url input menu here
    } else {
      range = selectedText.getRangeAt(0);
      clientRectBounds = range.getBoundingClientRect();

      // Every time we show the menu, reload the state
      reloadMenuState();
      setTextMenuPosition(
        clientRectBounds.top - 5 + root.pageYOffset,
        (clientRectBounds.left + clientRectBounds.right) / 2
      );
    }
  }

  function setTextMenuPosition(top, left) {
    textMenu.style.top = top + "px";
    textMenu.style.left = left + "px";

    if (options.animate) {
      if (top === EDGE) {
        textMenu.className = "highlight-menu hide";
      } else {
        textMenu.className = "highlight-menu active";
      }
    }
  }

  root.grande = grande;

}).call(this);
