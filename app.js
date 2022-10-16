const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// Get Movie API 1
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `SELECT
      *
    FROM
      player_details     
      ;`;
  const dbResponse = await db.all(getPlayerQuery);
  const objectPlayerArray = dbResponse.map((playername) => {
    return convertDbObjectToResponseObject(playername);
  });
  response.send(objectPlayerArray);
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT
      *
    FROM
      player_details
    WHERE
      player_id = ${playerId};`;
  const dbResponse = await db.get(getPlayerQuery);
  const playerObjectModifed = convertDbObjectToResponseObject(dbResponse);
  response.send(playerObjectModifed);
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updateplayer = `
  update player_details set 
  player_name = '${playerName}'
  where
  player_id = ${playerId};
  
  `;
  const dbResponse = await db.run(updateplayer);
  response.send("Player Details Updated");
});

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT
      *
    FROM
      match_details
    WHERE
      match_id = ${matchId};`;
  const dbResponse = await db.get(getMatchQuery);
  const movieObjectModifed = convertDbObjectToResponseObject(dbResponse);
  response.send(movieObjectModifed);
});

//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `SELECT
      *
    FROM
      match_details
    WHERE
      match_id in (select match_id from player_match_score where player_id = ${playerId});
      
      `;
  const dbResponse = await db.all(getMatchQuery);
  const objectMatchArray = dbResponse.map((match) => {
    return convertDbObjectToResponseObject(match);
  });
  response.send(objectMatchArray);
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT
      player_details.player_id as playerId,
      player_details.player_name as playerName
    FROM
      player_details inner join player_match_score on 
      player_details.player_id =  player_match_score.player_id
    WHERE
    player_match_score.match_id = ${matchId};     
      
      `;
  const dbResponse = await db.all(getMatchQuery);

  response.send(dbResponse);
});

//API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `SELECT
      player_details.player_id as playerId,
      player_name as playerName,
      sum(score) as totalScore,
      sum(fours) as totalFours,
      sum(sixes) as totalSixes
    FROM
      player_match_score inner join player_details
      on player_match_score.player_id = player_details.player_id
    WHERE
      player_match_score.player_id = ${playerId};
      
      `;
  const dbResponse = await db.get(getMatchQuery);
  response.send(dbResponse);
});

module.exports = app;
