#!/bin/bash
# 
# Install required JS libs for sshow.js.

set -e

mkdir -p lib
wget http://code.jquery.com/jquery-1.7.min.js -O lib/jquery.js
