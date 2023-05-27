const express = require("express");

const app = express();

const bcrypt = require("bcrypt");

const path = require("path");

const dirPath = path.join(__dirname, "userData.db");

app.use(express.json());

const sqlite3 = require("sqlite3");

const { open } = require("sqlite");
//server initialization

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dirPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db error ${e.message}`);
  }
};

initializeDbAndServer();

//API-1=>REGISTER
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  let hashPwd = await bcrypt.hash(password, 10);
  const searchUserQuery = `SELECT * FROM user where username='${username}';`;
  const dbUser = await db.get(searchUserQuery);
  if (dbUser === undefined) {
    let createUserQuery = `
        INSERT into user(username,name,password,gender,location)
        VALUES(
            '${username}',
            '${name}',
            '${hashPwd}',
            '${gender}',
            '${location}'
        )`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let newUser = await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API-2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const searchQuery = `SELECT * FROM user where username='${username}';`;
  let dbUser = await db.get(searchQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const hashPwd = await bcrypt.compare(password, dbUser.password);
    console.log(hashPwd);
    if (hashPwd) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API-3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const searchUser = `SELECT * from user where username='${username}';`;
  let dbUser = await db.get(searchUser);
  let hashPwd = await bcrypt.compare(oldPassword, dbUser.password);
  if (hashPwd) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newHashPwd = await bcrypt.hash(newPassword, 10);
      const updatePwd = `
            UPDATE user 
            SET password='${newHashPwd}'
            where username='${username}';`;
      await db.run(updatePwd);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
