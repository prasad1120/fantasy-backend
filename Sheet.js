class Sheet {
  constructor(url, players) {
    this.ss = SpreadsheetApp.openByUrl(url);
    this.standings = this.ss.getSheets()[0];
    this.chartsSheet = this.ss.getSheets()[1];
    this.scorecard = this.ss.getSheets()[2];
    this.chartColors = [
      {color: '#FFB805', labelInLegend: players[0]}, 
      {color: 'red', labelInLegend: players[1]}, 
      {color: 'blue', labelInLegend: players[2]},
      {color: 'green', labelInLegend: players[3]},
      {color: 'black', labelInLegend: players[4]},
      {color: '#C776B9', labelInLegend: players[5]},
      {color: 'brown', labelInLegend: players[6]}
    ];
  }

  addEntry(matchId, entry) {
    this.scorecard.getRange(matchId + 1, 1, 1, 8).setValues([entry]);
  }

  getNumOfLastMatches() {
    return parseInt(String(this.standings.getRange("D14:D14").getValues()[0]).match(/\d+/));
  }

  getRankInMostRanks() {
    return parseInt(String(this.standings.getRange("D25:D25").getValues()[0]).match(/\d+/));
  }

  getNumOfMatchesDone() {
    return this.scorecard.getRange("B2:B").getValues().filter(String).length;
  }

  getTournamentPlayerData() {
    return this.scorecard.getRange(2, 1, this.getNumOfMatchesDone(), 8).getValues();
  }

  plotTables(stats) {
    this.standings.getRange(4, 6, 7, 2).setValues(stats.playerPts);
    this.standings.getRange(4, 6).setValue(this.standings.getRange(4, 6).getValue() + " 👑");
    this.standings.getRange(27, 4, 7, 2).setValues(stats.mostXRanks);
    this.standings.getRange(16, 1, 7, 2).setValues(stats.numberOfWins);
    this.standings.getRange(27, 1, 7, 2).setValues(stats.avgScores);
    this.standings.getRange(16, 7, 7, 2).setValues(stats.avgRanks);
    this.standings.getRange(16, 10, 7, 2).setValues(stats.matchesMissed);
    this.standings.getRange(16, 4, 7, 2).setValues(stats.last5Matches);
  }

  plotChart(cumulativePtsTable, players) {
    this.chartsSheet.getRange(100, 1, this.getNumOfMatchesDone(), 8).setValues(cumulativePtsTable);
    this.chartsSheet.getRange(99, 2, 1, 7).setValues([players]);
    
    var charts = this.chartsSheet.getCharts();
    for (var i in charts) {
      this.chartsSheet.removeChart(charts[i]);
    }
    
    var standingsChart = this.chartsSheet.newChart()
    .setPosition(1, 1, 0, 0)
    .setChartType(Charts.ChartType.LINE)
    .addRange(this.chartsSheet.getRange(99, 1, this.getNumOfMatchesDone() + 1, 8))
    .setOption('title', 'Standings Overtime')
    .setOption('hAxis', {title: 'Matches'})
    .setOption('series', this.chartColors)
    .setOption('height', 700)
    .setOption('width', 1100)
    .build();

    this.chartsSheet.insertChart(standingsChart);
  }
}

