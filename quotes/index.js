var express = require('express');
var app = express();

const fs = require("fs");

app.get('/quotes', function(req, res){
    const dir = '/quotes';
    //passsing directoryPath and callback function
    fs.readdir(dir, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 

        var el = Math.floor(Math.random() * files.length);

        path = dir + '/' + files[el];

        fs.readFile(path, function(err, buf) {
            res.send(buf.toString());
        });
    });
});

app.listen(3000);