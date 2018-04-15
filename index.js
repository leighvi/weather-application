const express = require('express')
const bodyParser = require('body-parser')
const request = require('request-promise-native')
const fsx = require('fs-extra')
const minify = require('express-minify')

const app = express()
const port = 8080

// Define file paths for writing server logs and weather data
const weatherPath = 'weather_data/data.txt'
const logPath = 'logs/log.txt'

// Load key for openWeatherMap API
const openWeatherApiKey = fsx.readFileSync('api/key.txt')

// Create a write stream for server logs
const logStream = fsx.createWriteStream(logPath, {flags: 'a'})

// Define handler for uncaught exceptions, write to server logs on error
process.on('uncaughtException', function (error) {
    logStream.write(`${new Date().toUTCString()}: ${error}\n`)
});

//Set up body parser
app.use(bodyParser.urlencoded({
	extended: true
}))
app.use(bodyParser.json())

// set up minifier
app.use(minify())

// Define static file directory for client files
app.use(express.static(__dirname + '/public'))

/*
    Endpoint for weather data
        Expects a data object containing a city name in the request body
        Returns weather data array
*/
app.post('/api/weather', (req, res) => {
    if(!req.body.city) return res.send({error: { message: "Problem getting request body" } });
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${encodeURI(req.body.city)}&APPID=${openWeatherApiKey}&units=metric`;
    return request(url)
        .then(data => {
            data = JSON.parse(data)
            const date = new Date()
            // Create weather array to contain weather results strings
            const weather = [
                data.name,
                "",
                date.toUTCString().substring(0, date.toUTCString().length-13),
            ]
            if(data.main) weather.push(`Temperature: ${data.main.temp}\u2103`)
            if(data.weather && data.weather[0]) weather.push(`Sky Conditions: ${data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.substring(1)}`)
            if(data.main) weather.push(`Humidity: ${data.main.humidity}%`)

            // Return weather data to client
            res.send({data: weather})

            // Ensure file to contain weather result logs exists, creates file and dir if not found
            return fsx.ensureFile(weatherPath)
            .then(() => {
                // Append weather data to weather results file
                const stream = fsx.createWriteStream(weatherPath, {flags: 'a'})
                stream.write(weather.join("\n")+"\n\n")
                stream.end()
                return
            })
            .catch(err => {
                logStream.write(`${new Date().toUTCString()}: ${err}\n`)
                return
            })
        })
        .catch(err => {
            logStream.write(`${new Date().toUTCString()}: ${err}\n`)
            return res.send({error: JSON.parse(err.response.body)})
        })
})

/*
    Endpoint for downloading clients current weather results
        Expects weather data in query
        Returns .txt file attachment
*/
app.get('/api/download', (req, res) => {
    res.set({"Content-Disposition": "attachment; filename=\"weather data.txt\""})
    return res.send(req.query.data.replace(/\n/g, "\r\n"))
})

app.get('*', (req, res) => {
    return res.sendFile(__dirname + '/public/html/index.html')
})

app.listen(port, (err) => {
    if(err) {
        logStream.write(`${new Date().toUTCString()}: ${err}\n`)
        return console.log('Error: ', err)
    }
    console.log(`Serving on http://localhost:${port}`)
})