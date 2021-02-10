function newPage(url){ //open new page in same tab
    var tab = window.open(url,'_self'); //adapted from Stackoverflow https://stackoverflow.com/questions/8454510/open-url-in-same-window-and-in-same-tab
    tab.focus();
}

$("#btn-container").click(function(){newPage("table.html")});