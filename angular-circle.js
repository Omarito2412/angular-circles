/*jslint indent: 4, maxlen: 100 */
/*globals angular, Circles */

(function (ng, Circles) {
    'use strict';

    var // Constants
        DEFAULT_SETTINGS,
        POSSIBLE_SETTINGS,
        RESIZE_WAIT = 150,
        // Variables
        ngCircle = ng.module('angular-circle', []),
        iteration = 0,
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
        textClass: 'circles-text'
    };

    POSSIBLE_SETTINGS = [
        'radius', 'maxValue', 'width', 'text', 'colors', 'duration', 'wrpClass', 'textClass'
    ];

    // Source: http://modernjavascript.blogspot.fr/2013/08/building-better-debounce.html
    debounce = function (func, wait) {
        /*globals setTimeout, clearTimeout */
        var timeout;

        return function () {
            var context = this,
                args = arguments,
                later = function () {
                    timeout = null;
                    func.apply(context, args);
                };

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    ngCircle.provider('ngCircleSettings', [function () {
        var self = this,
            $get,
            set;

        $get = function () {
            return DEFAULT_SETTINGS;
        };

        set = function (settingsObject) {
            ng.extend(DEFAULT_SETTINGS, settingsObject);
        };

        self.$get = $get;
        self.set = set;
    }]);

    ngCircle.directive('ngCircle', ['$window', 'ngCircleSettings', function (
        $window,
        ngCircleSettings
    ) {
        var link;

        link = function (scope, element) {
            var // Variables
                self = scope,
                elementId = 'ng-circle-' + iteration,
                settings = ngCircleSettings,
                attrsSettings = {},
                circle,
                // Functions
                onResize;

            onResize = debounce(function () {
                var newWidth = element[0].offsetWidth;
                circle.updateRadius(newWidth / 2);
                circle.updateWidth((newWidth / 2) * (attrsSettings.width / 100))
            }, RESIZE_WAIT);

            element[0].id = elementId;
            iteration += 1;

            ng.forEach(POSSIBLE_SETTINGS, function (setting) {
                if (self[setting]) {
                    attrsSettings[setting] = self[setting];
                } else {
                    attrsSettings[setting] = DEFAULT_SETTINGS[setting];
                }
            });

            if (!self.value || isNaN(self.value)) {
                throw new Error('ngCircle: Your value does not exists, or is NaN!');
            }

            if (settings.width > 100 || settings.width < 1 ||
                    attrsSettings.width > 100 || attrsSettings.width < 1) {
                throw new Error('ngCircle: The width setting has to be between 1 & 100!');
            }

            circle = Circles.create(ng.extend({}, settings, attrsSettings, {
                id: elementId,
                value: self.value
            }));

            self.$watch('value', function (newValue) {
                circle.update(newValue);
            });

            onResize();
            ng.element($window).bind('resize', onResize);
        };

        return {
            restrict: 'A',
            scope: {
                value: '=',
                radius: '@',
                maxValue: '@',
                width: '@',
                text: '@',
                colors: '=',
                duration: '@',
                wrpClass: '@',
                textClass: '@'
            },
            link: link
        };
    }]);
}(angular, Circles));
