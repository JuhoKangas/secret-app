//jshint esversion:6

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

// Initialising ejs and bodyparser
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

//Initialising the express session and passport.js
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//Connecting to the database
mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.set('useCreateIndex', true);

const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('user', userSchema);

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// ROUTES

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/secrets', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('secrets');
    } else {
        res.redirect('/login');
    }
});

app.route('/register')
    .get((req, res) => {
        res.render('register');
    })

    .post((req, res) => {

        User.register(new User({
            username: req.body.username
        }), req.body.password, function (err, user) {
            if (err) {
                console.log(err);
                res.redirect('/register');
            }

            passport.authenticate('local')(req, res, function () {
                res.redirect('/secrets');
            });
        });

    });

app.route('/login')
    .get((req, res) => {
        res.render('login');
    })

    .post(passport.authenticate('local'), (req, res) => {
        res.redirect('/secrets');
    });

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});


app.listen(3000, () => console.log('Server succesfully started on port 3000'));