
DIST_DIR=myWebDevelopment-`date +%Y%m%d`
dist:
	ln -s ./ myWebDevelopment
	rm -f $(DIST_DIR).zip
	svn update
	svn -R list | sed s/^/myWebDevelopment\\\//g | zip -@ $(DIST_DIR).zip
	if test -L myWebDevelopment; then rm myWebDevelopment; fi

