const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const app = require('../../server');
const { sequelizeForConnection } = require('../../config/database');
const User = require('../../models/User');
const sinon = require('sinon');

describe('Login/ endpoint', async function() {

    /*
    Declaring user because it's creation requires calling async functions.
    Mocha allows these calls to be made only inside before() or after() sections
    */
    let user;
    const username = 'testuser'
    const password = 'testpassword';

    before(async function() {
        
        user = {
            username: username,
            password: password  
        };

        // Truncate all users and create test user
        await User.destroy({ truncate: true });
        await User.create(user);
    });

    after(async function() {

        // Truncate (empty) the users table
        await User.destroy({ truncate: true });
    });

    it('should login and receive token', async function() {
        
        const response = await request(app)
            .post('/auth/login')
            .send({ username: username, password: password });

        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('token');

    });

    it('should reject logging in with non-existent username', async function() {
        const user = {
            username: 'nonexistentuser',
            password: 'testpassword'
        };

        const response = await request(app)
            .post('/auth/login')
            .send(user);
        
        expect(response.status).to.equal(401);
        expect(response.body.message).to.equal('Invalid username. Please check your username and try again');
    });

    it('should reject logging in with wrong password', async function() {
        const user = {
            username: 'testuser',
            password: 'wrongpassword'
        };

        const response = await request(app)
            .post('/auth/login')
            .send(user);

        expect(response.status).to.equal(401);
        expect(response.body.message).to.equal('Incorrect password. Please check your password and try again');
    });

    it('should reject logging in with corrupted username', async function() {
        const user = {
            username: null,
            password: 'wrongpassword'
        };

        const response = await request(app)
            .post('/auth/login')
            .send(user);

        expect(response.status).to.equal(401);
        expect(response.body.message).to.equal('Malformed or Corrupted Request: Missing Username or Password');
    });

    it('should reject logging in with corrupted password', async function() {
        const user = {
            username: 'testuser',
            password: null
        };

        const response = await request(app)
            .post('/auth/login')
            .send(user);

        expect(response.status).to.equal(401);
        expect(response.body.message).to.equal('Malformed or Corrupted Request: Missing Username or Password');
    });


    it('should reject logging in with corrupted user Object', async function() {
        const user = {
            username: null,
            password: null
        };

        const response = await request(app)
            .post('/auth/login')
            .send(user);

        expect(response.status).to.equal(401);
        expect(response.body.message).to.equal('Malformed or Corrupted Request: Missing Username or Password');
    });

    it('should handle database error', async function() {
        // Mock the behavior of User.create to return a rejected promise
        const createUserStub = sinon.stub(User, 'findOne').rejects(new Error('Database faked error'));

        const response = await request(app)
            .post('/auth/login')
            .send({ username: user.username, password: password });

        // Restore the original behavior of User.create
        createUserStub.restore();

        // Assertions
        expect(response.status).to.equal(500);
        expect(response.body.message).to.equal('Internal server error');
    });

});


describe('Signup/ endpoint', async function() {

    before(async function() {

        // Truncate all users and create test user
        await User.destroy({ truncate: true });
    });

    after(async function() {

        // Truncate (empty) the users table
        await User.destroy({ truncate: true });
    });

    it('should register a new user', async function() {
        const newUser = {
            username: 'testuser',
            password: 'testpassword'
        };

        const response = await request(app)
            .post('/auth/signup')
            .send(newUser);

        expect(response.status).to.equal(201);
        expect(response.body.message).to.equal('User registered successfully');

        const queryResult = await User.findOne({where: {username: newUser.username} })

        // Check the database to ensure the user was added
        // const queryResult = await sequelize.query('SELECT * FROM users WHERE username = :username;',
        //     {
        //         logging: console.log,
        //         replacements: { username: newUser.username },
        //     });

        // Access the query result from the nested array structure
        // const userRows = queryResult[0];
        expect(queryResult.dataValues.username).to.equal(newUser.username);
    });


    describe('if username is taken', async function() {


        /*
        Before trying to reguster with existing username this user has to be created.
        Declaring user because it's creation requires calling async functions.
        Mocha allows these calls to be made only inside before() or after() sections.
        */
        let user;
        const username = 'testuser'
        const password = 'testpassword';

        before(async function() {
        
            // hash password for direct injecting it in db
            // const hashedPassword = await bcrypt.hash(password, 10);
            user = {
                username: username,
                password: password  
            };
    
            // Truncate all users and create test user
            await User.destroy({ truncate: true });
            await User.create(user);
        });
    
        after(async function() {
            // Truncate (empty) the users table
            await User.destroy({ truncate: true });
        });

        it('should reject registration with an existing username', async function() {
            const newUser = {
                username: 'testuser',
                password: 'testpassword'
            };
    
            const response = await request(app)
                .post('/auth/signup')
                .send(newUser);
    
            expect(response.status).to.equal(400);
            expect(response.body.message).to.equal('username must be unique');
        });
    });

    it('should reject registration with too short username', async function() {
        const newUser = {
            username: 'user',
            password: 'testpassword'
        };

        const response = await request(app)
            .post('/auth/signup')
            .send(newUser);

        expect(response.status).to.equal(400);
        expect(response.body.message).to.equal('Username must be between 5 and 20 characters long');
    });

    it('should reject registration with too short password', async function() {
        const newUser = {
            username: 'newusername',
            password: '0'
        };

        const response = await request(app)
            .post('/auth/signup')
            .send(newUser);

        expect(response.status).to.equal(400);
        expect(response.body.message).to.equal('Password must be between 5 and 25 characters long');
    });

    it('should reject registration with too long password', async function() {
        const newUser = {
            username: 'newusername',
            password: '_twentysixletterspassword_'
        };

        const response = await request(app)
            .post('/auth/signup')
            .send(newUser);

        expect(response.status).to.equal(400);
        expect(response.body.message).to.equal('Password must be between 5 and 25 characters long');
    });

});