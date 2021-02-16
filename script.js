function newPage(url){ //open new page in same tab
    var tab = window.open(url,'_self'); //adapted from Stackoverflow https://stackoverflow.com/questions/8454510/open-url-in-same-window-and-in-same-tab
    tab.focus();
}
function getFullDate(datetime){
    return new Date(datetime.getFullYear(),datetime.getMonth(),datetime.getDate());
}    

function initDateArray(dateArray, checkdate){
    for (let index = 0; index < dateArray.length; index++) {
        if (dateArray[index].getTime() == checkdate.getTime()){
            return true;
        }
    }
    return false;
}


function matchValid(fixture){
    let status = fixture.fixture.status.short;
    if (status === "NS" || status === "TBD" || status === "SUSP" || status === "INT" || 
    status === "PST" || status === "CANC" || status === "ABD" || status === "AWD" || status === "WO"){
        return [false, status];
    }
    else {
        return [true, status];
    }
}

function roundName(name){
    let newName = name;
    if (name.includes("Regular Season")){
        newName = name.replace("Regular Season","Match Week")
    }
    else if (name.includes("8th")){
        newName = "Round of 16";
    }
    else if (name.includes("16th")){
        newName = "Round of 32";
    }
    else if (name.includes("32nd")){
        newName = "Round of 64";
    }
    return newName;
}

function next10(dateArray, matchDict, matches, startDate, endDate, compId){
    startDate = new Date(startDate);
    let validSDate = `${startDate.getFullYear()}-${(startDate.getMonth()+1).toLocaleString('en-US',{minimumIntegerDigits:2})}-${startDate.getDate().toLocaleString('en-US',{minimumIntegerDigits:2})}`
    endDate = new Date(endDate);
    let validEDate = `${endDate.getFullYear()}-${(endDate.getMonth()+1).toLocaleString('en-US',{minimumIntegerDigits:2})}-${endDate.getDate().toLocaleString('en-US',{minimumIntegerDigits:2})}`
    $("#startdate").html(validSDate);
    $("#enddate").html(validEDate);
    var settings = {
        "url": `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${compId}&from=${validSDate}&to=${validEDate}&season=2020&timezone=Asia/Singapore`,
        "method": "GET",
        "timeout": 0,
        "headers": {
            "x-rapidapi-key": "89f6bb3f0cmshbe238b12b48adb9p15e37bjsnc3cca11640dc"
        },
    };
    $.ajax(settings).done(function (response) {
        let data = response.response;
        if (data.length === 0){
            $(".no-score").show();
        }
        else{
            $(".no-score").hide();
            for (let index2 = 0; index2 < data.length; index2++) {
                let fixture = data[index2];
                let matchCard = createMatchCard(fixture, index2, "notlive");
                let datetime = new Date(fixture.fixture.date);
                let date = getFullDate(datetime);
                matchDict[matchCard.outerHTML] = datetime;
                console.log(datetime, fixture.teams.home.name);
                if(! initDateArray(dateArray, date)) {
                    dateArray.push(date);
                }
            };
            matches += data.length;
            //insert into content into DOM
            for (let index = 0; index < dateArray.length; index++) {
                let dateHeader = document.createElement("header");
                let dateH6 = document.createElement("h6");
                dateH6.setAttribute("class",`text-muted matchday header matchday-${index}`);
                dateHeader.appendChild(dateH6);
                let matchDay = document.createElement("div");
                matchDay.setAttribute("class",`row row-cols-2 matchday matchday-${index}`);
                $("section.container.scores").append(dateHeader);
                $("section.container.scores").append(matchDay);
            };
            for (let index = 0; index < dateArray.length; index++) {
                $(`h6.matchday-${index}`).html(dateArray[index].toDateString());
                for (var match in matchDict){
                    if (getFullDate(matchDict[match]).getTime() === dateArray[index].getTime()){
                        $(`div.matchday-${index}`).append(match);
                    }
                }
            }
            for (let index = 0; index < matches; index++) {
                let fixture = data[index];
                $(`.match-${index} > .match-teams > .home-team > #tname`).html(`${fixture.teams.home.name}`)
                $(`.match-${index} > .match-teams > .away-team > #tname`).html(`${fixture.teams.away.name}`)
                let datetime = new Date(fixture.fixture.date)
                $(`.notlive.match-${index} > .match-info > #kickoff`).html(`<h3>${datetime.getHours().toLocaleString('en-US',{minimumIntegerDigits:2})}:${datetime.getMinutes().toLocaleString('en-US',{minimumIntegerDigits:2})}</h3>`)
                $(`.live.match-${index} > .match-info > #kickoff`).html('<lottie-player src="https://assets3.lottiefiles.com/private_files/lf30_zL4sS7.json"  background="transparent"  speed="2"  style="width: 300px; height: 300px;"  loop  autoplay></lottie-player>');
                $(`.match-${index} > .match-info > #status`).html(`${roundName(fixture.league.round)}`)
                if (! matchValid(fixture)[0]){
                    $(`.match-${index} > .match-teams > .score > #scoreline`).html("VS");
                    $(`.match-${index} > .match-info > #status`).append(`; ${fixture.fixture.status.long}`)
                }
                else{
                    $(`.match-${index} > .match-teams > .score > #scoreline`).html(`
                    <span id = 'hscore'>${fixture.goals.home}</span>
                    <img src="line.svg">
                    <span id = 'hscore'>${fixture.goals.away}</span>`)
                };
            }
        }
    });
}

function searchTeam(searchTerm,resultsId){
    var settings = {
        "url": `https://api-football-v1.p.rapidapi.com/v3/teams?search=${searchTerm}`,
        "method": "GET",
        "timeout": 0,
        "headers": {
          "x-rapidapi-key": "89f6bb3f0cmshbe238b12b48adb9p15e37bjsnc3cca11640dc"
        },
      };
      
      $.ajax(settings).done(function (response) {
        let data = response.response;
        for (let index = 0; index < data.length; index++) {
            let newOption = document.createElement("option");
            newOption.setAttribute("id",`teamId-${data[index].team.id}`);
            newOption.setAttribute("value",`${data[index].team.name}`);
            $(`datalist#${resultsId}`).append(newOption);
        }
    });
}

function createMatchCard(fixture, index, live){
    live = live || null;
    //Make div that displays match score
    let matchCard = document.createElement("section");
    matchCard.setAttribute("class",`col row ${live} match match-${index}`);
    //Set match info
    let matchInfo = document.createElement("div");
    matchInfo.setAttribute("class","match-info");
    let kickoff = document.createElement("div");
    kickoff.setAttribute("id","kickoff");
    let status = document.createElement("h5");
    status.setAttribute("id","status");
    matchInfo.appendChild(kickoff);
    matchInfo.appendChild(status);
    let matchTeams = document.createElement("div");
    matchTeams.setAttribute("class","row match-teams")
    //Set home team info
    let matchHome = document.createElement("div");
    matchHome.setAttribute("class","col team home-team");
    let homeName = document.createElement("h3");
    homeName.setAttribute("id","tname");
    let homeLogo = document.createElement("img");
    homeLogo.setAttribute("src",fixture.teams.home.logo)
    matchHome.appendChild(homeName);
    matchHome.appendChild(homeLogo);
    //Set away team info
    let matchAway = document.createElement("div");
    matchAway.setAttribute("class","col team away-team");
    let awayName = document.createElement("h3");
    awayName.setAttribute("id","tname");
    let awayLogo = document.createElement("img");
    awayLogo.setAttribute("src",fixture.teams.away.logo)
    matchAway.appendChild(awayName);
    matchAway.appendChild(awayLogo);
    //Show score board
    let score = document.createElement("div");
    score.setAttribute("class","col score");
    let scoreLine = document.createElement("h4");
    scoreLine.setAttribute("id","scoreline");
    score.appendChild(scoreLine);   
    matchCard.appendChild(matchInfo);
    matchTeams.appendChild(matchHome);
    matchTeams.appendChild(score);
    matchTeams.appendChild(matchAway);
    matchCard.append(matchTeams);
    return matchCard;
}

function createTr(index,desc){
    let newTr = document.createElement("tr");
    newTr.setAttribute("class",`rank rank-${index+1} ${rowColour(desc)}`);
    let newPos = document.createElement("th");
    newPos.setAttribute("scope","row");
    newPos.setAttribute("id","pos");
    let newTeam = document.createElement("td");
    newTeam.setAttribute("id","team");
    let newPts = document.createElement("th");
    newPts.setAttribute("scope","row");
    newPts.setAttribute("id","Pts");
    let newGD = document.createElement("th");
    newGD.setAttribute("scope","row");
    newGD.setAttribute("id","GD");
    let newMP = document.createElement("td");
    newMP.setAttribute("id","MP");
    let newWins = document.createElement("td");
    newWins.setAttribute("id","wins");
    let newDraws = document.createElement("td");
    newDraws.setAttribute("id","draws");
    let newLoss = document.createElement("td");
    newLoss.setAttribute("id","losses");
    let newGF = document.createElement("td");
    newGF.setAttribute("id","GF");
    let newGA = document.createElement("td");
    newGA.setAttribute("id","GA");
    let newForm = document.createElement("td");
    newForm.setAttribute("id","form");
    newTr.append(newPos,newTeam,newPts,newGD,newGD,newMP,
        newWins,newDraws,newLoss,newGF,newGA,newForm);
    return newTr;
}

function rowColour(desc){
    if (desc != null){
        if (desc ===  "Promotion - Champions League (Group Stage)" || desc === "Promotion - Champions League (Round of 16)" || desc == "Promotion - Europa League (Play Offs)"){
            return "table-success";
        }
        else if (desc === "Promotion - Europa League (Group Stage)" || desc === "Promotion - Europa League (Round of 32)"){
            return "table-warning";
        }
        else if (desc == "Promotion - Champions League (Qualification)"){
            return "table-info"
        }
        else if (desc.includes("Relegation")){
            return "table-danger";
        }
    }
    else{
        return "";
    }
}

$("#view-table").click(function(){newPage("table.html")});
$("#view-stats").click(function(){newPage("stats2.html")});
$("#h2h-stats").click(function(){newPage("stats3.html")});
//============== nav bar =================
$(".dropdown-item").click(function(){
    let compId = $(this).attr("id");
    let compName = $(this).text();
    localStorage.setItem("compId",compId);
    localStorage.setItem("compName",compName);
    newPage((window.location.href).replace("#",""));
})

//============ index.html ================
let dateArray = [];
let matchDict = {};
let matches = 0;
let startDate = Date.now();
let endDate = startDate + 604800000;
let compId = parseInt(localStorage.getItem("compId"));
let compName = localStorage.getItem("compName");
$("#view-table").hide();
$(".no-score").hide();
$(".no-table").hide()
$(".no-goals").hide();
$("ul.top-scorer-list, .top-scorer").hide();
if (isNaN(compId)){
    compId = 39;
}
if (compName === null){
    compName = "English Premier League"
}
$("header>h1").html(compName);
console.log(compId);
var settings = {
    "url": `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${compId}&live=all`,
    "method": "GET",
    "timeout": 0,
    "headers": {
      "x-rapidapi-key": "89f6bb3f0cmshbe238b12b48adb9p15e37bjsnc3cca11640dc"
    },
};
$.ajax(settings).done(function (response) {
    let data = response.response;
    for (let index1 = 0; index1 < data.length; index1++) {
        let fixture = data[index1];
        let matchCard = createMatchCard(fixture, index1, "live");
        let datetime = new Date(fixture.fixture.date);
        let date = getFullDate(datetime);
        matchDict[matchCard.outerHTML] = datetime;
        console.log(datetime, fixture.teams.home.name);
        if(! initDateArray(dateArray, date)) {
            dateArray.push(date);
        }
    };
    matches += data.length;
});
next10(dateArray, matchDict, matches, startDate, endDate, compId)
$("#see-future").click(function(){
    startDate += 604800000;
    endDate += 604800000;
    $("section.container.scores > *").remove();
    $(".no-score").hide();
    next10([], {}, 0, startDate, endDate, compId);
})
$("#see-earlier").click(function(){
    startDate -= 604800000;
    endDate -= 604800000;
    $("section.container.scores > *").remove();
    $(".no-score").hide();
    next10([], {}, 0, startDate, endDate, compId);
})
//============== table.html ==================
var settings = {
    "url": `https://api-football-v1.p.rapidapi.com/v3/standings?league=${compId}&season=2020`,
    "method": "GET",
    "timeout": 0,
    "headers": {
      "x-rapidapi-key": "89f6bb3f0cmshbe238b12b48adb9p15e37bjsnc3cca11640dc"
    },
};
$.ajax(settings).done(function (response) {
    let data = response.response
    if (data.length === 0){
        $("#view-table").hide();
        $("table.standings").hide();
        $(".no-table").show()
    }
    else{
        $("#view-table").show();
        $("table.standings").show();
        $(".no-table").hide()
        let groups = data[0].league.standings;
        for (let i = 0; i < groups.length; i++) {
            let standings = groups[i]
            let grpTable = document.createElement("table");
            grpTable.setAttribute("class",`table table-hover standings-${i} caption-top`);
            let caption = document.createElement("caption");
            let newThead = document.createElement("thead");
            let newTbody = document.createElement("tbody");
            grpTable.appendChild(caption);
            grpTable.appendChild(newThead);
            grpTable.appendChild(newTbody);
            $("section.tables").append(grpTable);
            $(`table.standings-${i} > thead`).html(`<tr>
            <th scope="col">Position</th>
            <th scope="col">Team</th>
            <th scope="col" class="table-secondary">Points</th>
            <th scope="col" class="table-secondary">GD</th>
            <th scope="col">MP</th><th scope="col">W</th>
            <th scope="col">D</th><th scope="col">L</th>
            <th scope="col">GF</th><th scope="col">GA</th>
            <th scope="col">Form</th>
            </tr>`);
            $(`table.standings-${i} > caption`).html(standings[0].group);
            for (let index = 0; index < standings.length; index++) {
                desc = standings[index].description;
                let newTr = createTr(index,desc);
                $(`table.standings-${i} > tbody`).append(newTr);
                $(`table.standings-${i} > tbody > .rank-${index+1} > #pos`).html(standings[index].rank);
                $(`table.standings-${i} > tbody > .rank-${index+1} > #team`).html(`<img src="${standings[index].team.logo}" id="logo"> ${standings[index].team.name}`);
                $(`table.standings-${i} > tbody > .rank-${index+1} > #Pts`).html(standings[index].points);
                $(`table.standings-${i} > tbody > .rank-${index+1} > #GD`).html(standings[index].goalsDiff);
                $(`table.standings-${i} > tbody > .rank-${index+1} > #MP`).html(standings[index].all.played);
                $(`table.standings-${i} > tbody > .rank-${index+1} > #wins`).html(standings[index].all.win);
                $(`table.standings-${i} > tbody > .rank-${index+1} > #draws`).html(standings[index].all.draw);
                $(`table.standings-${i} > tbody > .rank-${index+1} > #losses`).html(standings[index].all.lose);
                $(`table.standings-${i} > tbody > .rank-${index+1} > #GF`).html(standings[index].all.goals.for);
                $(`table.standings-${i} > tbody > .rank-${index+1} > #GA`).html(standings[index].all.goals.against);
                $(`table.standings-${i} > tbody > .rank-${index+1} > #form`).html(standings[index].form);
            }
        }
    }
});
//============== stats.html ==================
var settings = {
    "url": `https://api-football-v1.p.rapidapi.com/v3/players/topscorers?league=${compId}&season=2020`,
    "method": "GET",
    "timeout": 0,
    "headers": {
      "x-rapidapi-key": "89f6bb3f0cmshbe238b12b48adb9p15e37bjsnc3cca11640dc"
    },
};

$.ajax(settings).done(function (response) {
    let data = response.response;
    if (data.length < 10){
        $(".no-goals").show();
        $("ul.top-scorer-list, .top-scorer").hide();
    }
    else{
        $(".no-goals").hide();
        $("ul.top-scorer-list, .top-scorer").show();
        let topscorer = data[0];
        let playerName = topscorer.player.name;
        $(".top-scorer > #scorer-info > #name").text(playerName);
        $(".top-scorer > #scorer-info > #team").text(topscorer.statistics[0].team.name);
        $(".top-scorer > #logo").attr("src", topscorer.statistics[0].team.logo);
        $(".top-scorer > #card-container > .card > img").attr("src",topscorer.player.photo);
        $(".top-scorer > #card-container > .card > img").attr("alt",playerName);
        $(".top-scorer > #card-container > .card > img").attr("title",playerName);
        $(".top-scorer > #card-container > .card > h2 > #goals").text(topscorer.statistics[0].goals.total);
        for (let index = 1; index < 10; index++) {
            let player = data[index];
            console.log(index, player);
            $(`#pos-${index+1}.stats-row > #logo`).attr("src",player.statistics[0].team.logo);
            $(`#pos-${index+1}.stats-row > .player > #name`).text(player.player.name);
            $(`#pos-${index+1}.stats-row > .player > #team`).text(player.statistics[0].team.name);
            $(`#pos-${index+1}.stats-row > #stat > #goals`).text(player.statistics[0].goals.total);
        }
    }
});

//================= stats2.hhtml ==============
$("input#search").keyup(function(){
    let searchTerm = $("input#search").val();
    if (searchTerm.length === 3){
        $("datalist#results > *").remove();
        searchTeam(searchTerm,"results");
    }
});
$("input#search1").keyup(function(){
    let searchTerm = $("input#search1").val();
    if (searchTerm.length === 3){
        $("datalist#results > *").remove();
        searchTeam(searchTerm,"results1");
    }
});