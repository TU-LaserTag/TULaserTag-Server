<template>
    <div>
        <v-layout justify-center><h1 style="color:#61578b">Score Page</h1></v-layout>
        <v-container>
            <v-row>
                <v-col>
                    <v-layout justify-center>
                        <v-card width="500px" height="70px" style="padding:10px" color="#61578b" raised>
                            <game-dropdown v-bind:selection="selectedGame.value"
                            v-on:selection="selectGame"
                            ></game-dropdown>
                        </v-card>
                    </v-layout>
                </v-col>
            </v-row>
        </v-container>
        <br>
        <v-card>
            <v-card-title>
                <v-row>
                    <v-col cols=2>
                        <v-layout justify-left>
                        <v-btn outlined color=#61578b @click='refreshData()'>Refresh</v-btn>
                        </v-layout>
                    </v-col>
                    <v-col>
                        <v-layout justify-center> {{selectedGame.text}} </v-layout>
                    </v-col>
                    <v-col cols=2>
                        <v-text-field class="pt-0 mt-0" v-model="search" label="Search" single-line hide-details ></v-text-field>
                    </v-col>
                </v-row>
            </v-card-title>
            <v-data-table v-if=teams v-bind:headers="game_headers" v-bind:items="players" v-bind:search="search">
                <template slot="no-data">
                    <div>No data for game</div>
                </template>
                <template slot="no-results">
                    <div>No options found for search</div>
                </template>
                <template v-slot:item.teamColor="{ item }">
                    <v-avatar style:ma-4 :color="item.team_color"></v-avatar>
                </template>
                <template v-slot:item.moreStats="{ item }">
                    <v-icon color="#ae936c" small title="Stats" @click='showStats(item)'>
                        mdi-poll
                    </v-icon>
                </template>
            </v-data-table>
            <v-data-table v-if=!teams v-bind:headers="solo_game_headers" v-bind:items="players" v-bind:search="search">
                <template slot="no-data">
                    <div>No data for game</div>
                </template>
                <template slot="no-results">
                    <div>No options found for search</div>
                </template>
                <template v-slot:item.teamColor="{ item }">
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
import GameDropdown from "../components/GameDropdown";
export default {
    name: "Scores",
    components: {GameDropdown},
    data: function() {
        return {
            players: [],
            
            teams: false,

            selectedGame: {value: -1, text: "", starttime: "", endtime: "", maxammo: -1, style: "", timedisabled: 0,maxLives: 0, pause: false, winners: null, date: "", num_teams: 0, players_alive: -1, teams_alive: -1, name: "", host: ""},

            game_headers: [
                {text: "Name", value: "player_username"},
                {text: "Points", value: "points"},
                {text: "Remaining Lives", value: "remaining_lives"},
                {text: "Ammunition fired", value: "rounds_fired"},
                {text: "Team name", value: "team_name"},
                {text: "Team color", value: "teamColor"},
                {text: "Players Killed", value: "killed"},
                {text: "Gun", value: "gun"},
                {text: "More Stats", value: "moreStats"}
            ],

            solo_game_headers: [
                {text: "Name", value: "player_username"},
                {text: "Points", value: "points"},
                {text: "Remaining Lives", value: "remaining_lives"},
                {text: "Ammunition fired", value: "rounds_fired"},
                {text: "Color", value: "teamColor"},
                {text: "Players Killed", value: "killed"},
                {text: "Gun", value: "gun"},
                {text: "More Stats", value: "moreStats"}
            ],

            search: ""
        
        }
    },
    methods: {
        setPlayers() {
            const game_id = this.selectedGame.value;
            if (game_id == -1) return;
            this.$axios.get(`game/info/${game_id}`).then(response => {
                if (response.data[0].style == "team") this.teams = true;
                else this.teams = false;
                const stats = response.data[0].stats;
                var players = [];
                for (var i = 0; i < stats.length; i++) {
                    const kill_array = stats[i].killed;
                    var killed = [];
                    for (var j = 0; j < kill_array.length; j++) {
                        killed.push(kill_array[j].player_username);
                    }
                    if (this.teams) {
                        players.push({
                            player_username: stats[i].player_username,
                            points: stats[i].points,
                            remaining_lives: stats[i].remaining_lives,
                            rounds_fired: stats[i].rounds_fired,
                            team_name: stats[i].team_name,
                            team_color: stats[i].team_color,
                            killed: killed,
                            gun: stats[i].gun.mac_address
                        })
                    }
                    else {
                        players.push({
                            player_username: stats[i].player_username,
                            points: stats[i].points,
                            remaining_lives: stats[i].remaining_lives,
                            rounds_fired: stats[i].rounds_fired,
                            color: stats[i].team_color,
                            killed: killed,
                            gun: stats[i].gun.mac_address
                        })
                    }
                }
                this.players = players
            });
        },
        selectGame(game_option) {
            this.selectedGame = game_option;
            this.setPlayers();
        },
        showStats(item) {
            console.log(item);
        },
        refreshData() {
            this.setPlayers();
        }
    }
}
</script>