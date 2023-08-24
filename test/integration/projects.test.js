const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const app = require('../../server');
const Project = require('../../models/Project');
const User = require('../../models/User');
const sinon = require('sinon');
const sequelize = require('../../config/database');
const bcrypt = require('bcrypt');


function createTestProject(name = 'Test project') {

    // Create test project Object
    const project = {
        name: name,
        description: {
            "ops": [
                {
                    "insert": "Test description"
                }
            ]
        },
        tech_stack: 'Test, stack',
        link: 'https://fdd.mooo.com/example',
        github_link: 'https://github.com/grogulin/example'
    };

    return project;
}

async function pushTestProject(name = 'Test project') {
    
    const project = createTestProject(name = name);
    // Insert it into db
    await Project.create(project);
}

describe('Projects/ endpoint', async function() {
    
    before(async function() {

        // Truncate all projects and create test project
        await Project.destroy({ truncate: true });
        await pushTestProject();
    });

    after(async function() {

        // Truncate (empty) the projects table
        await Project.destroy({ truncate: true });
    });

    it('should receive one created project', async function() {
        const response = await request(app)
            .get('/projects');

        expect(response.status).to.equal(200);
        expect(response.body.length).to.equal(1);
    });

    it('should handle database error', async function() {
        // Mock the behavior of Project.findAll to return a rejected promise
        const findAllStub = sinon.stub(Project, 'findAll').rejects(new Error('Database faked error'));

        const response = await request(app)
            .get('/projects');

        // Restore the original behavior of Project.findAll
        findAllStub.restore();

        // Assertions
        expect(response.status).to.equal(500);
        expect(response.body.message).to.equal('Internal server error.');
    });

    it('should handle concurrent requests', async function() {
        // Number of concurrent requests
        const numRequests = 10;

        // Create an array of requests to be made concurrently
        const requests = Array.from({ length: numRequests }, () => {
            return request(app).get('/projects');
        });

        // Send all requests concurrently and wait for all responses
        const responses = await Promise.all(requests);

        // Assert the responses
        responses.forEach(response => {
            expect(response.status).to.equal(200);
            // Add more assertions as needed
        });
    });

    it('should reject POST method', async function() {
        const response = await request(app)
            .post('/projects')
            .send({});

        expect(response.status).to.equal(405);
    });

    it('should reject PUT method', async function() {
        const response = await request(app)
            .put('/projects')
            .send({});

        expect(response.status).to.equal(405);
    });

    it('should reject DELETE method', async function() {
        const response = await request(app)
            .delete('/projects')
            .send({});

        expect(response.status).to.equal(405);
    });

    it('should handle a large number of projects', async function() {
        // Clean db and create a large number of projects in the database
        await Project.destroy({ truncate: true });

        let i = 0;
        while (i<200) {
            await pushTestProject()
            i+=1
        }

        // Make the request using Supertest
        const response = await request(app).get('/projects');

        // Assertions
        expect(response.status).to.equal(200);

        // Clean db after run
        await Project.destroy({ truncate: true });
    });

    it('should handle very short project names', async function() {
        // Create a project with a very short name in the database
        await pushTestProject('');

        // Make the request using Supertest
        const response = await request(app).get('/projects');

        // Assertions
        expect(response.status).to.equal(200);
        expect(response.body.length).to.equal(1);
        expect(response.body[0].name).to.equal('');
        // Add more assertions based on your application's behavior
    });
});

describe('Projects/new endpoint', async function() {

    /*
    Declaring user and loginResponse because their creation requires calling async functions.
    Mocha allows these calls to be made only inside before() or after() sections
    */
    let user;
    let loginResponse;

    const username = 'testuser'
    const password = 'testpassword';

    before(async function() {
        // hash password for direct injecting it in db
        const hashedPassword = await bcrypt.hash(password, 10);
        user = {
            username: username,
            password: hashedPassword  
        };

        // Truncate all users and create test user
        await User.destroy({ truncate: true });
        await User.create(user);

        loginResponse = await request(app)
            .post('/auth/login')
            .send({ username: username, password: password}); // using original, not bcrypted password

        // Truncate all projects
        await Project.destroy({ truncate: true });
    });

    after(async function() {

        // Truncate (empty) the projects table
        await Project.destroy({ truncate: true });
        await User.destroy({ truncate: true });
    });

    it('should create project with a valid token', async function() {

        // check if testuser has correctly logged in and received a token
        expect(loginResponse.status).to.equal(200);
        expect(loginResponse.body).to.have.property('token');

        const token = loginResponse.body.token;
        const newProject = createTestProject();

        const response = await request(app)
            .post('/projects/new')
            .set('Authorization', `Bearer ${token}`)
            .send(newProject);

        expect(response.status).to.equal(201);
        expect(response.body.message).to.equal('New project was created.');
    });

    it('should reject creating project without logging in', async function() {

        const newProject = createTestProject();

        const response = await request(app)
            .post('/projects/new')
            .send(newProject);

        expect(response.status).to.equal(401);
        expect(response.body.message).to.equal('No token provided.');
    });

    it('should reject creating project if token is invalid', async function() {
        const newProject = createTestProject();
        const token = 'invalid_token';

        const response = await request(app)
            .post('/projects/new')
            .set('Authorization', `Bearer ${token}`)
            .send(newProject);

        expect(response.status).to.equal(403);
        expect(response.body.message).to.equal('Invalid token.');
    });

    it('should reject creating project if Project object is invalid', async function() {
        const newProject = {
            name: null,
            description: null,
            tech_stack: null,
            link: null,
            github_link: null,
        };
        const token = loginResponse.body.token;

        const response = await request(app)
            .post('/projects/new')
            .set('Authorization', `Bearer ${token}`)
            .send(newProject);

        expect(response.status).to.equal(401);
        expect(response.body.message).to.equal('Malformed or Corrupted Request.');
    });

    it('should reject GET method', async function() {
        const response = await request(app)
            .get('/projects/new')

        expect(response.status).to.equal(405);
    });

    it('should reject PUT method', async function() {
        const response = await request(app)
            .put('/projects/new')
            .set('Authorization', `Bearer ${loginResponse.body.token}`)
            .send({});

        expect(response.status).to.equal(405);
    });

    it('should reject DELETE method', async function() {
        const response = await request(app)
            .delete('/projects')
            .set('Authorization', `Bearer ${loginResponse.body.token}`)
            .send({});

        expect(response.status).to.equal(405);
    });
});


describe('Projects/:id endpoint', async function() {

    /*
    Declaring user and loginResponse because their creation requires calling async functions.
    Mocha allows these calls to be made only inside before() or after() sections
    */
    let user;
    let project;
    let loginResponse;

    const username = 'testuser'
    const password = 'testpassword';

    let id;

    before(async function() {
        // hash password for direct injecting it in db
        const hashedPassword = await bcrypt.hash(password, 10);
        user = {
            username: username,
            password: hashedPassword  
        };

        // Truncate all users and create test user
        await User.destroy({ truncate: true });
        await User.create(user);

        loginResponse = await request(app)
            .post('/auth/login')
            .send({ username: username, password: password}); // using original, not bcrypted password

        // Truncate all projects
        await Project.destroy({ truncate: true });

        // Placing test project inside db to update it later
        project = createTestProject()
        await Project.create(project)

        const projectResponse = await Project.findAll({ where: {name: 'Test project'} });

        expect(projectResponse.length).to.equal(1);
        expect(projectResponse[0]).to.have.property('dataValues');
        expect(projectResponse[0].dataValues).to.have.property('id');

        id = projectResponse[0].dataValues.id;
    });

    after(async function() {

        // Truncate (empty) the projects table
        await Project.destroy({ truncate: true });
        await User.destroy({ truncate: true });
    });

    it('PUT should update a project with a valid token', async function() {

        // check if testuser has correctly logged in and received a token
        expect(loginResponse.status).to.equal(200);
        expect(loginResponse.body).to.have.property('token');

        project.name = 'Updated name';

        const response = await request(app)
            .put(`/projects/${id}`)
            .set('Authorization', `Bearer ${loginResponse.body.token}`)
            .send(project);

        console.log("Response Project: ", response.body.project);

        expect(response.status).to.equal(201);
        expect(response.body.message).to.equal('Project was updated.');
        expect(response.body.project.name).to.equal('Updated name')
    });

    it('PUT should reject updating a project if token is invalid', async function() {
        const newProject = createTestProject();
        const invalid_token = 'invalid_token';

        const response = await request(app)
            .put(`/projects/${id}`)
            .set('Authorization', `Bearer ${invalid_token}`)
            .send(newProject);

        expect(response.status).to.equal(403);
        expect(response.body.message).to.equal('Invalid token.');
    });

    it('PUT should reject updating a project if Project object is invalid', async function() {
        const newProject = {
            name: null,
            description: null,
            tech_stack: null,
            link: null,
            github_link: null
        }

        const response = await request(app)
            .put(`/projects/${id}`)
            .set('Authorization', `Bearer ${loginResponse.body.token}`)
            .send(newProject);

        expect(response.status).to.equal(401);
        expect(response.body.message).to.equal('Malformed or Corrupted Request.');
    });

    it('PUT should reject updating a project with non-existing id', async function() {
        project.name = 'Updated name again'
        const nonExistentId = -1;

        const response = await request(app)
            .put(`/projects/${nonExistentId}`)
            .set('Authorization', `Bearer ${loginResponse.body.token}`)
            .send(project);

        expect(response.status).to.equal(404);
        expect(response.body.message).to.equal('Project not found.');
    });


    it('DELETE should delete a project with a valid token', async function() {

        // check if testuser has correctly logged in and received a token
        expect(loginResponse.status).to.equal(200);
        expect(loginResponse.body).to.have.property('token');

        const response = await request(app)
            .delete(`/projects/${id}`)
            .set('Authorization', `Bearer ${loginResponse.body.token}`);

        expect(response.status).to.equal(200);
        expect(response.body.message).to.equal('Project deleted successfully.');
    });

    it('DELETE should reject deleting a project if token is invalid', async function() {
        const invalid_token = 'invalid_token';

        const response = await request(app)
            .delete(`/projects/${id}`)
            .set('Authorization', `Bearer ${invalid_token}`);

        expect(response.status).to.equal(403);
        expect(response.body.message).to.equal('Invalid token.');
    });

    it('DELETE should reject deleting a project with non-existing id', async function() {
        const nonExistentId = -1;

        const response = await request(app)
            .delete(`/projects/${nonExistentId}`)
            .set('Authorization', `Bearer ${loginResponse.body.token}`);

        expect(response.status).to.equal(404);
        expect(response.body.message).to.equal('Project not found.');
    });

    it('PUT should reject GET method', async function() {
        const response = await request(app)
            .get('/projects/:id')
            .set('Authorization', `Bearer ${loginResponse.body.token}`);

        expect(response.status).to.equal(405);
    });

    it('PUT should reject POST method', async function() {
        const response = await request(app)
            .post('/projects/:id')
            .set('Authorization', `Bearer ${loginResponse.body.token}`)
            .send({});

        expect(response.status).to.equal(405);
    });

});