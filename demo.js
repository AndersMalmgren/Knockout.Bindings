ViewModel = function () {
    this.message = ko.observable();
    this.date = ko.observable(new Date());
    this.buttonEnabled = ko.observable(true);

    this.dialogItem = ko.observable();
    this.dialogTitle = ko.computed(function () {
        return this.dialogItem() != null ? this.dialogItem().title : "";
    }, this);

    this.tabs = ko.observableArray([
        new ko.TabViewModel(1, "Tab 1", { content: "Content of tab 1" }, "tab-template"),
        new ko.TabViewModel(2, "Tab 2", { content: "Content of tab 2" }, "tab-template")]);

    this.selectedTabModel = ko.observable();
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
    showDialog: function () {
        this.dialogItem({ message: "This is a dialog", title: "Databindable title" });
    },
    setTabTwo: function () {
        this.selectedTabModel(this.tabs()[1].model());
    },
    addTab: function () {
        var newIndex = this.tabs().length + 1;
        this.tabs.push(new ko.TabViewModel(newIndex, "Tab " + newIndex, { content: "Content of tab " + newIndex }, "tab-template"));
    }
};

$(document).ready(function () { ko.applyBindings(new ViewModel()); });


