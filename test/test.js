/// Requires resharper 6 or greater or use test.htm
/// <reference path="knockout-2.1.0.js"/>
/// <reference path="~/../src/knockout.binding.js"/>

(function () {
    module("Message binding");

    ko.test = function (tag, binding, test, configureElement) {
        var element = $("<" + tag + "/>");
        element.appendTo("body");
        ko.applyBindingsToNode(element[0], binding);
        test(element);

        element.remove();
    };

    var setupMessageTest = function (opt) {
        var message = ko.observable();

        ko.test("div", { message: message }, function () {
            message(opt);
        });
    };

    asyncTest("When updating message observable with a splash message", function () {
        var text = "Test";
        var splashQuery = "#splash";

        setupMessageTest({ splash: text, splashTimeout: 1, show: String.empty, hide: String.empty });

        var actualText = $(splashQuery).html();
        equal(text, actualText, "It should show a splash message with correct text");

        setTimeout(function () {
            equal(0, $(splashQuery).length, "It should hide and remove splash after a second"); //TODO: make splash time a bindable option
            start();
        }, 50)
    })

    test("When updating message observable with a confirm message", function () {
        var text = "Test";
        alert = function (value) {
            equal(text, value, "It should show a alert message with correct text");
        };
        setupMessageTest({ alert: text });
    });

    test("When updating message observable with a alert message", function () {
        var text = "Test";
        var confirmResult = "Test";

        confirm = function (value) {
            equal(text, value, "It should show a confirm message with correct text");
            return confirmResult;
        };

        var args = { confirm: text };
        setupMessageTest(args);
        equal(confirmResult, args.result);
    });

    module("Datepicker binding");

    var datePickerTest = function (date, assert, opt) {
        var observable = ko.observable(date);
        ko.test("input", { datepicker: observable, datepickerOptions: opt }, function (input) {
            assert(input, observable);
            $(".ui-datepicker").remove();
        });
    };

    test("When updating datepicker observable with a date", function () {
        var date = new Date(2007);
        datePickerTest(date, function (input) {
            var actualDate = input.val();
            equal(date.year, $(input).datepicker("getDate").year, "It should set the correct date");
        });
    });

    test("When setting new date from datepicker", function () {
        var oldDate = new Date(2007);
        datePickerTest(oldDate, function (input, observable) {
            var date = new Date(2008);
            $(input).datepicker("setDate", date);

            equal(date.year, observable().year, "It should update observable with correct date");
        });
    });

    test("When supplying options", function () {
        var date = new Date(2007);
        var orgDatePicker = $.fn.datepicker;
        var options = {};

        $.fn.datepicker = function (opt) {
            if (typeof (opt) == "string") return;

            equal(options, opt, "It should use those options for the datepicker");
        };

        datePickerTest(date, function (input, observable) {

        }, options);

        $.fn.datepicker = orgDatePicker;
    });

    module("Button binding");

    test("When using the button binding with a icon option", function () {
        ko.test("button", { button: { icon: "test-icon", label: "Test"} }, function (button) {
            equal(1, button.find(".ui-button-icon-primary").length, "It should have added the icon");
        });
    });

    test("When using the button binding with observable label", function () {
        var actualText = "Test"
        var label = ko.observable(actualText);
        ko.test("button", { button: { icon: "test-icon", label: label} }, function (button) {
            var getButtonText = function () {
                return button.find(".ui-button-text").html();
            };
            equal(actualText, getButtonText(), "It should have a initial text set");

            actualText = "NewValue";
            label(actualText);
            equal(actualText, getButtonText(), "It should update button label with correct text");
        });
    });

    module("Dialog binding");

    test("When using a dialog binding", function () {
        var actualTitle = "Test";
        ko.test("button", { dialog: { title: actualTitle} }, function (dialog) {
            equal(actualTitle, dialog.data("dialog").options.title, "It should configure dialog with correct options");
        });
    });

    test("When using a dialog binding with a openDialog binding", function () {
        var open = ko.observable(false);
        ko.test("button", { dialog: { autoOpen: false }, openDialog: open }, function (dialog) {
            equal(true, dialog.is(":hidden"), "It should be closed from the start");
            open(true);
            equal(false, dialog.is(":hidden"), "It should listen on observable and open dialog");
        });
    });
})();