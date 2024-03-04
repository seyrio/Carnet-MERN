const express = require("express");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetchuser = require("../middleware/fetchuser");
const { body, validationResult } = require("express-validator");

const JWT_SECRET = "viefolle";

// ROUTE 1 ~ create a user: POST "/api/auth/createuser" doesn't require login
router.post(
  "/createuser",
  [
    // validation of data
    body("name", "Enter a valid name").isLength({ min: 3 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be atleast 5 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    // if error, return bad request with array of errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // create a user
    try {
      // check if user with same email already exists ??
      let user = await User.findOne({ email: req.body.email });
      if (user)
        return res.status(400).json({
          error: "Sorry, a user with this electornic mail already exists.",
        });

      // generate salt and create secure password using bcrypt
      const salt = await bcrypt.genSalt(10);
      const securePassword = await bcrypt.hash(req.body.password, salt);

      // create user
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: securePassword,
      });

      // data for token
      const data = {
        user: {
          id: user.id,
        },
      };

      // generate token
      const authToken = jwt.sign(data, JWT_SECRET);
      res.json({ authToken });

      // catch other external errors
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Internal server error!");
    }
  }
);

// ROUTE 2 ~ authenticate a user: POST "api/auth/login" doesn't require login
router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Enter password").exists(),
  ],
  async (req, res) => {
    // if error, return bad request with array of errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }

    // destructing credentials
    const { email, password } = req.body;

    try {
      // checking email
      let user = await User.findOne({ email });
      if (!user) return res.status(400).send("Invalid login credentials.");

      // comparing passwords
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare)
        return res.status(400).send("Invalid login credentials.");

      // data for token
      const data = {
        user: {
          id: user.id,
        },
      };

      // generating token
      const authToken = jwt.sign(data, JWT_SECRET);
      res.json({ authToken });

      // handling errors
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Internal server error!");
    }
  }
);

// ROUTE 3 ~ get user details: POST "api/auth/getuser" require login
router.post("/getuser", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.send(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Internal server error!");
  }
});

module.exports = router;
