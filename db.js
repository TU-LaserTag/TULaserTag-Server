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

                teams = nextGame.teams;

                if (teams.length <= num_teams) {
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
                    const stats = await Stats.query().where('game_id', nextGame.id).andWhere('player_username', request.params.username);
                    if (stats.length == 0) await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username});
                    return {ok: true, game: nextGame, team: teams[team_index], needColor: false, needName: false};
                }

                else {
                    return {ok: false, message: "Error with game setup. Contact admin to fix it."}
                }
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
                    return {ok: false, message: "Incorrect code. Please try again."};
                }

                const nextGame = games[0];
                num_teams = nextGame.num_teams;

                if (num_teams == 0) {
                    return {ok: true, game: nextGame, team: null,needColor: true, needName: false}
                }

                teams = nextGame.teams;

                if (teams.length <= num_teams) {
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
                    const stats = await Stats.query().where('game_id', nextGame.id).andWhere('player_username', request.params.username);
                    if (stats.length == 0) await Stats.query().insert({game_id: nextGame.id, player_username: request.params.username});
                    return {ok: true, game: nextGame, team: teams[team_index], needColor: false, needName: false};
                }

                else {
                    return {ok: false, message: "Error with game setup. Contact admin to fix it."}
                }
            }
        },

        {//NEED TO CODE THIS
            method: 'GET',
            path: '/gamevue/{id}',
            config: {
                description: "Get information for a certain upcoming match"
            },
            handler: async (request, h) => {
                const game = await Game.query().where('id',request.params.id).withGraphFetched('teams').withGraphFetched('individuals');
                if (game.length == 1) {
                    return {ok: true, body: game};
                }
                else {
                    return {ok: false, message: "Invalid game code"};
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
                console.log(username);
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

                        const stats = await Stats.query().where('game_id', game.id).andWhere('player_username', username);
                        if (stats.length == 0) await Stats.query().insert({game_id: game.id, player_username: username});
                        
                        return {ok: true, game: game, team: solo, needColor: false, needName: false};
                    }
                    else {
                        await Individual.query().update({color: request.payload.color}).where('player_username', username);
                        const solo = await Individual.query().where('player_username', username);

                        const stats = await Stats.query().where('game_id', game.id).andWhere('player_username', username);
                        if (stats.length == 0) await Stats.query().insert({game_id: game.id, player_username: username});

                        return {ok: true, game: game, team: solo, needColor: false, needName: false};
                    }
                }
                else {
                    const createdTeam = await Team.query().insert({name: request.payload.name, color: request.payload.color});
                    await Contest.query().insert({game_id: game.id, team_id: createdTeam.id});
                    await Assignment.query().insert({team_id: createdTeam.id, player_username: username});

                    const stats = await Stats.query().where('game_id', game.id).andWhere('player_username', username);
                    if (stats.length == 0) await Stats.query().insert({game_id: game.id, player_username: username});

                    return {ok: true, game: game, team: createdTeam, needColor: false, needName: false};
                }
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