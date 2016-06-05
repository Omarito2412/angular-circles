/*jslint indent: 4, maxlen: 80 */
/*globals angular, Circles */

(function (ng, Circles) {
    'use strict';

    var // Constants
        DEFAULT_SETTINGS,
        POSSIBLE_SETTINGS,
        RESIZE_WAIT = 133,
        DEBOUNCE_WAIT = 10,

        // Variables
        ngCircles = ng.module('angular-circles', []),
        iteration = 0,
        currentSettings = {},

        // Functions
        debounce;

    DEFAULT_SETTINGS = {
        radius: 5,
        value: 50,
        maxValue: 100,
        width: 10,
        text: function (value) {
            return value + '%';
        },
        colors: ['#bdc3c7', '#2980b9'],
        duration: 0,
        wrpClass: 'circles-wrp',
        textClass: 'circles-text',
        valueStrokeClass: 'circles-valueStroke',
        maxValueStrokeClass: 'circles-maxValueStroke'
    };

    POSSIBLE_SETTINGS = [
        'radius', 'maxValue', 'width', 'text',
        'colors', 'duration', 'wrpClass', 'textClass',
        'valueStrokeClass', 'maxValueStrokeClass'
    ];

    // Source: http://goo.gl/c3mZHP
    debounce = function (func, wait) {
        /*global setTimeout */
        var timeout,
            args,
            context,
            timestamp;

        return function () {
            context = this;
            args = [].slice.call(arguments, 0);
            timestamp = new Date();

            var later = function () {
                var last = (new Date()) - timestamp;

                if (last < wait) {
                    timeout = setTimeout(later, wait - last);
                } else {
                    timeout = null;
                    func.apply(context, args);
                }
            };

            if (!timeout) {
                timeout = setTimeout(later, wait);
            }
        };
    };

    ngCircles.provider('ngCirclesSettings', [function () {
        var self = this,
            $get,
            set;

        $get = function () {
            return currentSettings;
        };

        set = function (settingsObject) {
            ng.extend(currentSettings, settingsObject);
        };

        ng.extend(currentSettings, DEFAULT_SETTINGS);

        self.$get = $get;
        self.set = set;
    }]);

    ngCircles.directive('ngCircles', ['$window', 'ngCirclesSettings', function (
        $window,
        ngCirclesSettings
    ) {
        var link;

        link = function (scope, element) {
            var // Variables
                self = scope,
                elementId = 'ng-circles-' + iteration,
                settings = ngCirclesSettings,
                attrsSettings = {},
                circle,

                // Functions
                debouncedCircleUpdate,
                onResize;

            debouncedCircleUpdate = debounce(function (force) {
                scope.$apply(function () {
                    circle.update(self.value);

                    if (force) {
                        circle.update(true);
                    }
                });
            }, DEBOUNCE_WAIT);

            onResize = debounce(function () {
                var newWidth = element[0].offsetWidth;

                circle.updateRadius(
                    newWidth / 2
                );

                circle.updateWidth(
                    (newWidth / 2) * (attrsSettings.width / 100)
                );
            }, RESIZE_WAIT);

            element[0].id = elementId;
            iteration += 1;

            ng.forEach(POSSIBLE_SETTINGS, function (setting) {
                if (ng.isDefined(self[setting])) {
                    attrsSettings[setting] = self[setting];
                } else {
                    attrsSettings[setting] = ngCirclesSettings[setting];
                }
            });

            if (ng.isUndefined(self.value) ||
                    self.value === null ||
                    isNaN(self.value)) {
                throw new Error(
                    'ngCircles: Your value does not exists, or is NaN!'
                );
            }

            if (settings.width > 100 || settings.width < 1 ||
                    attrsSettings.width > 100 || attrsSettings.width < 1) {
                throw new Error(
                    'ngCircles: The width setting has to be between 1 & 100!'
                );
            }

            circle = Circles.create(ng.extend({}, settings, attrsSettings, {
                id: elementId,
                value: self.value
            }));

            if (self.text) {
                var getType = {};
                getType.toString.call(self.text);
                if(getType === '[object Function]'){
                    self.$watch(function () {
                        return [
                            self.value,
                            self.text(self.value)
                        ];
                    }, function (newReturned, oldReturned) {
                        if (!ng.equals(newReturned, oldReturned)) {
                            debouncedCircleUpdate(true);
                        }
                    }, true);
                }
            } else {
                self.$watch('value', function () {
                    debouncedCircleUpdate();
                });
            }

            if (self.colors) {
                self.$watch('colors', function (newColors) {
                    circle.updateColors(newColors);
                });
            }

            onResize();
            ng.element($window).bind('resize', onResize);
            scope.$on('$destroy', function () {
                ng.element($window).unbind('resize', onResize);
            });
        };

        return {
            restrict: 'A',
            scope: {
                value: '=',
                maxValue: '@',
                width: '@',
                text: '=',
                colors: '=',
                duration: '@',
                wrpClass: '@',
                textClass: '@',
                valueStrokeClass: '@',
                maxValueStrokeClass: '@'
            },
            link: link
        };
    }]);
}(angular, Circles));