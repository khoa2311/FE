var CalorieNinjas = window.CalorieNinjas || {};

$(document).ready(function() {

    function signout() {
        CalorieNinjas.signOut();
        alert("You have been signed out.");
        window.location = "index";
    }

    $('#signup-button').click(function() {
        window.location = 'register';
    });

    CalorieNinjas.authToken.then(function updateAuthMessage(username) {
        if (username) {
            if (username.length > 15) {
                username = username.substring(0, 15) + '...';
            }
            $("#login-button").text('My Account');
            $('#login-button').click(function(e) {
                window.location = 'profile';
            });
            $("#signup-button").text('Sign Out');
            $("#signup-button").click(signout);
        }
        $('.header').show();
        $('#main-body').show();
    });
	
    /* ===== Stickyfill ===== */
    /* Ref: https://github.com/wilddeer/stickyfill */
    // Add browser support to position: sticky
    var elements = $('.sticky');
    if ((typeof Stickyfill !== 'undefined')) {
        Stickyfill.add(elements);
    }

    /* Activate scrollspy menu */
    $('body').scrollspy({target: '#doc-menu', offset: 100});
    
    /* Smooth scrolling */
	$('a.scrollto').on('click', function(e){
        //store hash
        var target = this.hash;    
        e.preventDefault();
		$('body').scrollTo(target, 400, {offset: 0, 'axis':'y'});
	});
     
    /* Bootstrap lightbox */
    /* Ref: http://ashleydw.github.io/lightbox/ */

    $(document).delegate('*[data-toggle="lightbox"]', 'click', function(e) {
        e.preventDefault();
        $(this).ekkoLightbox();
    });

    function loadRecipes(result, query) {
        if (result.length > 0) {
            r = result[0];
            $('#result-recipe-title').text(r['title']);
            servings = '<p><strong><strong>' + r['servings'] + '</strong></strong></p>';
            ings = r['ingredients'].split('|');
            ingredients = '<ul class="list-group list-group-flush">';
            for (var j = 0; j < ings.length; j++) {
                ingredients += '<li class="list-group-item">' + ings[j] + '</li>';
            }
            ingredients += '</ul>';
            console.log(ingredients);
            console.log(servings);
            instructions = '<p class="text-left px-5 py-3">' + r['instructions'] + '</p>';
            out = '<div><div class="row"><div class="col-lg-6">' + servings + '</div><div class="col-lg-6">' + ingredients + '</div></div><br>' + instructions + '</div>';
            $('#result-recipe').append(out);
        }
        $('#recipe-demo').show();
    }

    function completeRequest(result, query, is_image) {
        foods = result['items']
        if (!foods) {
            return;
        }
        results = []
        totals = {
            'serving_size': 0.0,
            'calories': 0.0,
            'total_fat': 0.0,
            'saturated_fat': 0.0,
            'cholesterol': 0.0,
            'sodium': 0.0,
            'carbohydrates': 0.0,
            'fiber': 0.0,
            'sugar': 0.0,
            'protein': 0.0,
        }

        function round(value, precision) {
            var multiplier = Math.pow(10, precision || 0);
            return Math.round(value * multiplier) / multiplier;
        }
        for (var i = 0; i < foods.length; i++) {
            name = foods[i]['name']
            serving_size = round(foods[i]['serving_size_g'], 1)
            calories = round(foods[i]['calories'], 1)
            total_fat = round(foods[i]['fat_total_g'], 1)
            saturated_fat = round(foods[i]['fat_saturated_g'], 1)
            cholesterol = round(foods[i]['cholesterol_mg'], 1)
            sodium = round(foods[i]['sodium_mg'], 1)
            carbohydrates = round(foods[i]['carbohydrates_total_g'], 1)
            fiber = round(foods[i]['fiber_g'], 1)
            sugar = round(foods[i]['sugar_g'], 1)
            protein = round(foods[i]['protein_g'], 1)
            results.push(
                '<tr><td>'+name+'</td><td>'+serving_size+'g</td><td>'+calories+'</td><td>'+total_fat+'g</td><td>'+saturated_fat+'g</td><td>'+cholesterol+'mg</td><td>'+sodium+'mg</td><td>'+carbohydrates+'g</td><td>'+fiber+'g</td><td>'+sugar+'g</td><td>'+protein+'g</td></tr>'
            )
            totals['serving_size'] += serving_size
            totals['calories'] += calories
            totals['total_fat'] += total_fat
            totals['saturated_fat'] += saturated_fat
            totals['cholesterol'] += cholesterol
            totals['sodium'] += sodium
            totals['carbohydrates'] += carbohydrates
            totals['fiber'] += fiber
            totals['sugar'] += sugar
            totals['protein'] += protein
        }  
        if (foods.length > 0) {
            results.unshift('<tr><th>Total</th><th>'+round(totals['serving_size'],1)+'g</th><th>'+round(totals['calories'],1)+'</th><th>'+round(totals['total_fat'],1)+'g</th><th>'+round(totals['saturated_fat'],1)+'g</th><th>'+round(totals['cholesterol'],1)+'mg</th><th>'+round(totals['sodium'],1)+'mg</th><th>'+round(totals['carbohydrates'],1)+'g</th><th>'+round(totals['fiber'],1)+'g</th><th>'+round(totals['sugar'],1)+'g</th><th>'+round(totals['protein'],1)+'g</th></tr>')
        }
        if (!is_image) {
            $('#query-text').append('<h5><em>'+query+'</em></h5>');
            for (var i = 0; i < results.length; i++) {
                $('#result').append(results[i])
            }
            $('#text-demo').show();
        }
        else {
            for (var i = 0; i < results.length; i++) {
                $('#image-result').append(results[i])
            }
            $('#image-demo').show();
        }
    }

    $('#login-button').click(function(e) {
        window.location = 'signin';
    });

    $('#submit').on('click', function(e) {
        gtag('event', 'Find Nutrition clicked');
        query = $('#demo-input').val();
        $('#result').empty();
        $('#query-text').empty();
        $('#text-demo').hide();
        $('#submit').prop('disabled', true);
        $('#text-loader').show();
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/nutrition?query=' + query,
            contentType: 'application/json',
            success: function(result) {
                completeRequest(result, query, false);
                $('#submit').prop('disabled', false);
                $('#text-loader').hide();
            },
            error: function ajaxError(jqXHR) {
                alert('An error occured with your request. Please try again later.');
                $('#submit').prop('disabled', false);
                $('#text-loader').hide();
            }
        });
    });

    $('#submit-recipe').on('click', function(e) {
        gtag('event', 'Find Recipes clicked');
        query = $('#demo-input-recipe').val();
        $('#result-recipe').empty();
        $('#recipe-demo').hide();
        $('#submit-recipe').prop('disabled', true);
        $('#text-loader-recipe').show();
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/recipe?query=' + query,
            contentType: 'application/json',
            success: function(result) {
                loadRecipes(result, query);
                $('#submit-recipe').prop('disabled', false);
                $('#text-loader-recipe').hide();
            },
            error: function ajaxError(jqXHR) {
                alert('An error occured with your request. Please try again later.');
                $('#submit-recipe').prop('disabled', false);
                $('#text-loader-recipe').hide();
            }
        });
    });

    $('#submitContactForm').on('click', function(e) {       
        $('#contact-email').css('border', 'solid 1px #eee');
        $('#contact-message').css('border', 'solid 1px #eee');
        name = $('#contact-name').val();
        email = $('#contact-email').val();
        message = $('#contact-message').val();
        complete = true
        if (!email) {
            $('#contact-email').css('border', 'solid 1px red');
            comlete = false
        }
        if (!message) {
            $('#contact-message').css('border', 'solid 1px red');
            complete = false
        }
        if (!complete) {
            return
        }
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/contact',
            contentType: 'application/json',
            data: JSON.stringify({
                name: name,
                email: email,
                message: message,
            }),
            success: function(msg, status, jqXHR) {
                $('#contactFormContainer').empty();
                $('#contactFormContainer').append('<div class="alert alert-success text-center"><p>Your message was successfully sent! Our team will get back to you as soon as possible.</p></div>')
            },
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                alert('There was an error sending your message. Please try again later.');
            }
        });
    });

    $('#submitSampleAPIRequest').on('click', function(e) {
        gtag('event', 'Send Sample API Request Clicked');
        query = $('#sample-api-request').val();
        $('#submitSampleAPIRequest').prop('disabled', true);
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/nutrition?query=' + query ,
            contentType: 'application/json',
            success: function(result) {
                $('#sample-response').html(JSON.stringify(result, null, 2));
                $('#submitSampleAPIRequest').prop('disabled', false);
            },
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.log('An error occured: ' + jqXHR.responseText);
                $('#submitSampleAPIRequest').prop('disabled', false);
            }
        });
    });

    $('#submitSampleRecipeAPIRequest').on('click', function(e) {
        gtag('event', 'Send Sample Recipe API Request Clicked');
        query = $('#sample-recipe-api-request').val();
        $('#submitSampleRecipeAPIRequest').prop('disabled', true);
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/recipe?query=' + query ,
            contentType: 'application/json',
            success: function(result) {
                $('#sample-response-recipe').html(JSON.stringify(result, null, 2));
                $('#submitSampleRecipeAPIRequest').prop('disabled', false);
            },
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.log('An error occured: ' + jqXHR.responseText);
                $('#submitSampleRecipeAPIRequest').prop('disabled', false);
            }
        });
    });

    $("input:file").change(function () {
        var file = document.getElementById('file').files[0];
        if (file.type != "image/jpeg" && file.type != "image/png") {
            alert("Please upload a PNG or JPEG image file")
        }
        var reader  = new FileReader();
        // it's onload event and you forgot (parameters)
        reader.onload = function(e)  {
            var image = document.createElement("img");
            // the result image data
            image.src = e.target.result;
            $("#image").attr("src",e.target.result);
            $("#api-menu").show();
            $('#original-div').show();
            $('#image-demo-container').show();
        }
        // you have to declare the file loading
        reader.readAsDataURL(file);
    });

    $('#submit-image').on('click', function(e) {
        if (! $('#image').attr('src')) {
            alert('Please select an image first.')
            return
        }
        gtag('event', 'Find Nutrition clicked');
        $('#result').empty();
        $('#query-text').empty();
        $('#image-demo').hide();
        var formData = new FormData();
        formData.append('file', $('#file')[0].files[0]);
        $('#submit-image').prop('disabled', true);
        $('#image-loader').show();
        $.ajax
        ({
            method: 'POST',
            url: _config.api.invokeUrl + '/imagetextnutrition',
            data: formData,
            enctype: 'multipart/form-data',
            processData: false,
            contentType: false, 
            success: function(result) {
                completeRequest(result, "", true);
                $('#submit-image').prop('disabled', false);
                $('#image-loader').hide();
            },
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText);
                $('#submit-image').prop('disabled', false);
                $('#image-loader').hide();
            }
        });
    });
    $('#submitImageAPIRequest').on('click', function(e) {
        if (! $('#image').attr('src')) {
            alert('Please select an image first.')
            return
        }
        gtag('event', 'Find Image Nutrition clicked');
        var formData = new FormData();
        formData.append('file', $('#file')[0].files[0]);
        $('#submitImageAPIRequest').prop('disabled', true);
        $.ajax
        ({
            method: 'POST',
            url: _config.api.invokeUrl + '/imagetextnutrition',
            data: formData,
            enctype: 'multipart/form-data',
            processData: false,
            contentType: false, 
            success: function(result) {
                var res = JSON.stringify(result, null, 2);
                $('#image-sample-response').text(res);
                $('#submitImageAPIRequest').prop('disabled', false);
            },
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText);
                $('#submitImageAPIRequest').prop('disabled', false);
            }
        });
    });
});