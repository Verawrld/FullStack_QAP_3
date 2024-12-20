const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "123123123456576676755654",
    resave: false,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const USERS = [
  {
    id: 1,
    username: "AdminUser",
    email: "admin@example.com",
    password: bcrypt.hashSync("admin123", SALT_ROUNDS), //In a database, you'd just store the hashes, but for
    // our purposes we'll hash these existing users when the
    // app loads
    role: "admin",
  },
  {
    id: 2,
    username: "RegularUser",
    email: "user@example.com",
    password: bcrypt.hashSync("user123", SALT_ROUNDS),
    role: "user", // Regular user
  },
];

// GET /login - Render login form
app.get("/login", (request, response) => {
  response.render("login");
});

// POST /login - Allows a user to login
app.post("/login", async (request, response) => {
  const { email, password } = request.body;
  const user = USERS.find((u) => u.email === email);
  if (user && bcrypt.compareSync(password, user.password)) {
    request.session.user = user;
    return response.redirect("/landing");
  }
  response.render("login", { error: "Invalid email or password" });
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
  response.render("signup");
});

// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
  const { username, email, password } = request.body;
  if (USERS.find((u) => u.email === email)) {
    return response.render("signup", { error: "Email already in use" });
  }
  const newUser = {
    id: USERS.length + 1,
    username,
    email,
    password: bcrypt.hashSync(password, SALT_ROUNDS),
    role: "user",
  };
  USERS.push(newUser);
  request.session.user = newUser;
  response.redirect("/landing");
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
  if (request.session.user) {
    return response.redirect("/landing");
  }
  response.render("index", { user: request.session.user });
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) => {
  if (!request.session.user) {
    return response.redirect("/login");
  }
  if (request.session.user.role === "admin") {
    return response.render("landing", {
      users: USERS,
      user: request.session.user,
    });
  }
  response.render("landing", { user: request.session.user });
});

app.post("/logout", (request, response) => {
  request.session.destroy((err) => {
    if (err) {
      return response.redirect("/landing");
    }
    response.redirect("/");
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
