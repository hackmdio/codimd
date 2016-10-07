/*
 * jQuery ScrollSpy Plugin
 * Author: @sxalexander, softwarespot
 * Licensed under the MIT license
 */
(function jQueryScrollspy(window, $) {
    // Plugin Logic

    $.fn.extend({
        scrollspy: function scrollspy(options, action) {
            // If the options parameter is a string, then assume it's an 'action', therefore swap the parameters around
            if (_isString(options)) {
                var tempOptions = action;

                // Set the action as the option parameter
                action = options;

                // Set to be the reference action pointed to
                options = tempOptions;
            }

            // override the default options with those passed to the plugin
            options = $.extend({}, _defaults, options);

            // sanitize the following option with the default value if the predicate fails
            _sanitizeOption(options, _defaults, 'container', _isObject);

            // cache the jQuery object
            var $container = $(options.container);

            // check if it's a valid jQuery selector
            if ($container.length === 0) {
                return this;
            }

            // sanitize the following option with the default value if the predicate fails
            _sanitizeOption(options, _defaults, 'namespace', _isString);

            // check if the action is set to DESTROY/destroy
            if (_isString(action) && action.toUpperCase() === 'DESTROY') {
                $container.off('scroll.' + options.namespace);
                return this;
            }

            // sanitize the following options with the default values if the predicates fails
            _sanitizeOption(options, _defaults, 'buffer', $.isNumeric);
            _sanitizeOption(options, _defaults, 'max', $.isNumeric);
            _sanitizeOption(options, _defaults, 'min', $.isNumeric);

            // callbacks
            _sanitizeOption(options, _defaults, 'onEnter', $.isFunction);
            _sanitizeOption(options, _defaults, 'onLeave', $.isFunction);
            _sanitizeOption(options, _defaults, 'onLeaveTop', $.isFunction);
            _sanitizeOption(options, _defaults, 'onLeaveBottom', $.isFunction);
            _sanitizeOption(options, _defaults, 'onTick', $.isFunction);

            if ($.isFunction(options.max)) {
                options.max = options.max();
            }

            if ($.isFunction(options.min)) {
                options.min = options.min();
            }

            // check if the mode is set to VERTICAL/vertical
            var isVertical = window.String(options.mode).toUpperCase() === 'VERTICAL';

            return this.each(function each() {
                // cache this
                var _this = this;

                // cache the jQuery object
                var $element = $(_this);

                // count the number of times a container is entered
                var enters = 0;

                // determine if the scroll is with inside the container
                var inside = false;

                // count the number of times a container is left
                var leaves = 0;

                // create a scroll listener for the container
                $container.on('scroll.' + options.namespace, function onScroll() {
                    // cache the jQuery object
                    var $this = $(this);

                    // create a position object literal
                    var position = {
                        top: $this.scrollTop(),
                        left: $this.scrollLeft(),
                    };

                    var containerHeight = $container.height();

                    var max = options.max;

                    var min = options.min;

                    var xAndY = isVertical ? position.top + options.buffer : position.left + options.buffer;

                    if (max === 0) {
                        // get the maximum value based on either the height or the outer width
                        max = isVertical ? containerHeight : $container.outerWidth() + $element.outerWidth();
                    }

                    // if we have reached the minimum bound, though are below the max
                    if (xAndY >= min && xAndY <= max) {
                        // trigger the 'scrollEnter' event
                        if (!inside) {
                            inside = true;
                            enters++;

                            // trigger the 'scrollEnter' event
                            $element.trigger('scrollEnter', {
                                position: position,
                            });

                            // call the 'onEnter' function
                            if (options.onEnter !== null) {
                                options.onEnter(_this, position);
                            }
                        }

                        // trigger the 'scrollTick' event
                        $element.trigger('scrollTick', {
                            position: position,
                            inside: inside,
                            enters: enters,
                            leaves: leaves,
                        });

                        // call the 'onTick' function
                        if (options.onTick !== null) {
                            options.onTick(_this, position, inside, enters, leaves);
                        }
                    } else {
                        if (inside) {
                            inside = false;
                            leaves++;

                            // trigger the 'scrollLeave' event
                            $element.trigger('scrollLeave', {
                                position: position,
                                leaves: leaves,
                            });

                            // call the 'onLeave' function
                            if (options.onLeave !== null) {
                                options.onLeave(_this, position);
                            }

                            if (xAndY <= min) {
                                // trigger the 'scrollLeaveTop' event
                                $element.trigger('scrollLeaveTop', {
                                    position: position,
                                    leaves: leaves,
                                });

                                // call the 'onLeaveTop' function
                                if (options.onLeaveTop !== null) {
                                    options.onLeaveTop(_this, position);
                                }
                            } else if (xAndY >= max) {
                                // trigger the 'scrollLeaveBottom' event
                                $element.trigger('scrollLeaveBottom', {
                                    position: position,
                                    leaves: leaves,
                                });

                                // call the 'onLeaveBottom' function
                                if (options.onLeaveBottom !== null) {
                                    options.onLeaveBottom(_this, position);
                                }
                            }
                        } else {
                            // Idea taken from: http://stackoverflow.com/questions/5353934/check-if-element-is-visible-on-screen
                            var containerScrollTop = $container.scrollTop();

                            // Get the element height
                            var elementHeight = $element.height();

                            // Get the element offset
                            var elementOffsetTop = $element.offset().top;

                            if ((elementOffsetTop < (containerHeight + containerScrollTop)) && (elementOffsetTop > (containerScrollTop - elementHeight))) {
                                // trigger the 'scrollView' event
                                $element.trigger('scrollView', {
                                    position: position,
                                });

                                // call the 'onView' function
                                if (options.onView !== null) {
                                    options.onView(_this, position);
                                }
                            }
                        }
                    }
                });
            });
        },
    });

    // Fields (Private)

    // Defaults

    // default options
    var _defaults = {
        // the offset to be applied to the left and top positions of the container
        buffer: 0,

        // the element to apply the 'scrolling' event to (default window)
        container: window,

        // the maximum value of the X or Y coordinate, depending on mode the selected
        max: 0,

        // the maximum value of the X or Y coordinate, depending on mode the selected
        min: 0,

        // whether to listen to the X (horizontal) or Y (vertical) scrolling
        mode: 'vertical',

        // namespace to append to the 'scroll' event
        namespace: 'scrollspy',

        // call the following callback function every time the user enters the min / max zone
        onEnter: null,

        // call the following callback function every time the user leaves the min / max zone
        onLeave: null,

        // call the following callback function every time the user leaves the top zone
        onLeaveTop: null,

        // call the following callback function every time the user leaves the bottom zone
        onLeaveBottom: null,

        // call the following callback function on each scroll event within the min and max parameters
        onTick: null,

        // call the following callback function on each scroll event when the element is inside the viewable view port
        onView: null,
    };

    // Methods (Private)

    // check if a value is an object datatype
    function _isObject(value) {
        return $.type(value) === 'object';
    }

    // check if a value is a string datatype with a length greater than zero when whitespace is stripped
    function _isString(value) {
        return $.type(value) === 'string' && $.trim(value).length > 0;
    }

    // check if an option is correctly formatted using a predicate; otherwise, return the default value
    function _sanitizeOption(options, defaults, property, predicate) {
        // set the property to the default value if the predicate returned false
        if (!predicate(options[property])) {
            options[property] = defaults[property];
        }
    }
}(window, window.jQuery));
