# -*- Mode: Makefile -*-
#
# Makefile for DirectDownload
#

.PHONY: xpi

xpi: clean
	zip -r9 directdownload-trunk.xpi install.rdf \
                                 bootstrap.js \
                                 chrome.manifest \
                                 chrome

clean:
	rm -f directdownload-trunk.xpi
