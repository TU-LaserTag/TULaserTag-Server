const knex = require('knex')({
    client: 'pg',
    connection: {
        host: 'localhost',
        user: 'lasertagger',
        password: 'GetBlasted?',
        database: 'postgres'
    }
});

const objection = require('objection');
const Model = objection.Model;
Model.knex(knex);

const Game = require('./models/Game');
const Player = require('./models/Player');
const Team = require('./models/Team');
const Stats = require('./models/Stats');
const League = require('./models/League');
const Assignment = require('./models/Assignment');
const Contest = require('./models/Contest');
const Individual = require('./models/Individual');
const Hit = require('./models/Hit');

const Hapi = require('@hapi/hapi');
const Joi = require('@hapi/joi');

function createDate() {
    var date = new Date();

    year = date.getFullYear();

    month = date.getMonth() + 1;
    if (month < 9) {
        month = "0" + (month);
    }

    day = date.getDate();
    if (day < 9) {
        day = "0" + day;
    }

    hour = date.getHours();
    if (hour < 9) {
        hour = "0" + hour;
    }

    minute = date.getMinutes();
    if (minute < 9) {
        minute = "0" + minute;
    }

    second = date.getSeconds();
    if (second < 9) {
        second = "0" + second;
    }

    return {date: year + "-" + month + "-" + day, time: hour + ":" + minute + ":" + second};
}

const init = async () => {
	const server = Hapi.server({
		host: 'localhost',
		port: 3000,
		routes: {
			cors: true
		}
	});
	
	await server.register({plugin: require('blipp'), options: {showAuth: true}});
	
	await server.register({plugin: require('hapi-pino'), options: {prettyPrint: true}});
	
	server.route([
        {
            method: 'GET',
            path: '/player/{username}/{password}', //possibly no password? Need secure way to transmit.
            config: {
                description: "Sign-in to server"
            },
            handler: async (request, h) => {
                const facts = await Player.query().where('username', request.params.username).andWhere('password', request.params.password);

                if (facts.length == 1) {
                    return {ok: true, body: facts, message: "Success!"}
                }
                else {
                    return {ok: false, message: "Incorrect username or password"};
                }
            }
        },

		{
            method: 'POST',
            path: '/player',
            config: {
                description: "Sign-up for the server",
                validate: {
                    payload: Joi.object({
                        username: Joi.string().required(),
                        password: Joi.string().required()
                    })
                }
            },
            handler: async (request, h) => {
                const user = await Player.query().where('username', request.payload.username);
                if (user.length == 0) {
                    const newPlayer = await Player.query().insert(request.payload);
                    if (newPlayer) {
                        return {ok: true, body: newPlayer, message: "Success!"}
                    }
                    else {
                        return {ok: false, message: "Unexpected error. Please try again."}
                    }
                }
                else {
                    return {ok: false, message: "Username already in use. Please try again"}
                }
            }
        },

        {
            method: 'GET',
            path: '/game/{username}',
            config: {
                description: "Get information for the next upcoming match"
            },
            handler: async (request, h) => {
                var date = createDate();
                const games = await Game.query().where('date', '>', date.date).orWhere('date', '=', date.date).andWhere('starttime', '>', date.time).orderBy(['date','starttime']).withGraphFetched('teams.players').withGraphFetched('individuals');

                if ((!games)||games.length == 0) {
                    return {ok: false, message: "No future games found at this time"};
                }

                const nextGame = games[0];
                num_teams = nextGame.num_teams;

                if (num_teams == 0) {
                    return {ok: true, game: nextGame, team: null,needColor: true, needName: false}
                }
                team_index = -1;
                teams = nextGame.teams;
                if (nextGame.team_selection == "manual") {
                    //search for person
                    for (var i = 0; i < teams.length; i++) {
                        for (var j = 0; j < player_list.length; j++) {
                            if (player_list[j].username == request.params.username) {
                                team_index = i;
                            }
                        }
                    }
                    if (team_index == -1) {
                        await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username, remaining_lives: nextGame.maxLives, style: nextGame.style, num_teams: nextGame.num_teams, team_color: ""})

                        await Game.query().patch({ players_alive: nextGame.players_alive + 1}).where('id',nextGame.id);
                        return {ok: true, game: nextGame, team: null, needColor: false, needName: false}
                    }
                }

                else {
                    team_index = -1;
                    minPlayerTeamIndex = 0;
                    minPlayers = teams[0].players.length;
                    
                    for (var i = 0; i < teams.length; i++) {
                        player_list = teams[i].players;
                        if (player_list.length < minPlayers) {
                            minPlayerTeamIndex = i;
                            minPlayers = player_list.length;
                        }

                        else if (player_list.length == minPlayers && Math.random() < (1/teams.length)) {
                            minPlayerTeamIndex = i;
                            minPlayers = player_list.length;
                        }

                        for (var j = 0; j < player_list.length; j++) {
                            if (player_list[j].username == request.params.username) {
                                team_index = i;
                            }
                        }
                    }

                    if (team_index == -1) {
                        if (teams.length < num_teams) {
                            return {ok: true, game: nextGame, team: null,needColor: true, needName: true}
                        }
                        await Assignment.query().insert({team_id: teams[minPlayerTeamIndex].id, player_username: request.params.username})
                        team_index = minPlayerTeamIndex;
                    }
                }
                //create stats column for player if needed
                const stats = await Stats.query().where('game_id', nextGame.id).andWhere('player_username', request.params.username);
                if (stats.length == 0) {
                    await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username, remaining_lives: nextGame.maxLives, style: nextGame.style, num_teams: nextGame.num_teams, team_color: teams[team_index].color});
                    //place player into game as an alive person
                    await Game.query().patch({ players_alive: nextGame.players_alive + 1}).where('id',nextGame.id);
                }
                else if (nextGame.team_selection == "manual") {
                    await Stats.query().patch({team_color: teams[team_index].color});
                }
                return {ok: true, game: nextGame, team: teams[team_index], needColor: false, needName: false};
            }
        },

        {
            method: 'GET',
            path: '/team/checkup/{username}/{team_id}/{game_id}',
            config: {
                description: "Check if team has changed before the upcoming match"
            },
            handler: async (request, h) => {
                team_id = -1;
                const currentGame = await Game.query().where('id', request.params.game_id).withGraphFetched('teams.players').first();
                teams = currentGame.teams;
                for (var i = 0; i < teams.length; i++) {
                    player_list = teams[i].players;
                    for (var j = 0; j < player_list.length; j++) {
                        if (player_list[j].username == request.params.username) {
                            team_id = teams[i].id;
                        }
                    }
                }
                var change = (team_id == request.params.team_id) ? false : true;
                var team = (change) ? team_id : request.params.team_id;
                return {change: change, team_id: teams[team]};
            }
        },

        {
            method: 'GET',
            path: '/game/code/{code}/{username}',
            config: {
                description: "Get information for a certain upcoming match"
            },
            handler: async (request, h) => {
                var date = createDate();
                const games = await Game.query().where('code', request.params.code).where('date', '>', date.date).orWhere('date', '=', date.date).andWhere('starttime', '>', date.time).withGraphFetched('teams.players').withGraphFetched('individuals');
               
                if ((!games)||games.length == 0) {
                    return {ok: false, message: "No future games found at this time"};
                }

                const nextGame = games[0];
                num_teams = nextGame.num_teams;

                if (num_teams == 0) {
                    return {ok: true, game: nextGame, team: null,needColor: true, needName: false}
                }
                team_index = -1;
                teams = nextGame.teams;
                if (nextGame.team_selection == "manual") {
                    //search for person
                    for (var i = 0; i < teams.length; i++) {
                        for (var j = 0; j < player_list.length; j++) {
                            if (player_list[j].username == request.params.username) {
                                team_index = i;
                            }
                        }
                    }
                    if (team_index == -1) {
                        await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username, remaining_lives: nextGame.maxLives, style: nextGame.style, num_teams: nextGame.num_teams, team_color: ""});
                        await Game.query().patch({ players_alive: nextGame.players_alive + 1}).where('id',nextGame.id);
                        return {ok: true, game: nextGame, team: null, needColor: false, needName: false}
                    }
                }

                else {
                    team_index = -1;
                    minPlayerTeamIndex = 0;
                    minPlayers = teams[0].players.length;
                    
                    for (var i = 0; i < teams.length; i++) {
                        player_list = teams[i].players;
                        if (player_list.length < minPlayers) {
                            minPlayerTeamIndex = i;
                            minPlayers = player_list.length;
                        }

                        else if (player_list.length == minPlayers && Math.random() < (1/teams.length)) {
                            minPlayerTeamIndex = i;
                            minPlayers = player_list.length;
                        }

                        for (var j = 0; j < player_list.length; j++) {
                            if (player_list[j].username == request.params.username) {
                                team_index = i;
                            }
                        }
                    }

                    if (team_index == -1) {
                        if (teams.length < num_teams) {
                            return {ok: true, game: nextGame, team: null,needColor: true, needName: true}
                        }
                        await Assignment.query().insert({team_id: teams[minPlayerTeamIndex].id, player_username: request.params.username})
                        team_index = minPlayerTeamIndex;
                    }
                }
                //create stats column for player if needed
                const stats = await Stats.query().where('game_id', nextGame.id).andWhere('player_username', request.params.username);
                if (stats.length == 0) {
                    await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username, remaining_lives: nextGame.maxLives, style: nextGame.style, num_teams: nextGame.num_teams, team_color: teams[team_index].color});
                    //place player into game as an alive person
                    await Game.query().patch({ players_alive: nextGame.players_alive + 1}).where('id',nextGame.id);
                }
                else if (nextGame.team_selection == "manual") {
                    await Stats.query().patch({team_color: teams[team_index].color});
                }
                return {ok: true, game: nextGame, team: teams[team_index], needColor: false, needName: false};
            }
        },

        {
            method: 'GET',
            path: '/checkin/{id}',
            config: {
                description: "Confirm information for a certain upcoming match or get the information for a match"
            },
            handler: async (request, h) => {
                const game = await Game.query().where('id',request.params.id);
                if (game.length == 1) {
                    return {ok: true, body: game};
                }
                else {
                    return {ok: false, message: "Invalid game id"};
                }
            }
        },

        {
            method: 'POST',
            path: '/color/{username}',
            config: {
                description: "Create new team/individual for the next upcoming match",
                validate: {
                    payload: Joi.object({
                        color: Joi.string().required(),
                        name: Joi.string().allow("").required(),
                        game: Joi.object().required()
                    })
                }
            },
            handler: async (request, h) => {
                const sameName = await Team.query().where('name',request.payload.name);
                if (sameName.length > 0) {
                    return {ok: false, message: "Duplicate name. Please fill out a different name."};
                }
                game = request.payload.game;
                username = request.params.username;
                
                const stats = await Stats.query().where('game_id', game.id).andWhere('player_username', username);
                if (stats.length == 0) {
                    await Stats.query().insert({game_id: game.id, player_username: request.params.username, remaining_lives: game.maxLives, style: game.style, num_teams: game.num_teams, team_color: teams[team_index].color})
                    //place player into game as an alive person
                    await Game.query().patch({players_alive: game.players_alive + 1}).where('id', game.id);
                }
                else {
                    await Stats.query().patch({game_id: game.id, player_username: request.params.username, remaining_lives: game.maxLives, style: game.style, num_teams: game.num_teams, team_color: teams[team_index].color})
                }

                if (game.num_teams == 0) {
                    player_index = -1;
                    for (var i = 0; i < game.individuals.length; i++) {
                        if (game.individuals[i].username == username) {
                            player_index = i;
                            break;
                        }
                    }

                    if (player_index == -1) {
                        const solo = await Individual.query().insert({game_id: game.id, color: request.payload.color, player_username: username});

                        return {ok: true, game: game, team: solo, needColor: false, needName: false};
                    }
                    else {
                        await Individual.query().update({color: request.payload.color}).where('player_username', username);
                        const solo = await Individual.query().where('player_username', username);

                        return {ok: true, game: game, team: solo, needColor: false, needName: false};
                    }
                }
                else {
                    const createdTeam = await Team.query().insert({name: request.payload.name, color: request.payload.color});
                    await Contest.query().insert({game_id: game.id, team_id: createdTeam.id});
                    await Assignment.query().insert({team_id: createdTeam.id, player_username: username});

                    return {ok: true, game: game, team: createdTeam, needColor: false, needName: false};
                }
            }
        },

        {
            method: 'GET',
            path: '/fire/team/{username}/{game_id}/{timestamp}/{rounds_fired}',
            config: {
                description: 'Method called after a blaster fires to get information about damage done'
            },
            handler: async (request,h) => {
                // get data from user's stats page
                const userStats = await Stats.query().where('player_username', request.params.username).andWhere('game_id', request.params.game_id);

                // get data from hits recorded on hits page
                const hitStats = await Hit.query().where('game_id', request.params.game_id).andWhere('person_shooting', request.params.username).andWhere('time', '>', request.params.timestamp);
                
                var hits = {};
                var kills = {};
                // place data into two arrays
                for (var i = 0; i < hitStats.length; i++) {
                    if (hitStats[i].kill) {
                        kills[hitStats[i].person_hit] = hitStats[i].team_person_hit;
                    }
                    else hits[hitStats[i].person_hit] = hitStats[i].team_person_hit;
                }
                // update number of rounds fired
                await Stats.query().patch({rounds_fired: userStats.rounds_fired+request.params.rounds_fired}).where('id',userStats.id);

                game_over = false //IMPLEMENT THIS SOON
                
                // return data to user
                return {hits: userStats.hits, kills: userStats.kills, points: userStats.points, hitDictionary: {hits: hits, kills: kills}, game_over: game_over}
            }
        },

        {
            method: 'GET',
            path: '/fire/solo/{username}/{game_id}/{timestamp}/{rounds_fired}',
            config: {
                description: 'Method called after a blaster fires to get information about damage done'
            },
            handler: async (request,h) => { //TODO make these a Game eager in both directions?
                // get data from user's stats page
                const userStats = await Stats.query().where('player_username', request.params.username).andWhere('game_id', request.params.game_id);
                // get data from hits recorded on hits page
                const hitStats = await Hit.query().where('game_id', request.params.game_id).andWhere('person_shooting', request.params.username).andWhere('time', '>', request.params.timestamp);
                var hits = [];
                var kills = [];
                // obtain data on who has been hit
                for (var i = 0; i < hitStats.length; i++) {
                    if (hitStats[i].kill) {
                        kills.push(hitStats[i].person_hit);
                    }
                    else{
                        hits.push(hitStats[i].person_hit);
                    }
                }
                // update number of rounds fired
                await Stats.query().patch({rounds_fired: userStats.rounds_fired + request.params.rounds_fired}).where('id',userStats.id);
                
                game_over = false //IMPLEMENT THIS SOON

                // return data to user
                return {hits: userStats.hits, kills: userStats.kills, points: userStats.points, hitDictionary: {hits: hits, kills: kills}, game_over: game_over}
            }
        },

        {
            method: 'POST',
            path: '/hit/team',
            config: {
                description: 'Path called to indicate a hit and the appropriate response',
                validate: {
                    username: Joi.string().required(),
                    hit_id: Joi.integer().required(),
                    game_id: Joi.integer().required(),
                    timestamp: Joi.string().required(),
                    long_shot: Joi.boolean().required()
                }
            },
            handler: async (request, h) => {
                // get current status of game
                const gameStats = await Game.query().where('id',request.payload.game_id).withGraphFetched('teams.players').withGraphFetched('stats').first();

                // instantiate variables
                var user_id = -1;
                var die = false;
                var livesLeft = 0;
                var teamName = ""
                var teamColor = "";
                var opposingTeamName = "";
                var hitman = "";
                var hitmanId = -1;
                var others_killed = [];
                var currentPoints = 0;
                var pointIncrease = 5;
                var lastPersonDead = true;
                var teamsLeft = gameStats.teams_alive;
                var winner = "";

                //searches teams and players involved in the game
                for (var i = 0; i < gameStats.teams.length; i++) {
                    for (var j = 0; j < gameStats.teams[i].players.length; j++) {
                        if (gameStats.teams[i].players[j].id == hit_id) {
                            //finds team name of person who shot
                            opposingTeamName = gameStats.teams[i].name;
                            //finds name of person who shot
                            hitman = gameStats.teams[i].players[j].username;
                        }
                        else if (gameStats.teams[i].players[j].username == request.payload.username) {
                            //finds team name of person who got shot
                            teamName = gameStats.teams[i].name;
                            //finds team color of person who got shot
                            teamColor = gameStats.teams[i].color;
                        }
                    }
                }

                // if friendly fire, no reason to do anything
                if (teamName == opposingTeamName) {
                    return {ok: false, message: "Friendly fire"};
                }

                //searches stats associated with the game
                for (var i = 0; i < gameStats.stats.length; i++) {
                    if (gameStats.stats[i].player_username == request.payload.username) {
                        //retrieves id of stats object about player who got shot
                        user_id = gameStats.stats[i].id;
                        //analyzes lives left and determines whether player is now dead or not
                        livesLeft = gameStats.stats[i].remaining_lives;
                        if (livesLeft == 1) {
                            die = true;

                        }
                    }
                    else if (gameStats.stats[i].player_username == hitman) {
                        //obtains id of person who shot user
                        hitmanId = gameStats.stats[i].id;
                        //obtains list of people the shooter has already killed
                        others_killed = gameStats.stats[i].players_killed;
                        //obtains current points the shooter has
                        currentPoints = gameStats.stats[i].points;
                    }
                    // checks if there are still people on the same team alive
                    else if (gameStats.stats[i].team_color == teamColor && gameStats.stats[i].alive) {
                        lastPersonDead = false;
                    }
                }
                //set shooter's points to correct amount
                if (die) pointIncrease = 15;
                else if (long_shot) pointIncrease = 10;

                // update the user's statistics to reflect the hit
                await Stats.query().patch({remaining_lives: livesLeft-1, alive: !die}).where('id', user_id);

                // if user died, update respective items
                if (die) {
                    //NEED TO TEST THIS TO ENSURE THAT IT WORKS

                    // update shooter's statistics and points
                    await Stats.query().patch({points: currentPoints + pointIncrease, players_killed: others_killed.unshift(request.payload.username)}).where('id', hitmanId);
                    
                    // if the person was the last on their team to die, one less team is now in the game
                    if (lastPersonDead) teamsLeft--;
                    // if there is now one team left, that must be the winning team
                    if (teamsLeft == 1) winner = opposingTeamName;

                    // send necessary info to database game table
                    await Game.query().patch({players_alive: gameStats.players_alive-1, teams_alive: teamsLeft, winner: winner}).where('id', gameStats.id);
                }
                // update Hit table with the appropriate information
                await Hit.query().insert({game_id: request.payload.game_id, time: request.payload.timestamp, person_shooting: hitman, person_hit: request.payload.username, team_person_shooting: opposingTeamName, team_person_hit: teamName, kill: die});

                // update user with information about shooter
                return {ok: true, shooter: hitman, shooter_team: opposingTeamName};
            }
        },

        {
            method: 'POST',
            path: '/hit/solo',
            config: {
                description: 'Path called to indicate a hit and the appropriate response',
                validate: {
                    username: Joi.string().required(),
                    hit_id: Joi.integer().required(),
                    game_id: Joi.integer().required(),
                    timestamp: Joi.string().required(),
                    long_shot: Joi.boolean().required()
                }
            },
            handler: async (request, h) => {
                const gameStats = await Game.query().where('id',request.params.game_id).withGraphFetched('individuals').withGraphFetched('stats').first();
                var user_id = -1;
                var die = false;
                var livesLeft = 0;
                var teamName = ""
                var opposingTeamName = "";
                var hitman = "";
                var hitmanId = -1;
                var others_killed = [];
                var currentPoints = 0;
                var pointIncrease = 5;
                var winner = ""

                //searches teams and players involved in the game
                for (var i = 0; i < gameStats.individuals.length; i++) {
                    if (gameStats.teams[i].players[j].id == hit_id) {
                        //finds name of person who shot
                        hitman = gameStats.teams[i].players[j].username;
                    }
                }

                //searches stats associated with the game
                for (var i = 0; i < gameStats.stats.length; i++) {
                    if (gameStats.stats[i].player_username == request.params.username) {
                        //retrieves id of stats object about player who got shot
                        user_id = gameStats.stats[i].id;
                        //analyzes lives left and determines whether player is now dead or not
                        livesLeft = gameStats.stats[i].remaining_lives;
                        if (livesLeft == 1) {
                            die = true;
                        }
                    }
                    else if (gameStats.stats[i].player_username == hitman) {
                        //gets id of stats object for shooter
                        hitmanId = gameStats.stats[i].id;
                        //gets array of players killed by shooter
                        others_killed = gameStats.stats[i].players_killed;
                        //obtains current points the shooter has
                        currentPoints = gameStats.stats[i].points;
                    }
                }
                //update points that shooter will obtain
                if (die) pointIncrease = 15;
                else if (long_shot) pointIncrease = 10;

                // update user's stats
                await Stats.query().patch({remaining_lives: livesLeft-1, alive: !die}).where('id', user_id);
                // if the user died
                if (die) {
                    //NEED TO TEST THIS TO ENSURE THAT IT WORKS
                    //update shooter's stats
                    await Stats.query().patch({players_killed: others_killed.unshift(request.params.username), points: currentPoints + pointIncrease}).where('id', hitmanId);
                    
                    //if the player was the last one left and has died, the winner must be the shooter
                    if (gameStats.players_alive == 2) {
                        winner = hitman
                    }
                    
                    //update game table
                    await Game.query().patch({players_alive: gameStats.players_alive-1, winner: winner}).where('id', gameStats.id);
                }
                // update Hit table
                await Hit.query().insert({game_id: request.params.game_id, time: request.params.timestamp, person_shooting: hitman, person_hit: request.params.username, team_person_shooting: opposingTeamName, team_person_hit: teamName, kill: die});
                
                //return shooter info to user
                return {ok: true, shooter: hitman, shooter_team: opposingTeamName};
            }
        }
    ]);

    await server.start();
};

process.on('unhandledRejection', err => {
    console.error(err);
    process.exit(1);
});

init();