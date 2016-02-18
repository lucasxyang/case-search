
/* 
This is a basic searching tool used in pair with Google Chrome, 
which does not provide built-in case-sensitive string searching. 
This tool will search most of what is on the webpage, 
but it does not search dynamically loaded content, 
such as content in a side-panel where random Tweet would appear.
Neither does this search content that is non-textual but is visually-percived as text. 
In all, this tool can never be un-buggy. A seeamingly simple task is proved to be very hard.
Just think about it:  Chrome and Firefox fail at this on sites like Amazon.com. 
*/

// author: Xiaosiqi "Lucas" Yang
// Fair use only. 


// add listeners to each of four buttons
document.getElementById("prev").addEventListener("click", function(event) {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendMessage(tab.id, {command: "prev"});
    });
});
document.getElementById("next").addEventListener("click", function(event) {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendMessage(tab.id, {command: "next"});
    });
});
document.getElementById("search").addEventListener("click", search);
document.getElementById("clear").addEventListener("click", function(event) {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendMessage(tab.id, {command: "clear"});
    });
});

// if Enter is pressed when div is focused
document.getElementById("query").addEventListener("keydown", function(event) {
    // assign the value of input field *query*, 
    // to the background (long-running event) variable *query*
    chrome.extension.getBackgroundPage().query = document.getElementById("query").value;
    if (event.keyCode == 13) {
        search();
    }
});

// assign the value of var *query* from background page, 
// to *query* of the document (the input field)
// this is used when user reopens the extension
document.getElementById("query").value = chrome.extension.getBackgroundPage().query;

// mixed use of old and new syntax for reference
// This sends the input string to content.js which does all the work. 
// Detailed searching is not done here. 
function search() {
    chrome.tabs.query({active: true, lastFocusedWindow: true }, function(array_of_Tabs){
        var tab = array_of_Tabs[0];
        var el = document.getElementById("query");
        el.className = '';
        checkbox = document.getElementById("case-insensitive");
        if (checkbox.checked) {
            var insensitive = false;
        } else {
            var insensitive = true;
        }
        // old
        //chrome.tabs.sendMessage(tab.id, {command: "search", caseInsensitive: insensitive, regexp: el.value});
        // new, as follows
        chrome.tabs.sendMessage(tab.id, {command: "search", 
            caseInsensitive: insensitive, regexp: el.value}, 
            function(response){
                c1 = response.c;
                document.getElementById('countP').innerHTML = "Total matches: " + c1;
        });
    });
}

