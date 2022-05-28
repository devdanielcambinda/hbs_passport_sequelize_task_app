const isAuthenticated = (req, res, next) => {
  if (req.user) return next();
  else
    return res.render("unauthenticated", {
      error: "User not authenticated",
      title: "Authentication needed",
      name: "Daniel Cambinda",
      user: req.user,
    });
};

module.exports = isAuthenticated