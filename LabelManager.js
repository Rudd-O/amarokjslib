if (!Importer.include("../amarokjslib/utils.js")) {
	throw "Could not import amarokjslib/utils.js - aborting";
}

function AlreadyExists(msg) {
	this.msg = msg;
}
AlreadyExists.prototype.toString = function () {
	return this.msg;
};
function DoesntExist(msg) {
	this.msg = msg;
}
DoesntExist.prototype.toString = function () {
	return this.msg;
};

/* FIXME:
 * we might bother to make signals and slots
 * so when labels are modified, consumer UIs are updated
 */
function LabelManager() {
	this.revalidate_track_cache();
	this.revalidate_label_cache();
	this.revalidate_urls_labels_cache();
}
LabelManager.prototype.revalidate_track_cache =       function() {
	var sum = q("select sum(id) from urls")[0];
	if (!(sum == LabelManager.track_cache_sum)) {
		Amarok.debug("Previous track cache is invalid.  Regenerating. " + LabelManager.track_cache_sum + " " + sum)
		LabelManager.track_cache = new Array();
		LabelManager.track_cache_sum = sum;
	}
}
LabelManager.prototype.revalidate_label_cache =       function() {
	var sum = q("select sum(id) from labels")[0];
	if (!(sum == LabelManager.label_cache_sum)) {
		Amarok.debug("Previous label cache is invalid.  Regenerating. " + LabelManager.label_cache_sum + " " + sum)
		LabelManager.label_cache = new Array();
		LabelManager.label_cache_sum = sum;
	}
}
LabelManager.prototype.revalidate_urls_labels_cache = function() {
	var sum = q("select concat(sum(url),sum(label)) from urls_labels")[0];
	if (!(sum == LabelManager.urls_labels_cache_sum)) {
		Amarok.debug("Previous urls_labels cache is invalid.  Regenerating. " + LabelManager.urls_labels_cache_sum + " " + sum)
		LabelManager.urls_labels_cache = new Array();
		LabelManager.urls_labels_cache_sum = sum;
	}
}
LabelManager.prototype.warmupFileCache = function(filenames) {
	function incache(f) { return LabelManager.track_cache[f] === undefined; }
	var keys = map( function(f) { return quotestr(path2rpath(f)); } , filter( incache, filenames ) );
	if (keys.length == 0) { return; }
	var query = "select id,rpath from urls where rpath in ("+keys.join(",")+")";
	var res = batch(q(query),2);
	if (keys.length != res.length) {
		throw "Unexpected keys.length != res.length: " + keys.length + " " + res.length;
	}
	for (var i in res) { LabelManager.track_cache[rpath2path(res[i][1])] = res[i][0]; }
};
LabelManager.prototype.warmupLabelCache = function(labels) {
	function incache(f) { return LabelManager.label_cache[f] === undefined; }
	var keys = map( quotestr, filter( incache, labels ) );
	if (keys.length == 0) { return; }
	var query = "select id,label from labels where label in ("+keys.join(",")+")";
	var res = batch(q(query),2);
	if (keys.length != res.length) {
		throw "Unexpected keys.length != res.length: " + keys.length + " " + res.length;
	}
	for (var i in res) { LabelManager.label_cache[res[i][1]] = res[i][0]; }
};
LabelManager.prototype.warmupUrlsLabelsCache = function(filenames,labels) {
	if (filenames.length == 0) { return; }
	if (labels.length == 0) { return; }
	for (var i in filenames) {
		var urlid = this.getTrackID(filenames[i]);
		for (var j in labels) {
			var labelid = this.getLabelID(labels[j]);
			if (LabelManager.urls_labels_cache[urlid+ "," + labelid] === undefined) {
				LabelManager.urls_labels_cache[urlid+ "," + labelid] = false;
			}
		}
	}
	var keys = q("select CONCAT(url,',',label) from urls_labels");
	map( function(key) { LabelManager.urls_labels_cache[key] = true; } , keys );
};
LabelManager.prototype.getLabels = function() {
	return q("select label from labels");
};
LabelManager.prototype.getTrackID = function(filename) {
	if (!LabelManager.track_cache[filename]) {
		Amarok.debug("Initializing track cache for "+filename);
		query = "select id from urls where rpath = " + quotestr(path2rpath(filename));
		id = q(query)[0];
		if (!id) { throw filename + ' does not have an associated track ID'; }
		LabelManager.track_cache[filename] = id;
		return id;
	}
	return LabelManager.track_cache[filename];
};
LabelManager.prototype.getLabelID = function (label) {
	if (!LabelManager.label_cache[label]) {
		Amarok.debug("Initializing label cache for "+label);
		var query = "select id from labels where label = " + quotestr(label);
		var id = q(query)[0];
		if (!id) { throw label + ' does not have an associated label ID'; }
		LabelManager.label_cache[label] = id;
		return id;
	}
	return LabelManager.label_cache[label];
};
LabelManager.prototype.labeled = function(filename,label) {
	var urlid = this.getTrackID(filename);
	var labelid = this.getLabelID(label);
	if (LabelManager.urls_labels_cache[urlid+ "," + labelid] === undefined) {
		Amarok.debug("Initializing urls_labels cache for " + urlid + "," + labelid);
		var query = "select label from urls_labels where url = " + urlid + " and label = " + labelid;
		var id = q(query)[0];
		if (id) { id = true; }
		else { id = false };
		LabelManager.urls_labels_cache[urlid + "," + labelid] = id;
		return id;
	}
	return LabelManager.urls_labels_cache[urlid + "," + labelid];
};
LabelManager.prototype.addLabel = function (filename,label) {
	if (this.labeled(filename,label)) { return; }
	Amarok.debug("Adding label " + label + " to file " + filename);
	q("insert into urls_labels (url,label) values("+this.getTrackID(filename)+","+this.getLabelID(label)+")");
	LabelManager.urls_labels_cache[this.getTrackID(filename) + "," + this.getLabelID(label)] = true;
};
/*LabelManager.prototype.addLabelToManyFiles = function (label,arrayoffiles) {
	var labelid = this.getLabelID(label);
	function unlabeled(x) { return function(f) { return !x.labeled(f,label); } }
	var filtered = filter ( unlabeled(this) , arrayoffiles );
	if (filtered.length == 0) { return; }
	var urlids = map ( this.getTrackID , filtered );
// 	Amarok.debug("Adding label " + label + " to multiple files: " + urlids);
	var queries = map (
		function(urlid) {
			return "insert into urls_labels (url,label) values("+urlid+","+labelid+")";
		} , urlids );
	var query = queries.join("; ");
	q(query);
	map (
		function(urlid) {
			LabelManager.urls_labels_cache[urlid + "," + labelid] = true;
		}, urlids );
};*/
LabelManager.prototype.removeLabel = function (filename,label) {
	if (!this.labeled(filename,label)) { return; }
	Amarok.debug("Removing label " + label + " from file " + filename);
	q("delete from urls_labels where url = "+this.getTrackID(filename)+" and label = "+this.getLabelID(label));
	LabelManager.urls_labels_cache[this.getTrackID(filename) + "," + this.getLabelID(label)] = false;
};
LabelManager.prototype.createLabel = function (label) {
	try {
		this.getLabelID(label);
		Amarok.debug("Throwing alreadyexists");
		throw new AlreadyExists("Label " + label + " already exists");
	} catch (e) {
		if (e instanceof AlreadyExists) { throw e; }
		else {
			Amarok.debug("Creating label " + label);
			q("insert into labels (label) values(" + quotestr(label) + ")");
			this.revalidate_label_cache();
			this.revalidate_urls_labels_cache();
			/* the above line may not be needed (tho it cannot hurt)
			 * the reason is when a label is added,
			 * the table urls_labels does not change */
		}
	}
};
LabelManager.prototype.deleteLabel = function (label) {
	try {
		labelid = this.getLabelID(label);
	} catch (e) {
		throw new DoesntExist("Label " + label + " doesn't exist");
	}
	Amarok.debug("Deleting label " + label);
	q("delete from urls_labels where label = " + labelid);
	q("delete from labels where id = " + labelid);
	this.revalidate_label_cache();
	this.revalidate_urls_labels_cache();
};
LabelManager.prototype.getTracksLabeledAs = function (label) {
	labelid = this.getLabelID(label);
	res = q("select urls.rpath from urls_labels inner join urls on (urls_labels.url = urls.id) where label = " + labelid);
	return map( rpath2path , res );
}

