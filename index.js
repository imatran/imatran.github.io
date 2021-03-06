const angular = require('./resources/js/angular-app.js');

(() => {
    const controller = ($scope) => {
        $scope.init = () => {
            $scope.hello = 'Hello There!';
        };
    };

    controller.$inject = ['$scope'];
    angular.app.controller('main', controller);
})();