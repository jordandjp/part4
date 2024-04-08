const Blog = require("../models/blog");

const middleware = require("../utils/middleware");

const blogsRouter = require("express").Router();

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", { username: 1, name: 1 });
  response.json(blogs);
});

blogsRouter.post("/", middleware.userExtractor, async (request, response) => {
  const user = request.user;
  const body = request.body;

  if (!body.title) {
    return response.status(400).json("title field is necessary");
  }

  if (!body.url) {
    return response.status(400).json("url field is necessary");
  }

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user._id,
  });

  const savedBlog = await blog.save();
  response.status(201).json(savedBlog);
});

blogsRouter.delete(
  "/:id",
  middleware.userExtractor,
  async (request, response) => {
    const user = request.user;

    const blog = await Blog.findById(request.params.id);

    if (blog.user.toString() !== user._id.toString()) {
      return response
        .status(403)
        .json({
          error: "You don't have the permission to perform this action",
        });
    }

    await Blog.findByIdAndDelete(request.params.id);
    response.status(204).end();
  }
);

blogsRouter.put("/:id", async (request, response) => {
  const body = request.body;

  if (!body.title) {
    return response.status(400).json("title field is necessary");
  }

  if (!body.url) {
    return response.status(400).json("url field is necessary");
  }

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  };

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
    new: true,
  });
  response.json(updatedBlog);
});

module.exports = blogsRouter;
