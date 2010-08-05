/* to include this library into your project, use this snippet of code at the start of your script:
 * 
try {
	if (!Importer.include("../amarokjslib/main.js")) {
		throw "Could not import the Amarok QtScript library - aborting";
	}
} catch (e) {
	Amarok.alert("This script requires that you get the Amarok QtScript library script first\nDetails: " + e);
	Amarok.end();
}
if (!amarokjslib_satisfies_version || !amarokjslib_satisfies_version("0.1.1")) { // < minimum amarokjslib version your script needs
	Amarok.alert("Your Script Name needs you to update to the latest version of the Amarok QtScript library");
	Amarok.end();
} 
 *
 */


if (!Importer.include("../amarokjslib/utils.js")) {
	throw "amarokjslib: could not import utils.js";
}
if (!Importer.include("../amarokjslib/CollectionManager.js")) {
	throw "amarokjslib: could not import CollectionManager.js";
}
if (!Importer.include("../amarokjslib/LabelManager.js")) {
	throw "amarokjslib: could not import LabelManager.js";
}

// FIXME: make load this version from the specfile

amarokjslib_version = "0.1.2";

function amarokjslib_satisfies_version(minimum_version) {
    var mine = amarokjslib_version.split(".");
    var requested = minimum_version.split(".");
    for (var x = 0 ; x < mine.length + requested.length ; x++) {
        var a = mine[x]; var b = requested[x];
        if (!a) { a = "0"; }
        if (!b) { b = "0"; }
        a = parseInt(a); b = parseInt(b);
        if (a > b) { return true; }
        if (a < b) { return false; }
    }
    return true;
}
