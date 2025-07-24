module.exports = {
  skipFiles: [
    'mocks/', // Exclude all mock contracts
    'test/', // Exclude test utilities (if any)
  ],
  configureYulOptimizer: true,
  solcOptimizerDetails: {
    yul: true,
    yulDetails: {
      stackAllocation: true,
    },
  },
};
