var pointsMap;
var config;
var data;
var sheet;
let NO_OF_LAST_MATCHES = 5;
let RANK_IN_MOST_RANKS = 2;
var players;
var stats = {
  playerPts: {},
  numberOfWins: {},
  avgRanks: {},
  avgScores: {},
  matchesMissed: {},
  last5Matches: {},
  mostXRanks: {}
};
var matchPts = {};
var cumulativePtsTable = [];
var numberOfMatchesDone = 0;
var tournamentPlayerData;


function init(version) {
  players = ["Ninad", "Prasad", "Siddhant", "Shubham S", "Shubham V", "Aditya", "Daivat"];
  config = new Config();
  data = new Data();
  sheet = new Sheet(data.versions[version].sheetsUrl, players);

  pointsMap = data.versions[version].pointsMap;
  
  for (var statTable in stats) {
    players.forEach(function(player) {
      stats[statTable][player] = 0;
    });
  }

  players.forEach(function(player) {
    matchPts[player] = 0;
  });
}

function test() {
  doPost({parameter: { action: 'onEdit', version: 'IPL 2021'}})
}

function doPost(e){
  try {
    init(e.parameter.version);
    var action = e.parameter.action;
    
    switch (action) {
      case 'addEntry':
        return addEntry(e);
      case 'getSchedule':
        let jsonToSend = {
          "matches": data.versions[e.parameter.version].scheduleJson,
          "noOfMatchesScoresUploaded": sheet.getNumOfMatchesDone()
        };
        return ContentService.createTextOutput(JSON.stringify(jsonToSend)).setMimeType(ContentService.MimeType.TEXT);
      case 'onEdit':
        onEdit();
        return ContentService.createTextOutput('Sheet Updated!');
    }
  } catch(err) {
    return ContentService.createTextOutput(err);
  }
}

function addEntry(e) {
  var matchId = parseInt(e.parameter.matchId);
  var matchInfo = e.parameter.info;
  var entry = [matchInfo, e.parameter.t1, e.parameter.t2, e.parameter.t3, e.parameter.t4, e.parameter.t5, e.parameter.t6, e.parameter.t7];
  
  sheet.addEntry(matchId, entry)

  onEdit()
  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}

function onEdit() {
  NO_OF_LAST_MATCHES = sheet.getNumOfLastMatches();
  RANK_IN_MOST_RANKS = sheet.getRankInMostRanks();
  numberOfMatchesDone = sheet.getNumOfMatchesDone();
  tournamentPlayerData = sheet.getTournamentPlayerData();

  calcPlayerPts();
  setStandings();
  sheet.plotChart(cumulativePtsTable, players);
}

function calcPlayerPts() {
  for(var i = 0; i<tournamentPlayerData.length; i++) { 
    
    if (tournamentPlayerData[i][1] == -1) {
      tournamentPlayerData.splice(parseInt(i), 1);
      numberOfMatchesDone--;
      i--;
      continue;
    }
    
    var tmp = 1;
    for (key in matchPts) {
      matchPts[key] = tournamentPlayerData[i][tmp];
      tmp++;
    }
    
    var sortedMatchPts;
    sortedMatchPts = Object.keys(matchPts).map(function(key) {
      return [key, matchPts[key]];
    });
  
    sortedMatchPts.sort(function(first, second) {
        return second[1] - first[1];
    });
  
    stats.numberOfWins[sortedMatchPts[0][0]]++;
    stats.mostXRanks[sortedMatchPts[RANK_IN_MOST_RANKS - 1][0]]++;
    
    var arr = [("#" + (i+1))];
    for (var j = 0; j < sortedMatchPts.length; j++) {
      if (sortedMatchPts[j][1] == 0) {
        stats.matchesMissed[sortedMatchPts[j][0]]++;
        stats.avgRanks[sortedMatchPts[j][0]] += 8;
        stats.playerPts[sortedMatchPts[j][0]] += 0;
        arr[players.indexOf(sortedMatchPts[j][0]) + 1] = 0;
      } else {
        stats.avgRanks[sortedMatchPts[j][0]] += getFirstRank(sortedMatchPts, sortedMatchPts[j][1]);
        stats.playerPts[sortedMatchPts[j][0]] += pointsMap[getFirstRank(sortedMatchPts, sortedMatchPts[j][1])];
        arr[players.indexOf(sortedMatchPts[j][0]) + 1] = pointsMap[getFirstRank(sortedMatchPts, sortedMatchPts[j][1])];
      }
      
      stats.avgScores[sortedMatchPts[j][0]] += sortedMatchPts[j][1];
            
      if(i>0) {
        arr[players.indexOf(sortedMatchPts[j][0]) + 1] += cumulativePtsTable[i - 1][players.indexOf(sortedMatchPts[j][0]) + 1];
      }
    }
    cumulativePtsTable.push(arr);
  }
  
  if (cumulativePtsTable.length >= NO_OF_LAST_MATCHES) {
    for (var i = 0; i < Object.keys(stats.last5Matches).length; i++) {
      stats.last5Matches[players[i]] = cumulativePtsTable[cumulativePtsTable.length - 1][i + 1];
      if (cumulativePtsTable.length > NO_OF_LAST_MATCHES) {
        stats.last5Matches[players[i]] -= cumulativePtsTable[cumulativePtsTable.length - NO_OF_LAST_MATCHES - 1][i + 1];
      }
    }
  }
  
  for(var i in stats.avgRanks) {
    stats.avgRanks[i] /= parseFloat(numberOfMatchesDone);
    stats.avgScores[i] /= parseFloat(numberOfMatchesDone);
  }
}

function setStandings() {

  var statsToPlot = {};
  for (statTable in stats) {
    statsToPlot[statTable] = sortTable(stats[statTable], statTable === "avgRanks")
  }

  sheet.plotTables(statsToPlot);
}

function sortTable(items, isAscending) {
  items = Object.keys(items).map(function(key) {
    return [key, items[key]];
  });
  
  items.sort(function(first, second) {
    
    if (first[1] > second[1]) return isAscending ? 1 : -1;
    if (first[1] < second[1]) return isAscending ? -1 : 1;

    if (stats.numberOfWins[first[0]] > stats.numberOfWins[second[0]]) return -1;
    if (stats.numberOfWins[first[0]] < stats.numberOfWins[second[0]]) return 1;

    if (stats.avgRanks[first[0]] > stats.avgRanks[second[0]]) return 1;
    if (stats.avgRanks[first[0]] < stats.avgRanks[second[0]]) return -1;

    if (stats.avgScores[first[0]] > stats.avgScores[second[0]]) return -1;
    if (stats.avgScores[first[0]] < stats.avgScores[second[0]]) return 1;
    
    return 0;
  });

  return items;
}

function getFirstRank(arr, points) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][1] == points) {
      return i + 1;
    }
  }
}

