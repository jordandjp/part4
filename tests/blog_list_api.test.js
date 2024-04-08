const { test, after, before, beforeEach, describe } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const Blog = require("../models/blog");
const User = require("../models/user");
const helper = require("./test_helper");

const api = supertest(app);

const endpoint = "/api/blogs";

beforeEach(async () => {
  await Blog.deleteMany({});
  await User.deleteMany({});
  const userObjects = helper.initialUsers.map((user) => new User(user));

  const userPromiseArray = userObjects.map((userObject) => userObject.save());
  await Promise.all(userPromiseArray);

  const blogObjects = helper.initialBlogs.map((blog) => new Blog(blog));

  const blogPromiseArray = blogObjects.map((blogObject) => blogObject.save());
  await Promise.all(blogPromiseArray);
});

describe("list blogs - GET /api/blogs", () => {
  test("blogs are returned as json", async () => {
    await api
      .get(endpoint)
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("there are two blogs", async () => {
    const response = await api.get(endpoint);

    assert.strictEqual(response.body.length, helper.initialBlogs.length);
  });

  test("the first title is React patterns", async () => {
    const response = await api.get(endpoint);

    const titles = response.body.map((blog) => blog.title);
    assert(titles.includes("React patterns"));
  });

  test("unique identifier property of blog posts is named id", async () => {
    const response = await api.get(endpoint);
    const blogsWithID = response.body.filter((blog) => blog.id !== undefined);
    assert.strictEqual(blogsWithID.length, helper.initialBlogs.length);
  });
});

describe("add new blog - POST /api/blogs", () => {
  let loggedInUserToken;

  before(async () => {
    const user = helper.initialUsers[0];
    const userPassword = helper.initialUserPasswords.get(user.username);

    loggedInUserToken = await helper.loginWithUser(
      api,
      user.username,
      userPassword
    );
  });

  test("a valid blog can be added ", async () => {
    const newBlog = {
      title: "First class tests",
      author: "Robert C. Martin",
      url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
      likes: 10,
    };

    await api
      .post(endpoint)
      .set("Authorization", `Bearer ${loggedInUserToken}`)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();

    const titles = blogsAtEnd.map((blog) => blog.title);

    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1);

    assert(titles.includes("First class tests"));
  });

  test("if the likes property is missing, it will default to value 0", async () => {
    const newBlog = {
      title: "First class tests",
      author: "Robert C. Martin",
      url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
    };

    await api
      .post(endpoint)
      .set("Authorization", `Bearer ${loggedInUserToken}`)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();

    const createdBlog = blogsAtEnd.filter(
      (blog) => blog.title === "First class tests"
    )[0];

    assert(createdBlog);
    assert.strictEqual(createdBlog.likes, 0);
  });

  test("title property is required", async () => {
    const newBlog = {
      author: "Robert C. Martin",
      url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
    };

    await api
      .post(endpoint)
      .set("Authorization", `Bearer ${loggedInUserToken}`)
      .send(newBlog)
      .expect(400)
      .expect("Content-Type", /application\/json/);
  });

  test("url property is required", async () => {
    const newBlog = {
      author: "Robert C. Martin",
      title: "First class tests",
    };

    await api
      .post(endpoint)
      .set("Authorization", `Bearer ${loggedInUserToken}`)
      .send(newBlog)
      .expect(400)
      .expect("Content-Type", /application\/json/);
  });
});

describe("delete blog - DELETE /api/blogs/:id", () => {
  let blogToDelete;
  let loggedInUserToken;

  beforeEach(async () => {
    const blogsAtStart = await helper.blogsInDb();
    blogToDelete = blogsAtStart[0];

    const user = blogToDelete.user;
    const userPassword = helper.initialUserPasswords.get(user.username);

    loggedInUserToken = await helper.loginWithUser(
      api,
      user.username,
      userPassword
    );
  });

  test("succeeds with status code 204 if id is valid", async () => {
    await api
      .delete(`${endpoint}/${blogToDelete.id}`)
      .set("Authorization", `Bearer ${loggedInUserToken}`)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();

    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1);

    const blogIds = blogsAtEnd.map((blog) => blog.id);
    assert(!blogIds.includes(blogToDelete.id));
  });

  test("succeeds with status code 204 if authenticated user is the same as the blog creator", async () => {
    await api
      .delete(`${endpoint}/${blogToDelete.id}`)
      .set("Authorization", `Bearer ${loggedInUserToken}`)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();

    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1);
    const blogIds = blogsAtEnd.map((blog) => blog.id);
    assert(!blogIds.includes(blogToDelete.id));
  });

  test("fails with status code 403 if authenticated user is not the same as the blog creator", async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    // authenticate with different user
    const differentUser = await helper.findDifferentUser(blogToDelete.user.id);

    const differentUserPassword = helper.initialUserPasswords.get(
      differentUser.username
    );

    const token = await helper.loginWithUser(
      api,
      differentUser.username,
      differentUserPassword
    );

    await api
      .delete(`${endpoint}/${blogToDelete.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(403);

    const blogsAtEnd = await helper.blogsInDb();

    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length);
  });
});

describe("update specified blog - PUT /api/blogs/:id", () => {
  test("blog is updated correctly", async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToUpdate = blogsAtStart[0];

    const likesAtStart = blogToUpdate.likes;
    blogToUpdate.likes = likesAtStart + 1;

    await api
      .put(`${endpoint}/${blogToUpdate.id}`)
      .send(blogToUpdate)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    const updatedBlogAtEnd = blogsAtEnd.filter(
      (blog) => blog.id === blogToUpdate.id
    )[0];

    assert.strictEqual(updatedBlogAtEnd.likes, likesAtStart + 1);
  });
});

after(async () => {
  await mongoose.connection.close();
});
