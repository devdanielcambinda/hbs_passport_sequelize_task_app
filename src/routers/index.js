const express = require("express");
const router = new express.Router();

router.get("/", (req, res) => {
  res.render("index", {
    title: "Home",
    name: "Daniel Cambinda",
    user: req.user,
  });
});

module.exports = router