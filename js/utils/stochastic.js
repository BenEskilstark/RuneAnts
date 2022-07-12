
const {floor, sqrt, random, round} = Math;

const rand = () => random();

// return an integer between min and max, inclusive
const randomIn = (min, max) => floor(min + rand() * (max - min + 1));

const shamefulGaussian = () => (rand() + rand() + rand() + rand() + rand() + rand() - 3) / 3;
const normalIn = (min, max) => {
  const gaussian = (shamefulGaussian() + 1) / 2;
  return floor(min + gaussian * (max - min + 1));
};

const oneOf = (options) => {
  if (options.length === 0) return null;
  return options[floor(rand() * options.length)];
};

// weights must be positive
const weightedOneOf = (options, weights) => {
  const cumulativeWeights = [];
  let sum = 0;

  for (let i = 0; i < options.length; i++) {
    sum += weights[i];
    cumulativeWeights.push(sum);
  }

  const randomVal = randomIn(0, sum - 1) + 1;

  let index = 0;
  for (; randomVal > cumulativeWeights[index]; index++);

  return options[index];
};

module.exports = {
	randomIn,
	normalIn,
	oneOf,
  weightedOneOf,
}
