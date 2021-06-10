const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

let urlDatabase = {
  "b2xVn2": {longUrl: "http://www.lighthouselabs.ca", userID: "aabb"} ,
  "9sm5xK": {longUrl: "http://www.google.com", userID: "eekk"}
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
};

function findEmail() {
  for (const user in users) {
    return users[user].email;
  }
};

function findUser(email, password) {
  for (const user in users) {
    if (users[user].email === email && users[user].password === password) {
      return users[user].id;
    }
  }
};

function urlsForUser(user) {
  let result = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === user.id) {
      result[url] = urlDatabase[url]; 
    }
  }
  return result
};

//console.log("urls for users", urlsForUser(users.aabb))

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
  const user = users[req.cookies.cookieId];
  const templateVars = { user };
  res.render("register", templateVars);
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
  const user = users[req.cookies.cookieId];
  const templateVars = { user };
  res.render("login", templateVars);
});

//login submit
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log("login email: ", email, "login password: ", password);

  const user = findUser(email, password);
  console.log("user", user);

  if (findEmail() !== email) {
    return res.status(403).send("User not found");
  }

  
  if (!findUser(email, password)) {
    return res.status(403).send("Incorrect password");
  }
  

  res
    .cookie("cookieId", user)
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
  const user = users[req.cookies.cookieId];
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
  const user = users[req.cookies.cookieId];

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
    userID:req.cookies.cookieId
  };
  res.redirect(`/urls/${shortURL}`);
});

//short url detail page
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.cookies.cookieId];
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
