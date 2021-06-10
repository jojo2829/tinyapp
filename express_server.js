const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');

const app = express();
const PORT = 8080;

let urlDatabase = {
  "b2xVn2": {longUrl: "http://www.lighthouselabs.ca", userID: "aabb"} ,
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

const findEmail = function() {
  let result;
  for (const user in users) {
    result = users[user].email;
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
//app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//register page
app.get("/register", (req, res) => {
  const user = users[req.session.cookieId];
  const templateVars = { user };
  res.render("register", templateVars);
});

//register submit
app.post("/register", (req, res) => {
  //recieve user input
  const email = req.body.email;
  const password = req.body.password;
  console.log("register email: ", email, "register password: ", password);
  const hash = bcrypt.hashSync(password, 10);


  //check if email is registered
  if (findEmail() === email) {
    return res.status(400).send("user already exist");
  }
  
  if (!email || !password) {
    return res.status(400).send("fields need input");
  }

  //create new user
  const newUserId = generateRandomString().substring(2);
  const newUser = {id: newUserId, email, password: hash};

  //add register user to users
  users[newUserId] = newUser;
  console.log("new users", users);
  req.session.cookieId = newUserId;
  res
    //.cookie("cookieId", newUserId)
    .redirect("urls");
});

//login page
app.get("/login", (req, res) => {
  const user = users[req.session.cookieId];
  const templateVars = { user };
  res.render("login", templateVars);
});

//login submit
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log("login email: ", email, "login password: ", password);

  const hash = bcrypt.hashSync(password, 10);
  console.log("hash: ", hash);


  let foundUser;

  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      foundUser = user;
    }
  }

  if (findEmail() !== email) {
    return res.status(401).send("User not found");
  }

  bcrypt.compare(password, foundUser.password, function(err, result) {
    if (!result) {
      return res.status(401).send("Password Incorrect");
    }
    //res.cookie("cookieId", foundUser.id);
    req.session.cookieId = foundUser.id;
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
    urls };
  res.render("urls_index", templateVars);
});

//create new url page
app.get("/urls/new", (req, res) => {
  const user = users[req.session.cookieId];

  if (!user) {
    return res.status(403).send("Cannot access");
  }
  
  const templateVars = {
    user,
    urls: urlDatabase
  };
  res.render("urls_new", templateVars);
});

//create new url submit
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longUrl: req.body.longURL,
    userID:req.session.cookieId
  };
  res.redirect(`/urls/${shortURL}`);
});

//short url detail page
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.session.cookieId];
  const shortURL = req.params.shortURL;
  let urls;

  if (!urlDatabase[shortURL]) {
    res.status(404).send('Page Not Found');
  }
  
  if (user) {
    urls = urlsForUser(user);
  }

  if (!urls[`${shortURL}`]) {
    return res.status(403).send("Cannot access");
  }

  const templateVars = {
    user,
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longUrl };

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
  
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls`);
});

//short url redirects to actual page
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longUrl;
  console.log("short url: ",shortURL);
  console.log("long url: ",longURL);
  //res.end();
  res.redirect(longURL);
});

//delete from list submit
app.post("/urls/:shortURL/delete", (req, res) => {
  const itemToBeDeleted = req.params.shortURL;
  const urlUserId = urlDatabase[itemToBeDeleted].userID;
  const cookieId = req.session.cookieId;

  if (urlUserId !== cookieId) {
    return res.status(403).send("Cannot access");
  }

  console.log("deleted ", req.params);
  delete urlDatabase[itemToBeDeleted];

  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
