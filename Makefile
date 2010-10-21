
DIST_DIR=myWebDevelopment-`date +%Y%m%d`
dist:
	rm -f $(DIST_DIR).zip
	hg archive -t zip $(DIST_DIR).zip
#	ln -s ./ myWebDevelopment
#	svn update
#	svn -R list | sed s/^/myWebDevelopment\\\//g | zip -@ $(DIST_DIR).zip
#	if test -L myWebDevelopment; then rm myWebDevelopment; fi

