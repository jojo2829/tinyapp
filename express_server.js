const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "aabb": {
    id: "aabb", 
    email: "aabb@mail.com", 
    password: "a123"
  },
 "eekk": {
    id: "eekk", 
    email: "eekk@mail.com", 
    password: "e123"
  }
}

function generateRandomString() {
  const characters = "qwertyuiopasdfghjklzxcvbnm";
  let result = "";
  for (let i = 0; i < 6; i++ ) {
    result += characters.charAt(Math.random() * characters.length);
  }
  return result;
}

function findEmail() {
  for (const user in users) {
    return users[user].email;
  }
}

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//register page
app.get("/register", (req, res) => {
  res.render("register");
});

//register submit
app.post("/register", (req, res) => {
  //recieve user input
  const email = req.body.email;
  const password = req.body.password;
  console.log("register email: ", email, "register password: ", password);

  //check if email is registered
  if (findEmail() === email) {
    return res.status(400).send("user already exist");
  }
  

  if (!email || !password) {
    return res.status(400).send("fields need input");
  }

  //create new user
  const newUserId = generateRandomString().substring(2);
  const newUser = {id: newUserId, email, password};

  //add register user to users
  users[newUserId] = newUser;
  console.log("new users", users);
  res
    .cookie("cookieId", newUserId)
    .redirect("urls")
});

//login page
app.get("/login", (req, res) => {
  res.render("login");
});

//login submit
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log("login email: ", email, "login password: ", password);

  let foundUser;

  for (const eachUser in users) {
    const user = users[eachUser];
    if (user.email === email) {
      foundUser = user;
    }
  }

  if (!foundUser) {
    return res.status(404).send("User not found");
  }

  res
    .redirect("/urls")
});

//logout submit
app.post("/logout", (req, res) => {
  res
    .clearCookie('cookieId')
    .redirect("urls")
});

//list of all urls page
app.get("/urls", (req, res) => {
  const cookieId = req.cookies.cookieId;
  const user = users[cookieId];

  const templateVars = { 
    user,
    urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//create new url page
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//create new url submit
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

//short url detail page
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.status(404).send('Page Not Found');
  }

  const templateVars = { 
    username: req.cookies["userId"],
    shortURL: shortURL, 
    longURL: urlDatabase[shortURL] };
  res.render("urls_show", templateVars);
});

//edit & update new long url submit
app.post("/urls/:shortURL", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls`);
});

//short url redirects to actual page
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

//delete from list submit
app.post("/urls/:shortURL/delete", (req, res) => {
  console.log("deleted ", req.params)
  const itemToBeDeleted = req.params.shortURL;
  delete urlDatabase[itemToBeDeleted];

  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
