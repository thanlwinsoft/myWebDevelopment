
DIST_DIR=myWebDevelopment-`date +%Y%m%d`
dist:
	ln -s ./ myWebDevelopment
	rm $(DIST_DIR).zip
	svn -R list | sed s/^/myWebDevelopment\\\//g | zip -@ $(DIST_DIR).zip
	rm myWebDevelopment

