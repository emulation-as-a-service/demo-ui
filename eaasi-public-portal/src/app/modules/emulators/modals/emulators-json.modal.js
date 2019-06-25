module.exports = ["$scope", "entry", function ($scope, entry) {
    console.log("entry", entry);
    var vm = this;
    vm.entry = entry;
    $().ready(function () {
        $('#json-renderer').jsonViewer(vm.entry, {withQuotes: false});
        $(".modal-content").css("box-shadow", "unset");
    });
}];