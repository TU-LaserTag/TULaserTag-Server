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
const Gun = require('./models/Gun');

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
            method: 'GET',
            path: '/players/{game_id}',
            config: {
                description: "Get players associated with a game",
            },
            handler: async (request, h) => {
                const game = await Game.query().where('id', request.params.game_id).withGraphFetched('players').first();
                return game.players;
            }
        },

		{
            method: 'POST',
            path: '/create/player',
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
                    const newPlayer = await Player.query().insertAndFetch(request.payload);
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
            path: '/game',
            config: {
                description: "Get list of upcoming games"
            },
            handler: async (request, h) => {
                return await Game.query().where('date', createDate().date);
            }
        },

        {
            method: 'GET',
            path: '/game/{game_id}/{username}/{mac_address}',
            config: {
                description: "Get information for the next upcoming match"
            },
            handler: async (request, h) => {
                // search for upcoming games
                const games = await Game.query().where('id', request.params.game_id).withGraphFetched('teams.players').withGraphFetched('individuals').withGraphFetched('stats');

                //if no games are found matching the id, return that this is the case
                if ((!games)||games.length == 0) {
                    return {ok: false, message: "No future games found at this time"};
                }

                //set the next game and number of teams
                const nextGame = games[0];
                num_teams = nextGame.num_teams;

                //gets gun associated with mac address
                gun_object = await Gun.query().where('mac_address', mac_address).first();
                gun_id = gun_object.id;

                // individual match: person needs to choose a color before we can continue
                if (num_teams == 0) {
                    // create a stats page for them
                    await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username, remaining_lives: nextGame.maxLives, style: nextGame.style, num_teams: 0, team_color: "", gun_id: gun_id});
                    // return information
                    return {ok: true, game: nextGame, team: null, needColor: true, needName: false}
                }

                // gets teams currently associated with the game
                team_index = -1;
                teams = nextGame.teams;

                // if the admin/host chooses the teams
                if (nextGame.team_selection == "manual") {
                    //search for person in teams
                    for (var i = 0; i < teams.length; i++) {
                        for (var j = 0; j < player_list.length; j++) {
                            if (player_list[j].username == request.params.username) {
                                team_index = i;
                            }
                        }
                    }
                    // if the person is not found
                    if (team_index == -1) {
                        // place a stats object in for them
                        await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username, remaining_lives: nextGame.maxLives, style: nextGame.style, num_teams: nextGame.num_teams, team_color: "", gun_id: gun_id});

                        // fix game by updating players alive, adding player to game
                        await Game.query().patch({ players_alive: nextGame.players_alive + 1}).where('id',nextGame.id);

                        //return the fact that the player has no team, but no other info is needed
                        return {ok: true, game: nextGame, team: null, needColor: false, needName: false, gun_id: gun_id};
                    }
                }
                // if the team placement is automatic
                else {
                    // values to keep track of which team the player has been assigned to, the index of the team with the fewest players, and the fewest amount of players on a team
                    team_index = -1;
                    minPlayerTeamIndex = 0;
                    minPlayers = teams[0].players.length;
                    
                    // loops through teams
                    for (var i = 0; i < teams.length; i++) {

                        // finds player list for each team
                        player_list = teams[i].players;
                        // if the number of players on a team is fewer than the current minimum, update accordingly
                        if (player_list.length < minPlayers) {
                            minPlayerTeamIndex = i;
                            minPlayers = player_list.length;
                        }
                        // if the number of players is equal to the minimum but a random number decides to swap teams, update accordingly
                        else if (player_list.length == minPlayers && Math.random() < (1/teams.length)) {
                            minPlayerTeamIndex = i;
                            minPlayers = player_list.length;
                        }
                        // goes through player list
                        for (var j = 0; j < player_list.length; j++) {
                            // if the player is already on a team, assign him there as such
                            if (player_list[j].username == request.params.username) {
                                team_index = i;
                            }
                        }
                    }

                    // if no team was assigned to the player
                    if (team_index == -1) {
                        // if not enough people have signed in yet to create new teams and not enough teams have been created yet, let the player create one
                        if (nextGame.stats.length < num_teams && teams.length < num_teams) {
                            await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username, remaining_lives: nextGame.maxLives, style: nextGame.style, num_teams: nextGame.num_teams, team_color: "", gun_id: gun_id});
                            // increases players alive in game
                            await Game.query().patch({ players_alive: nextGame.players_alive + 1}).where('id',nextGame.id);
                            return {ok: true, game: nextGame, team: null, needColor: true, needName: true, gun_id: gun_id}
                        }
                        // assigns player to the team with the fewest number of players
                        await Assignment.query().insert({team_id: teams[minPlayerTeamIndex].id, player_username: request.params.username})
                        team_index = minPlayerTeamIndex;
                    }
                }

                //create stats column for player if needed
                const stats = await Stats.query().where('game_id', nextGame.id).andWhere('player_username', request.params.username);
                // if no such column is found
                if (stats.length == 0) {
                    //create the stats column
                    await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username, remaining_lives: nextGame.maxLives, style: nextGame.style, num_teams: nextGame.num_teams, team_color: teams[team_index].color, gun_id: gun_id});
                    //place player into game as an alive person
                    await Game.query().patch({ players_alive: nextGame.players_alive + 1}).where('id',nextGame.id);
                }
                else {
                    // updates gun_id in case the previous one was faulty
                    await Stats.query().patch({gun_id: gun_id});
                }
                // returns game, team, and gun id
                return {ok: true, game: nextGame, team: teams[team_index], needColor: false, needName: false, gun_id: gun_id};
            }
        },

        {
            method: 'GET',
            path: '/assignedteam/{username}/{game_id}',
            config: {
                description: "Check if team has been assigned yet and get info if it has"
            },
            handler: async (request, h) => {
                var team = null;
                const currentGame = await Game.query().where('id', request.params.game_id).withGraphFetched('teams.players').first();
                const teams = currentGame.teams;

                //finds team that the player is on if player is on a team
                for (var i = 0; i < teams.length; i++) {
                    player_list = teams[i].players;
                    for (var j = 0; j < player_list.length; j++) {
                        if (player_list[j].username == request.params.username) {
                            team = teams[i];
                        }
                    }
                }

                // if player is on a team, update the person's stats page for the game
                if (team) {
                    await Stats.query().patch({team_color: team.color}).where('username', request.params.username).andWhere('game_id', request.params.game_id);
                }
                //return the team information
                return team;
            }
        },

        {
            method: 'GET',
            path: '/checkup/{username}/{game_id}/{color}',
            config: {
                description: "Get final info or changes"
            },
            handler: async (request, h) => {
                var team = null;
                const currentGame = await Game.query().where('id', request.params.game_id).withGraphFetched('teams.players').withGraphFetched('stats').first();
                const teams = currentGame.teams;
                const stats = currentGame.stats;

                // finds the right team that the player is on; does not loop if the game is individuals
                for (var i = 0; i < teams.length; i++) {
                    // gets player list for current team
                    player_list = teams[i].players;
                    // checks if player's name is in the player list
                    for (var j = 0; j < player_list.length; j++) {
                        if (player_list[j].username == request.params.username) {
                            team = teams[i];
                        }
                    }
                }

                // object to store teams of enemies
                enemy_list = {};

                // loop through stats to find enemy players
                for (var k = 0; k < stats.length; k++) {
                    // if the team colors are different, the teams must be different
                    if (stats[k].team_color != request.params.color) {
                        enemy_list[stats[k].gun_id] = enemy_list[k].player_username;
                    }
                }

                // holders for time options
                var time_left = 0;
                var game_length = 0;

                // if the game is locked to players entering, calculate time constraints until game starts
                var locked = currentGame.locked;
                if (locked) {
                    start_time_array = currentGame.starttime.split(":");
                    end_time_array = currentGame.endtime.split(":");
                    current_time_array = createDate().time.split(":");
                    for (var m = 0; m < 3; m++) {
                        //calculates remaining time in seconds until game starts; starts with seconds and goes up to hours
                        time_left += (Math.pow(60, m))*(Number(start_time_array[2-m]) - Number(current_time_array[2-m]));
                        //calculates game length using same method
                        game_length += (Math.pow(60, m))*(Number(end_time_array[2-m]) - Number(start_time_array[2-m]));
                    }
                }
                // if the player is not on a team and the game is a team game, return that something is not ok 
                if (currentGame.num_teams > 0 && !team) {
                    return {ok: false, team: null};
                }

                await Stats.query().patch({remaining_lives: currentGame.remaining_lives, num_teams: currentGame.num_teams, team_color: team.color}).where('player_username',request.params.username).andWhere('game_id',request.params.game_id);

                // returns that everything is ok, game, team, enemy teams, and time until game and game length if possible
                return {ok: true, game: currentGame, team: team, enemy_list: enemy_list, time_left: time_left, game_length: game_length};
            }
        },

        {
            method: 'GET',
            path: '/game/code/{code}/{username}/{mac_address}',
            config: {
                description: "Get information for a certain upcoming match"
            },
            handler: async (request, h) => {
                // get game associated with code
                const games = await Game.query().where('code', request.params.code).andWhere('date', createDate().date).withGraphFetched('teams.players').withGraphFetched('individuals');

                // if said game does not exist, return an error
                if ((!games)||games.length == 0) {
                    return {ok: false, message: "No future games found at this time"};
                }

                // set the next game and number of teams as such
                const nextGame = games[0];
                num_teams = nextGame.num_teams;

                //gets gun associated with mac address
                gun_object = await Gun.query().where('mac_address', mac_address).first();
                gun_id = gun_object.id;

                // individual match: person needs to choose a color before we can continue
                if (num_teams == 0) {
                    // create a stats page for them
                    await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username, remaining_lives: nextGame.maxLives, style: nextGame.style, num_teams: 0, team_color: "", gun_id: gun_id});
                    // return information
                    return {ok: true, game: nextGame, team: null, needColor: true, needName: false}
                }

                //gets teams currently associated with game
                team_index = -1;
                teams = nextGame.teams;

                // if the team placement is manually done by the host or admin
                if (nextGame.team_selection == "manual") {
                    //search for person in teams
                    for (var i = 0; i < teams.length; i++) {
                        for (var j = 0; j < player_list.length; j++) {
                            if (player_list[j].username == request.params.username) {
                                team_index = i;
                            }
                        }
                    }
                    // if the person is not found in the teams
                    if (team_index == -1) {
                        // create a stats page for them
                        await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username, remaining_lives: nextGame.maxLives, style: nextGame.style, num_teams: nextGame.num_teams, team_color: "", gun_id: gun_id});
                        // update the game to have an increased number of players alive
                        await Game.query().patch({ players_alive: nextGame.players_alive + 1}).where('id',nextGame.id);
                        // returns nothing needed, but no team assigned yet
                        return {ok: true, game: nextGame, team: null, needColor: false, needName: false, gun_id: gun_id}
                    }
                }
                // if the team placement is automatic
                else {
                    // values to keep track of which team the player has been assigned to, the index of the team with the fewest players, and the fewest amount of players on a team
                    team_index = -1;
                    minPlayerTeamIndex = 0;
                    minPlayers = teams[0].players.length;
                    
                    // loops through teams
                    for (var i = 0; i < teams.length; i++) {

                        // finds player list for each team
                        player_list = teams[i].players;
                        // if the number of players on a team is fewer than the current minimum, update accordingly
                        if (player_list.length < minPlayers) {
                            minPlayerTeamIndex = i;
                            minPlayers = player_list.length;
                        }
                        // if the number of players is equal to the minimum but a random number decides to swap teams, update accordingly
                        else if (player_list.length == minPlayers && Math.random() < (1/teams.length)) {
                            minPlayerTeamIndex = i;
                            minPlayers = player_list.length;
                        }
                        // goes through player list
                        for (var j = 0; j < player_list.length; j++) {
                            // if the player is already on a team, assign him there as such
                            if (player_list[j].username == request.params.username) {
                                team_index = i;
                            }
                        }
                    }

                    // if no team was assigned to the player
                    if (team_index == -1) {
                        // if not enough people have signed in yet to create the teams and not enough teams have been created yet, let the player create one
                        if (nextGame.stats.length < num_teams && teams.length < num_teams) {
                            await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username, remaining_lives: nextGame.maxLives, style: nextGame.style, num_teams: nextGame.num_teams, team_color: "", gun_id: gun_id});
                            // increases players alive in game
                            await Game.query().patch({ players_alive: nextGame.players_alive + 1}).where('id',nextGame.id);
                            return {ok: true, game: nextGame, team: null, needColor: true, needName: true, gun_id: gun_id}
                        }
                        // assigns player to the team with the fewest number of players
                        await Assignment.query().insert({team_id: teams[minPlayerTeamIndex].id, player_username: request.params.username})
                        team_index = minPlayerTeamIndex;
                    }
                }

                // check if player has a stats column associated yet with the game
                const stats = await Stats.query().where('game_id', nextGame.id).andWhere('player_username', request.params.username);
                // if no stats page has been created yet
                if (stats.length == 0) {
                    // put a stats page in for the person
                    await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username, remaining_lives: nextGame.maxLives, style: nextGame.style, num_teams: nextGame.num_teams, team_color: teams[team_index].color, gun_id: gun_id});
                    //update players alive in game
                    await Game.query().patch({ players_alive: nextGame.players_alive + 1}).where('id',nextGame.id);
                }
                // update gun_id if id was faulty
                else {
                    await Stats.query().patch({gun_id: gun_id});
                }
                // returns game, team, and gun id
                return {ok: true, game: nextGame, team: teams[team_index], needColor: false, needName: false, gun_id: gun_id};
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
                // get the game from the payload
                game = request.payload.game;

                // check for conflicting names or colors - return an error if this is true 
                // TEST COMBINED QUERY
                const sameName = await Team.query().where('name', request.payload.name).orWhere('color',request.payload.color).andWhere('game_id', game.id);
                // const sameColor = await Team.query().where('color',request.payload.color).andWhere('game_id', game.id);
                if (sameName.length > 0) { //|| sameColor.length > 0) {
                    return {ok: false, message: "Duplicate name and/or color."};
                }

                // get the username
                username = request.params.username;
                
                // ensure the Stats object for the player is updated accordingly
                await Stats.query().patch({team_color: teams[team_index].color}).where('game_id', game.id).andWhere('player_username', username);

                // if an individual game
                if (game.num_teams == 0) {
                    player_id = -1;
                    // ensure the individual is signed up for the game
                    for (var i = 0; i < game.individuals.length; i++) {
                        if (game.individuals[i].username == username) {
                            player_id = i;
                            break;
                        }
                    }

                    // if he is not
                    if (player_id == -1) {
                        // sign him up
                        await Individual.query().insert({game_id: game.id, color: request.payload.color, player_username: username});
                        // return information
                        return {ok: true, game: game, team: null, needColor: false, needName: false};
                    }
                    // otherwise
                    else {
                        // make sure info is correct
                        await Individual.query().update({color: request.payload.color}).where('player_username', username).andWhere('game_id',game.id);
                        // return information
                        return {ok: true, game: game, team: null, needColor: false, needName: false};
                    }
                }
                // otherwise we have a team match
                else {
                    // create the new team
                    const createdTeam = await Team.query().insert({name: request.payload.name, color: request.payload.color});
                    // place team into match and assign player to team
                    await Contest.query().insert({game_id: game.id, team_id: createdTeam.id});
                    await Assignment.query().insert({team_id: createdTeam.id, player_username: username});
                    // return the information
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
                const hitStats = await Hit.query().where('game_id', request.params.game_id).andWhere('person_shooting', request.params.username).andWhere('time', '>=', request.params.timestamp);
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
            options: {
                description: 'Path called to indicate a hit and the appropriate response',
                validate: {
                    payload: Joi.object({
                        username: Joi.string().required(),
                        hit_id: Joi.number().required(),
                        game_id: Joi.number().required(),
                        timestamp: Joi.string().required(),
                        long_shot: Joi.boolean().required()
                    })
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
            options: {
                description: 'Path called to indicate a hit and the appropriate response',
                validate: {
                    payload: Joi.object({
                        username: Joi.string().required(),
                        hit_id: Joi.number().required(),
                        game_id: Joi.number().required(),
                        timestamp: Joi.string().required(),
                        long_shot: Joi.boolean().required()
                    })
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
        },

        {
            method: 'GET',
            path: '/gameover/{username}/{game_id}',
            config: {
                description: 'The path called to check when the game is over to check for the winner, stats, etc.'
            },
            handler: async (request, h) => {
                var gameOver = false;
                var winners = null;
                // gets stats of player and game
                const playerStats = await Stats.query().where('player_username', request.params.username);
                const gameStats = await Game.query().where('id', game_id).first().withGraphFetched('stats');

                // checks to see if a winner has been declared
                if (gameStats.winner) {
                    gameOver = true;
                    winners = gameStats.winners;
                }
                // finds winner(s) if game has ended without one
                else if (gameStats.endtime < createDate().time) {
                    gameOver = true;
                    maxPoints = -1;
                    winners = [];
                    for (var i = 0; i < gameStats.stats.length; i++) {
                        if (gameStats.stats[i].points > maxPoints) {
                            winners = [gameStats.stats[i].player_username];
                            maxPoints = gameStats.stats[i].points;
                        }
                        else if (gameStats.stats[i].points == maxPoints) {
                            winners.push(gameStats.stats[i].username);
                        }
                    };
                    // updates game with winner(s)
                    await Game.query().patch({winner: winners.toString()}).where('id', request.params.game_id);
                }
                // FUTURE TODO: put code in to change wait time until function is called again to check on game results
                return {gameOver: gameOver, winner: winners, gameStats: playerStats};
            }
        },

        { // TODO: change to make leagues work
            method: 'POST',
            path: '/create/team',
            config: {
                description: 'Creates a team',
                validate: {
                    payload: Joi.object({
                        name: Joi.string().allow("").required(),
                        color: Joi.string().allow("").required()
                    })
                }
            },
            handler: async (request, h) => {
                return await Team.query().insert(request.payload);
            }
        },

        { //TODO check whether this actually handles duplicate colors or whether it does not work
            method: 'POST',
            path: '/createbatch/team/{game_id?}',
            config: {
                description: 'Creates many teams at once and creates array to assign them to a game',
                validate: {
                    payload: Joi.array().items(
                        Joi.object({
                            name: Joi.string().allow("").required(),
                            color: Joi.string().allow("").required(),
                            team_id: Joi.number().allow(null).required()
                        }).required()
                    )
                }
            },
            handler: async (request, h) => {
                // these handle creating an id_array and new teams
                id_array = [];
                new_team_array = [];

                // these handle checking for duplicate colors in the creation of teams
                color_array = [];
                var duplicate_color = false;

                // loop through all teams
                for (var i = 0; i < request.payload.length; i++) {
                    // if a color is in the array already, the boolean value is set to true; otherwise, the color is added.
                    if (color_array.includes(request.payload[i].color)) duplicate_color = true;
                    else color_array.push(request.payload[i].color)

                    // if the team exists already, patch it in case changes have been made
                    if (request.payload[i].team_id) {
                        id_array.push({team_id: request.payload[i].team_id, game_id: request.params.game_id});
                        await Team.query().patch({name: request.payload[i].name, color: request.payload[i].color}).where('id', request.payload[i].id)
                    }

                    // if the team does not exist
                    else {
                        new_team_array.push({name: request.payload[i].name, color: request.payload[i].color});
                    }
                }

                // create all new teams at once
                new_teams = await Team.query().insertAndFetch(new_team_array);

                // if there is a game_id, create an array using the id
                if (game_id) {
                    // if there are duplicate colors, we have a problem
                    if (duplicate_color) return {ok: false, message: "Duplicate colors in same game are not allowed."}
                    // otherwise, create the array
                    new_teams.forEach(element => id_array.push({team_id: element.team.id, game_id: request.params.game_id}));  
                    // sends back list of ids and teams ready to go into the Contest table
                    return {ok: true, id_array};            
                }
                else {
                    // if there is no game_id, simply return the new teams created
                    return {ok: true, new_teams};
                }
            }
        },

        { // TODO: change to make leagues work
            method: 'PATCH',
            path: '/change/team/{id}',
            config: {
                description: 'Creates a team',
                validate: {
                    payload: Joi.object({
                        name: Joi.string().allow("").required(),
                        color: Joi.string().allow("").required()
                    })
                }
            },
            handler: async (request, h) => {
                return await Team.query().patch(request.payload).where('id', request.params.id);
            }
        },

        {
            method: 'GET',
            path: '/teams/{game_id}',
            config: {
                description: 'Gets teams and their corresponding players involved in a game'
            },
            handler: async (request, h) => {
                const teams = Game.query().where('id', request.params.game_id).first().withGraphFetched('teams.players');

                return teams.teams;
            }
        },

        {
            method: 'POST',
            path: '/createbatch/assignment',
            config: {
                description: 'Assigns many players to a team',
                validate: {
                    payload: Joi.array().items(
                        Joi.object({
                            team_id: Joi.number().required(),
                            player_username: Joi.string().required()
                        }).required()
                    )
                }
            },
            handler: async (request, h) => {
                return await Assignment.query().insert(request.payload);
            }
        },

        {
            method: 'POST',
            path: '/create/game',
            config: {
                description: 'Creates a game',
                validate: {
                    payload: Joi.object({
                        maxammo: Joi.number().required(),
                        style: Joi.string().required(),
                        timedisabled: Joi.number(),
                        maxlives: Joi.number().positive().required(),
                        pause: Joi.bool(),
                        date: Joi.string().required(),
                        code: Joi.string().allow(""),
                        num_teams: Joi.number().required(),
                        team_selection: Joi.string().required()
                    })
                }
            },
            handler: async (request, h) => {
                return await Game.query().insert(request.payload);
            }
        },

        { //TODO check if return is an issue
            method: 'PATCH',
            path: '/change/game/{id}',
            config: {
                description: 'Changes a game',
                validate: {
                    payload: Joi.object({
                        maxammo: Joi.number().required(),
                        style: Joi.string().required(),
                        timedisabled: Joi.number(),
                        maxlives: Joi.number().positive().required(),
                        pause: Joi.bool(),
                        date: Joi.string().required(),
                        code: Joi.string().allow(""),
                        num_teams: Joi.number().required(),
                        team_selection: Joi.string().required()
                    })
                }
            },
            handler: async (request, h) => {
                return await Game.query().patch(request.payload).where('id',request.params.id).where('locked', false);
            }
        },

        {
            method: 'POST',
            path: '/readylock',
            config: {
                description: 'Locks down and starts a countdown for a game',
                validate: {
                    payload: Joi.object({
                        game_length: Joi.string().required(),
                        id: Joi.number().required(),
                        secs_to_start: Joi.number().required()
                    })
                }
            },
            handler: async (request, h) => {
                // gets information for game
                game = Game.query().where('id', request.payload.id).first().withGraphFetched('teams.players').withGraphFetched('stats').withGraphFetched('individuals');
                // individual game
                if (game.num_teams == 0) {
                    // if the number of people with stats is not equal to the number of people in the game, we have a problem
                    if (game.stats.length != game.individuals.length) {
                        return {ok: false}
                    }
                }
                // team game
                else {
                    var num_of_people = 0; //stores the number of people in the game
                    for (var a = 0; a < game.teams.length; a++) {
                        num_of_people += game.teams[a].players.length;
                    }
                    // if the number of people with stats is not equal to the number of people on teams in the game, we have a problem
                    if (game.stats.length != num_of_people) {
                        return {ok: false};
                    }
                }

                // math to calculate when start time of game is given a countdown
                date = createDate();
                time_array = date.time.split(":");
                game_length_array = request.payload.game_length.split(":");
                end_time_string = "";
                for (var i = 0; i < 2; i++) {
                    // calculates end time of game in hours and minutes
                    end_time_string = end_time_string + (Number(time_array[i]) + Number(game_length_array[i])) + ":";
                }
                //calculates seconds for start and end of games with a thirty second runoff
                end_time_string = end_time_string + (Number(time_array[2]) + Number(game_length_array[2]) + request.payload.secs_to_start);
                start_time_string = time_array[0] + ":" + time_array[1] + ":" + (Number(time_array[2]) + request.payload.secs_to_start);

                //calculates exact number of seconds to start of game
                num_seconds = Number(game_length_array[2]) + Number(game_length_array[1])*60 + Number(game_length_array[0])*3600;
                
                //updates game with exact start and end time and locks game for start
                await Game.query().patch({locked: true, starttime: start_time_string, endtime: end_time_string}).where('id',request.payload.id)

                //returns that everything is good to go and the number of seconds until the start of the game, in case it is different from the seconds requested
                return {ok: true, num_seconds: num_seconds};
            }
        },

        {
            method: 'GET',
            path: '/team/{name}',
            config: {
                description: "Find a team by name"
            },
            handler: async (request, h) => {
                return await Team.query().where('name', request.params.name);
            }
        },

        {
            method: 'GET',
            path: '/team',
            config: {
                description: "Get all teams"
            },
            handler: async (request, h) => {
                return await Team.query();
            }
        },

        {
            method: 'POST',
            path: '/create/contest',
            config: {
                description: 'Assigns a team into a game',
                validate: {
                    payload: Joi.object({
                        game_id: Joi.number().required(),
                        team_id: Joi.number().required()
                    })
                }
            },
            handler: async (request, h) => {
                return await Contest.query().insert(request.payload);
            }
        },

        {
            method: 'POST',
            path: '/createbatch/contest',
            config: {
                description: 'Assigns multiple teams to multiple games at once',
                validate: {
                    payload: Joi.array().items(
                        Joi.object({
                            game_id: Joi.number().required(),
                            team_id: Joi.number().required()
                        })
                    )
                }
            },
            handler: async (request, h) => {
                return await Contest.query().insert(request.payload);
            }
        },

        {
            method: 'POST',
            path: '/create/individual',
            config: {
                description: 'Assigns an individual to a game',
                validate: {
                    payload: Joi.object({
                        game_id: Joi.number().required(),
                        color: Joi.string().allow("").required(),
                        player_username: Joi.string().required()
                    })
                }
            },
            handler: async (request, h) => {
                return await Individual.query().insert(request.payload);
            }
        },

        {
            method: 'POST',
            path: '/create/gun',
            config: {
                description: 'Creates a gun for use',
                validate: {
                    payload: Joi.object({
                        mac_address: Joi.string().required()
                    })
                }
            },
            handler: async (request, h) => {
                await Gun.query().insert(request.payload);
            }
        },

        {
            method: 'PATCH',
            path: '/change/guns',
            config: {
                description: 'Edits guns for use',
                validate: {
                    payload: Joi.array().items(
                        Joi.object({
                            gun_id: Joi.number().required(),
                            mac_address: Joi.string().required()
                        })
                    )
                }
            },
            handler: async (request, h) => {
                list_of_guns = [];
                for (var i = 0; i < request.payload.length; i++) {
                    list_of_guns.push(await Gun.query().patchAndFetchById(request.payload[i].id, {gund_id: reqest.payload[i].gun_id}));
                }
                return list_of_guns
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