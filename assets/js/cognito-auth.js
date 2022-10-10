/*global CalorieNinjas _config AmazonCognitoIdentity AWSCognito*/

var CalorieNinjas = window.CalorieNinjas || {};

(function scopeWrapper($) {
    var signinUrl = 'signin';

    var poolData = {
        UserPoolId: _config.cognito.userPoolId,
        ClientId: _config.cognito.userPoolClientId
    };

    var userPool;

    if (!(_config.cognito.userPoolId &&
          _config.cognito.userPoolClientId &&
          _config.cognito.region)) {
        $('#noCognitoMessage').show();
        return;
    }

    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    if (typeof AWSCognito !== 'undefined') {
        AWSCognito.config.region = _config.cognito.region;
    }

    CalorieNinjas.signOut = function signOut() {
        userPool.getCurrentUser().signOut();
    };

    CalorieNinjas.authToken = new Promise(function fetchCurrentAuthToken(resolve, reject) {
        var cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
            cognitoUser.getSession(function sessionCallback(err, session) {
                if (err) {
                    reject(err);
                } else {
                    resolve(cognitoUser.username);
                }
            });
        } else {
            resolve(null);
        }
    });


    /*
     * Cognito User Pool functions
     */

    function register(email, password, onSuccess, onFailure) {
        var dataEmail = {
            Name: 'email',
            Value: email
        };
        var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);

        userPool.signUp(email, password, [attributeEmail], null,
            function signUpCallback(err, result) {
                if (!err) {
                    onSuccess(result);
                } else {
                    onFailure(err);
                }
            }
        );
    }

    function signin(email, password, onSuccess, onFailure) {
        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: email,
            Password: password
        });

        var cognitoUser = createCognitoUser(email);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: onSuccess,
            onFailure: onFailure
        });
    }

    function createCognitoUser(email) {
        return new AmazonCognitoIdentity.CognitoUser({
            Username: email,
            Pool: userPool
        });
    }

    function changePassword(oldPassword, newPassword) {
        var cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
            cognitoUser.getSession(function sessionCallback(err, session) {
                if (err) {
                    $('#changePasswordError').text('There was an error processing your request. Please try again later.');
                    $('#changePasswordError').show()
                } else {
                    cognitoUser.changePassword(oldPassword, newPassword, function(err, result) {
                        if (err) {
                            var errorText = 'Failed to change password. Please check your current password and try again.'
                            if (err.code === 'LimitExceededException') {
                                errorText = 'Too many password change attempts. Please try again later.'
                            }
                            if (err.code === 'PasswordResetRequiredException') {
                                errorText = "Password reset required. Please reset your password by logging out and then navigating to the login page and clicking 'forgot password'"
                            }
                            $('#changePasswordError').text(errorText);
                            $('#changePasswordError').show()
                            return;
                        }
                        $('#changePasswordSuccess').text('Password changed successfully!');
                        $('#changePasswordSuccess').show()
                        $('#changePasswordButton').hide();
                    });
                }
            });
        }
    }

    function forgotPassword(username) {
        var cognitoUser = createCognitoUser(username)
        cognitoUser.forgotPassword({
            onSuccess: function (result) {
                return;
            },
            onFailure: function(err) {
                return;
            },
            inputVerificationCode() {
            }
        });
    }

    function confirmForgotPassword(username, confirmationCode, password) {
        var cognitoUser = createCognitoUser(username)
        cognitoUser.confirmPassword(confirmationCode, password, {
            onFailure(err) {
                if (err.code === 'TooManyFailedAttemptsException' || err.code === 'TooManyRequestsException') {
                    $('#forgotPasswordError').text('Too many attempts. Please wait a bit and try again later.');
                }
                else {
                    $('#forgotPasswordError').text('Error confirming new password. Make sure your code is correct and the new password is at least 8 characters and contains at least one number.   ');
                }
                $('#forgotPasswordError').text('Too many attempts. Please wait a bit and try again later.');
            },
            onSuccess() {
                $('#forgotPasswordSuccess').text('Your password has been successfully changed!');
                $('#forgotPasswordSuccess').show();
            },
        });
    }

    function deleteUser() {
        var cognitoUser = userPool.getCurrentUser();
        $('#confirmDeleteAccount').attr('disabled','disabled');
        if (cognitoUser) {
            cognitoUser.getSession(function sessionCallback(err, session) {
                if (err) {
                    alert('There was an error deleting your account. Please try again or contact our team. at info@calorieninjas.com');
                    $('#confirmDeleteAccount').removeAttr('disabled');
                } else {
                    $.ajax({
                        method: 'POST',
                        url: _config.api.invokeUrl + '/deleteuser',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            "AccessToken": session.getAccessToken().getJwtToken(),
                            
                        }),
                        success: function(msg, status, jqXHR) {
                            alert('User successfully deleted. You will be signed out now.')
                            userPool.getCurrentUser().signOut();
                            window.location.href = 'index'
                        },
                        error: function ajaxError(jqXHR, textStatus, errorThrown) {
                            alert('There was an error deleting your account. Please try again or contact our team. at info@calorieninjas.com');
                            userPool.getCurrentUser().signOut();
                            window.location.href = 'index'
                        }
                    });
                }
            });
        }
        else {
            $('#confirmDeleteAccount').removeAttr('disabled');
        }
    }

    /*
     *  Event Handlers
     */

    $(function onDocReady() {
        $('#signinForm').submit(handleSignin);
        $('#registrationForm').submit(handleRegister);
        $('#changePasswordButton').click(handleChangePassword);
        $('#forgotPasswordButton').click(handleForgotPassword);
        $('#confirmForgotPasswordButton').click(handleConfirmForgotPassword);
        $('#confirmDeleteAccount').click(handleDeleteUser);
    });

    $('#resendConfirmationButton').on('click', function(e) {
        $('#signInError').hide();
        $('#resendConfirmationButton').hide();
        $('#signInSuccess').hide();
        var email = $('#emailInputSignin').val();
        var cognitoUser = createCognitoUser(email);
        cognitoUser.resendConfirmationCode(function(err, result) {
            if (err) {
                $('#signInError').text('Error sending verification code. Please try again later.');
                $('#signInError').show()
                return;
            }
            $('#signInSuccess').text('Verification email successfully sent!');
            $('#signInSuccess').show()
        });
    });

    function handleSignin(event) {
        var email = $('#emailInputSignin').val();
        var password = $('#passwordInputSignin').val();
        event.preventDefault();

        signin(email, password,
            function signinSuccess() {
                window.location.href = 'profile';
            },
            function signinError(err) {
                $('#signInError').hide();
                $('#resendConfirmationButton').hide();
                $('#signInSuccess').hide();
                if (err.name === 'UserNotConfirmedException') {
                    $('#signInError').html('<p>This account has not been verified. Click below to resend verification email.</p>'); 
                    $('#resendConfirmationButton').show();
                } else{
                    $('#signInError').text('Error signing in. Please check your email and password and try again.');    
                }
                $('#signInError').show();
            }
        );
    }

    function handleChangePassword(event) {
        var oldPassword = $('#oldPassword').val();
        var password = $('#newPassword').val();
        var password2 = $('#new2Password').val();

        $('#changePasswordError').hide()
        $('#changePasswordSuccess').hide()
        if (!oldPassword || !password || !password2) {
            $('#changePasswordError').text('Fields cannot be empty');
            $('#changePasswordError').show();
            return;
        }
        if (password !== password2) {
            $('#changePasswordError').text('New passwords do not match');
            $('#changePasswordError').show();
            return;
        }
        changePassword(oldPassword, password)
    }

    function handleForgotPassword(event) {
        $('#forgotPasswordError').hide();
        $('#forgotPasswordSuccess').hide();
        var email = $('#emailForgotPassword').val();
        if (!email || email.indexOf("@") < 0) {
            $('#forgotPasswordError').text('Please enter a valid email address');
            $('#forgotPasswordError').show();
            return;
        }
        forgotPassword(email);
        $('#forgotPasswordPart1').hide()
        $('#forgotPasswordPart2').show()
    }

    function handleConfirmForgotPassword(event) {
        $('#forgotPasswordError').hide();
        $('#forgotPasswordSuccess').hide();
        var email = $('#emailForgotPassword').val();
        var confirmationCode = $('#codeForgotPassword').val();
        var newPassword = $('#newPasswordForgotPassword').val();
        var new2Password = $('#newPassword2ForgotPassword').val();
        if (!confirmationCode || !newPassword || !new2Password) {
            $('#forgotPasswordError').text('Fields cannot be empty');
            $('#forgotPasswordError').show();
        }
        else if (newPassword !== new2Password) {
            $('#forgotPasswordError').text('New passwords do not match');
            $('#forgotPasswordError').show();
        }
        else {
            confirmForgotPassword(email, confirmationCode, newPassword)
        }
    }

    function handleRegister(event) {
        $('#registerError').hide();
        $('#registerSuccess').hide();
        var email = $('#emailInputRegister').val();
        var password = $('#passwordInputRegister').val();
        var password2 = $('#password2InputRegister').val();

        var onSuccess = function registerSuccess(result) {
            $('#registerSuccess').text('Registration successful. Please check your email for the verification link.');
            $('#registerSuccess').show();
        };
        var onFailure = function registerFailure(err) {
            var msg = 'Error registering account. Please check that your password contains at least 8 characters and one number and try again later.'
            if (err.code === 'UsernameExistsException') {
                msg = 'A user is already associated with this email'
            }
            $('#registerError').text(msg);
            $('#registerError').show();
        };
        event.preventDefault();

        if (!email || !password || !password2) {
            $('#registerError').text('Fields cannot be empty');
            $('#registerError').show();
        }
        else if (password !== password2) {
            $('#registerError').text('Passwords do not match');
            $('#registerError').show();
        } else {
            register(email, password, onSuccess, onFailure);
        }
    }

    function handleDeleteUser(event) {
        if ($('#confirmDeleteInput').val() === 'delete') {
            deleteUser()
        }
    }
    
}(jQuery));
