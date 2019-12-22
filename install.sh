#!/bin/bash

xcode-select --install
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

brew install git
brew install node
brew install redis

git clone https://github.com/Aspine/aspine.git
cd aspine
npm install
