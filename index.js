const express = require('express');
const dotenv = require('dotenv').config();
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoose = require('mongoose');
const { errorHandler, notFound } = require('./middlewares/error');
const cors = require('cors');


// connect to db
mongoose
    .connect(process.env.MONGO_URL)


// create express app
const app = express();

// middlewares
app.use(express.json());

// security headers
app.use(helmet());

// prevent http parameter pollution
app.use(hpp());

// security
app.use(xss());

// rate limiter
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    // windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

app.use(cors({
    origin: `${process.env.BASE_URL}`,
}));


// routes
app.use('/api/auth', require('./routes/authRoute'));
app.use('/api/users', require('./routes/usersRoute'));
app.use('/api/posts', require('./routes/postsRoute'));
app.use('/api/comments', require('./routes/commentsRoute'));
app.use('/api/categories', require('./routes/categoryRoute'));
app.use('/api/password', require('./routes/passwordRoute'));


// error handler
app.use(notFound)
app.use(errorHandler)


// run server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});
