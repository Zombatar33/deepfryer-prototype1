const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const port = 5050;

// serve your css as static
app.use(express.static(__dirname));

// get our app to use body parser 
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', function (req, res) {
    res.sendFile('/src/html/index.html', { root: __dirname });
})

app.listen(port, () => {
    console.log(`started on http://localhost:${port}`);
})