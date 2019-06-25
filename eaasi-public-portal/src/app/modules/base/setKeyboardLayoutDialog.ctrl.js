module.exports = ['$scope', '$cookies', '$translate', 'kbLayouts', 'growl', function($scope, $cookies, $translate, kbLayouts, growl) {
     this.kbLayouts = kbLayouts.data;

     var kbLayoutPrefs = $cookies.getObject('kbLayoutPrefs');

     if (kbLayoutPrefs) {
         this.chosen_language = kbLayoutPrefs.language;
         this.chosen_layout = kbLayoutPrefs.layout;
     }

     this.saveKeyboardLayout = function() {
         if (!this.chosen_language || !this.chosen_layout) {
             growl.error($translate.instant('SET_KEYBOARD_DLG_SAVE_ERROR_EMPTY'));
             return;
         }

         $cookies.putObject('kbLayoutPrefs', {"language": this.chosen_language, "layout": this.chosen_layout}, {expires: new Date('2100')});

         growl.success($translate.instant('SET_KEYBOARD_DLG_SAVE_SUCCESS'));
         $scope.$close();
     };
 }];