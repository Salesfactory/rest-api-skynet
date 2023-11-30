// __mocks__/bull.js

const mockWorker = {
    on: jest.fn(),
};

const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: '123' }),
    process: jest.fn().mockReturnValue(mockWorker),
};

module.exports = {
    Queue: jest.fn().mockImplementation(() => mockQueue),
    Worker: jest.fn().mockImplementation(() => mockWorker),
};
