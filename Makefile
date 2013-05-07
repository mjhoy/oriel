# Run `make` to install JS library dependencies to lib/

all: lib/jquery.js

lib/jquery.js:
	mkdir -p lib
	wget http://code.jquery.com/jquery-1.7.min.js -O lib/jquery.js

clean:
	rm -rf lib

.PHONY: all clean
