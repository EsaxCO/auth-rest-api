const router = require('express').Router()
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jsw = require('jsonwebtoken')
const { registerValidation, loginValidation } = require('../validation')


router.post('/register', async (req, res) => {
    //VALIDATE
    const { error } = registerValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);


    //CHECK CLONE
    const emailExist = await User.findOne({ email: req.body.email })
    if (emailExist) return res.status(400).send('Email already exists');


    //HASH PASSWORDS
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);


    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
    });
    try {
        const savedUser = await user.save();
        res.send({ user: savedUser._id })
    } catch (err) {
        res.status(400).send(err);
    }
})



//LOGIN
router.post('/login', async (req, res) => {
    //VALIDATE
    const { error } = loginValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    //CHECKING EMAIL EXISTS
    const user = await User.findOne({ email: req.body.email })
    if (!user) return res.status(400).send('Email is not found');

    //CHECKING CORRECT PASSWORD
    const validPassword = await bcrypt.compare(req.body.password, user.password)
    if (!validPassword) return res.status(400).send('Password is wrong');

    //CREATE AND ASSIGN TOKER 
    const token = jsw.sign({ _id: user._id }, process.env.TOKEN_SECRET)
    res.header('auth-toker', token).send(token)
})



module.exports = router;