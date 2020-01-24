<template>
    <v-select :items="game_ids" label="Select a game" v-model="key" v-on:change="selectGameId" solo></v-select>
</template>

<script>
export default {
    props: ["id"],
    watch: {
        id(newId) {
            this.key = newId;
            if (this.game_ids.length == 0) {
                this.startup = true;
            }
            else if (newId == -1) {
                this.game_ids.shift();
            }
            else if (this.game_ids[0].value) {
                this.game_ids.unshift({
                    text: "",
                    value: 0,
                    teams: false,
                    table: false
                });
            }
        },
    },
    data: function() {
        return {
            game_ids: [],
            key: this.id,
            startup: false
        }
    },
    mounted: function() {
        this.$axios.get("games/locked").then(response => {
            this.game_ids = response.data.map((game) => ({
               text: `${game.name}`,
               value: game.id,
               teams: game.num_teams != 0,
               table: true
            }));
            if (this.startup) {
            this.game_ids.unshift({
                    text: "",
                    value: 0,
                    teams: false,
                    table: false
            });
        }
        });
    },
    methods: {
        selectGameId() {
            const index = this.game_ids.findIndex((game_id) => {
                return game_id.value === this.key;
            })
            this.$emit('selection', this.game_ids[index]);
        }
    }
}
</script>