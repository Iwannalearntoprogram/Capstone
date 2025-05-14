const User = require('./userModel');

async function createUser(req, res) {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json({ message: "User created!", user: newUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = { createUser };
