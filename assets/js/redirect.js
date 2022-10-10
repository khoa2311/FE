var CalorieNinjas = window.CalorieNinjas || {};
$(document).ready(function() {
    CalorieNinjas.authToken.then(function redirectIfNecessary(username) {
        if (username) {
            window.location = "profile";
        }
    });
});