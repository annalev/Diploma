/**
 * Created by Ann on 22.01.2017.
 */
angular.module('app.controllers', ['pascalprecht.translate'])

.controller('homeCtrl', function ($scope, $rootScope, $translate, $cordovaProgress, $state, $q,
                                  $http, $ionicPopup, $timeout, LoginFactory, StudentFactory, ClassFactory, SchoolFactory,
                                  TeacherFactory, AuthenticationFactory) {

    $scope.initData = function () {
        var schools = SchoolFactory.getSchools();
        schools.success(function (success) {
            $scope.initData.availableSchools = success;
        });

        var res = AuthenticationFactory.getAuthenticationLevel(JSON.parse(localStorage.getItem("token")));

        res.success(function (success) {
            if (localStorage.getItem("token")) {
                sessionStorage.setItem("role", success[0].role);
            }

            var classes = ClassFactory.getClasses();
            classes.success(function (success) {
                $scope.initData.availableClasses = success;
            });

        }).then(function () {
            if ((localStorage.getItem("token"))) //If user is authenticated
            {
                switch (sessionStorage.getItem("role")) {
                    case "T":

                        var res = ClassFactory.getClassByTeacherId(JSON.parse(localStorage.getItem("token")));

                        res.success(function (success) {
                            $scope.initData.classes = success;
                        });

                        break;

                    case "P":
                        var res = StudentFactory.getFamilyChildren(JSON.parse(localStorage.getItem("token")));

                        res.success(function (success) {
                            $scope.initData.children = success;

                        });
                        break;

                    case "S":
                        var schools = SchoolFactory.getSchools();
                        schools.success(function (success) {
                            $scope.initData.availableSchools = success;
                        });

                        var myClasses = ClassFactory.getClassByStudentId(JSON.parse(localStorage.getItem("token")));
                        myClasses.success(function (success) {
                            $scope.initData.myClasses = success;
                        });
                        break;
                }
            }
        });
    }

    $scope.showIntPicker = function () {
        var config = {
            title: "Select a Year",
            items: [
                { text: "0", value: "0" },
                { text: "1", value: "1" },
                { text: "2", value: "2" },
                { text: "3", value: "3" },
                { text: "4", value: "4" },
                { text: "5", value: "5" },
                { text: "6", value: "6" },
                { text: "7", value: "7" },
                { text: "8", value: "8" },
                { text: "9", value: "9" },
                { text: "10", value: "10" },
                { text: "11", value: "11" },
                { text: "12", value: "12" },
                { text: "13", value: "13" }
            ],
            doneButtonLabel: "Done",
            cancelButtonLabel: "Cancel"
        };

        window.plugins.listpicker.showPicker(config,
            function(item) {
                $scope.showIntPicker.year = parseInt(item);
            },
            function() {
                $scope.class.year = undefined;
            }
        );
    };

    $scope.addClass = function (form) {
        var res = ClassFactory.addClass($scope.showIntPicker.year, form, JSON.parse(localStorage.getItem("token")));

        res.success(function (success) {
            var successMessage = $ionicPopup.alert({
                title: $translate.instant('SUCCESS'),
                subTitle: $translate.instant('ADD-CLASS-SUCCESS'),
                cssClass: 'ionic-alert-box'
            });
            $state.go($state.current, {}, {reload: true});
        });
    };

    $scope.selectClass = function (taughtClass) {
        $scope.selectClass.taughtClass = taughtClass;
    };

    $scope.pupilSearch = function () {

        var res = StudentFactory.findStudentByName($scope.pupilSearch.searchTerm);
        res.success(function (success) {
            if (success.length > 0) {
                $scope.pupilSearch.returnedStudent = success;
                $(".student-search").show();
            }
            else {
                $scope.pupilSearch.returnedStudent = null;
                $(".student-search").hide();

                var failMessage = $ionicPopup.alert({
                    title: $translate.instant('FAIL'),
                    subTitle: $translate.instant('NO-STUDENTS-FOUND'),
                    cssClass: 'ionic-alert-box'
                });

                $timeout(function () {
                    failMessage.close();
                }, 3000);
            }
        });
    };

    $scope.selectStudentForEvent = function (student) {
        $scope.selectStudentForEvent.student = student;
    };

    $scope.selectStudent = function (student) {

        $scope.pupilSearch.selectedStudent = student;

        var confirmStudentAdd = $ionicPopup.confirm({
            title: $translate.instant('ADD-CHILD-CONFIRM'),
            template: "<div class='item item-body'><label class='item item-input'><span class='input-label center'><b>" + $scope.pupilSearch.selectedStudent.username + "</b><br /><small> (" + $scope.pupilSearch.selectedStudent.surname + ")</small></span></label></div>",
            subTitle: $translate.instant('ADD-CHILD-CONFIRM')
        });

        confirmStudentAdd.then(function (res) {
            if (res) {
                var queryRes = StudentFactory.addStudentToFamily($scope.pupilSearch.selectedStudent.studentId, JSON.parse(localStorage.getItem("token")));
                queryRes.success(function (success) {
                    $scope.familyChildren.children = success;
                });
            } else {
                confirmStudentAdd.close();
            }
            $state.go($state.current, {}, {reload: true});
        });
    };

    $scope.classSelected = function(thisClass){
        var res = TeacherFactory.getTeacherByClassId(thisClass);
        res.success(function (success) {
            $scope.signup.teacherId = success[0].teacherId;
        });
    };

    $scope.register = function () {
        var signUpPopUp = $ionicPopup.show({
            template: '<div class="item item-divider">{{\'REGISTER-ACCOUNT\'| translate}}</div> <form class="list"> <label class="item item-input item-select"> <div class="input-label">Role: </div> <select ng-model="signup.selectedRole"> <option selected="selected"></option> <option>Teacher</option> <option>Parent</option> <option>Student</option> </select> </label><label ng-show="signup.selectedRole==\'Student\' || signup.selectedRole==\'Teacher\'" class="item item-input item-select"> <div class="input-label">School: </div> <select ng-model="signup.selectedSchool"><option selected></option> <option ng-repeat="school in initData.availableSchools" value="{{school.schoolId}}">{{school.schoolName}}</option> </select> </label> <label ng-show="signup.selectedRole==\'Student\' && signup.selectedSchool" class="item item-input item-select"> <div class="input-label">Class: </div> <select ng-change="classSelected(signup.selectedClass)" ng-model="signup.selectedClass"><option selected></option> <option ng-repeat="class in initData.availableClasses" value="{{class.classId}}">{{"Year " + class.year + class.form}}</option> </select> </label> <label class="item item-input item-select" ng-show="signup.selectedRole==\'Teacher\'"> <div class="input-label">{{\'TITLE\' | translate}}:</div> <select ng-model="signup.title"> <option selected="selected"></option> <option>Mr.</option> <option>Mrs.</option> <option>Ms.</option> <option>Miss</option> <option>Dr.</option> </select> </label> <label class="item item-input" ng-show="signup.selectedRole==\'Teacher\' || signup.selectedRole==\'Student\'"> <input type="text" placeholder="{{\'FIRST-NAME\' | translate}}" ng-model="signup.firstname"> </label><label class="item item-input" ng-show="signup.selectedRole==\'Teacher\' || signup.selectedRole==\'Student\'"><input type="text" placeholder="{{\'SURNAME\' | translate}}" ng-model="signup.surname"></label><label class="item item-input"><input type="text" placeholder="{{\'USERNAME\' | translate}}" ng-model="signup.username"></label><label class="item item-input"><input type="password" placeholder="{{\'PASSWORD\' | translate}}" ng-model="signup.password"></label><div class="pop-up-button"><button ng-click="signup()" ng-disabled="!signup.selectedRole || !signup.username || !signup.password" class=" button button-positive"><b>{{\'REGISTER\'| translate}}</b></button></div></div></form>',
            title: $translate.instant('REGISTER'),
            scope: $scope,
            buttons: [
                {
                    text: $translate.instant('CANCEL'),
                    cssClass: 'ionic-alert-box'
                }
            ]
        });

        $scope.signUpPopUp = signUpPopUp;
    };

    $scope.signup = function () {
        // https://codeforgeek.com/2014/07/angular-post-request-php/

        var res = LoginFactory.signup($scope.signup);

        res.success(function (success) {
            var previousPopUp = $scope.signUpPopUp;
            previousPopUp.close();

            //$cordovaProgress.showSimple(true);
            //
            //$timeout(function () {
            //    $cordovaProgress.hide();
            //}, 800);

            var successMessage = $ionicPopup.alert({
                title: $translate.instant('SUCCESS'),
                template: $translate.instant('ACCOUNT-SUCCESS'),
                cssClass: 'ionic-alert-box'
            });
        });

        res.error(function (err) {
            $ionicPopup.alert({
                title: $translate.instant('FAIL'),
                template: $translate.instant('GENERAL-ERROR'),
                cssClass: 'ionic-alert-box'
            });
            $scope.login.username = null;
            $scope.login.password = null;
        });
        $state.go($state.current, {}, {reload: true});
    };

    $scope.logout = function () {
        var logoutConfirm = $ionicPopup.confirm({
            title: $translate.instant('LOGOUT'),
            template: $translate.instant('LOGOUT-CONFIRM'),
            buttons: [
                {text: $translate.instant('CANCEL')},
                {
                    text: $translate.instant('OK'),
                    type: 'button-positive',

                    onTap: function (e) {
                        //$cordovaProgress.showSimple(true);
                        var res = LoginFactory.logout(JSON.parse(localStorage.getItem("token")));
                        res.success(function(success){
                            sessionStorage.clear();
                            localStorage.clear();
                            $state.go($state.current, {}, {reload: true});
                        });

                        //$timeout(function () {
                        //    $cordovaProgress.hide();
                        //}, 800);
                    }
                }
            ]
        });
    };

    $scope.login = function () {
        $ionicPopup.show({
            template: '{{\'USERNAME\' | translate}}: <input type="text" ng-model="login.username"><br />{{\'PASSWORD\' | translate}}: <input type="password" ng-model="login.password">',
            title: $translate.instant('LOGIN'),
            scope: $scope,
            buttons: [
                {text: $translate.instant('CANCEL')},
                {
                    text: $translate.instant('LOGIN'),
                    type: 'button-positive',

                    onTap: function (e) {
                        //$cordovaProgress.showSimple(true);
                        $scope.doLogin();

                        //$timeout(function () {
                        //    $cordovaProgress.hide();
                        //}, 800);
                        //$state.go($state.current, {}, {reload: true});
                        $scope.initData();
                        $state.go($state.current, {}, {reload: true});
                    }
                }
            ]
        });
    };

    $scope.doLogin = function () {
        var res = LoginFactory.login($scope.login.username, $scope.login.password);

        res.success(function (success) {
            if(success !== "false")
            {
                localStorage.setItem("token", success);
                $ionicPopup.alert({
                    title: $translate.instant('SUCCESS'),
                    template: $translate.instant('LOGIN-SUCCESS'),
                    buttons: [{text: $translate.instant('OK'), type: 'button-positive'}],
                    cssClass: 'ionic-alert-box'
                });
                $state.go($state.current, {}, {reload: true});
            }
            else
            {
                $ionicPopup.alert({
                    title: $translate.instant('FAIL'),
                    template: $translate.instant('LOGIN-FAIL'),
                    buttons: [{text: $translate.instant('OK'), type: 'button-positive'}],
                    cssClass: 'ionic-alert-box'
                }).then(function () {
                    $state.go($state.current, {}, {reload: true});
                });
            }
        })
    };

    $scope.checkIsLoggedOut = function () {
        if (localStorage.getItem("token") === null) {
            return "ng-show";
        }
        else {
            return "ng-hide";
        }
    };

    $scope.checkIsLoggedIn = function () {
        if (localStorage.getItem("token") !== null) {
            return "ng-show";
        } else {
            return "ng-hide";
        }
    };

    $scope.studentScope = function () {

        if (sessionStorage.getItem("role") == "S")
        {
            return "ng-show";
        }
        else
        {
            return "ng-hide";
        }
        $scope.initData();
    };

    $scope.teacherScope = function () {

        if (sessionStorage.getItem("role") == "T")
        {
            return "ng-show";
        }
        else
        {
            return "ng-hide";
        }
        $scope.initData();
    };

    $scope.parentScope = function () {
        if (sessionStorage.getItem("role") == "P")
        {
            return "ng-show";
        }
        else
        {
            return "ng-hide";
        }
    };

    $scope.parentStudentScope = function () {
        if (sessionStorage.getItem("role") == "P" || sessionStorage.getItem("role") == "S")
        {
            return "ng-show";
        }
        else
        {
            return "ng-hide";
        }
    };
})
