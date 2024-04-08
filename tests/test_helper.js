const mongoose = require("mongoose");

const Blog = require("../models/blog");
const User = require("../models/user");

// Corresponding user passwords for the initialUsers
const initialUserPasswords = new Map([
  ["michael-chan", "michael-chan-secret-password"],
  ["edsger-dijkstra", "edsger-dijkstra-secret-password"],
]);

const initialUsers = [
  {
    username: "michael-chan",
    name: "Michael Chan",
    passwordHash:
      "$2b$10$D76LCRx/2DMz/IgVSnL5QO4MQ57wdAfA/tBlwZj4iHJp4ZwnAU33a",
    _id: new mongoose.Types.ObjectId().toHexString(),
  },
  {
    username: "edsger-dijkstra",
    name: "Edsger W. Dijkstra",
    password: "edsger-dijkstra-secret-password",
    passwordHash:
      "$2b$10$sbq3IcNPd2LEqJtL/wVuQ.rI18rB6amVVu8dssWkRZvhLDUeXBTa2",
    _id: new mongoose.Types.ObjectId().toHexString(),
  },
];

const initialBlogs = [
  {
    title: "React patterns",
    author: "Michael Chan",
    url: "https://reactpatterns.com/",
    likes: 7,
    user: initialUsers[0]._id,
  },
  {
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
    likes: 5,
    user: initialUsers[1]._id,
  },
];

const blogsInDb = async () => {
  const blogs = await Blog.find({}).populate("user", { username: 1, name: 1 });
  return blogs.map((blog) => blog.toJSON());
};

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((u) => u.toJSON());
};

const findDifferentUser = async (userId) => {
  return await User.findOne({
    _id: { $ne: userId },
  }).exec();
};

const loginWithUser = async (api, username, password) => {
  const resultLogin = await api.post("/api/login").send({ username, password });

  return resultLogin.body.token;
};

module.exports = {
  initialBlogs,
  blogsInDb,
  initialUsers,
  initialUserPasswords,
  usersInDb,
  findDifferentUser,
  loginWithUser,
};
