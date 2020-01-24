<template>
    <v-select :items="game_ids" label="Select a game" v-model="key" v-on:change="selectGameId" solo></v-select>
</template>

<script>
export default {
    props: ["id"],
    watch: {
        id(newId) {
            this.key = newId;
        }
    },
    data: function() {
        return {
            game_ids: [],
            key: this.id
        }
    },
    mounted: function() {
        this.$axios.get("games/upcoming").then(response => {
            this.game_ids = response.data.map(game => ({
                text: game.id + ": " + game.name,
                value: game.id,
            }));
            this.game_ids.unshift({
                text: "",
                value: ""
            })
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