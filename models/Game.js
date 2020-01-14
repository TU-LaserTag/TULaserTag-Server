const objection = require('objection');
const Model = objection.Model;

class Game extends Model {
    static get tableName() {
        return 'game';
    }

    static get relationMappings() {
        const Team = require('./Team');
        const Player = require('./Player');
        const Stats = require('./Stats');
        const Hit = require('./Hit');
        const Individual = require('./Individual');

        return {
            individuals: {
                relation: Model.HasManyRelation,
                modelClass: Individual,
                join: {
                    from: 'game.id',
                    to: 'individual.game_id'
                }
            },

            players: {
                relation: Model.ManyToManyRelation,
                modelClass: Player,
                join: {
                    from: 'game.id',
                    through: {
                        from: 'stats.game_id',
                        to: 'stats.player_username'
                    },
                    to: 'player.username'
                }
            },

            teams: {
                relation: Model.ManyToManyRelation,
                modelClass: Team,
                join: {
                    from: 'game.id',
                    through: {
                        from: 'contest.game_id',
                        to: 'contest.team_id'
                    },
                    to: 'team.id'
                }
            },

            stats: {
                relation: Model.HasManyRelation,
                modelClass: Stats,
                join: {
                    from: 'game.id',
                    to: 'stats.game_id'
                }
            },

            actions: {
                relation: Model.HasManyRelation,
                modelClass: Hit,
                join: {
                    from: 'game.id',
                    to: 'hit.game_id'
                }
            }
        }
    }
}

module.exports = Game;