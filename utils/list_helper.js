const _ = require("lodash");

const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  let sum = 0;
  blogs.forEach((blog) => {
    sum += blog.likes;
  });
  return sum;
};

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) {
    return {};
  }

  let max = -1;
  let favorite;

  blogs.forEach((blog) => {
    if (blog.likes > max) {
      max = blog.likes;
      favorite = blog;
    }
  });
  return {
    title: favorite.title,
    author: favorite.author,
    likes: favorite.likes,
  };
};

const mostBlogs = (blogs) => {
  if (blogs.length === 0) {
    return {};
  }

  // Count blogs by author
  const blogCount = _.countBy(blogs, "author");

  // Find the author with most blogs
  const [author, numberBlogs] = _.maxBy(
    _.toPairs(blogCount),
    ([, blog]) => blog
  );
  return { author, blogs: numberBlogs };
};

const mostLikes = (blogs) => {
  if (blogs.length === 0) {
    return {};
  }

  // Group blogs by author
  const blogsByAuthor = _.groupBy(blogs, "author");

  // Find the author with the maximum total likes
  const [authorWithMostLikes, authorBlogs] = _.maxBy(
    _.toPairs(blogsByAuthor),
    ([, blogs]) => _.sumBy(blogs, "likes")
  );

  // Calculate the total number of likes for the author
  const totalLikes = _.sumBy(authorBlogs, "likes");

  return { author: authorWithMostLikes, likes: totalLikes };
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
};
