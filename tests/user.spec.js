const supertest = require('supertest');
const makeApp = require('../src/app');
const { User } = require('../src/models');

jest.mock('../src/models', () => ({
    User: {
        create: jest.fn(),
        update: jest.fn(),
        findOne: jest.fn(),
        findAll: jest.fn(),
        destroy: jest.fn()
    },
}));

const app = makeApp();
const request = supertest(app);

describe("User Endpoints Test", () => {
    describe("Get all users", () => {
        it("200", async () => {
            const data = [{
                name: "John Doe",
                email: "johndoe@test.com", 
                username: "johndoe"
            }];
    
            User.findAll.mockResolvedValue(data);
    
            const response = await request.get("/api/users")
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data);
            expect(response.body.message).toBe("Users retrieved successfully");
        });

        it("500", async () => {
            User.findAll.mockRejectedValue(new Error("Error"));
            const response = await request.get("/api/users");
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Error");
        });
    });

    describe("Get user by id", () => {
        it("200", async () => {
            const data = [{
                name: "John Doe",
                email: "johndoe@test.com",
                username: "johndoe"
            }];

            User.findOne.mockResolvedValue(data);

            const response = await request.get("/api/users/1");
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data);
            expect(response.body.message).toBe("User with id 1 retrieved successfully");
        });

        it("404", async () => {
            User.findOne.mockResolvedValue(null);
            const response = await request.get("/api/users/1");
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("User not found");
        });

        it("500", async () => {
            User.findOne.mockRejectedValue(new Error("Error"));
            const response = await request.get("/api/users/1");
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Error");
        });
    });

    describe("Create user", () => {
        it("201", async () => {
            const data = {
                name: "John Doe",
                email: "jonhdoe@test.com",
                username: "johndoe"
            };

            User.create.mockResolvedValue(data);
            const response = await request.post("/api/users").send(data);
            expect(response.status).toBe(201);
            expect(response.body.data).toEqual(data);
            expect(response.body.message).toBe("User created successfully");
        });

        it("400", async () => {
            const data = {
                name: "John Doe",
                email: "jonhdoe@test.com",
            };
            const response = await request.post("/api/users").send(data);
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Missing required params: username");
        });

        it("400", async () => {
            const data = {
                name: "John Doe",
                email: "jonhdoe@test.com",
                username: "johndoe"
            };
            const error = new Error("Username already exists");
            error.name = "SequelizeUniqueConstraintError";
            error.fields = { username: "johndoe" };

            User.create.mockRejectedValue(error);
            const response = await request.post("/api/users").send(data);
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("username already exists");
        });

        it("500", async () => {
            const data = {
                name: "John Doe",
                email: "jonhdoe@test.com",
                username: "johndoe"
            };
            User.create.mockRejectedValue(new Error("Error"));
            const response = await request.post("/api/users").send(data);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Error");
        });
    });

    describe("Update user", () => {
        it("201", async () => {
            const data = {
                name: "John Doe",
                email: "jonhdoe@test.com",
                username: "johndoe"
            };
            const modifiedData = {
                name: "John Doe",
                email: "johndoe@test.com",
                username: "johndoe"
            };
            User.findOne.mockResolvedValue(data);
            User.update.mockResolvedValue(modifiedData);
            const response = await request.put("/api/users/1").send(modifiedData);
            expect(response.status).toBe(201);
            expect(response.body.data).toEqual(modifiedData);
        });

        it("400", async () => {
            const data = {
                name: "John Doe",
                email: "jonhdoe@test.com",
                username: "johndoe"
            };
            const error = new Error("Username already exists");
            error.name = "SequelizeUniqueConstraintError";
            error.fields = { username: "johndoe" };

            User.findOne.mockResolvedValue(data);
            User.update.mockRejectedValue(error);
            const response = await request.put("/api/users/1").send(data);
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("username already exists");
        });

        it("404", async () => {
            const data = {
                name: "John Doe",
                email: "jonhdoe@test.com",
                username: "johndoe"
            };
            User.findOne.mockResolvedValue(null);
            const response = await request.put("/api/users/1").send(data);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("User not found");
        });

        it("500", async () => {
            const data = {
                name: "John Doe",
                email: "jonhdoe@test.com",
                username: "johndoe"
            };
            User.findOne.mockResolvedValue(data);
            User.update.mockRejectedValue(new Error("Error"));
            const response = await request.put("/api/users/1").send(data);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Error");
        });
    });

    describe("Delete user", () => {
        it("200", async () => {
            const data = {
                name: "John Doe",
                email: "jonhdoe@test.com",
                username: "johndoe"
            };  
            User.findOne.mockResolvedValue(data);
            User.destroy.mockResolvedValue(1);
            const response = await request.delete("/api/users/1");
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("User deleted successfully");
        });

        it("404", async () => {
            User.findOne.mockResolvedValue(null);
            const response = await request.delete("/api/users/1");
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("User not found");
        });

        it("500", async () => {
            const data = {
                name: "John Doe",
                email: "jonhdoe@test.com",
                username: "johndoe"
            };  
            User.findOne.mockResolvedValue(data);
            User.destroy.mockRejectedValue(new Error("Error"));
            const response = await request.delete("/api/users/1");
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Error");
        });
    });
});