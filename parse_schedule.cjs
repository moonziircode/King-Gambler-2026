const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, 'matches_raw.txt'), 'utf-8');
const lines = raw.split('\n');

const matches = [];
let currentRound = "Group Stage";

lines.forEach((line) => {
  line = line.trim();
  if (!line) return;

  if (line.match(/^(Putaran|Babak|Perempat|Semi|Finals)/i) || line.match(/Round of /i)) {
    currentRound = line;
  } else if (line.startsWith('-')) {
    const parts = line.replace(/^- /, '').split(' | ');
    const datetimeStr = parts[0] ? parts[0].trim() : '';
    const teamsStr = parts[1] ? parts[1].trim() : 'TBC vs TBC';
    const stadium = parts[2] ? parts[2].trim() : '';

    const [teamA, teamB] = teamsStr.split(' vs ');

    const dateObj = new Date(datetimeStr);
    const kickoffTime = dateObj.getTime();

    matches.push({
      id: `match-${matches.length+1}`,
      teamA: teamA ? teamA.trim() : 'TBC',
      teamB: teamB ? teamB.trim() : 'TBC',
      flagA: "",
      flagB: "",
      date: dateObj.toISOString(),
      kickoffTime,
      stadium,
      status: "scheduled",
      scoreA: null,
      scoreB: null,
      round: currentRound
    });
  }
});

fs.mkdirSync(path.join(__dirname, 'src', 'data'), {recursive: true});
fs.writeFileSync(path.join(__dirname, 'src', 'data', 'matches.json'), JSON.stringify(matches, null, 2));
console.log("Parsed", matches.length, "matches.");
