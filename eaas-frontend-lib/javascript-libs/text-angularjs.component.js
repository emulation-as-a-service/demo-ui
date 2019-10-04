export const textAngularComponent = {
    bindings: {
        description: '=',
        disabled: '=',
        updateDescription: '&'
    },
    template: `
            <br>
            <h5 ng-if="!disabled">{{'EDITENV_DESC' | translate}}</h5>

            <text-angular ng-if="disabled"  ta-toolbar="[]" ta-bind="text" ng-readonly=true
              ng-model="networkDescription.primitiveVariable"></text-angular>
                              
            <text-angular  ng-if="!disabled"
                   ng-model="networkDescription.primitiveVariable"
                   placeholder="{{'EDITENV_DESC_PH' | translate}}"></text-angular>`,
    controller: ["$scope", function ($scope) {
        //https://stackoverflow.com/questions/38763460/angular-scope-variable-not-updating
        $scope.networkDescription = {primitiveVariable: ""};

        var vm = this;
        this.$onInit = function(){
            $scope.networkDescription.primitiveVariable = vm.description;
            $scope.disabled = vm.disabled;
        };

        $scope.$watch('networkDescription.primitiveVariable', function() {
            vm.updateDescription($scope.networkDescription.primitiveVariable);
        });
    }],
    controllerAs: '$ctrl'
};
