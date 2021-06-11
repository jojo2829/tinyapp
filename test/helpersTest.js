const { assert } = require('chai');

const { getUserByEmail } = require('../helper');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const actual = user.id;
    const expectedOutput = "userRandomID";
    assert.equal(actual, expectedOutput);
  });

  it('should return undefined with invalid email', function() {
    const user = getUserByEmail("aa@mail.com", testUsers)
    const actual = user ? user.id : undefined;
    const expectedOutput = undefined;
    assert.equal(actual, expectedOutput);
  });
});