if (!Importer.include("../amarokjslib/utils.js")) {
	throw "Could not import utils.js - aborting";
}

function CollectionTrack(cm,id) {
	this.cm = cm;
	this.id = id
}
CollectionTrack.prototype.getID       = function () { return this.id; }
CollectionTrack.prototype.getFileName = function () {
	var query = "select rpath from urls where id = " + this.id;
	res = q(query)[0];
	if (!res) { throw "Track " + this.id + " does not have a corresponding entry in the urls table"; }
	return rpath2path(res);
}
CollectionTrack.prototype.getGains = function () {
	var query = "select trackgain,trackpeakgain,albumgain,albumpeakgain from tracks where url = " + this.id;
	var gains = q(query);
// 	d("Gains for " + this.id + ": " + gains);
	return map(parseFloat,gains);
}
CollectionTrack.prototype.getOtherTracksFromSameAlbum = function () {
	var query = "select urls.id from tracks inner join urls on ( tracks.url = urls.id ) inner join albums on ( tracks.album = albums.id) where albums.id in ( select album from tracks where tracks.url = " + this.id + ") and urls.id != " + this.id + " and albums.name != ''";
	var othertracks = q(query);
	return map( function(id) { return new CollectionTrack(this.cm,id); } , othertracks );
}

function CollectionManager() { }
CollectionManager.prototype.getURLID = function (filename) {
	var query = "select id from urls where rpath = " + quotestr(path2rpath(filename));
	var id = q(query)[0];
	if (!id) { throw filename + ' does not have an associated track ID'; }
	return id;
}
CollectionManager.prototype.getTrackByURLID = function (urlid) {
	return new CollectionTrack(this,urlid);
}
CollectionManager.prototype.getTrackByPath = function (filename) {
	var query = "select id from urls where rpath = " + quotestr(path2rpath(filename));
	var res = q(query)[0];
	if (!res) { throw "Track " + filename + " is not in the collection"; }
	return new CollectionTrack(this,res);
}
CollectionManager.prototype.rescanIncrementally = function (filenames) {
	if (!filenames.length) { return; }
	var urlids = map(this.getURLID,filenames);
	var quotedrdirs = map(function (f) { return quotestr(path2rpath(dirname(f))); } , filenames );
	q("update tracks set modifydate = modifydate - 3 where url in (" + urlids.join(",") + ")");
	q("update directories set changedate = changedate - 3 where dir in (" + quotedrdirs.join(",") + ")");
	Amarok.Collection.scanCollectionChanges();
}
