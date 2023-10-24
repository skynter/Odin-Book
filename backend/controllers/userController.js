const validator = require("validator");
const bcryptjs = require("bcryptjs");
const User = require("../models/userModel");
const cloudinary = require("../cloudinary");
const jwt = require("jsonwebtoken");

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

exports.sign_up = async (req, res) => {
  // signup logic
  const signup = async (firstName, lastName, email, password) => {
    // #1 firstName lastName, Email and password validation (form fields)

    // Check if form fields exist
    if (!firstName || !lastName || !email || !password) {
      throw Error("All fields must be filled");
    }

    // check if email is a valid email
    if (!validator.isEmail(email)) {
      throw Error("Email is not valid");
    }

    // check if password is strong enough
    if (
      !validator.isStrongPassword(password, {
        minLength: 6,
        minNumbers: 0,
        minSymbols: 0,
      })
    ) {
      throw Error(
        "Password must at least contain 6 characters and one uppercase letter"
      );
    }

    // #2 DB result validation

    // Check if user exists in the database
    const exists = await User.findOne({ email });

    if (exists) {
      throw Error("The email is already used by another user.");
    }

    // #3 DB security
    // hashing the password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // #4 Add user to DB
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    await user.save();

    return user;
  };

  // desctructure form body fields
  const { firstName, lastName, email, password } = req.body;

  try {
    // run the signup logic and create user if the logic succeeds
    const user = await signup(firstName, lastName, email, password);

    // create a token
    const token = createToken(user._id);

    // send user info as json
    res.status(200).json({ ...user._doc, password: null, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.log_in = async (req, res) => {
  // login logic
  const login = async (email, password) => {
    // #1 Email and password validation (form fields)

    // check if email or password are empty
    if (!email || !password) {
      throw Error("All fields must be filled");
    }

    // #2 DB result validation

    // check if user does not exists
    const user = await User.findOne({ email });

    if (!user) {
      throw Error("Incorrect email");
    }

    // check if password is correct
    const match = await bcryptjs.compare(password, user.password);

    if (!match) {
      throw Error("Incorrect password");
    }

    return user;
  };

  // desctructure form body fields
  const { email, password } = req.body;

  try {
    // run the login logic and log the user in if the logic succeeds
    const user = await login(email, password);

    // create a token
    const token = createToken(user._id);

    // send user info as json
    res.status(200).json({ ...user._doc, password: null, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.get_users = async (req, res) => {
  try {
    const users_list = await User.find();

    res.status(200).json(users_list);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.get_non_friends_users = async (req, res) => {
  const { user_id } = req.params;

  const user = await User.findById(user_id);

  const generateUserAndFriendsIdsArray = () => {
    const userFriends_ids = user.friends_ids;
    const userSentRequests = user.sent_friends_requests;
    const userIncomingRequests = user.incoming_friends_requests;
    const user_id = user._id;

    return userFriends_ids.concat(
      userSentRequests,
      userIncomingRequests,
      user_id
    );
  };

  const user_and_friends_ids = generateUserAndFriendsIdsArray();

  try {
    const non_friends_users = await User.find({
      _id: { $nin: user_and_friends_ids },
    });
    res.status(200).json(non_friends_users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.get_user = async (req, res) => {
  const { user_id } = req.params;

  try {
    const user = await User.findById(user_id);

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.get_friends = async (req, res) => {
  const { user_id } = req.params;

  const user = await User.findById(user_id);

  const user_friends_ids = user.friends_ids;

  try {
    if (user_friends_ids) {
      const users_friends = await User.find({
        _id: { $in: user_friends_ids },
      });
      res.status(200).json(users_friends);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.get_limited_friends = async (req, res) => {
  const { userFriends_ids } = req.body;

  try {
    // fetch user limited friends
    const userFriends = await User.find({
      _id: { $in: userFriends_ids },
    }).limit(9);

    res.status(200).json(userFriends);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.get_incoming_friends_requests = async (req, res) => {
  const { user_id } = req.params;

  const user = await User.findById(user_id);

  const incoming_friends_requests = user.incoming_friends_requests;

  try {
    const incomingFriendsRequests = await User.find({
      _id: { $in: incoming_friends_requests },
    });
    res.status(200).json(incomingFriendsRequests);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.get_sent_friends_requests = async (req, res) => {
  const { user_id } = req.params;

  const user = await User.findById(user_id);

  const sent_friends_requests = user.sent_friends_requests;

  try {
    const sentFriendsRequests = await User.find({
      _id: { $in: sent_friends_requests },
    });

    res.status(200).json(sentFriendsRequests);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.send_friend_request = async (req, res) => {
  const { user_id, friend_id } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      user_id,
      {
        $push: { sent_friends_requests: friend_id },
      },
      { new: true }
    );

    const added_friend = await User.findByIdAndUpdate(friend_id, {
      $push: { incoming_friends_requests: user_id },
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.essage });
  }
};

exports.cancel_friend_request = async (req, res) => {
  const { user_id, friend_id } = req.body;

  const user = await User.findById(user_id);
  const filtered_user_sent_requests = user.sent_friends_requests.filter(
    (request) => request !== friend_id
  );

  const friend = await User.findById(friend_id);
  const filtered_friend_incoming_requests =
    friend.incoming_friends_requests.filter((request) => request !== user_id);

  try {
    const updated_user = await User.findByIdAndUpdate(
      user_id,
      {
        $set: {
          sent_friends_requests: filtered_user_sent_requests,
        },
      },
      {
        new: true,
      }
    );

    const updated_friend = await User.findByIdAndUpdate(friend_id, {
      $set: {
        incoming_friends_requests: filtered_friend_incoming_requests,
      },
    });

    res.status(200).json(updated_user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.accept_friend_request = async (req, res) => {
  const { user_id, friend_id } = req.body;

  const user = await User.findById(user_id);
  const filtered_user_incoming_requests = user.incoming_friends_requests.filter(
    (request) => request !== friend_id
  );

  const friend = await User.findById(friend_id);
  const filtered_friend_sent_requests = friend.sent_friends_requests.filter(
    (request) => request !== user_id
  );

  try {
    const updated_user = await User.findByIdAndUpdate(
      user_id,
      {
        $set: { incoming_friends_requests: filtered_user_incoming_requests },
        $push: {
          friends_ids: friend_id,
        },
      },
      { new: true }
    );

    const updated_friend = await User.findByIdAndUpdate(friend_id, {
      $set: { sent_friends_requests: filtered_friend_sent_requests },
      $push: {
        friends_ids: user_id,
      },
    });

    res.status(200).json(updated_user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.reject_friend_request = async (req, res) => {
  const { user_id, friend_id } = req.body;

  const user = await User.findById(user_id);
  const filtered_user_incoming_requests = user.incoming_friends_requests.filter(
    (request) => request !== friend_id
  );

  const friend = await User.findById(friend_id);
  const filtered_friend_sent_requests = friend.sent_friends_requests.filter(
    (request) => request !== user_id
  );

  try {
    const updated_user = await User.findByIdAndUpdate(
      user_id,
      {
        $set: {
          incoming_friends_requests: filtered_user_incoming_requests,
        },
      },
      { new: true }
    );

    const updated_friend = await User.findByIdAndUpdate(friend_id, {
      $set: {
        sent_friends_requests: filtered_friend_sent_requests,
      },
    });

    res.status(200).json(updated_user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete_friend = async (req, res) => {
  const { user_id, friend_id } = req.body;

  const user = await User.findById(user_id);
  const filtered_user_friends_ids = user.friends_ids.filter(
    (friend) => friend !== friend_id
  );

  const friend = await User.findById(friend_id);
  const filtered_friend_friends_ids = friend.friends_ids.filter(
    (friend) => friend !== user_id
  );

  try {
    const updated_user = await User.findByIdAndUpdate(
      user_id,
      {
        $set: { friends_ids: filtered_user_friends_ids },
      },
      { new: true }
    );

    const updated_friend = await User.findByIdAndUpdate(friend_id, {
      $set: { friends_ids: filtered_friend_friends_ids },
    });

    res.status(200).json(updated_user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update_profile_data = async (req, res) => {
  const {
    user_id,
    firstName,
    lastName,
    email,
    occupation,
    education,
    location,
  } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      {
        $set: {
          firstName,
          lastName,
          email,
          occupation,
          education,
          location,
        },
      },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update_profile_image = async (req, res) => {
  const { user_id, imageUrl } = req.body;

  try {
    if (!imageUrl) {
      const updatedUserEmptyProfileImage = await User.findByIdAndUpdate(
        user_id,
        {
          $set: {
            profileImg: {
              public_id: "",
              url: "",
            },
          },
        },
        { new: true }
      );

      res.status(200).json(updatedUserEmptyProfileImage);
    }
    if (imageUrl) {
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: "profile_images",
      });

      const updatedUser = await User.findByIdAndUpdate(
        user_id,
        {
          $set: {
            profileImg: {
              public_id: result.public_id,
              url: result.secure_url,
            },
          },
        },
        { new: true }
      );
      res.status(200).json(updatedUser);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update_user_cover_image = async (req, res) => {
  const { user_id, imageUrl } = req.body;

  try {
    if (!imageUrl) {
      const updatedUserEmptyCoverImage = await User.findByIdAndUpdate(
        user_id,
        {
          $set: {
            coverImg: {
              public_id: "",
              url: "",
            },
          },
        },
        { new: true }
      );

      res.status(200).json(updatedUserEmptyCoverImage);
    }

    if (imageUrl) {
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: "profile_cover_images",
      });

      const updatedUser = await User.findByIdAndUpdate(
        user_id,
        {
          $set: {
            coverImg: {
              public_id: result.public_id,
              url: result.secure_url,
            },
          },
        },
        { new: true }
      );
      res.status(200).json(updatedUser);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
