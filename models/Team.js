const objection = require('objection');
const Model = objection.Model;

class Team extends Model {
    static get tableName() {
        return 'team';
    }

    static get relationMappings() {
        const Game = require('./Game');
        const Player = require('./Player');

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

            players: {
                relation: Model.ManyToManyRelation,
                modelClass: Player,
                join: {
                    from: 'team.id',
                    through: {
                        from: 'assignment.team_id',
                        to: 'assignment.player_id'
                    },
                    to: 'player.id'
                }
            }
        }
    }
}

module.exports = Team;