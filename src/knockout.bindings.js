// Knockout.Bindings
// (c) Anders Malmgren - https://github.com/AndersMalmgren/Knockout.Bindings
// License: MIT (http://www.opensource.org/licenses/mit-license.php)
// Datepicker and some other parts of library (C) Ryan Niemeyer

(function () {
    String.empty = "";
    String.hasValue = function (value) {
        return value != null && value != String.empty;
    };

    //Fix for a bug in jquery UI button
    var enableUpdate = ko.bindingHandlers.enable.update;
    ko.bindingHandlers.enable.update = function (element, valueAccessor) {
        enableUpdate(element, valueAccessor);
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (!value || value == null) {
            $(element).removeClass("ui-state-hover ui-state-focus");
        }
    };

    ko.bindingHandlers.message = {
        update: function (element, valueAccessor) {
            var opt = ko.utils.unwrapObservable(valueAccessor());

            if (opt != null) {
                if (opt.splash) {
                    ko.bindingHandlers.message.showSplash(opt.splash);
                } else if (opt.confirm) {
                    opt.result = confirm(opt.confirm);
                } else if (opt.alert) {
                    alert(opt.alert);
                }
            }
        },
        showSplash: function (text) {
            var splash = $("<div id='splash'/>");
            splash.html(text).appendTo("body").dialog({
                show: "fade",
                hide: "fade",
                close: function () { splash.remove(); },
                open: function () {
                    setTimeout(function () { splash.dialog("close") }, 1000);
                }
            });
        }
    };

    ko.virtualElements.allowedBindings.message = true;

    ko.bindingHandlers.datepicker = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            //initialize datepicker with some optional options
            var options = allBindingsAccessor().datepickerOptions || {};
            $(element).datepicker(options);

            //handle the field changing
            ko.utils.registerEventHandler(element, "change", function () {
                var observable = valueAccessor();
                observable($(element).datepicker("getDate"));
            });

            //handle disposal (if KO removes by the template binding)
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).datepicker("destroy");
            });

        },
        update: function (element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());

            //handle date data coming via json from Microsoft
            if (String(value).indexOf('/Date(') == 0) {
                value = new Date(parseInt(value.replace(/\/Date\((.*?)\)\//gi, "$1")));
            }

            current = $(element).datepicker("getDate");

            if (value - current !== 0) {
                $(element).datepicker("setDate", value);
            }
        }
    };

    ko.bindingHandlers.button = {
        init: function (element, valueAccessor) {
            var options = ko.utils.unwrapObservable(ko.toJS(valueAccessor())) || {};
            var icon = options['icon'];
            if (icon != null) {
                options.icons = { primary: icon };
            }

            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).button("destroy");
            });

            $(element).button(options);
        },
        update: function (element, valueAccessor) {
            var options = ko.toJS(valueAccessor());

            if (options) {
                $(element).button(options);
            }
        }
    };

    ko.bindingHandlers.dialog = {
        init: function (element) {
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).dialog("destroy");
            });
        },
        update: function (element, valueAccessor) {
            var options = ko.toJS(valueAccessor());

            if (options) {
                $(element).dialog(options);
            }
        }
    };

    ko.bindingHandlers.openDialog = {
        update: function (element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            if (value) {
                $(element).dialog("open");
            } else {
                $(element).dialog("close");
            }
        }
    };

    ko.bindingHandlers.label = {
        counter: 0,
        init: function (element, valueAccessor) {
            var options = ko.utils.unwrapObservable(valueAccessor()) || {};
            var wrapped = $(element);
            var id = wrapped.attr("id");
            if (!String.hasValue(id)) {
                id = "label-" + ko.bindingHandlers.label.counter++;
                wrapped.attr("id", id);
            }
            var label = $("<label/>");
            label.attr("for", id);
            if (options.title) {
                label.attr("title", options.title);
            }
            label.insertAfter(wrapped);

            ko.applyBindingsToNode(label[0], { text: options.caption });
        }
    };

    ko.bindingHandlers.tabs = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            ko.renderTemplate(tabsTemplate, bindingContext.createChildContext(valueAccessor()), { templateEngine: stringTemplateEngine }, element, "replaceChildren");

            var tabs = ko.utils.unwrapObservable(valueAccessor())
            config = ko.utils.unwrapObservable(allBindingsAccessor().tabsOptions) || {};

            if (config.enable && ko.isObservable(config.enable)) {
                config.enable.subscribe(function (enable) {
                    if (enable) {
                        $(element).tabs({ disabled: [] });
                    } else {
                        var index = 0;
                        var indexes = ko.utils.arrayMap(tabs, function () { return index++ });
                        $(element).tabs({ disabled: indexes });
                    }
                });

                config.enable = null;
            }

            if (config.selectedTab && ko.isObservable(config.selectedTab)) {
                var updating = false;
                var onSelectedChangeCallback = function (value) {
                    if (updating) return;

                    updating = true;
                    var newIndex = ko.utils.arrayIndexOf(tabs, ko.utils.arrayFirst(tabs, function (item) {
                        return ko.utils.unwrapObservable(item.model) == value;
                    }));

                    $(element).tabs("option", "selected", newIndex);

                    config.selected = newIndex;
                    updating = false;
                };

                config.selectedTab.subscribe(onSelectedChangeCallback);
                onSelectedChangeCallback(config.selectedTab());

                config.select = function (event, ui) {
                    if (updating) return;

                    updating = true;
                    config.selectedTab(ko.utils.unwrapObservable(tabs[ui.index].model));
                    updating = false;
                };
            }

            var onHistory = function () {
                if (notNavigating) return;
                if (String.hasValue(window.location.hash)) {
                    navigating = true;
                    $(element).tabs("select", window.location.hash);
                    navigating = false;
                }
            };

            if (history && history.pushState) {
                var setState = function (state) {
                    history.pushState(state, null, state);
                };

                window.onpopstate = onHistory;
            }
            else if ($.address) {
                var setState = function (state) {
                    window.location.hash = state;
                };

                $.address.change(onHistory);
            }

            if (setState != null) {
                var orgSelect = config.select;
                var notNavigating = true;
                var navigating = false;
                config.select = function (event, ui) {
                    notNavigating = true;
                    if (orgSelect) orgSelect(event, ui);

                    if (!navigating) {
                        setState(ui.tab.hash);
                    }
                    notNavigating = false;
                };
            }

            $(element).tabs(config);

            return { controlsDescendantBindings: true };
        },
        update: function (element, valueAccessor, allBindingsAccessor) {
            var tabs = ko.utils.unwrapObservable(valueAccessor());

            ko.utils.arrayForEach(tabs, function (tab) {
                if (tab.enable.subscribed) return;
                tab.enable.subscribed = true; //Hack to avoid multiple subscriptions
                tab.enable.subscribe(function (enable) {
                    var index = ko.utils.arrayIndexOf(tabs, ko.utils.arrayFirst(tabs, function (item) {
                        return item == tab;
                    }));

                    if (enable) {
                        $(element).tabs("enable", index);
                    } else {
                        $(element).tabs("disable", index);
                    }

                });
            });

            if ($(element).tabs("length") == tabs.length) return;

            config = $(element).tabs("option");
            $(element).tabs("destroy").tabs(config);
        }

    };

    ko.TabViewModel = function (id, title, model, template) {
        this.id = ko.observable(id);
        this.title = ko.observable(title);
        this.model = ko.observable(model);
        this.template = template;
        this.enable = ko.observable(true);
    };

    //string template source engine
    var stringTemplateSource = function (template) {
        this.template = template;
    };

    stringTemplateSource.prototype.text = function () {
        return this.template;
    };

    var stringTemplateEngine = new ko.nativeTemplateEngine();
    stringTemplateEngine.makeTemplateSource = function (template) {
        return new stringTemplateSource(template);
    };

    var tabsTemplate = '<ul data-bind="foreach: $data">\
    <li>\
        <a data-bind="text: title, attr: { href: \'#tab-\' + id() }"></a>\
    </li>\
</ul>\
<!-- ko foreach: $data -->\
<div data-bind="attr: { id: \'tab-\' + id() }">\
    <h2 data-bind="text: title"></h2>\
    <div data-bind="template: { name: template, data: model }"></div>\
</div>\
<!-- /ko -->';
} ());