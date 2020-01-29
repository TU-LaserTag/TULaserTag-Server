const objection = require('objection');
const Model = objection.Model;

class Team extends Model {
    static get tableName() {
        return 'team';
    }

    static get relationMappings() {
        const Game = require('./Game');
        const Player = require('./Player');
        const League = require('./League');

        return {
            games: {
                relation: Model.ManyToManyRelation,
                modelClass: Game,
                join: {
                    from: 'team.id',
                    through: {
                        from: 'contest.team_id',
                        to: 'contest.game_id'
                    },
                    to: 'game.id'
                }
            },

            leagues: {
                relation: Model.ManyToManyRelation,
                modelClass: League,
                join: {
                    from: 'team.id',
                    through: {
                        from: 'league_assignment.team_id',
                        to: 'league_assignment.league_id'
                    },
                    to: 'league.id'
                }
            },

            players: {
                relation: Model.ManyToManyRelation,
                modelClass: Player,
                join: {
                    from: 'team.id',
                    through: {
                        from: 'assignment.team_id',
                        to: 'assignment.player_username'
                    },
                    to: 'player.username'
                }
            }
        }
    }
}

module.exports = Team;