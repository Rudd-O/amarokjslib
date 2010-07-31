/*#########################################################################
#   This program is free software; you can redistribute it and/or modify  #
#   it under the terms of the GNU General Public License as published by  #
#   the Free Software Foundation; either version 3 of the License, or     #
#   (at your option) any later version.                                   #
#                                                                         #
#   This program is distributed in the hope that it will be useful,       #
#   but WITHOUT ANY WARRANTY; without even the implied warranty of        #
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         #
#   GNU General Public License for more details.                          #
#                                                                         #
#   You should have received a copy of the GNU General Public License     #
#   along with this program; if not, see <http://www.gnu.org/licenses/>   #
#   or write to the                                                       #
#   Free Software Foundation, Inc.,                                       #
#   51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.         #
##########################################################################*/

var utils_js_loaded; if (!utils_js_loaded) {

function basename(path) {
    return path.replace(/\\/g,'/').replace( /.*\//, '' );
}
 
function dirname(path) {
    return path.replace(/\\/g,'/').replace(/\/[^\/]*$/, '');
}

function inArray (arr,value) {
	var i;
	for (i=0; i < arr.length; i++) { if (arr[i] == value) { return true; } }
	return false;
}

function uniqueize (arr) {
	var newarr = new Array();
	for (var i=0; i < arr.length; i++) {
		if (!inArray(newarr,arr[i])) { newarr.push(arr[i]); }
	}
	return newarr;
}

function map(func, array) {
	var r = new Array();
	var l = array.length;
	for ( var i = 0; i < l ; i++ ) { r.push(func(array[i])); }
	return r;
}

function filter(func, array) {
	var r = new Array();
	var l = array.length;
	for ( var i = 0; i < l ; i++ ) {
		if (func(array[i])) { r.push(array[i]); }
	}
	return r;
}

function Logger() {
	this.filename = Amarok.Info.scriptPath() + "/script.log";
	this.file = new QFile( this.filename );
	var mode = QIODevice.OpenMode ( QIODevice.WriteOnly , QIODevice.Append );
	if ( !this.file.open( mode ) ) {
		this.opened = false;
	}
	else {
		this.opened = true;
		Amarok.debug("Log file opened: " + this.filename);
	}
}
Logger.prototype.debug = function (str) {
	try {
		if (this.opened) {
			var arr = new QByteArray(str + "\n");
			this.file.write(arr);
			this.file.flush();
		}
		else {
			Amarok.debug(str);
		}
	} catch (e) {
		Amarok.alert(e + " while attempting to log " + str);
	}
}

logger = new Logger();
d = function(s) { return logger.debug(s); }

a = Amarok.alert;

function catchAndAlert(f) {
	var g = function() {
		try {
			return f.apply(this,arguments);
		} catch(e) {
			var arglist = new Array();
			for (var i = 0; i < arguments.length ; i++) { arglist.push(arguments[i]); }
			if (e.lineNumber) {
				Amarok.alert("Exception @" + e.lineNumber +
					"\n" + e +
					"\nArguments (" + arglist.length + 
					"):\n" + arglist.join("\n")
				);
			} else {
				Amarok.alert("Exception" +
					"\n" + e +
					"\nArguments (" + arglist.length + 
					"):\n" + arglist.join("\n")
				);
			}
			throw e;
		}
	}
	return g;
}

function catchAndDebug(f) {
	var g = function() {
		try {
			return f.apply(this,arguments);
		} catch(e) {
			Amarok.debug("Something went wrong");
			Amarok.debug(e);
			Amarok.debug(e.lineNumber);
			var arglist = new Array();
			for (var i = 0; i < arguments.length ; i++) { arglist.push(arguments[i]); }
			if (e.lineNumber) {
				Amarok.debug("Exception @" + e.lineNumber +
					"\n" + e +
					"\nArguments (" + arglist.length + 
					"):\n" + arglist.join("\n")
				);
			} else {
				Amarok.debug("Exception" +
					"\n" + e +
					"\nArguments (" + arglist.length + 
					"):\n" + arglist.join("\n")
				);
			}
			throw e;
		}
	}
	return g;
}

function timed(f) {
	var g = function() {
		var start = new Date().getTime();
		var ret = f.apply(this,arguments);
		var end = new Date().getTime();
		var diff = end - start;
		Amarok.debug("Computed in " + diff + " milliseconds. Result: " + ret);
		return ret;
	}
	return g;
}

function batch(array,batchSize) {
	var result = new Array();
	var l = array.length;
	for (var i = 0; i < l; i++) {
		var stride = Math.floor(i / batchSize);
		if (result[stride] === undefined) { result[stride] = new Array(); }
		result[stride].push(array[i]);
	}
	return result;
}

function q(s) {
	d("SQL query: " + s);
	return Amarok.Collection.query(s);
} 

function quotestr(s) { return "'" + Amarok.Collection.escape(s) + "'"; }

path2rpath = function (p) { return "." + p; }

rpath2path = function (p) { return p.substr(1); }

utils_js_loaded = true; }