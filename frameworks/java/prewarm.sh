#!/bin/bash

echo "loading" > home/codewarrior/prewarm.status

# prewarm by starting the gradle daemon. Running an initial test build will also speed things up a bit
cd frameworks/java && gradle --daemon --offline test

cd ../..

echo "loaded" > home/codewarrior/prewarm.status

