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
                    const newPlayer = await Driver.query().insert(request.payload);
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
                description: "Get information for the next upcoming match"
            },
            handler: async (request, h) => {
                const games = await Game.query().orderBy(['date','starttime']);
                if ((games)&&(games.length > 0)) {
                    return {ok: true, body: games[0]};
                }
                else {
                    return {ok: false, message: "No future games found at this time"};
                }
            }
        },

        {
            method: 'GET',
            path: '/game/code/{code}',
            config: {
                description: "Get information for a certain upcoming match"
            },
            handler: async (request, h) => {
                const game = await Game.query().where('code',request.params.code);
                if (game.length == 1) {
                    return {ok: true, body: game};
                }
                else {
                    return {ok: false, message: "Invalid game code"};
                }
            }
        },

        {
            method: 'GET',
            path: '/game/{id}',
            config: {
                description: "Get information for a certain upcoming match"
            },
            handler: async (request, h) => {
                const game = await Game.query().where('id',request.params.id);
                if (game.length == 1) {
                    return {ok: true, body: game};
                }
                else {
                    return {ok: false, message: "Invalid game code"};
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