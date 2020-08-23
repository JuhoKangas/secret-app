//jshint esversion:6

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');

const bcrypt = require('bcrypt');
const saltRounds = 10;

mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: String,
    password: String
});

const User = mongoose.model('user', userSchema);

app.get('/', (req, res) => {
    res.render('home');
});

app.route('/register')
    .get((req, res) => {
        res.render('register');
    })

    .post((req, res) => {
        bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
            const newUser = new User({
                email: req.body.username,
                password: hash
            });

            newUser.save((err) => {
                if (!err) {
                    res.render('secrets');
                } else {
                    console.log(err);
                }
            });
        });
    });

app.route('/login')
    .get((req, res) => {
        res.render('login');
    })

    .post((req, res) => {
        const username = req.body.username;
        const password = req.body.password;

        User.findOne({
            email: username
        }, (err, foundUser) => {
            if (!err) {
                if (foundUser) {
                    bcrypt.compare(password, foundUser.password, (err, result) => {
                        if (result === true) {
                            res.render('secrets');
                        }
                    });
                }
            } else {
                console.log(err);
            }
        });
    });



app.listen(3000, () => console.log('Server succesfully started on port 3000'));