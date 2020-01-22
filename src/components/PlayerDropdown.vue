<template>
    <v-select :items="players" label="Select a player" v-model="key" v-on:change="selectPlayer" solo></v-select>
</template>

<script>
export default {
    props: ["username"],
    watch: {
        username(newUsername) {
            this.key = newUsername;
        }
    },
    data: function() {
        return {
            players: [],
            key: this.username
        }
    },
    mounted: function() {
        this.$axios.get("players").then(response => {
            this.players = response.data.map(player => ({
                text: player.username,
                value: player.username,
            }));
            this.players.unshift({
                text: "",
                value: ""
            })
        });
    },
    methods: {
        selectPlayer() {
            const index = this.players.findIndex((player) => {
                return player.value === this.key;
            })
            this.$emit('selection', this.players[index]);
        }
    }
}
</script>