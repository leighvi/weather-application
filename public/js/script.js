/*
    Get weather data for input city from server
        Manually submit form data to server with ajax
        Show user error message on incomplete form or server error
        On successful receipt of data from server call "showWeatherResults"
*/
function getWeatherData() {
    var city = $('#city').val()
    if(!city) return $('#inputError').text("Please enter a city name")
    else $('#inputError').text("")
    $.ajax({
        method: "POST",
        url: location.protocol + "//" + location.host + "/api/weather",
        contentType: 'application/json',
        dataType: "json",
        data: JSON.stringify({"city": city})
    })
    .done(function(res) {
        console.log(res.error)
        if(res.error) $('#inputError').text(res.error.message)
        else {
            return showWeatherResults(res.data)
        }
    })
    .fail(function(err) {
        $('#inputError').text(err.responseJSON.message)
    })
}

/*
    Insert returned weather data to user display
        Data is displayed latest first (prepend)
        Show results download button if not already visible
*/
function showWeatherResults(data) {
    $('#results').prepend(data.join("\n")+"\n\n")
    if($('#download-results').attr("hidden")) $('#download-results').attr("hidden", false)
}

/* 
    Block default submittion of form on enter key press
        Call manual data submittion function "getWeatherData"
*/ 
function preventEnter(e) {
    if(e.keyCode === 13) {
        e.preventDefault()
        getWeatherData()
    }
}

/*
    Download current weather results to .txt file
        Create download anchor element with current weather results data
        Trigger link to get file from server
        Remove link from DOM
*/
function downloadDataFile() {
    $('#results').after('<a id="download-link" hidden target="_blank" download href=' + location.protocol + '//' + location.host + '/api/download/?data=' + encodeURI($('#results').text()) +'><span></span></a>')
    $('#download-link span').trigger('click')
    $('#download-link').remove()
}