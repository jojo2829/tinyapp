const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const { getUserByEmail} = require("./helper");

const app = express();
const PORT = 8080;

let urlDatabase = {
  "b2xVn2": {longUrl: "http://www.lighthouselabs.ca", userID: "aabb"} ,
  "b3xVn3": {longUrl: "http://www.facebook.com", userID: "aabb"},
  "9sm5xK": {longUrl: "http://www.google.com", userID: "eekk"}
};

const users = {
  "aabb": {
    id: "aabb",
    email: "aabb@mail.com",
    password: "$2b$10$6XRDyfKywNDg.AIu5.x/4.k8ZZZVs0WiZ5TKwtQT8CxSC0NSpNxHK"
  },
  "eekk": {
    id: "eekk",
    email: "eekk@mail.com",
    password: "$2b$10$XUMYc3wfgu3pD0xdpO08u.2FSm4pMHAQpzJWWL7kC1T8TPOdm/cRO"
  }
};

const generateRandomString = function() {
  const characters = "qwertyuiopasdfghjklzxcvbnm";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.random() * characters.length);
  }
  return result;
};


const urlsForUser = function(user) {
  let result = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === user.id) {
      result[url] = urlDatabase[url];
    }
  }
  return result;
};

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.get("/", (req, res) => {
  const user = users[req.session.cookieId];

  if (!user) {
    res.redirect("/login");
  }

  res.redirect("/urls");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//register page
app.get("/register", (req, res) => {
  const user = users[req.session.cookieId];

  if (user) {
    res.redirect("/urls");
  }

  const templateVars = { user };
  res.render("register", templateVars);
});

//register submit
app.post("/register", (req, res) => {
  //recieve user input
  const email = req.body.email;
  const password = req.body.password;
  const hash = bcrypt.hashSync(password, 10);
  const userFound = getUserByEmail(email, users);

  //check if email is registered
  if (userFound) {
    if (userFound.email === email) {
      return res.status(400).send("user already exist");
    }
  }
  
  if (!email || !password) {
    return res.status(400).send("fields need input");
  }

  //create new user
  const newUserId = generateRandomString().substring(2);
  const newUser = {id: newUserId, email, password: hash};

  //add register user to users
  users[newUserId] = newUser;
  req.session.cookieId = newUserId;
  res.redirect("urls");
});

//login page
app.get("/login", (req, res) => {
  const user = users[req.session.cookieId];

  if (user) {
    res.redirect("/urls");
  }

  const templateVars = { user };
  res.render("login", templateVars);
});

//login submit
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = getUserByEmail(email, users);

  if (!user) {
    return res.status(401).send("User not found");
  }

  bcrypt.compare(password, user.password, function(err, result) {
    if (!result) {
      return res.status(401).send("Password Incorrect");
    }
    req.session.cookieId = user.id;
    res.redirect("/urls");
  });
});

//logout submit
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("urls");
});

//list of all urls page
app.get("/urls", (req, res) => {
  const user = users[req.session.cookieId];
  let urls;

  if (user) {
    urls = urlsForUser(user);
  }

  const templateVars = {
    user,
    urls
  };
  res.render("urls_index", templateVars);
});

//create new url page
app.get("/urls/new", (req, res) => {
  const user = users[req.session.cookieId];

  if (!user) {
    res.redirect("/login");
  }
  
  const templateVars = {
    user,
    urls: urlDatabase
  };
  res.render("urls_new", templateVars);
});

//create new url submit
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longUrl: req.body.longURL,
    userID:req.session.cookieId
  };
  res.redirect(`/urls/${shortURL}`);
});

//short url detail page
app.get("/urls/:shortURL", (req, res) => {
  const cookieId = req.session.cookieId;
  const user = users[cookieId];
  const shortURL = req.params.shortURL;
  let urls;

  if (!urlDatabase[shortURL]) {
    res.status(404).send('Page Not Found');
  }
  
  if (user) {
    urls = urlsForUser(user);
    if (!urls[shortURL])
      return res.status(403).send('Cannot access');
  }

  if (!user) {
    return res.status(403).send("Cannot access");
  }
 
  const templateVars = {
    user,
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longUrl
  };
  res.render("urls_show", templateVars);
});

//edit & update new long url submit
app.post("/urls/:shortURL", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  const urlUserId = urlDatabase[shortURL].userID;
  const cookieId = req.session.cookieId;

  if (urlUserId !== cookieId) {
    return res.status(403).send("Cannot access");
  }
  
  urlDatabase[shortURL].longUrl = longURL;
  res.redirect(`/urls`);
});

//short url redirects to actual page
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (!urlDatabase[shortURL]) {
    return res.status(404).send("Page not found");
  }

  const longURL = urlDatabase[shortURL].longUrl;
  res.redirect(longURL);
});

//delete from list submit
app.post("/urls/:shortURL/delete", (req, res) => {
  const itemToBeDeleted = req.params.shortURL;
  const urlUserId = urlDatabase[itemToBeDeleted].userID;
  const cookieId = req.session.cookieId;

  if (!cookieId) {
    return res.status(403).send("Cannot access");
  }

  if (urlUserId !== cookieId) {
    return res.status(403).send("Cannot access");
  }

  delete urlDatabase[itemToBeDeleted];

  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
