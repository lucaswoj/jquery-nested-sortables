$.fn.nestedSortable = function(settings) {

    var settings = $.extend({
        nestable: 'li',
        container: 'ul',
        indent: 30,
        handle: null,
        opacity: 1,
        placeholderClass: 'placeholder',
        helperClass: 'helper',
        appendTo: 'parent',
        start: function() {},
        stop: function() {},
        drag: function() {},
        maxDepth: null,
		disableSelect: true
    }, settings);

    settings.snapTolerance = settings.indent * 0.4;

    this.each(function() {

        // The top level nestable list container
        var $root = $(this);

        // Create an element used to preview the location of the dragged element in the nested list
        var $placeholder = $('<div/>', {
            "class": settings.placeholderClass
        });

        // Use the live mouseover event to bind to nestables as they are created
        $root.find(settings.nestable).live("mouseover", function() {

			// $this will point to the targeted nestable
            var $this = $(this);

            // Check if the element has already been set up as a nestable
            if (!$this.data("nestable")) {

                // Make the element draggable and attach special nested draggable code
                $this.draggable({

                    // Transfer over some settings to jQuery's draggable implementation
                    opacity: settings.opacity,
                    handle: settings.handle,
                    appendTo: settings.appendTo,

                    // Create an element which will follow the mouse to show the user what they are dragging
                    helper: function() {
                        return $this.clone().width($this.width()).addClass(settings.helperClass);
                    },

                    // When dragging starts
                    start: function() {

                        // Hide the original and initialize the placeholder on top of the starting position
                        $this.hide().after($placeholder);

                        // Find the depth of the deepest nested child and cache it for later
                        var maxChildDepth = 0;
                        $this.find(settings.nestable).each(function(index, child) {
                            var $child = $(child);
                            var childDepth = $child.parentsUntil($this).filter(settings.nestable).length;
                            if (childDepth > maxChildDepth) {
                                maxChildDepth = childDepth;
                            }
                        });
                        $this.data("maxChildDepth", maxChildDepth);

						if (settings.disableSelect) {
							$("html").css({
								"-moz-user-select": "none",
								"-khtml-user-select": "none",
								"-webkit-user-select": "none",
								"user-select": "none"
							});
						}

                        // Run a custom start function specitifed in the settings
                        settings.start.apply(this);

                    },

                    // Runs at each "step" during the drag
                    drag: function(event, ui) {

                        var largestY = 0;
                        var depth;
						var underItem;
                        var maxChildDepth = $this.data("maxChildDepth");

						// Cycle through all nestables in this nested list looking for the one directly under the helper
                        $root.find(settings.nestable).each(function(item) {

                            $item = $(item);
							itemOffset = $item.offset();

                            // Is the item being checked below the one being dragged and above the previous lowest element?
                            if (! ((itemOffset.top < ui.position.top) && (itemOffset.top > largestY)))
                                return;

                            // Is the item being checked on the right nesting level for the dragged item's horizantal position?
                            if (itemOffset.left - settings.snapTolerance >= ui.position.left)
                                return;

                            // Is the item being checked part of the helper?
                            if (ui.helper.find($item).length)
                                return;

                            // Does this item comply with max depth rules?
                            if (settings.maxDepth) {
                                depth = $item.parentsUntil($root).filter(settings.container).length + maxChildDepth;
                                if (depth - 1 > settings.maxDepth) {
                                    return;
                                }
                            }

                            // If we've got this far, its a match
                            largestY = itemOffset.top;
							underItem = item;

                        });

                        // If there is no underItem, check if we should place the dragged item at the beginning of the list
                        if (!underItem) {

							// Find the first nestable
                            var firstItem = $root.find(settings.nestable + ":first");

							// Check if the positioning looks good. If so, put the placeholder in position
                            if ((firstItem.offset().top < ui.position.top + $(this).height()) && (firstItem.offset().top > ui.position.top)) {
                                $root.prepend($placeholder);
                            }

                        // Place the placeholder inside or after the item underneath, depending on their relative x coordinates
                        } else {

                            // Should the dragged item be nested?
                            if ((underItem.offset().left + settings.indent - settings.snapTolerance < ui.position.left) && (settings.maxDepth === null || depth < settings.maxDepth)) {
                                underItem.children(settings.container).prepend($placeholder);

                                // … or should it just be placed after
                            } else {
                                underItem.after($placeholder);
                            }
                        }

                        // Run a custom drag callback specitifed in the settings
                        settings.drag.apply(this);

                    },

					// When dragging ends
                    stop: function(event, ui) {
	
                        // Replace the placeholder with the original
                        $placeholder.after($this.show()).remove();

						if (settings.disableSelect) {
							$("html").css({
								"-moz-user-select": "",
								"-khtml-user-select": "",
								"-webkit-user-select": "",
								"user-select": ""
							});
						}

                        // Run a custom stop function specitifed in the settings
                        settings.stop.apply(this);
                    }

                }).data("nestable", true);
            }
        });
    });
    return this;
};