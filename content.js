
/* Architecture of this script: 
1. Receive the input from popup.js
2. Recursively search for the desired text in all text nodes on the page
3. Apply (2) to all nodes' child nodes
4a. In simple cases, just add "everything that is before next mark" to the page. 
4b. To deal with cases where multiple (more than one) occurance of desired text in one node, ...
  ... replace the entire "element" with "before", and insert this mark before next mark. 
5. This ends (2).
*/

var current = 0;
var marks = new Array(); // an array of highlighted phrases(nodes) that are PUT BACK TO THE PAGE

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.command == "search") {
		var flags = "g";
		if (request.caseInsensitive == true) {
			var flags = "gi";
		}
		var r_e = new RegExp(request.regexp, flags);
		var html = document.getElementsByTagName('body')[0];
		clear();
		recurse(html, r_e);
		displayCount();
	} else if (request.command == "clear") {
		clear();
	    chrome.extension.getBackgroundPage().query = "";
	} else if (request.command == "prev") {
		moveToPrev();
	} else if (request.command == "next") {
		moveToNext();
	} 
	sendResponse({c: marks.length});// new. added
	if (marks.length > 0) {
		marks[current].className="__regexp_search_selected";
	}
});

// this clears the highlighted mark array, and restores the page
// It is strongly encouraged to refresh the page before a new search!  
function clear() {
	current = 0;
	for (var i = 0; i < marks.length; i++) {
		var mark = marks[i];
		mark.parentNode.replaceChild(mark.firstChild, mark);
	}
	marks.length = 0;
	var s = document.getElementById("_regexp_search_count");
	if (s != null) {
		s.parentNode.removeChild(s);
	}
}

// recursively go through every element and its child elements
function recurse(element, regexp) {
	// ... unless it appears in any un-interested places
	if (element.nodeName == "MARK" || 
		element.nodeName == "SCRIPT" ||
		element.nodeName == "STYLE" ||
		element.nodeType == 8) {
		// 8 is COMMENT_NODE
		return;
	}

	// future work here to deal with various invisible elements
	if (element.nodeType != 3 && !$(element).is(':visible')) {
	//if (element.nodeType != 3 && element.style.display != "none" ) {
 		return;
 	}

 	// if it has child nodes, recursion
	if (element.childNodes.length > 0) { 
		for (var i = 0; i < element.childNodes.length; i++) {
			recurse(element.childNodes[i], regexp);
		}
	}

	if (element.nodeType == 3) { // 3 IS TEXT_NODE
		var str = element.nodeValue;
		if (str.trim() != '') {
			var matches = str.match(regexp);
			var parent = element.parentNode;
			if (matches != null) {
				var pos = 0;
				var mark;
				for (var i = 0; i < matches.length; i++) {
					// starting from pos [2nd arg], find index of current match in str
					var index = str.indexOf(matches[i], pos);
					// before is everything before this match but after last match. 
					var before = document.createTextNode(str.substring(pos, index));
					// move pos to the end of this match (which is string length)
					pos = index + matches[i].length;

					// if more than one occurance in parent node (including its children)
					// To be exact, this section of code deals with situations 
					// where two (or more) children nodes of a parent node, each has an occurance
					// 
					if (element.parentNode == parent) {
						// replace element(2nd) with before(1st)
						parent.replaceChild(before, element); 
					} else { // simple
						// insert before before thisMark.nextsibling
						parent.insertBefore(before, mark.nextSibling) 
					}

					mark = document.createElement('mark');
					mark.appendChild(document.createTextNode(matches[i])); 
					// a mark element whose text is matches[i]

					parent.insertBefore(mark, before.nextSibling); 
					// insert mark before bofore.nextsibling (before, mark, nextsibling)

					// This is how it looks now, [before], [mark], [mark.nextsibling]
					marks.push(mark);
				}
				//parent.appendChild(document.createTextNode(str.substring(pos)));
				var after = document.createTextNode(str.substring(pos));
				parent.insertBefore(after, mark.nextSibling);
			}
		}
	}
}

// in case that webpage's floating header overlaps this displayed message
// *count* is also sent back to the popup
// This may be refactored using z-index in the future
function displayCount() {
	if (marks.length > 0) {
		var num = current + 1;
	} else {
		var num = 0;
	}
	var rsc = document.createElement('span');
	rsc.id = "_regexp_search_count";
	rsc.innerHTML = num + " of " + marks.length + " matches.";

	// disappear when mouseover and reappear when mouseout
	rsc.addEventListener('mouseover', function(event) {
		document.getElementById("_regexp_search_count").style.opacity = "0";
	});
	rsc.addEventListener('mouseout', function(event) {
		document.getElementById("_regexp_search_count").style.opacity = "1";
	});

	document.getElementsByTagName('body')[0].appendChild(rsc);
}

function moveToPrev() {
	if (current > 0) {
		marks[current--].className="";
		marks[current].className="__regexp_search_selected";
		updateText();
	}
}

function moveToNext() {
	if (current < marks.length - 1) {
		marks[current++].className="";
		marks[current].className="__regexp_search_selected";
		updateText();
	}
}

function updateText() {
	if (marks.length > 0) {
		var s = document.getElementById("_regexp_search_count");
		var num = current + 1;
		s.innerHTML = num + " of " + marks.length + " matches.";
	}
}
