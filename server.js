require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000

// MongoDB Connection
const connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  }

  //Connect to the database before listening
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("listening for requests");
    })
})


// User Schema
const userSchema = new mongoose.Schema({
    vehicle_id: String,
    rfid_id: String,
    first_name: String,
    last_name: String,
    contact_no: String,
    email: { type: String, unique: true },
    password: String,
}, {
    // Set versionKey to false to exclude the __v field
    versionKey: false
});


app.use('/public/', express.static('./public'));
app.set('view engine', 'ejs');

const session = require('express-session');

app.use(bodyParser.json());

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));


userSchema.methods.comparePassword = function(candidatePassword) {
    return candidatePassword === this.password;
};


const User = mongoose.model('ho_accounts', userSchema);
module.exports = User;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        // User is authenticated, continue to the next middleware or route handler
        next();
    } else {
        // User is not authenticated, redirect to the login page
        res.redirect('/login'); // Replace '/login' with your actual login route
    }
}

// Routes
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/edit', requireAuth, (req, res) => {
    const user = req.session.user;
    res.render('edit', { user });
});

app.get('/home', requireAuth, (req, res) => {
    res.render('index');
});

app.get('/incopass', (req, res) => {
    res.render('incopass');
});

app.get('/infosucc', (req, res) => {
    res.render('infosucc');
});

app.get('/existsuername', (req, res) => {
    res.render('existsusername');
});

app.get('/logout', (req, res) => {
    delete req.session.userId;
    req.session.destroy(err => {
        if (err) {
            console.error(err);
        }
        // Redirect to the login page or any other page as needed
        res.redirect('/login');
    });
});

app.get('/success', requireAuth, (req, res) => {
    res.render('success');
});

app.get('/exists', requireAuth, (req, res) => {
    res.render('exists');
});

app.get('/incorrect', requireAuth, (req, res) => {
    res.render('incorrect');
});


app.post('/register', async (req, res) => {
    const { email, password, first_name, last_name, contact_no } = req.body;
    const vehicle_id = ""; // Set default value for vehicle_id
    const rfid_id = ""; // Set default value for rfid_id

    try {
        const isUsernameTaken = await User.exists({ email: email });

        if (isUsernameTaken) {
            // Return an error message to the client
            res.redirect('/existsuername');
            console.log('Existing User.')
            return;
        }

        const user = new User({ email, password, vehicle_id, rfid_id, first_name, last_name, contact_no });
        await user.save();

        // Log in the new user after successful registration
        req.session.userId = user._id;
        req.session.user = user;

        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.redirect('/register'); // Redirect to an error page or handle the error accordingly
    }
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && user.password === password) {
            req.session.userId = user._id;
            req.session.user = user;
            res.redirect('/home'); // You can redirect or render a dashboard here
        } else {
            res.redirect('/incopass');
        }
    } catch (error) {
        console.error(error);
        res.send('Error logging in');
    }
});

app.post('/editlogin', async (req, res) => {
    const { newEmail, newPassword, currentPassword } = req.body;
    const userId = req.session.userId; // Retrieve the user's ID from the session

    try {
        // Check if the new username is already taken in your database
        const isUsernameTaken = await User.exists({ email: newEmail });

        if (isUsernameTaken) {
            // Return an error message to the client
            res.redirect('/exists');
            console.log('Existing User.')
            return;
        } 

        const user = await User.findById(userId);

        const passwordMatch = await user.comparePassword(currentPassword); // You need to implement this method in your User model

        if (!passwordMatch) {
            res.redirect('/incorrect'); // Password doesn't match, return an error message
            console.log('Verification Failed.')
        }
        
        else {
            const user = await User.findById(userId);

            // Update the user's information in the database (e.g., using Mongoose)
            await User.findByIdAndUpdate(userId, {
                email: newEmail,
                password: newPassword,
            });

            user.email = newEmail;
            user.password = newPassword;

            req.session.user = user;

            // Return a success message to the client
            res.redirect('/success');
            console.log('Success.')
            return;
        }
    } catch (error) {
        console.error(error);
        console.log('Error.')
    }
});

app.post('/editinfo', async (req, res) => {
    const { newFirstName, newLastName, newContactNo } = req.body;
    const userId = req.session.userId; // Retrieve the user's ID from the session

    try {
        const user = await User.findById(userId);
        // Update the user's information in the database (e.g., using Mongoose)
        // Replace this with your database update code
        await User.findByIdAndUpdate(userId, {
            first_name: newFirstName,
            last_name: newLastName,
            contact_no: newContactNo,
        });
        user.first_name = newFirstName;
        user.last_name = newLastName;
        user.contact_no = newContactNo;

        req.session.user = user;

        res.redirect('/infosucc'); // Redirect to a dashboard or profile page
        console.log('Success.')
    } catch (error) {
        console.error(error);
        res.send('Error updating user account');
    }
});

app.post('/delete', async (req, res) => {
    const userId = req.session.userId; // Retrieve the user's ID from the session

    try {
        // Delete the user's account from the database (e.g., using Mongoose)
        // Replace this with your database deletion code
        await User.findByIdAndDelete(userId);
        req.session.destroy(); // Destroy the session to log the user out
        res.redirect('/login'); // Redirect to the login or home page
    } catch (error) {
        console.error(error);
        res.send('Error deleting user account');
    }
});
