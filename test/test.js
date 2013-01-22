/// Requires resharper 6 or greater or use test.htm
/// <reference path="knockout-2.1.0.js"/>
/// <reference path="~/../src/knockout.binding.js"/>

(function () {
    module("Message binding");

    ko.test = function (tag, binding, test) {
        var element = $("<" + tag + "/>");
        element.appendTo("body");
        ko.applyBindingsToNode(element[0], binding);
        var args = {
            clean: function () {
                element.remove();
            }
        };
        test(element, args);

        if (!args.async) {
            args.clean();
        }
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
            equal($(splashQuery).length, 0, "It should hide and remove splash after a second"); //TODO: make splash time a bindable option
            start();
        }, 50)
    })

    test("When updating message observable with a alert message", function () {
        var text = "Test";
        window.alert = function (value) {
            equal(value, text, "It should show a alert message with correct text");
        };
        setupMessageTest({ alert: text });
    });

    test("When updating message observable with a confirm message", function () {
        var text = "Test";
        var confirmResult = "Test";

        window.confirm = function (value) {
            equal(value, text, "It should show a confirm message with correct text");
            return confirmResult;
        };

        var args = { confirm: text };
        setupMessageTest(args);
        equal(args.result, confirmResult, "It should have correct confirm result");
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
            equal($(input).datepicker("getDate").year, date.year, "It should set the correct date");
        });
    });

    test("When setting new date from datepicker", function () {
        var oldDate = new Date(2007);
        datePickerTest(oldDate, function (input, observable) {
            var date = new Date(2008);
            $(input).datepicker("setDate", date);

            equal(observable().year, date.year, "It should update observable with correct date");
        });
    });

    test("When supplying options", function () {
        var date = new Date(2007);
        var orgDatePicker = $.fn.datepicker;
        var options = {};

        $.fn.datepicker = function (opt) {
            if (typeof (opt) == "string") return;

            equal(opt, options, "It should use those options for the datepicker");
        };

        datePickerTest(date, function (input, observable) {

        }, options);

        $.fn.datepicker = orgDatePicker;
    });

    module("Button binding");

    var buttonTest = function (opt, assert, bindings) {
        ko.test("button", ko.utils.extend({ button: opt }, bindings), function (button) {
            assert(button);
        });
    };

    test("When using the button binding with a icon option", function () {
        buttonTest({ icon: "test-icon", label: "Test" }, function (button) {
            equal(button.find(".ui-button-icon-primary").length, 1, "It should have added the icon");
        });
    });

    test("When using the button binding with observable label", function () {
        var expectedText = "Test"
        var label = ko.observable(expectedText);
        buttonTest({ label: label }, function (button) {
            var getButtonText = function () {
                return button.find(".ui-button-text").html();
            };
            equal(getButtonText(), expectedText, "It should have a initial text set");

            actualText = "NewValue";
            label(expectedText);
            equal(getButtonText(), expectedText, "It should update button label with correct text");
        });
    });

    test("When disabling the button from click handler", function () {
        var enabled = ko.observable(true);
        var click = function () {
            enabled(false);
        };

        buttonTest({ icon: "test-icon", label: "Test" }, function (button) {
            button.focus();
            button.click();
            equal(button.is(".ui-state-focus"), false, "It should not appear active");
        }, { click: click, enable: enabled });
    });

    module("Dialog binding");

    test("When using a dialog binding", function () {
        var expectedTitle = "Test";
        ko.test("button", { dialog: { title: expectedTitle} }, function (dialog) {
            equal(dialog.data("dialog").options.title, expectedTitle, "It should configure dialog with correct options");
        });
    });

    test("When using a dialog binding with a openDialog binding", function () {
        var open = ko.observable(false);
        ko.test("button", { dialog: { autoOpen: false }, openDialog: open }, function (dialog) {
            equal(dialog.is(":hidden"), true, "It should be closed from the start");
            open(true);
            equal(dialog.is(":hidden"), false, "It should listen on observable and open dialog");
        });
    });

    module("Label binding");

    var labelTest = function (opt, assert) {
        ko.test("input type='checkbox'", { label: opt }, function (checkbox) {
            var label = checkbox.siblings("label");
            assert(checkbox, label);
            label.remove();
        });
    };

    test("When using a label binding", function () {
        var text = "Test";
        var checkboxId = "label-0";
        labelTest({ title: text, caption: text }, function (checkbox, label) {
            equal(label.html(), text, "It should have correct caption");
            equal(label.attr("title"), text, "It should have correct title");
            equal(checkbox.attr("id"), checkboxId, "It should have correct id");
        });
    });

    test("When using a label binding and click on the label", function () {
        labelTest({}, function (checkbox, label) {
            label.click();
            equal(checkbox.is(":checked"), true, "It should effect input also");
        });
    });

    module("Tabs Binding");

    var tabsTest = function (opt, assert) {
        var template = $("<script id='tmpl' type='text/html'>Buset</script>").appendTo("body");

        var tabs = ko.observableArray([new ko.TabViewModel(1, "Tab1", {}, "tmpl"), new ko.TabViewModel(2, "Tab2", {}, "tmpl")])
        ko.test("div", { tabs: tabs, tabsOptions: opt }, function (element) {
            var addTab = function () {
                var id = tabs()[tabs().length - 1].id() + 1;
                tabs.push(new ko.TabViewModel(id, "Tab" + id, {}, "tmpl"));
            };
            assert(element, tabs(), addTab);
            template.remove();
        });
    };

    test("When using a tab binding", function () {
        tabsTest({}, function (element) {
            var query = element.find("ul li")
            equal(query.length, 2, "It should reflect number of tabs");
            equal(query.find("a:first").html(), "Tab1", "It should have correct tab title");
        });
    });

    test("When using a tab binding and setting selectedTab", function () {
        var selectedTab = ko.observable();
        tabsTest({ selectedTab: selectedTab }, function (element, tabs) {
            selectedTab(tabs[1].model());
            equal(element.find("ul li.ui-tabs-active a").html(), "Tab2", "It should have selected tab2");
        });
    });

    test("When using a tab binding and selecting tab 2", function () {
        var selectedTab = ko.observable();
        tabsTest({ selectedTab: selectedTab }, function (element, tabs) {
            element.find("ul li:last a").click()
            equal(selectedTab(), tabs[1].model(), "It should have updated selectedTab observable correctly");
        });
    });

    test("When binding the enable option to false", function () {
        var enabled = ko.observable(true);
        tabsTest({ enable: enabled, selectedTab: ko.observable(null) }, function (element, tabs) {
            enabled(false);
            equal(element.find("ul li.ui-state-disabled").length, 2, "It should disable all tabs");
        });
    });

    test("When binding the enable option for a tab to false", function () {
        tabsTest({ selectedTab: ko.observable(null) }, function (element, tabs) {
            tabs[1].enable(false);
            equal(element.find("ul li.ui-state-disabled").length, 1, "It should disable last tab");
        });
    });

    test("When adding a tab", function () {
        tabsTest({ selectedTab: ko.observable(null) }, function (element, tabs, addTab) {
            addTab();
            ok(element.find("ul li:last").attr("class") != null, "It should add jQuery tab stuff to button");
            equal(element.find("div.ui-tabs-panel").length, 3, "It should add jQuery tab stuff to the tab itself");
        });
    });

    module("Selected Binding");

    var selectedBindingTest = function (items, selected, expected, optionsKey) {
        ko.test("select", { options: items, optionsText: "name", optionsCaption: " ", selected: ko.observable(selected), optionsKey: optionsKey }, function (select, args) {
            args.async = true;
            setTimeout(function () {
                equal($(":selected", select).html(), expected, "It should set correct selected item");
                args.clean();
                start();
            }, 1);
        });
    };

    asyncTest("When using a selected binding with preselected item", function () {
        var expected = "test2";
        var items = ko.observableArray([{ name: "test1" }, { name: expected}]);
        var selected = { name: expected };

        selectedBindingTest(items, selected, expected);
    });

    asyncTest("When key property is a observable for selected binding", function () {
        var expected = "Test";
        var items = [{ name: "test2" }, { name: ko.observable(expected)}];
        var selected = { name: expected };


        selectedBindingTest(items, selected, expected);
    })

    asyncTest("When key is a function", function () {
        var expected = "Test";
        var items = [{ name: "test2" }, { name: expected }];
        var selected = { name: expected };
        var key = function (item, value) {
            return item.name === value.name;
        };

        selectedBindingTest(items, selected, expected, key);
    })
})();