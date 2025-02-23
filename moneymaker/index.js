var express = require('express');
var app = express();

const fs = require("fs");

app.get('/moneymaker', function(req, res){
    const dir = '/moneymaker';
    //passsing directoryPath and callback function
    fs.readdir(dir, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }

        do {
            var el = Math.floor(Math.random() * files.length);

            path = dir + '/' + files[el];

            console.log('chosen path', path, ' - is dir?', fs.lstatSync(path).isDirectory());
        } while (fs.lstatSync(path).isDirectory());

        fs.readFile(path, function(err, buf) {
            res.send(buf.toString());
        });
    });
});

app.listen(3000);