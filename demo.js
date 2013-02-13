ViewModel = function () {
    this.message = ko.observable();
    this.date = ko.observable(new Date());
    this.buttonEnabled = ko.observable(true);
    this.buttonLabel = ko.observable(0);

    this.dialogItem = ko.observable();
    this.dialogTitle = ko.computed(function () {
        return this.dialogItem() != null ? this.dialogItem().title : "";
    }, this);

    this.tabs = ko.observableArray([
        new ko.TabViewModel(1, "Tab 1", { content: "Content of tab 1" }, "tab-template"),
        new ko.TabViewModel(2, "Tab 2", { content: "Content of tab 2" }, "tab-template")]);

    this.selectedTabModel = ko.observable();
    this.tabsEnabled = ko.observable(true);

    this.cancelTabSelect = false;
    this.onTabChanging = function (args) {
        args.cancel = this.cancelTabSelect;
    } .bind(this);

    this.optionItems = ko.observableArray([{ text: "Test1" }, { text: "Test2"}]);
    this.selectedOption = ko.observable({ text: "Test1" });
};


ViewModel.prototype = {
    showSplash: function () {
        this.message({ splash: "This is a splash message" });
    },
    showAlert: function () {
        this.message({ alert: "This is a alert message" });
    },
    showConfirm: function () {
        var args = { confirm: "Choose!" };
        this.message(args);

        this.message({ splash: args.result ? "Yes" : "No" });
    },
    disableButton: function () {
        this.buttonEnabled(false);
    },
    increaseButton: function () {
        this.buttonLabel(this.buttonLabel() + 1);
    },
    showDialog: function () {
        this.dialogItem({ message: "This is a dialog", title: "Databindable title" });
    },
    setTabTwo: function () {
        this.selectedTabModel(this.tabs()[1].model());
    },
    toggleTabTwo: function () {
        this.tabs()[1].enable(!this.tabs()[1].enable());
    },
    toggleTabs: function () {
        this.tabsEnabled(!this.tabsEnabled());
    },
    addTab: function () {
        var newIndex = this.tabs().length + 1;
        this.tabs.push(new ko.TabViewModel(newIndex, "Tab " + newIndex, { content: "Content of tab " + newIndex }, "tab-template"));
    },
    collapse: function () {
        this.selectedTabModel(null);
    }
};

$(document).ready(function () { ko.applyBindings(new ViewModel()); });


