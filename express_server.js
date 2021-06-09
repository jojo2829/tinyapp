const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  const characters = "qwertyuiopasdfghjklzxcvbnm";
  let result = "";
  for (let i = 0; i < 6; i++ ) {
    result += characters.charAt(Math.random() * characters.length);
  }
  return result;
}

generateRandomString();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//login
app.post("/login", (req, res) => {
  const username = req.body.username;
  console.log("username: ", username);
  res
    .cookie("username", username)
    .redirect("/urls")
});

//log out
app.post("/logout", (req, res) => {
  res
    .clearCookie('username')
    .redirect("urls")
});

//list of all urls
app.get("/urls", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"],
    urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//create form
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//recieve form & response
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
    username: req.cookies["username"],
    shortURL: shortURL, 
    longURL: urlDatabase[shortURL] };
  res.render("urls_show", templateVars);
});

//recieve new long url redirect to urls
app.post("/urls/:shortURL", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls`);
});

//click on short url redirects to actual page
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

//delete from list
app.post("/urls/:shortURL/delete", (req, res) => {
  console.log("deleted ", req.params)
  const itemToBeDeleted = req.params.shortURL;
  delete urlDatabase[itemToBeDeleted];

  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
