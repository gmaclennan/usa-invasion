all: \
	geo/topojson/ilc_polys_simp.json

geo/geojson/ilc_polys.json: node_modules/.bin/esri-dump
	mkdir -p $(dir $@)
	$< http://maps.itos.uga.edu/ArcGIS/rest/services/History/GWLG/MapServer/2 > $@

geo/topojson/ilc_polys_simp.json: node_modules/.bin/mapshaper geo/geojson/ilc_polys.json
	mkdir -p $(dir $@)
	rm -f $@ $(basename $@)-index$(suffix $@)
	$^ -o $@ -f topojson -p 0.03 --modified --split Type --keep-shapes --auto-snap --e "Cession_Date=+Cession_Date, Year=+Year, StartDate=+StartDate, EndDate=+EndDate, Area=$$.originalArea, Nation=Nation_Correct, delete Nation_Correct, Type=Cession_Reservation, delete Cession_Reservation, delete OBJECTID, delete Checked, delete joinid, delete temp, delete SHAPE_Area, delete SHAPE_Length"
	node_modules/.bin/js-beautify -f $@ -r
	rm -f $(basename $@)-index.json

node_modules/.install: package.json
	npm install && touch $@

node_modules/.bin/mapshaper: node_modules/.install

node_modules/.bin/esri-dump: node_modules/.install

node_modules/.bin/js-beautify: node_modules/.install