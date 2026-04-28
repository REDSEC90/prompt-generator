// Mock para ora (spinner de loading)
const mockSpinner = {
  start: jest.fn().mockReturnThis(),
  stop: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  warn: jest.fn().mockReturnThis(),
  info: jest.fn().mockReturnThis(),
  text: '',
  color: 'cyan',
};

const ora = jest.fn(() => mockSpinner);

module.exports = ora;
module.exports.default = ora;
