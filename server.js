const http = require('https');
const express = require('express');
const PORT = process.env.PORT | 3000 | 5000 | 8080;
const app = express();
const prefix = "//"

const server = app.listen(PORT);

app.use('/', (req, res) => {
	res.send(new Date());
});


app.get('/',(req,res)=>res.sendStatus(200))

module.exports = { PORT };