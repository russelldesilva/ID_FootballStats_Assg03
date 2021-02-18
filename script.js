function newPage(url){ //open new page in same tab
    var tab = window.open(url,'_self'); //adapted from Stackoverflow https://stackoverflow.com/questions/8454510/open-url-in-same-window-and-in-same-tab
    tab.focus();
}
function getFullDate(datetime){
    return new Date(datetime.getFullYear(),datetime.getMonth(),datetime.getDate()); //get date portion of Date element
}    

function initDateArray(dateArray, checkdate){ //check if Date is in array of Dates
    for (let index = 0; index < dateArray.length; index++) {
        if (dateArray[index].getTime() == checkdate.getTime()){
            return true;
        }
    }
    return false;
}


function matchValid(fixture){ //check if match has been played fully / is being played
    let status = fixture.fixture.status.short;
    if (status === "NS" || status === "TBD" || status === "SUSP" || status === "INT" || //click here to see what each status stands for: https://www.api-football.com/documentation-v3#operation/get-fixtures
    status === "PST" || status === "CANC" || status === "ABD" || status === "AWD" || status === "WO"){  
        return [false, status];
    }
    else {
        return [true, status];
    }
}

function roundName(name){ //change name of competition round to something more commonly used
    let newName = name;
    if (name.includes("Regular Season")){
        newName = name.replace("Regular Season","Match Week") //match week is more commonly said than regular season
    }
    else if (name.includes("8th")){ //change 8th final to round of 16
        newName = "Round of 16"; 
    }
    else if (name.includes("16th")){ //change 16th final to round of 32
        newName = "Round of 32";
    }
    else if (name.includes("32nd")){ //change 32nd final to round of 64
        newName = "Round of 64";
    }
    return newName;
}

function next10(dateArray, matchDict, matches, startDate, endDate, compId){ //get and display the matches for the next/previous week
    startDate = new Date(startDate); 
    let validSDate = `${startDate.getFullYear()}-
    ${(startDate.getMonth()+1).toLocaleString('en-US',{minimumIntegerDigits:2})}-
    ${startDate.getDate().toLocaleString('en-US',{minimumIntegerDigits:2})}` //validXdate = YYYY-MM-DD format, minimumIntegerDigits:2 to ensure month and day has 2 digits
    endDate = new Date(endDate);
    let validEDate = `${endDate.getFullYear()}-
    ${(endDate.getMonth()+1).toLocaleString('en-US',{minimumIntegerDigits:2})}-
    ${endDate.getDate().toLocaleString('en-US',{minimumIntegerDigits:2})}`
    $("#startdate").html(validSDate);
    $("#enddate").html(validEDate);
    var settings = {
        "url": `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${compId}&from=${validSDate}&to=${validEDate}&season=2020&timezone=Asia/Singapore`, //get matches form compId between validSDate and validEDate
        "method": "GET",
        "timeout": 0,
        "headers": {
            "x-rapidapi-key": "89f6bb3f0cmshbe238b12b48adb9p15e37bjsnc3cca11640dc"
        },
    };
    $.ajax(settings).done(function (response) {
        let data = response.response;
        if (data.length === 0){ //if no matches for the week, display no-score animation
            $(".no-score").show();
        }
        else{
            $(".no-score").hide();
            for (let index2 = 0; index2 < data.length; index2++) {
                let fixture = data[index2];
                let matchCard = createMatchCard(fixture, index2, "notlive"); //create div that represents one match
                let datetime = new Date(fixture.fixture.date);
                let date = getFullDate(datetime);
                matchDict[matchCard.outerHTML] = datetime; //matchCard.outerHTML = html of matchCard as a string; matchDict is a dictionary containing the html of each matchCard and its corresponding date
                if(! initDateArray(dateArray, date)) { 
                    dateArray.push(date); //push date if not already in dateArray to get only unique match dates
                }
            };
            matches += data.length;
            //insert into content into DOM
            for (let index = 0; index < dateArray.length; index++) { //create header for match date
                let dateHeader = document.createElement("header");
                let dateH6 = document.createElement("h6");
                dateH6.setAttribute("class",`text-muted matchday header matchday-${index}`);
                dateHeader.appendChild(dateH6);
                let matchDay = document.createElement("div");
                matchDay.setAttribute("class",`row row-cols-2 matchday matchday-${index}`);
                $("section.container.scores").append(dateHeader);
                $("section.container.scores").append(matchDay);
            };
            for (let index = 0; index < dateArray.length; index++) { //populate match date header
                $(`h6.matchday-${index}`).html(dateArray[index].toDateString());
                for (var match in matchDict){
                    if (getFullDate(matchDict[match]).getTime() === dateArray[index].getTime()){
                        $(`div.matchday-${index}`).append(match);
                    }
                }
            }
            for (let index = 0; index < matches; index++) { //populate matchCard
                let fixture = data[index];
                $(`.match-${index} > .match-teams > .home-team > #tname`).html(`${fixture.teams.home.name}`)
                $(`.match-${index} > .match-teams > .away-team > #tname`).html(`${fixture.teams.away.name}`)
                let datetime = new Date(fixture.fixture.date)
                $(`.notlive.match-${index} > .match-info > #kickoff`).html(`<h3>${datetime.getHours().toLocaleString('en-US',{minimumIntegerDigits:2})}:${datetime.getMinutes().toLocaleString('en-US',{minimumIntegerDigits:2})}</h3>`)
                $(`.live.match-${index} > .match-info > #kickoff`).html('<lottie-player src="https://assets3.lottiefiles.com/private_files/lf30_zL4sS7.json"  background="transparent"  speed="2"  style="width: 300px; height: 300px;"  loop  autoplay></lottie-player>');
                $(`.match-${index} > .match-info > #status`).html(`${roundName(fixture.league.round)}`)
                if (! matchValid(fixture)[0]){ //check if score can be displayed (ie match is/has been played)
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

function createTr(index,desc){ //create one row in table (for league table)
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

function rowColour(desc){ //colour row in league table according to promotion/relegation
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

function biggestScore(score1, score2){ //returns the bigger score given 2 scorelines
    let array1 = [0,0];
    let array2 = [0,0];
    if (score1 != null){
        array1 = score1.split('-');
    }
    if (score2 != null){
        array2 = score2.split('-');
    }
    let diff1 = Math.abs(array1[0] - array1[1]);
    let diff2 = Math.abs(array2[0] - array2[1]);
    if (diff1 === Math.max(diff1,diff2)){
        return score1;
    }
    else{
        return score2;
    }
}

function populateTable(data, tableId){ //populates league table with data
    $(`#${tableId} > img`).attr("src",data.team.logo)
    $(`#${tableId} > tbody > .gplayed > #home`).html(data.fixtures.played.home);
    $(`#${tableId} > tbody > .gplayed > #away`).html(data.fixtures.played.away);
    $(`#${tableId} > tbody > .gplayed > #total`).html(data.fixtures.played.total);
    $(`#${tableId} > tbody > .wins > #home`).html(data.fixtures.wins.home);
    $(`#${tableId} > tbody > .wins > #away`).html(data.fixtures.wins.away);
    $(`#${tableId} > tbody > .wins > #total`).html(data.fixtures.wins.total);
    $(`#${tableId} > tbody > .draw > #home`).html(data.fixtures.draws.home);
    $(`#${tableId} > tbody > .draw > #away`).html(data.fixtures.draws.away);
    $(`#${tableId} > tbody > .draw > #total`).html(data.fixtures.draws.total);
    $(`#${tableId} > tbody > .loss > #home`).html(data.fixtures.loses.home);
    $(`#${tableId} > tbody > .loss > #away`).html(data.fixtures.loses.away);
    $(`#${tableId} > tbody > .loss > #total`).html(data.fixtures.loses.total);
    $(`#${tableId} > tbody > .for > #home`).html(data.goals.for.total.home);
    $(`#${tableId} > tbody > .for > #away`).html(data.goals.for.total.away);
    $(`#${tableId} > tbody > .for > #total`).html(data.goals.for.total.total);
    $(`#${tableId} > tbody > .against > #home`).html(data.goals.against.total.home);
    $(`#${tableId} > tbody > .against > #away`).html(data.goals.against.total.away);
    $(`#${tableId} > tbody > .against > #total`).html(data.goals.against.total.total);
    $(`#${tableId} > tbody > .csheets > #home`).html(data.clean_sheet.home);
    $(`#${tableId} > tbody > .csheets > #away`).html(data.clean_sheet.away);
    $(`#${tableId} > tbody > .csheets > #total`).html(data.clean_sheet.total);
    $(`#${tableId} > div > h3 > #wstreak`).html(data.biggest.streak.wins);
    $(`#${tableId} > div > h3 > #lstreak`).html(data.biggest.streak.loses);
    $(`#${tableId} > div > h3 > #bwin`).html(biggestScore(data.biggest.wins.home, data.biggest.wins.away));
    $(`#${tableId} > div > h3 > #bloss`).html(biggestScore(data.biggest.loses.home, data.biggest.loses.away));
}
//=================== on load ============================
//general functions
$("#view-table").click(function(){newPage("table.html")});
$("#view-stats").click(function(){newPage("stats2.html")});
$("#h2h-stats").click(function(){newPage("stats3.html")});
//initialise data on load
let dateArray = [];
let matchDict = {};
let matches = 0;
let startDate = Date.now();
let endDate = startDate + 604800000; //endDate is 7 days after startDate
let compId = parseInt(localStorage.getItem("compId"));
let compName = localStorage.getItem("compName");
let results = {};
//hide elements on load
$("#view-table").hide();
$(".no-score").hide();
$(".no-table").hide()
$(".no-goals").hide();
$("ul.top-scorer-list, .top-scorer").hide();
//set default values
if (isNaN(compId)){
    compId = 39;
}
if (compName === null){
    compName = "English Premier League"
}
//populate elements on load
$("header>#compName").html(compName);
$("input").attr("placeholder",`Search from ${compName}`);

//============== nav bar =================
$(".dropdown-item").click(function(){
    let compId = $(this).attr("id");
    let compName = $(this).text();
    localStorage.setItem("compId",compId);
    localStorage.setItem("compName",compName);
    newPage((window.location.href).replace("#",""));
})

//============ index.html ================
var settings = {
    "url": `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${compId}&live=all`, //get live scores from compId
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
next10(dateArray, matchDict, matches, startDate, endDate, compId) //load matches for the week
$("#see-future").click(function(){ //load matches for next week
    startDate += 604800000;
    endDate += 604800000;
    $("section.container.scores > *").remove();
    $(".no-score").hide();
    next10([], {}, 0, startDate, endDate, compId);
})
$("#see-earlier").click(function(){ //load matches for the previous week
    startDate -= 604800000;
    endDate -= 604800000;
    $("section.container.scores > *").remove();
    $(".no-score").hide();
    next10([], {}, 0, startDate, endDate, compId);
})
//============== table.html ==================
var settings = {
    "url": `https://api-football-v1.p.rapidapi.com/v3/standings?league=${compId}&season=2020`, //get league standings for the competition
    "method": "GET",
    "timeout": 0,
    "headers": {
      "x-rapidapi-key": "89f6bb3f0cmshbe238b12b48adb9p15e37bjsnc3cca11640dc"
    },
};
$.ajax(settings).done(function (response) {
    let data = response.response
    if (data.length === 0){ //display animation and hide table if competition has no league table
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
            let grpTable = document.createElement("table"); //create new table for every group in competition
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
            </tr>`); //set table header
            $(`table.standings-${i} > caption`).html(standings[0].group); //caption contains the name of the competition group
            for (let index = 0; index < standings.length; index++) {
                desc = standings[index].description;
                let newTr = createTr(index,desc);
                $(`table.standings-${i} > tbody`).append(newTr); //append newTr and populate it
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
    "url": `https://api-football-v1.p.rapidapi.com/v3/players/topscorers?league=${compId}&season=2020`, //get top scorers of compId
    "method": "GET",
    "timeout": 0,
    "headers": {
      "x-rapidapi-key": "89f6bb3f0cmshbe238b12b48adb9p15e37bjsnc3cca11640dc"
    },
};

$.ajax(settings).done(function (response) {
    let data = response.response;
    if (data.length < 10){ //only display top scorers if there are 10 or more
        $(".no-goals").show(); //show no top scorers animation
        $("ul.top-scorer-list, .top-scorer").hide();
    }
    else{
        $(".no-goals").hide();
        $("ul.top-scorer-list, .top-scorer").show();
        let topscorer = data[0];
        let playerName = topscorer.player.name;
        //populate top scorer info
        $(".top-scorer > #scorer-info > #name").text(playerName);
        $(".top-scorer > #scorer-info > #team").text(topscorer.statistics[0].team.name);
        $(".top-scorer > #logo").attr("src", topscorer.statistics[0].team.logo);
        $(".top-scorer > #card-container > .card > img").attr("src",topscorer.player.photo);
        $(".top-scorer > #card-container > .card > img").attr("alt",playerName);
        $(".top-scorer > #card-container > .card > img").attr("title",playerName);
        $(".top-scorer > #card-container > .card > h2 > #goals").text(topscorer.statistics[0].goals.total);
        for (let index = 1; index < 10; index++) { //populate rest of scorers
            let player = data[index];
            $(`#pos-${index+1}.stats-row > #logo`).attr("src",player.statistics[0].team.logo);
            $(`#pos-${index+1}.stats-row > .player > #name`).text(player.player.name);
            $(`#pos-${index+1}.stats-row > .player > #team`).text(player.statistics[0].team.name);
            $(`#pos-${index+1}.stats-row > #stat > #goals`).text(player.statistics[0].goals.total);
        }
    }
});

//================= stats2.hhtml ==============
var settings = {
    "url": `https://api-football-v1.p.rapidapi.com/v3/teams?league=${compId}&season=2020`, //get all teams in compId
    "method": "GET",
    "timeout": 0,
    "headers": {
      "x-rapidapi-key": "89f6bb3f0cmshbe238b12b48adb9p15e37bjsnc3cca11640dc"
    },
};
var dvalue = {};
$.ajax(settings)
.done(function (response) {
    let data = response.response;
    for (let index = 0; index < data.length; index++) { //create option for each team in competition
        let newOption = document.createElement("option");
        newOption.setAttribute("value",data[index].team.name);
        newOption.setAttribute("data-value",data[index].team.id);
        $('datalist').append(newOption);
    };
    $('option').each(function(i, el) {
        dvalue[$(el).val()] = $(el).data("value"); //save option value as key in dictionary, option data-value as value
        //Most browsers only display value property of option, hence the team name is set as such
        //However, we want to process the data-value property, hence we save in it a dictionary
    });
    localStorage.setItem("results", JSON.stringify(dvalue));
});

$("form.search").submit(function(event){
    let value1 = $("input#search").val();
    let value2 = $("input#search1").val();
    let results = JSON.parse(localStorage.getItem("results"));
    let teamId = results[value1];
    let teamId2 = results[value2];
    var settings = {
        "url": `https://api-football-v1.p.rapidapi.com/v3/teams/statistics?league=${compId}&season=2020&team=${teamId}`,
        "method": "GET",
        "timeout": 0,
        "headers": {
          "x-rapidapi-key": "89f6bb3f0cmshbe238b12b48adb9p15e37bjsnc3cca11640dc"
        },
    };
    $.ajax(settings).done(function (response) {
        let data = response.response;
        $("#table-1 > #team-name").text(data.team.name);    
        populateTable(data, "table-1");
    });
    if (value2 != null){
        var settings = {
            "url": `https://api-football-v1.p.rapidapi.com/v3/teams/statistics?league=${compId}&season=2020&team=${teamId2}`,
            "method": "GET",
            "timeout": 0,
            "headers": {
              "x-rapidapi-key": "89f6bb3f0cmshbe238b12b48adb9p15e37bjsnc3cca11640dc"
            },
        };
        $.ajax(settings).done(function (response) {
            let data = response.response;
            $("#table-2 > #team-name").text(data.team.name);    
            populateTable(data, "table-2");
        });
    }
    event.preventDefault();
})