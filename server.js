const express = require("express");
const mongoose = require("mongoose");
const users = require("./models/users");
const ShortUrl = require("./models/shortUrl");
const bcrypt = require("bcrypt");
const app = express();

//#region mongoDB setup
mongoose
  .connect("mongodb://127.0.0.1/Url_Shortener", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log(err);
  });
//#endregion

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
let login_status = false;
let username = null;

app.get("/", async (req, res) => {
  if (login_status) {
    const shortUrls = await ShortUrl.find({ username: username });
    res.render("home", { shortUrls: shortUrls });
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const data = { name: req.body.username, password: hashedPassword };
    await users.insertMany([data]);
    res.render("login");
  } catch {
    res.status(500).send();
  }
});

app.post("/login", async (req, res) => {
  const data = await users.findOne({ name: req.body.username });
  if (data == null) {
    return res.status(400).send("Cannot find user");
  }
  try {
    if (await bcrypt.compare(req.body.password, data.password)) {
      login_status = true;
      username = data.name;
      res.redirect("/");
    } else {
      res.send("Password is incorrect");
    }
  } catch {
    res.sendStatus(500);
  }
});

app.post("/shortUrls", async (req, res) => {
  await ShortUrl.create({ username: username, full: req.body.fullUrl });
  res.redirect("/");
});

app.get("/:shortUrl", async (req, res) => {
  const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
  if (shortUrl == null) return res.sendStatus(404);

  shortUrl.clicks++;
  shortUrl.save();

  res.redirect(shortUrl.full);
});

app.post("/logout", (req, res) => {
  login_status = false;
  username = null;
  res.redirect("/");
});

app.listen(process.env.PORT || 5000);
