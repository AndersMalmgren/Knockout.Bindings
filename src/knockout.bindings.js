(function () {
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

    ko.bindingHandlers.datepicker = {
        init: function (element, valueAccessor) {
            var options = ko.utils.extend(ko.bindingHandlers.datepicker.defaultOptions, ko.utils.unwrapObservable(valueAccessor()) || {});

            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).datepicker("destroy");
            });

            $(element).datepicker(defaultOptions);
        },
        defaultOptions: {}
    };

    ko.bindingHandlers.button = {
        init: function (element, valueAccessor) {
            var options = ko.utils.unwrapObservable(valueAccessor()) || {};
            var icon = options['icon'];
            if (icon != null) {
                options.icons = { primary: icon };
            }

            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).button("destroy");
            });

            $(element).button(options);
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

            return { controlsDescendantBindings: true };
        },
        update: function (element, valueAccessor, allBindingsAccessor) {
            var dependency = ko.utils.unwrapObservable(valueAccessor()),
           currentIndex = $(element).tabs("option", "selected") || 0,
           config = ko.utils.unwrapObservable(allBindingsAccessor().tabsOptions) || {};
            if (config.selectedTab && ko.isObservable(config.selectedTab)) {
                var updating = false;
                var onSelectedChangeCallback = function (value) {
                    if (updating) return;

                    updating = true;
                    var newIndex = dependency.indexOf(ko.utils.arrayFirst(dependency, function (item) {
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
                    config.selectedTab(ko.utils.unwrapObservable(dependency[ui.index].model));
                    updating = false;
                };
            }

            //make sure that elements are set from template before calling tabs API
            setTimeout(function () {
                $(element).tabs("destroy").tabs(config).tabs("option", "selected", currentIndex);
            }, 0);
        }
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

    ko.bindingHandlers.tabs.Tab = function (id, title, model, template) {
        this.id = ko.observable(id);
        this.title = ko.observable(title);
        this.model = ko.observable(model);
        this.template = template;
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