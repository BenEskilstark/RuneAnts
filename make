#!/bin/bash

# npm run babel -- --plugins transform-react-jsx

mkdir bin

# flow transform
# npm run babel -- --presets flow index.js
npm run babel -- js/ -d bin

# babel ignores the levels cuz they're huge, copy them over:
cp -r js/levels bin/

# scrape for todos
# printf "<----- ../TODO\n\n" > todos/INLINE
# grep -r "TODO" js >> todos/INLINE

# transform the pheromone web worker separately since nothing requires it
npm run babel -- js/utils/pheromoneWorker.js --out-file bin/pheromoneWorker.js

# clientside require everything into a single bundle.js file
npm run browserify -- bin/index.js -o bin/bundle.js

# clientside require for the worker as well
npm run browserify -- bin/pheromoneWorker.js -o bin/pheromoneWorker.js

# remove everything but the bundle and the worker
mv bin/bundle.js ./
mv bin/pheromoneWorker.js ./
rm -rf bin/
mkdir bin

# put the bundle and worker back
mv bundle.js bin/
mv pheromoneWorker.js bin/





