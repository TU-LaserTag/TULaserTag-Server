const objection = require('objection');
const Model = objection.Model;

class Stats extends Model {
    static get tableName() {
        return 'stats';
    }

    static get relationMappings() {
        const Gun = require('./Gun');
        const Killed = require('./Killed')

        return {
            gun: {
                relation: Model.HasOneRelation,
                modelClass: Gun,
                join: {
                    from: 'stats.gun_id',
                    to: 'gun.id'
                }
            },

            killed: {
                relation: Model.HasManyRelation,
                modelClass: Killed,
                join: {
                    from: 'stats.id',
                    to: 'killed.killer_stats_id'
                }
            }
        }
    }
}

module.exports = Stats;