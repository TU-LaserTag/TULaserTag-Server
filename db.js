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
const Killed = require('./models/Killed');
const Role = require('./models/Role');
const Password = require('./models/Password');
const Announcement = require('./models/Announcement');

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

    return {date: month + "-" + day + "-" + year, time: hour + ":" + minute + ":" + second};
}

function getColors(num_of_teams) {
    const rand_num2 = Math.floor(Math.random()*25);
    const rand_num3 = Math.floor(Math.random()*25);
    const rand_num4 = Math.floor(Math.random()*25);
    const rand_num5 = Math.floor(Math.random()*15) + 240;
    const rand_num6 = Math.floor(Math.random()*15) + 115;
    const rand_num7 = Math.floor(Math.random()*15);
    const rand_num8 = Math.floor(Math.random()*15) + 30; //talk over these two with Physics guys next week
    const rand_num9 = Math.floor(Math.random()*15) + 60; //this one as well. Need to decide what color the last option should be.
    color_array = [];
    names = ['orange', 'yellow', 'purple', 'red', 'indigo', 'green', 'blue', 'pink'];
    for (var k = 0; k < 8; k++) {
        var rand_array = [rand_num2, rand_num3, rand_num4]
        if (k % 2 == 0) {
            rand_array[2] = 255-rand_num4;
        }
        if (k % 4 < 2) {
            rand_array[1] = 255-rand_num3;
        }
        if (k < 4) {
            rand_array[0] = 255-rand_num2;
        }
        if (k == 0) {
            rand_array = [rand_num5, rand_num6, rand_num7];
        }
        else if (k == 7) {
            rand_array = [rand_num5, rand_num8, rand_num9];
        }
        for (var h = 0; h < 3; h++) {
            var rand_val = rand_array[h];
            if (rand_val < 16) {
                rand_val = rand_val.toString(16);
                rand_val = "0" + rand_val;
                rand_array[h] = rand_val
            }
        }
        color_array.push({color: "#" + rand_array[0].toString(16) + rand_array[1].toString(16) + rand_array[2].toString(16), name: names[k]});
    }
    color_list = [];
    for (var i = 0; i < num_of_teams; i++) {
        rand_index = Math.floor(Math.random()*color_array.length)
        color_list.push(color_array[rand_index]);
        color_array.splice(rand_index, 1);
    }
    return color_list;
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
            path: '/player/{username}/{password}',
            config: {
                description: "Sign-in to server and retrieve possible player roles"
            },
            handler: async (request, h) => {
                const person = await Player.query().where('username', request.params.username).withGraphFetched('roles');

                if (person.length == 1) {
                    const password = await Password.query().where('player_username', request.params.username).first();
                    if (password.password == request.params.password) {
                        return {ok: true, message: "Success!", person: person[0]};
                    }
                    else {
                        return {ok: false, message: "Incorrect password"};
                    }
                }
                else {
                    return {ok: false, message: "Incorrect username"};
                }
            }
        },

        {
            method: 'GET',
            path: '/player/roles/{username}',
            config: {
                description: "Get roles for a specific person without signing in"
            },
            handler: async (request, h) => {
                return await Role.query().where('player_username', request.params.username).first();
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
                        player_username: Joi.string().required(),
                        password: Joi.string().required(),
                        admin: Joi.boolean(),
                        possible_host: Joi.boolean(),
                        team_captain: Joi.boolean()
                    })
                }
            },
            handler: async (request, h) => {
                const user = await Player.query().where('username', request.payload.player_username);
                if (user.length == 0) {
                    await Player.query().insert({username: request.payload.player_username});
                    await Password.query().insert({player_username: request.payload.player_username, password: request.payload.password});
                    if (request.payload.admin || request.payload.possible_host || request.payload.team_captain) {
                        await Role.query().insert({player_username: request.payload.player_username, admin: request.payload.admin, possible_host: request.payload.possible_host, team_captain: request.payload.team_captain});
                    }
                    else {
                        await Role.query().insert({player_username: request.payload.player_username});
                    }
                    return {ok: true, message: "Player has been added"}
                }
                else {
                    return {ok: false, message: "Username already in use. Please try again"}
                }
            }
        },

        {
            method: 'PATCH',
            path: '/change/player/{old_username}',
            config: {
                description: "Edit a player",
                validate: {
                    payload: Joi.object({
                        player_username: Joi.string().required(),
                        password: Joi.string(), //remove?
                        admin: Joi.boolean().required(),
                        possible_host: Joi.boolean().required(),
                        team_captain: Joi.boolean().required()
                    })
                }
            },
            handler: async (request, h) => {
                old_username = request.params.old_username;
                player_username = request.payload.player_username;
                password = request.payload.password;
                admin = request.payload.admin;
                possible_host = request.payload.possible_host;
                team_captain = request.payload.team_captain;

                // if the username is not being changed
                if (player_username == old_username) {
                    await Password.query().patch({password: password}).where('player_username', player_username);
                    await Role.query().patch({admin: admin, possible_host: possible_host, team_captain: team_captain}).where('player_username', player_username);
                    console.log("Change?");
                    return {ok: true, message: "Player has been updated"}
                }
                // otherwise ensure there is not a duplicate
                const user = await Player.query().where('username', player_username);
                if (user.length == 0) {
                    console.log("Definitely");
                    // clear all foreign keys associated with the user
                    await Password.query().patch({player_username: null}).where('player_username', old_username);

                    await Role.query().patch({player_username: null}).where('player_username', old_username);
                    
                    await Individual.query().patch({player_username: null}).where('player_username', old_username);
                    
                    await Assignment.query().patch({player_username: null}).where('player_username', old_username)

                    await Stats.query().patch({player_username: null}).where('player_username', old_username);

                    // update player's username
                    await Player.query().patch({username: player_username}).where('username', old_username);

                    // update all other associations with the player                    
                    await Password.query().patch({player_username: player_username, password: request.payload.password}).where('player_username', null);

                    await Role.query().patch({player_username: player_username, admin: admin, possible_host: possible_host, team_captain: team_captain}).where('player_username', null);

                    await Individual.query().patch({player_username: player_username}).where('player_username', null);

                    await Assignment.query().patch({player_username: player_username}).where('player_username', null);

                    await Stats.query().patch({player_username: player_username}).where('player_username', null);

                    // return message signifying completion
                    return {ok: true, message: "Player has been updated"};
                }
                else {
                    return {ok: false, message: "Username already in use. Please try again"}
                }
            }
        },

        {
            method: 'DELETE',
            path: '/player/{username}',
            config: {
                description: "Delete a player and all associated entities"
            },
            handler: async (request, h) => {
                username = request.params.username;
                const stats = await Stats.query().where('player_username', username);
                for (var i = 0; i < stats.length; i++) {
                    await Killed.query().delete().where('killer_stats_id', stats[i].id);
                }
                await Stats.query().delete().where('player_username', username);
                await Role.query().delete().where('player_username', username);
                await Password.query().delete().where('player_username', username);
                await Individual.query().delete().where('player_username', username);
                await Assignment.query().delete().where('player_username', username);
                return await Player.query().delete().where('username',username);
                
            }
        },

        {
            method: 'GET',
            path: '/game',
            config: {
                description: "Get list of upcoming games"
            },
            handler: async (request, h) => {
                return await Game.query().where('date', createDate().date).andWhere('code',"").andWhere('locked', false);
            }
        },

        {
            method: 'GET',
            path: '/game/code/{code}',
            config: {
                description: "Get list of matches with a certain code",
            },
            handler: async (request, h) => {
                return await Game.query().where('code', request.params.code).andWhere('locked', false);
            }
        },

        {
            method: 'GET',
            path: '/game/{game_id}/{username}/{mac_address}',
            config: {
                description: "Sign into a certain match and get information about it"
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
                gun_object = await Gun.query().where('mac_address', request.params.mac_address).first();
                gun_id = gun_object.id;

                // individual match: person needs to choose a color before we can continue
                if (num_teams == 0) {
                    // create a stats page and individual object for them if none have been created yet
                    const stats = await Stats.query().where('game_id', request.params.game_id).andWhere('player_username', request.params.username);
                    const individual = await Individual.query().where('game_id', request.params.game_id).andWhere('player_username', request.params.username);
                    if (stats.length == 0) {
                        if (individual.length == 0) {
                            await Individual.query().insert({game_id: nextGame.id, player_username: request.params.username});
                        }
                        await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username, remaining_lives: nextGame.maxLives, style: nextGame.style, num_teams: 0, team_color: "", gun_id: gun_id});
                    }
                    else {
                        await Stats.query().patch({gun_id: gun_id}).where('player_username',request.params.username).andWhere('game_id', request.params.game_id);
                        if (individual.length == 0) {
                            await Individual.query().insert({game_id: nextGame.id, player_username: request.params.username});
                        }
                        if (stats.team_color != "") {
                            await Individual.patch({color: stats.team_color}).where('game_id', request.params.game_id).andWhere('player_username', request.params.username);
                            return {ok: true, game: nextGame, team: null, needColor: false, needName: false};
                        }
                    }
                    // return information
                    return {ok: true, game: nextGame, team: null, needColor: true, needName: false}
                }

                // gets teams currently associated with the game
                team_index = -1;
                teams = nextGame.teams;
                var player_list = [];
                // if the admin/host chooses the teams
                if (nextGame.team_selection == "manual") {
                    //search for person in teams
                    for (var i = 0; i < teams.length; i++) {
                        player_list = teams[i].players;
                        for (var j = 0; j < player_list.length; j++) {
                            if (player_list[j].username == request.params.username) {
                                team_index = i;
                            }
                        }
                    }
                    // if the person is not found
                    if (team_index == -1) {
                        const stats = await Stats.query().where('game_id', nextGame.id).andWhere('player_username', request.params.username);
                        if (stats.length == 0) {
                            // place a stats object in for them
                            await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username, remaining_lives: nextGame.maxLives, style: nextGame.style, num_teams: nextGame.num_teams, team_color: "", team_name: "", gun_id: gun_id});
                        }
                        else {
                            // edit the stats object
                            await Stats.query().patch({gun_id: gun_id}).where('game_id', nextGame.id).andWhere('player_username', request.params.username);
                        }

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
                        // assigns player to the team with the fewest number of players
                        await Assignment.query().insert({team_id: teams[minPlayerTeamIndex].id, player_username: request.params.username})
                        team_index = minPlayerTeamIndex;
                        // if not enough people have signed in yet to create names for teams, let the player create one
                        if (nextGame.stats.length < num_teams) {
                            // create stats id for the player
                            await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username, remaining_lives: nextGame.maxLives, style: nextGame.style, num_teams: nextGame.num_teams, team_color: teams[team_index].color, team_name: null, gun_id: gun_id});

                            return {ok: true, game: nextGame, team: teams[team_index], needColor: false, needName: true, gun_id: gun_id}
                        }
                    }
                }
                
                //check if player has a stats column yet associated with the game
                const stats = await Stats.query().where('game_id', nextGame.id).andWhere('player_username', request.params.username);

                // if no stats page has been created yet
                if (stats.length == 0) {
                    //create the stats column
                    await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username, remaining_lives: nextGame.maxLives, style: nextGame.style, num_teams: nextGame.num_teams, team_color: teams[team_index].color, team_name: teams[team_index].name, gun_id: gun_id});
                }
                else {
                    // updates gun_id in case the previous one was faulty
                    await Stats.query().patch({gun_id: gun_id}).where('game_id', nextGame.id).andWhere('player_username', request.params.username);
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
                    await Stats.query().patch({team_color: team.color, team_name: team.name}).where('player_username', request.params.username).andWhere('game_id', request.params.game_id);
                }
                //return the team information
                return {team: team};
            }
        },

        {
            method: 'GET',
            path: '/checkup/{username}/{game_id}',
            config: {
                description: "Get final info or changes"
            },
            handler: async (request, h) => {
                var team = null;
                var individual = null;
                const currentGame = await Game.query().where('id', request.params.game_id).withGraphFetched('teams.players').withGraphFetched('individuals').withGraphFetched('stats').withGraphFetched('announcement').first();
                const teams = currentGame.teams;
                const stats = currentGame.stats;
                const individuals = currentGame.individuals;

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

                // finds the individual player; does not loop if game is team
                for (var j = 0; j < individuals.length; j++) {
                    if (individuals[j].player_username == request.params.username) {
                        individual = individuals[j]
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
                if (currentGame.num_teams == 0) {
                    await Stats.query().patch({remaining_lives: currentGame.maxLives, num_teams: currentGame.num_teams, team_color: individual.color, team_name: null}).where('game_id',request.params.game_id).andWhere('player_username', request.params.username);
                }
                else {  
                    await Stats.query().patch({remaining_lives: currentGame.maxLives, num_teams: currentGame.num_teams, team_color: team.color, team_name: team.name}).where('game_id',request.params.game_id).andWhere('player_username', request.params.username);
                }
                const playerStats = await Stats.query().where('game_id', request.params.game_id).andWhere('player_username', request.params.username).first();

                // object to store teams of enemies
                enemy_list = {};

                // loop through stats to find enemy players
                for (var k = 0; k < stats.length; k++) {
                    // if the team colors are different, the teams must be different
                    if (stats[k].team_color != playerStats.team_color) {
                        enemy_list[stats[k].gun_id] = stats[k].player_username;
                    }
                }

                // returns that everything is ok, game, team, enemy teams, and time until game and game length if possible
                return {ok: true, game: currentGame, team: team, individual: individual, enemy_list: enemy_list, time_left: time_left, game_length: game_length};
            }
        },

        {
            method: 'PATCH',
            path: '/name/{username}/{game_id}/{team_id}',
            config: {
                description: "Create name for team for the upcoming match",
                validate: {
                    payload: Joi.object({
                        name: Joi.string().required()
                    })
                }
            },
            handler: async (request, h) => {
                duplicate_team = await Team.query().where('name', request.payload.name);
                if (duplicate_team.length > 0) {
                    return {ok: false, message: "Duplicate name"};
                }
                const team = await Team.query().patchAndFetchById(request.params.team_id, {name: request.payload.name, used: true});
                await Stats.query().patch({team_name: request.payload.name}).where('game_id', request.params.game_id).andWhere('player_username', request.params.username);
                return {ok: true, team: team};
            }
        },

        {
            method: 'POST',
            path: '/color/{username}/{game_id}',
            config: {
                description: "Create new color for an upcoming solo match",
                validate: {
                    payload: Joi.object({
                        color: Joi.string().required()
                    })
                }
            },
            handler: async (request, h) => {
                // get the game from the payload
                game = await Game.query().where('id', request.params.game_id).withGraphFetched('individuals').first();

                // get the username
                username = request.params.username;
                
                player_id = -1;
                // ensure the individual is signed up for the game and his color is unique
                for (var i = 0; i < game.individuals.length; i++) {
                    if (game.individuals[i].player_username == username) {
                        player_id = i;
                    }
                    else if (game.individuals[i].color == request.payload.color) {
                        return {ok: false, message: "Duplicate color"};
                    }
                }
                // ensure the Stats object for the player is updated accordingly
                await Stats.query().patch({team_color: request.payload.color}).where('game_id', game.id).andWhere('player_username', username);

                // if he is not
                if (player_id == -1) {
                    // sign him up
                    await Individual.query().insert({game_id: game.id, color: request.payload.color, player_username: username});
                    // return information
                    return {ok: true};
                }
                // otherwise
                else {
                    // make sure info is correct
                    await Individual.query().patch({color: request.payload.color}).where('player_username', username).andWhere('game_id', game.id);
                    // return information
                    return {ok: true};
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
                // get game information using modifiers
                const game = await Game.query().where('id', request.params.game_id).withGraphFetched('stats(player_username, game_id)').withGraphFetched('actions(game_id, person_shooting)').modifiers({
                    game_id(builder) {
                        builder.where('game_id',request.params.game_id);
                    },

                    player_username(builder) {
                        builder.where('player_username', request.params.username);
                    },

                    person_shooting(builder) {
                        builder.where('person_shooting', request.params.username);
                    }
                })

                // get data from user's stats page
                const userStats = game[0].stats[0];

                // get data from hits recorded on hits page
                const hitStats = game[0].actions;
                var hits = [];
                var kills = [];
                // place data into two arrays
                for (var i = 0; i < hitStats.length; i++) {
                    if (Number(hitStats[i].time) <= Number(request.params.timestamp)){
                        if (hitStats[i].kill) {
                            kills.push({person: hitStats[i].person_hit, team: hitStats[i].team_person_hit});
                        }
                        else hits.push({person: hitStats[i].person_hit, team: hitStats[i].team_person_hit});
                    }
                }
                // update number of rounds fired
                await Stats.query().patch({rounds_fired: Number(userStats.rounds_fired) + Number(request.params.rounds_fired)}).where('id',userStats.id);

                // check if game has ended
                const game_over = (game[0].winners != null);

                // if it has, return the winner as well
                var winners = null;
                if (game_over) winners = [game[0].winners];
                
                // return data to user
                return {points: userStats.points, hitDictionary: {hits: hits, kills: kills}, game_over: game_over, winners: winners}
            }
        },

        {
            method: 'GET',
            path: '/fire/solo/{username}/{game_id}/{timestamp}/{rounds_fired}',
            config: {
                description: 'Method called after a blaster fires to get information about damage done'
            },
            handler: async (request,h) => {
                // get game information using modifiers
                const game = await Game.query().where('id', request.params.game_id).withGraphFetched('stats(player_username, game_id)').withGraphFetched('actions(game_id, person_shooting)').modifiers({
                    game_id(builder) {
                        builder.where('game_id',request.params.game_id);
                    },

                    player_username(builder) {
                        builder.where('player_username', request.params.username);
                    },

                    person_shooting(builder) {
                        builder.where('person_shooting', request.params.username);
                    }
                })

                // get data from user's stats page
                const userStats = game[0].stats[0];

                // get data from hits recorded on hits page
                const hitStats = game[0].actions;

                var hits = [];
                var kills = [];

                // obtain data on who has been hit
                for (var i = 0; i < hitStats.length; i++) {
                    if (Number(hitStats[i].time) <= Number(request.params.timestamp)){
                        if (hitStats[i].kill) {
                            // if the hit was a kill, place in the kills list
                            kills.push({person: hitStats[i].person_hit});
                        }
                        else {
                            // if the hit was not a kill, place in the hits list
                            hits.push({person: hitStats[i].person_hit});
                        }
                    }
                }

                // update number of rounds fired
                await Stats.query().patch({rounds_fired: Number(userStats.rounds_fired) + Number(request.params.rounds_fired)}).where('id', userStats.id);
                
                // check if game has ended
                const game_over = (game[0].winners != null);

                // if it has, return the winners as well
                var winners = null;
                if (game_over) winners = [game[0].winners];

                // return data to user
                return {points: userStats.points, hitDictionary: {hits: hits, kills: kills}, game_over: game_over, winners: winners}
            }
        },

        {
            method: 'POST',
            path: '/hit/team',
            options: {
                description: 'Path called in a team game to analyze a hit',
                validate: {
                    payload: Joi.object({
                        username: Joi.string().required(),
                        shooter_username: Joi.string().required(),
                        game_id: Joi.number().required(),
                        timestamp: Joi.string().required(),
                        long_shot: Joi.boolean().required()
                    })
                }
            },
            handler: async (request, h) => {
                // get current status of game
                const gameStats = await Game.query().where('id',request.payload.game_id).withGraphFetched('teams.players').withGraphFetched('stats').first(); //modifiers are not used here in order to go through all current stats and people when looping through stats, teams, and players
                
                // if there is a winner, then the game is over and there is no need to update anything
                if (gameStats.winners) {
                    return null;
                }

                // instantiate preliminary variables tracking team names, colors, and shooter
                const hitman = request.payload.shooter_username;
                var opposingTeamName = "";
                var teamColor = ""; 
                var teamName = "";

                //searches teams and players involved in the game
                for (var i = 0; i < gameStats.teams.length; i++) {
                    for (var j = 0; j < gameStats.teams[i].players.length; j++) {
                        // finds team of shooter and stores the name
                        if (gameStats.teams[i].players[j].username == hitman) {
                            opposingTeamName = gameStats.teams[i].name;
                        }
                        // finds team of user and stores the name and color
                        else if (gameStats.teams[i].players[j].username == request.payload.username) {
                            teamName = gameStats.teams[i].name;
                            teamColor = gameStats.teams[i].color;
                        }
                    }
                }

                // if friendly fire, no reason to do anything
                if (teamName == opposingTeamName) {
                    return null
                }

                // track whether user will die or not
                var die = false;
                var livesLeft = 0;

                // keep track of shooter's points
                var currentPoints = 0;
                var pointIncrease = 5;

                // tracks whether a team has died
                var lastPersonDead = true;
                var teamsLeft = gameStats.teams_alive;
                var killer_stats_id = null;
                // stores winner if necessary
                var winners = null;

                //searches stats associated with the game
                for (var i = 0; i < gameStats.stats.length; i++) {
                    // stats page for user
                    if (gameStats.stats[i].player_username == request.payload.username) {
                        //analyzes lives left and determines whether player is now dead or not
                        // checks if players is already dead or not
                        if (!gameStats.stats[i].alive) {
                            return null;
                        }
                        livesLeft = gameStats.stats[i].remaining_lives;
                        if (livesLeft == 1) {
                            die = true;
                        }
                    }
                    // stats page for shooter
                    else if (gameStats.stats[i].player_username == hitman) {
                        // stores killer stats id in case the player died
                        killer_stats_id = gameStats.stats[i].id;
                        // obtains current points the shooter has
                        currentPoints = gameStats.stats[i].points;
                    }
                    // checks if there are still people on the same team alive
                    else if (gameStats.stats[i].team_color == teamColor && gameStats.stats[i].alive) {
                        lastPersonDead = false;
                    }
                }
                //set shooter's point increase to correct amount
                if (die) pointIncrease = 15;
                else if (request.payload.long_shot) pointIncrease = 10;

                // update shooter's point total
                await Stats.query().patch({points: currentPoints + pointIncrease}).where('game_id', request.payload.game_id).andWhere('player_username', hitman);

                // update the user's statistics to reflect the hit
                await Stats.query().patch({remaining_lives: livesLeft-1, alive: !die}).where('game_id', request.payload.game_id).andWhere('player_username', request.payload.username);

                // if user died, update respective items
                if (die) {

                    // update shooter's statistics by placing a killed object in the killed table
                    await Killed.query().insert({player_username: request.payload.username, killer_stats_id: killer_stats_id});
                    
                    // if the person was the last on their team to die, one less team is now in the game
                    if (lastPersonDead) teamsLeft--;

                    // if there is only one team left, that must be the winning team
                    if (teamsLeft == 1) winners = [opposingTeamName];

                    // send necessary info to database game table
                    await Game.query().patch({players_alive: gameStats.players_alive-1, teams_alive: teamsLeft, winners: winners}).where('id', gameStats.id);
                }

                // update Hit table with the appropriate information
                await Hit.query().insert({game_id: request.payload.game_id, time: request.payload.timestamp, person_shooting: hitman, person_hit: request.payload.username, team_person_shooting: opposingTeamName, team_person_hit: teamName, kill: die});

                //return
                return null;
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
                        shooter_username: Joi.string().required(),
                        game_id: Joi.number().required(),
                        timestamp: Joi.string().required(),
                        long_shot: Joi.boolean().required()
                    })
                }
            },
            handler: async (request, h) => {
                const gameStats = await Game.query().where('id',request.payload.game_id).withGraphFetched('stats').first(); //modifiers not used so that all stats can be analyzed

                // if there is a winner, then the game is over and there is no need to update anything
                if (gameStats.winners) {
                    return null;
                }
                // keeps track of shooter's username
                const hitman = request.payload.shooter_username;

                // used to check whether user died
                var die = false;
                var livesLeft = 0;
                var killer_stats_id = null;

                // keeps track of shooter's point total
                var currentPoints = 0;
                var pointIncrease = 5;

                // keeps track of winners, if needed
                var winners = null
                //searches stats associated with the game
                for (var i = 0; i < gameStats.stats.length; i++) {
                    // stats page for user
                    if (gameStats.stats[i].player_username == request.payload.username) {
                        //analyzes lives left and determines whether player is now dead or not
                        if (!gameStats.stats[i].alive) {
                            return null;
                        }
                        livesLeft = gameStats.stats[i].remaining_lives;
                        if (livesLeft == 1) {
                            die = true;
                        }
                    }
                    // stats page for shooter
                    else if (gameStats.stats[i].player_username == hitman) {
                        // stores killer stats id in case the player died
                        killer_stats_id = gameStats.stats[i].id;

                        //obtains current points the shooter has
                        currentPoints = gameStats.stats[i].points;
                    }
                }
                //update points that shooter will obtain
                if (die) pointIncrease = 15;
                else if (request.payload.long_shot) pointIncrease = 10;

                //update shooter's stats
                await Stats.query().patch({points: currentPoints + pointIncrease}).where('game_id', request.payload.game_id).andWhere('player_username', hitman);
                    

                // update user's stats
                await Stats.query().patch({remaining_lives: livesLeft-1, alive: !die}).where('game_id', request.payload.game_id).andWhere('player_username', request.payload.username);

                // if the user died
                if (die) {
                    //NEED TO TEST THIS TO ENSURE THAT IT WORKS
                    // creates new object in Killed table
                    await Killed.query().insert({player_username: request.payload.username, killer_stats_id: killer_stats_id})
                    
                    //if the player was the last one left and has died, the winner must be the shooter
                    if (gameStats.players_alive == 2) {
                        winners = [hitman]
                    }
                    
                    //update game table
                    await Game.query().patch({players_alive: gameStats.players_alive-1, winners: winners}).where('id', gameStats.id);
                }

                // update Hit table
                await Hit.query().insert({game_id: request.payload.game_id, time: request.payload.timestamp, person_shooting: hitman, person_hit: request.payload.username, team_person_shooting: null, team_person_hit: null, kill: die});
                
                //return
                return null
            }
        },

        {
            method: 'GET',
            path: '/gameover/{username}/{game_id}',
            config: {
                description: 'The path called to check when the game is over to check for the winner, stats, etc.'
            },
            handler: async (request, h) => {
                // gets stats of player and game
                const gameStats = await Game.query().where('id', request.params.game_id).first().withGraphFetched('stats');
                
                // checks to see if a winner has been declared
                if (gameStats.winners) {
                    // get the player stats
                    const playerStats = await Stats.query().where('player_username', request.params.username).andWhere('game_id', request.params.game_id).first().withGraphFetched('killed');

                    // return the facts
                    return {gameOver: true, winners: gameStats.winners, gameStats: playerStats};
                }

                // math to check whether the clock has expired
                current_date = createDate();
                // store seconds, minutes, hours split
                end_time_array = gameStats.endtime.split(":");
                current_time_array = current_date.time.split(":");
                // store seconds from beginning of day
                var end_secs = 0;
                var current_secs = 0;
                // loop through arrays and calculate total seconds going from hours to seconds
                for (var i = 0; i < 3; i++) {
                    end_secs += Number(end_time_array[i])*Math.pow(60,2-i);
                    current_secs += Number(current_time_array[i])*Math.pow(60,2-i);
                }

                // if the clock has not expired yet, return without calculating anything
                if (current_date.date < gameStats.date || ((end_secs >= current_secs) && (current_date.date == gameStats.date))) {
                    // FUTURE TODO: put code in to change wait time until function is called again to check on game results
                    return {gameOver: false};
                }
                // finds winner(s) if game has ended without one
                else {
                    // variables to hold maximum amount of points in the game and the people who have the number of points
                    var maxPoints = -1;
                    var winners = [];

                    // loop through the players
                    for (var j = 0; j < gameStats.stats.length; j++) {
                        // if a player has more points than the current max
                        if (gameStats.stats[j].points > maxPoints) {
                            // he is a winner and the maxpoints is now his total
                            winners = [gameStats.stats[j].player_username];
                            maxPoints = gameStats.stats[j].points;
                        }
                        // if a players points are the same as the max points
                        else if (gameStats.stats[j].points == maxPoints) {
                            // we include him as a winner
                            winners.push(gameStats.stats[j].player_username);
                        }
                    };

                    // updates game with winner(s)
                    await Game.query().patch({winners: winners}).where('id', request.params.game_id);

                    // get the player stats
                    const playerStats = await Stats.query().where('player_username', request.params.username).andWhere('game_id', request.params.game_id).first().withGraphFetched('killed');

                    // return the facts
                    return {gameOver: true, winners: winners, gameStats: playerStats};
                }
            }
        },

        { // TODO: change to make leagues work
            method: 'POST',
            path: '/create/team',
            config: {
                description: 'Creates a team',
                validate: {
                    payload: Joi.object({
                        name: Joi.string().required(),
                        captain: Joi.string().allow("").allow(null).required(),
                        primaryColor: Joi.string().allow("").allow(null).required(),
                        secondaryColor: Joi.string().allow("").allow(null).required()
                    })
                }
            },
            handler: async (request, h) => {
                if (!request.payload.captain) {
                    return await Team.query().insert({name: request.payload.name, captain: request.payload.captain, primaryColor: request.payload.primaryColor, secondaryColor: request.payload.secondaryColor, used: true});
                }
                return await Team.query().insert({name: request.payload.name, captain: request.payload.captain, primaryColor: request.payload.primaryColor.toLowerCase(), secondaryColor: request.payload.secondaryColor.toLowerCase(), used: true});
            }
        },

        {
            method: 'POST',
            path: '/createbatch/team/{game_id}',
            config: {
                description: 'Creates many teams at once and assigns them to a game - used when creating quick games',
                validate: {
                    payload: Joi.array().items(
                        Joi.object({
                            name: Joi.string().allow("").required(),
                            color: Joi.string().allow("").required(),
                            color_name: Joi.string().allow("").required(),
                            team_id: Joi.number().allow(null).required()
                        }).required()
                    )
                }
            },
            handler: async (request, h) => {
                // these handle creating an id_array and new teams
                id_array = [];
                new_team_array = [];
                final_team_array = [];
                
                // array of options for a team's colors
                color_options = getColors(request.payload.length);

                // these handle checking for duplicate colors in the creation of teams
                color_array = [];

                // loop through all teams
                for (var i = 0; i < request.payload.length; i++) {
                    var color_name = request.payload[i].color_name;
                    var color = request.payload[i].color;
                    if (!color) {
                        color_option = color_options.pop();
                        color_name = color_option.name;
                        color = color_option.color;
                    }
                    
                    while (color_array.includes(color_name)) {
                        color_option = color_options.pop();
                        color_name = color_option.name;
                        color = color_option.color;
                    }

                    // if the team exists already, patch it in case changes have been made
                    if (request.payload[i].team_id) {
                        id_array.push({team_id: request.payload[i].team_id, game_id: request.params.game_id});

                        var team = await Team.query().patchAndFetchById(request.payload[i].team_id, {name: request.payload[i].name, color: color, color_name: color_name});
                        
                        final_team_array.push(team);
                        color_array.push(color_name);
                    }

                    // if the team does not exist
                    else {
                        new_team_array.push({name: request.payload[i].name, color: color, color_name: color_name});
                        color_array.push(color_name);
                    }
                }

                // create all new teams at once
                new_teams = await Team.query().insertAndFetch(new_team_array);
                // finish creating the array for 
                new_teams.forEach(element => {
                    id_array.push({team_id: element.id, game_id: request.params.game_id});
                    final_team_array.push(element);
                });
                // sends back list of ids and teams ready to go into the Contest table
                await Contest.query().insert(id_array);

                return final_team_array;          
            }
        },

        {
            method: 'PATCH',
            path: '/change/team/{id}',
            config: {
                description: 'Changes a team',
                validate: {
                    payload: Joi.object({
                        name: Joi.string().allow("").required(),
                        primaryColor: Joi.string().allow("").allow(null).required(),
                        secondaryColor: Joi.string().allow("").allow(null).required(),
                        captain: Joi.string().allow("").allow(null).required()
                    })
                }
            },
            handler: async (request, h) => {
                if (!request.payload.captain) {
                    return await Team.query().patch({name: request.payload.name, captain: request.payload.captain, primaryColor: request.payload.primaryColor, secondaryColor: request.payload.secondaryColor, used: true}).where('id', request.params.id);
                }
                return await Team.query().patch({name: request.payload.name, captain: request.payload.captain, primaryColor: request.payload.primaryColor.toLowerCase(), secondaryColor: request.payload.secondaryColor.toLowerCase(), used: true}).where('id', request.params.id);
            }
        },

        {
            method: 'GET',
            path: '/players/notonteam/{id}',
            config: {
                description: 'Gets all players not on a certain team'
            },
            handler: async (request, h) => {
                const players = await Player.query();
                const team = await Team.query().where('id', request.params.id).withGraphFetched('players').first();
                console.log(players);
                for (var i = 0; i < team.players.length; i++) {
                    console.log(players);
                    players.splice(team.players[i], 1);
                }
                console.log(players);
                return players;
            }
        },

        {
            method: 'GET',
            path: '/teams/notingame/{id}',
            config: {
                description: 'Gets all players not on a certain team'
            },
            handler: async (request, h) => {
                const teams = await Team.query().where('used', true);
                const game = await Game.query().where('id', request.params.id).withGraphFetched('teams').first();
                for (var i = 0; i < game.teams.length; i++) {
                    teams.splice(game.teams[i], 1);
                }
                return teams;
            }
        },

        {
            method: 'DELETE',
            path: '/team/{id}',
            config: {
                description: 'Deletes a team and all associated foreign keys'
            },
            handler: async (request, h) => {
                team_id = request.params.id;
                await Contest.query().delete().where('team_id', team_id);
                await Assignment.query().delete().where('team_id', team_id);
                await Team.query().delete().where('id', team_id);
                const teams = await Team.query().where('used', true);
                return teams;

            }
        },

        {
            method: 'GET',
            path: '/teams/{game_id}',
            config: {
                description: 'Gets teams and their corresponding players involved in a game'
            },
            handler: async (request, h) => {
                const teams = await Game.query().where('id', request.params.game_id).first().withGraphFetched('teams.players');
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
                            team_id: Joi.number(),
                            player_username: Joi.string()
                        })
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
                        maxLives: Joi.number().required(),
                        pause: Joi.bool(),
                        date: Joi.string(),
                        code: Joi.string().allow(""),
                        num_teams: Joi.number().required(),
                        team_selection: Joi.string().required(),
                        name: Joi.string().allow("").required(),
                        host: Joi.string().allow("").required()
                    })
                }
            },
            handler: async (request, h) => {
                return await Game.query().insertAndFetch(request.payload);
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
                        maxLives: Joi.number().required(),
                        pause: Joi.bool(),
                        date: Joi.string().required(),
                        code: Joi.string().allow(""),
                        num_teams: Joi.number().required(),
                        team_selection: Joi.string().required(),
                        name: Joi.string().allow("").required(),
                        host: Joi.string().allow("").required()
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
                game = await Game.query().where('id', request.payload.id).first().withGraphFetched('teams.players').withGraphFetched('stats').withGraphFetched('individuals');
                var teams_alive = null;

                if (game.locked) {
                    return {ok: false};
                }
                
                // individual game
                if (game.num_teams == 0) {
                    // if the number of people with stats is not equal to the number of people in the game, we have a problem
                    if (game.stats.length != game.individuals.length) {
                        return {ok: false}
                    }
                }
                // team game
                else {
                    teams_alive = game.teams.length;
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
                
                //updates game object and locks game for start
                await Game.query().patch({locked: true, starttime: start_time_string, endtime: end_time_string, date: date.date, players_alive: game.stats.length, teams_alive: teams_alive}).where('id',request.payload.id)

                //returns that everything is good to go and the number of seconds until the start of the game, in case it is different from the seconds requested
                return {ok: true};
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
                return await Team.query().where('used', true);
            }
        },

        {
            method: 'GET',
            path: '/teams',
            config: {
                description: "Get all teams with their players"
            },
            handler: async (request, h) => {
                return await Team.query().where('used', true).withGraphFetched('players');
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
                guns = await Gun.query();
                return await Gun.query().insert({mac_address: request.payload.mac_address, id: guns.length+1});
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
                return list_of_guns;
            }
        },

        {
            method: 'DELETE',
            path: '/player/game/{username}/{game_id}',
            config: {
                description: 'Removes a player from a game',
            },
            handler: async (request, h) => {
                return await Stats.query().delete().where('player_username', request.params.username).andWhere('game_id', request.params.game_id);
            }
        },

        {
            method: 'DELETE',
            path: '/player/team/{username}/{team_id}',
            config: {
                description: 'Removes a player from a team',
            },
            handler: async (request, h) => {
                return await Assignment.query().delete().where('player_username', request.params.username).andWhere('team_id', request.params.team_id);
            }
        },

        {
            method: 'POST',
            path: '/assign/player',
            config: {
                description: 'Assigns a player to a team',
                validate: {
                    payload: Joi.object({
                        player_username: Joi.string().required(),
                        team_id: Joi.number().required()
                    })
                }
            },
            handler: async (request, h) => {
                return await Assignment.query().insert(request.payload);
            }
        },

        {
            method: 'DELETE',
            path: '/team/game/{team_id}/{game_id}',
            config: {
                description: 'Removes a team from a game',
            },
            handler: async (request, h) => {
                return await Contest.query().delete().where('team_id', request.player.team_id).andWhere('game_id', request.params.game_id);
            }
        },

        {
            method: 'GET',
            path: '/allgames',
            config: {
                description: "Gets all games in database"
            },
            handler: async (request, h) => {
                return await Game.query();
            }
        },

        {
            method: 'GET',
            path: '/game/info/{game_id}',
            config: {
                description: "Gets a certain game and its stats"
            },
            handler: async (request, h) => {
                const game = await Game.query().where('id', request.params.game_id).withGraphFetched('stats.[killed, gun]').withGraphFetched('teams.players').withGraphFetched('announcement').first();
                time = "";
                console.log(game.date, createDate().date);
                if (game.date == createDate().date) {
                    console.log("The effort is here" + game.date + " " + createDate().date)
                    const endtime = game.endtime;
                    const end_time_array = endtime.split(":");
                    const current_time_array = createDate().time.split(":");
                    var time_left = 0
                    for (var j = 0; j < 3; j++) {
                        //calculates remaining time in seconds until game starts; starts with seconds and goes up to hours
                        time_left += (Math.pow(60, j))*(Number(end_time_array[2-j]) - Number(current_time_array[2-j]));
                    }
                    // convert back to HH:MM:SS
                    var hours = Math.floor(time_left / 3600);
                    time_left %= 3600;
                    var minutes = Math.floor(time_left/60);
                    if (minutes < 10) minutes = "0" + minutes
                    var seconds = time_left % 60;
                    if (seconds < 10) seconds = "0" + seconds
                    time = hours + ":" + minutes + ":" + seconds;
                }
                else {
                    time = null
                }
                return {game: game, time: time};
            }
        },

        {
            method: 'DELETE',
            path: '/game/{id}',
            config: {
                description: "Deletes a game and all its data"
            },
            handler: async (request, h) => {
                game_id = request.params.id;
                stats = await Stats.query().where('game_id', game_id);
                for (var i = 0; i < stats.length; i++) {
                    await Killed.query().delete().where('killer_stats_id', stats[i].id);
                }
                await Stats.query().delete().where('game_id', game_id);
                await Individual.query().delete().where('game_id', game_id);
                await Contest.query().delete().where('game_id', game_id);
                await Hit.query().delete().where('game_id', game_id);
                await Announcement.query().delete().where('game_id', game_id);
                return await Game.query().deleteById(game_id);
            }
        },

        {
            method: 'GET',
            path: '/games/upcoming',
            config: {
                description: "Gets all upcoming games"
            },
            handler: async (request, h) => {
                return await Game.query().where('locked', false);
            }
        },

        {
            method: 'GET',
            path: '/games/locked',
            config: {
                description: "Gets all upcoming games"
            },
            handler: async (request, h) => {
                return await Game.query().where('locked', true);
            }
        },

        {
            method: 'GET',
            path: '/games/current',
            config: {
                description: "Gets the current games and time remaining on each of them"
            },
            handler: async (request, h) => {
                const games = await Game.query().where('locked', true).andWhere('date', createDate().date).andWhere('winners',  null);
                time = [];
                for (var i = 0; i < games.length; i++) {
                    const endtime = games[i].endtime;
                    const end_time_array = endtime.split(":");
                    const current_time_array = createDate().time.split(":");
                    var time_left = 0
                    for (var j = 0; j < 3; j++) {
                        //calculates remaining time in seconds until game starts; starts with seconds and goes up to hours
                        time_left += (Math.pow(60, j))*(Number(end_time_array[2-j]) - Number(current_time_array[2-j]));
                    }
                    // convert back to HH:MM:SS
                    var hours = Math.floor(time_left / 3600);
                    time_left %= 3600;
                    var minutes = Math.floor(time_left/60);
                    if (minutes < 10) minutes = "0" + minutes
                    var seconds = time_left % 60;
                    if (seconds < 10) seconds = "0" + seconds
                    time.push(hours + ":" + minutes + ":" + seconds);

                }
                return {games: games, time: time}
            }
        },

        {
            method: 'GET',
            path: '/announcements/general',
            config: {
                description: "Get general announcements"
            },
            handler: async (request, h) => {
                return await Announcement.query().where('game_id', null);
            }
        },

        {
            method: 'GET',
            path: '/announcements/game/{game_id}',
            config: {
                description: "Get specific announcements for a game"
            },
            handler: async (request, h) => {
                return await Announcement.query().where('game_id', request.params.game_id);
            }
        },

        {
            method: 'GET',
            path: '/announcements',
            config: {
                description: "Get all announcements"
            },
            handler: async (request, h) => {
                return await Announcement.query();
            }
        },

        {
            method: 'POST',
            path: '/announcements',
            config: {
                description: "Post an announcement",
                validate: {
                    payload: Joi.object({
                        announcement: Joi.string().required(),
                        game_id: Joi.number().allow(null).required(),
                        time: Joi.date().required()
                    })
                }
            },
            handler: async (request, h) => {
                return await Announcement.query().insert(request.payload);
            }
        },

        {
            method: 'PATCH',
            path: '/announcements/{id}',
            config: {
                description: "Patch an announcement",
                validate: {
                    payload: Joi.object({
                        announcement: Joi.string().required(),
                        game_id: Joi.number().allow(null).required(),
                        time: Joi.date().required()
                    })
                }
            },
            handler: async (request, h) => {
                return await Announcement.query().patch(request.payload).where('id', request.params.id);
            }
        },

        {
            method: 'DELETE',
            path: '/announcements/{id}',
            config: {
                description: "Delete an announcement"
            },
            handler: async (request, h) => {
                return await Announcement.query().delete().where('id', request.params.id);
            }
        },

        {
            method: 'GET',
            path: '/players',
            config: {
                description: "Get all players"
            },
            handler: async (request, h) => {
                return await Player.query().withGraphFetched('password').withGraphFetched('roles');
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