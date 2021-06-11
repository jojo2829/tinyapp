const getUserByEmail = function(email, users) {
  let foundUser;
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      foundUser = user;
    }
  }
  if (foundUser === undefined) {
    return undefined;
  }
  return foundUser;
};

module.exports = { getUserByEmail};