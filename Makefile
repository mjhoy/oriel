# Run `make` to install JS library dependencies to lib/

all: lib/jquery.js docs

docs: docs/oriel.html docs/oriel.js

docs/oriel.js: src/oriel.js
	cp src/oriel.js docs/oriel.js

docs/oriel.html: src/oriel.js
	docco src/oriel.js

lib/jquery.js:
	mkdir -p lib
	wget http://code.jquery.com/jquery-1.7.min.js -O lib/jquery.js

clean:
	rm -rf lib

.PHONY: all clean docs
