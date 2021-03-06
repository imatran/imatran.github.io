const app = require('ile/resources/js/angular-app.js')['app'];

require('bootstrap');
require('bootstrap/dist/css/bootstrap.css');
require('angular-ui-bootstrap');
const html2canvas = require('html2canvas');
import { jsPDF } from 'jspdf';

require('ile/resources/js/airtable-service');
require('ile/resources/js/vietngu-service');
require('ile/reportcard/reportcard.css');

(() => {
    const controller = ($scope, $q, $window, $document, $modal, service, apputil) => {

        /**
         * init
         */
        $scope.init = () => {
            $scope.dateFormat = "yy-mm-dd";

            $scope.absentChoices = ['', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
            $scope.skillChoices = ['', 'E', 'G', 'S', 'N'];
            $scope.gradeChoices = ['', 'A+', 'A', 'A-'];
            $scope.suggestions = _config.suggestions;

            //fix ui-select issue
            apputil.fixSelect();

            //browser refresh
            !$scope.report && (location.hash = '#!/list');

            // $scope.signin('1', '2');
        };

        /**
         * signin
         */
        $scope.signin = (profile, token) => {
            $scope.profile = profile;
            $scope.accessToken = token;
            loadData()
        };

        $scope.view = (oen) => {
            getReport(oen)
                .then(report => {
                    $scope.report = report;
                });
        };

        $scope.edit = (oen) => {
            getReport(oen)
                .then(report => {
                    $scope.report = angular.copy(report);

                    $scope.$watch('report', (a) => {
                        let savebtn = $('#save-btn')[0];
                        savebtn && (angular.equals(a, report) ? savebtn.classList.add('disabled') : savebtn.classList.remove('disabled'));
                    }, true);

                    const datepicker = {
                        dateFormat: $scope.dateFormat,
                        onSelect: (date, field) => {
                            $scope.$apply(() => {
                                let id = field.input[0].dataset['id'];
                                $scope.report[`date_${id}`] = date;
                                $scope.report[`signature_${id}`] = _config.signature;
                            });
                        }
                    };

                    $('#datepicker1').datepicker(datepicker);
                    $('#datepicker2').datepicker(datepicker);
                });
        };

        $scope.submit = () => {
            if($scope.report.refId) {
                service.updateReport($scope.report.refId, $scope.report);
            } else {
                service.createReport($scope.report);
            }
        };

        $scope.clearDate = (time) => {
            delete $scope.report[`date_${time}`];
            delete $scope.report[`signature_${time}`];
        };

        $scope.print = () => {
            html2canvas(document.getElementById('view'), {
                width: 920
            })
                .then(canvas => {
                    let img = canvas.toDataURL('image/jpeg'),
                        pdf = new jsPDF();

                    pdf.addImage(img, 'JPEG', 0, 8, 210, 280);
                    pdf.save(`${$scope.report.name}.pdf`);
                });
        };

        $scope.popup = () => {
            let popup = $modal.open({
                scope: $scope,
                templateUrl: 'suggests.html',
                size: 'lg',
                controller: () => {
                    $scope.cancel = () => {
                        popup.close();
                    };

                    $scope.select = (value) => {
                        console.log(value);
                    };
                }
            });
        };

        $scope.formatOEN = (oen) => {
            let match = (oen || '').replace(/\D/g, '').match(/^(\d{3})(\d{3})(\d*)$/);
            return match ? `${match[1]}-${match[2]}-${match[3]}` : oen;
        };

        const loadData = () => {
            let deferred = $q.defer();

            $q.all([
                service.loadStudents(_config.lang),
                service.loadReports()
            ])
                .then((values) => {
                    $scope.students = values[0];
                    $scope.reports = values[1];

                    $scope.reports.forEach(report => {
                        sanitize(report);
                    });

                    deferred.resolve();
                });

            return deferred.promise;
        };

        const getReport = (oen) => {
            let deferred = $q.defer(),
                report = $scope.reports.find(report => { return report['oen'] === oen; }),
                student = $scope.students.find(student => { return student['oen'] === oen; });

            if(report) {
                service.getReport(report.refId)
                    .then(report => {
                        sanitize(report);
                        deferred.resolve(report);
                    });
            } else {
                report = { oen: student.oen };
                sanitize(report);
                deferred.resolve(report);
            }

            return deferred.promise;
        };

        const sanitize = (report) => {
            //sanitize signature
            !apputil.isEmpty(report['date_t1']) && (report['signature_t1'] = _config.signature);
            !apputil.isEmpty(report['date_t2']) && (report['signature_t2'] = _config.signature);

            //sanitize student name
            let student = $scope.students.find(student => { return student.oen === report.oen; });
            student && (report.name = student.name);

            //sanitize from configs
            Object.assign(report, apputil.pick(_config, 'lang', 'center', 'instructor'));
        }
    };

    controller.$inject = ['$scope', '$q', '$window', '$document', '$uibModal', 'VietNguService', 'AppUtil'];
    app.controller("reportcard", controller);
})();

(() => {
    const config = ($routeProvider) => {
        $routeProvider.
        when('/view', {
            templateUrl: '/ile/reportcard/view.html'
        }).
        when('/edit', {
            templateUrl: '/ile/reportcard/edit.html'
        }).
        otherwise({
            templateUrl: '/ile/reportcard/list.html'
        });
    };

    config.$inject = ['$routeProvider'];
    app.config(config);
})();