export const textAngularComponent = {
    bindings: {
        description: '=',
        disabled: '=',
        updateDescription: '&'
    },
    template: `
            <h3 ng-click="$ctrl.debug()">{{'EDITENV_DESC' | translate}}</h3>

            <text-angular ng-if="disabled"  ta-toolbar="[]" ta-bind="text" ng-readonly=true
              ng-model="networkDescription"></text-angular>
                              
            <text-angular  ng-if="!disabled"
                   ng-model="networkDescription"
                   placeholder="{{'EDITENV_DESC_PH' | translate}}"></text-angular>`,
    controller: ["$scope", function ($scope) {
        var vm = this;
        vm.debug = function () {
        console.log("vm.disabled", vm.disabled)
        };
        this.$onInit = function(){
            var vm = this;
            $scope.networkDescription = vm.description;
            $scope.disabled = vm.disabled;
        };

        $scope.$watch('networkDescription', function() {
            vm.updateDescription($scope.networkDescription);
        });
    }],
    controllerAs: '$ctrl'
};
