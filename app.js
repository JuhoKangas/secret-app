//jshint esversion:6

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');

const app = express();

// Initialising ejs and bodyparser
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

//Initialising the express session and passport.js
app.use(session({
    secret: process.env.CLIENT_SECRET,
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
    password: String,
    googleId: String,
    facebookId: String,
});

const secretSchema = new Schema({
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('user', userSchema);
const Secret = mongoose.model('secret', secretSchema);

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets"
    },
    function (accessToken, refreshToken, profile, cb) {
        // console.log(profile);
        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));

passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/secrets"
    },
    function (accessToken, refreshToken, profile, cb) {
        // console.log(profile);
        User.findOrCreate({
            facebookId: profile.id,
            // username: profile.displayName
        }, function (err, user) {
            return cb(err, user);
        });
    }
));


// ROUTES

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile']
    }));

app.get('/auth/google/secrets',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect('/secrets');
    });

app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect('/secrets');
    });

app.get('/secrets', (req, res) => {
    if (req.isAuthenticated()) {
        Secret.find({}, (err, secret) => {
            if (err) {
                console.log(err);
            } else {
                res.render('secrets', {
                    secrets: secret
                });
            }
        });
    } else {
        res.redirect('/login');
    }
});

app.route('/submit')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render('submit');
        } else {
            res.redirect('/login');
        }
    })
    .post((req, res) => {

        const secret = new Secret({
            secret: req.body.secret
        });
        secret.save(() => res.redirect('/secrets'));
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