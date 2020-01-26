<template>
    <div>
        <v-card>
            <v-card-title>
                <v-row>
                    <v-col cols=2>
                        <v-layout justify-left>
                        <v-btn outlined color=#61578b @click='refresh()'>Refresh</v-btn>
                        </v-layout>
                    </v-col>
                    <v-col>
                        <v-layout justify-center> {{name}} </v-layout>
                    </v-col>
                    <v-col cols=2>
                        <v-text-field class="pt-0 mt-0" v-model="search" label="Search" single-line hide-details ></v-text-field>
                    </v-col>
                </v-row>
            </v-card-title>
            <v-data-table v-bind:headers="solo_game_headers" v-bind:items="players" v-bind:search="search">
                <template slot="no-data">
                    <div>No data for game</div>
                </template>
                <template slot="no-results">
                    <div>No options found for search</div>
                </template>
                <template v-slot:item.color="{ item }">
                    <v-avatar style:ma-4 :color="item.color"></v-avatar>
                </template>
                <template v-slot:item.moreStats="{ item }">
                    <v-icon color="#ae936c" small title="Stats" @click='showStats(item)'>
                        mdi-poll
                    </v-icon>
                </template>
            </v-data-table>
        </v-card>
    </div>
</template>

<script>
export default {
    props: ["id"],
    watch: {
        id(new_id) {
            this.game_id = new_id;
            this.refresh();
        }
    },
    mounted: function() {
        if (this.game_id != -1) {
            this.setPlayers();
        }
    },
    data: function() {
        return {
            solo_game_headers: [
                {text: "Name", value: "player_username"},
                {text: "Points", value: "points"},
                {text: "Remaining Lives", value: "remaining_lives"},
                {text: "Ammunition fired", value: "rounds_fired"},
                {text: "Color", value: "color"},
                {text: "Players Killed", value: "killed"},
                {text: "Time Left", value: "time_left"},
                {text: "Gun", value: "gun"},
                {text: "More Stats", value: "moreStats"}
            ],
            search: "",
            players: [],
            game_id: this.id,
            name: ""
        }
    },
    methods: {
        showStats(item) {
            console.log(item);
        },
        refresh() {
            this.setPlayers();
        },
        setPlayers() {
            if (this.game_id == -1 || this.game_id == 0) {
                this.players = [];
                return;
            }
            this.$axios.get(`game/info/${this.game_id}`).then(response => {
                this.name = response.data.game.name;
                const stats = response.data.game.stats;
                var players = [];
                for (var i = 0; i < stats.length; i++) {
                    const kill_array = stats[i].killed;
                    var killed = [];
                    for (var j = 0; j < kill_array.length; j++) {
                        killed.push(kill_array[j].player_username);
                    }
                    players.push({
                        player_username: stats[i].player_username,
                        points: stats[i].points,
                        remaining_lives: stats[i].remaining_lives,
                        rounds_fired: stats[i].rounds_fired,
                        killed: killed,
                        color: stats[i].team_color,
                        time_left: response.data.time,
                        gun: stats[i].gun.mac_address
                    })
                }
                this.players = players
            }).catch((err) => console.log("An error has occurred: " + err));
        }
    }
}
</script>