<template>
    <div>
        <v-card>
            <v-card-title>
                <v-row>
                    <v-col cols=4>
                        <v-btn color="#61578b" raised v-on:click="addTeam">
                        <font color=white>Add Team</font>
                        </v-btn>
                        <v-btn class="ml-4" color="#61578b" raised v-on:click="refresh">
                        <font color=white>Refresh</font>
                        </v-btn>
                    </v-col>
                    <v-col cols=4>
                        <v-layout justify-center><h3>Team Table</h3></v-layout>
                    </v-col>
                    <v-spacer />
                    <v-col cols=2>
                        <v-text-field class="pt-0 mt-0" v-model="search" label="Search" single-line hide-details ></v-text-field>
                    </v-col>
                </v-row>
            </v-card-title>
            <v-data-table v-bind:headers="team_headers" v-bind:items="teams" v-bind:search="search">
                <template slot="no-data">
                    <div>No teams in database</div>
                </template>
                <template slot="no-results">
                    <div>No options found for search</div>
                </template>
                <template v-slot:item.primaryColor="{ item }">
                    <v-avatar style:ma-4 :color="item.primaryColor"></v-avatar>
                </template>
                <template v-slot:item.secondaryColor="{ item }">
                    <v-avatar style:ma-4 :color="item.secondaryColor"></v-avatar>
                </template>
                <template v-slot:item.editPlayers="{ item }">
                    <v-icon color="#ae936c" medium title="Edit" @click='editPlayers(item)'>
                        mdi-account-edit
                    </v-icon>
                </template>
                <template v-slot:item.editTeam="{ item }">
                    <v-icon color="#ae936c" medium title="Edit" @click='editTeam(item)'>
                        mdi-lead-pencil
                    </v-icon>
                </template>
                <template v-slot:item.deleteTeam="{ item }">
                    <v-icon color="#ae936c" medium title="Delete" @click='deleteTeam(item)'>
                        mdi-delete
                    </v-icon>
                </template>
            </v-data-table>
        </v-card>
        
        <div>
            <v-dialog persistent v-model="edit_team_visible" max-width=800px>
                <v-card>
                    <v-card-title>
                        <v-layout justify-center>
                        {{action}} Team
                        </v-layout>
                    </v-card-title>
                    <v-form v-model="valid">
                        <v-card-text>
                                <v-label>Name</v-label>
                                <v-text-field v-bind:rules="name_rules" v-model="selectedTeam.name" required>
                                </v-text-field>
                            <br>
                                <v-label>Captain</v-label>
                            <player-dropdown v-bind:username="selectedPlayer"
                            v-on:selection="selectPlayer"></player-dropdown>
                            <div v-if="viewColors">
                                <v-row>
                                    <v-col>
                                        <v-label>Primary color</v-label>
                                        <v-color-picker v-model="primaryColor" class=mx-8>
                                        </v-color-picker>
                                    </v-col>
                                    <v-spacer />
                                    <v-col>
                                        <v-label>Secondary color</v-label>
                                        <v-color-picker v-model="secondaryColor" class=mx-8>
                                        </v-color-picker>
                                    </v-col>
                                </v-row>
                            </div>
                            <span style="color:red; font-size:17px">{{message}}</span>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer />
                            <v-btn v-on:click="submitTeam" :disabled="!valid">Submit</v-btn>
                            <v-btn v-on:click="cancel">Cancel</v-btn>
                        </v-card-actions>
                    </v-form>
                </v-card>
            </v-dialog>
        </div>
        <div>
            <v-dialog persistent v-model="edit_players_visible" max-width=450px>
                <v-card>
                    <v-card-title>
                        <v-layout justify-center>
                            {{action}} Players
                        </v-layout>
                    </v-card-title>
                    <v-card-text>
                        <v-data-table v-bind:headers="player_headers" v-bind:items="players" v-bind:search="searchPlayer">
                            <template slot="no-data">
                                <div>No players on team</div>
                            </template>
                            <template slot="no-results">
                                <div>No options found for search</div>
                            </template>
                            <template v-slot:item.removePlayer="{ item }">
                                <v-icon color="#ff0000" medium title="Remove" @click='removePlayer(item)'>
                                    mdi-minus-circle
                                </v-icon>
                            </template>
                        </v-data-table>
                        <v-layout justify-center>
                            <v-btn color="#61578b" v-on:click="addPlayers"><font color=white>Add Players</font></v-btn>
                        </v-layout>
                        <br><br>
                        <v-data-table v-if="view_add_player_table" v-bind:headers="other_player_headers" v-bind:items="other_players" v-bind:search="searchOtherPlayer">
                            <template slot="no-results">
                                <div>No options found for search</div>
                            </template>
                            <template v-slot:item.addPlayer="{ item }">
                                <v-icon color="#008800" medium title="Add" @click='addPlayer(item)'>
                                    mdi-plus-circle
                                </v-icon>
                            </template>
                        </v-data-table>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn v-on:click="done">Done</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </div>
    </div>
</template>

<script>
import PlayerDropdown from './PlayerDropdown';
export default {
    components: {PlayerDropdown},
    data: function() {
        return {
            selectedTeam: {},
            selectedPlayer: null,
            search: "",
            searchPlayer: "",
            searchOtherPlayer: "",
            team_headers: [
                {text: "Id", value: "id"},
                {text: "Name", value: "name"},
                {text: "Team Captain", value: "captain"},
                {text: "Primary Color", value: "primaryColor"},
                {text: "Secondary color", value: "secondaryColor"},
                {text: "Players", value: "players"},
                {text: "Add/Remove Players", value: "editPlayers"},
                {text: "Edit Team", value: "editTeam"},
                {text: "Delete Team", value: "deleteTeam"}
            ],
            other_players: [],
            other_player_headers: [
                {text: "Username", value: "username"},
                {text: "Add Player", value: "addPlayer"}
            ],
            players: [],
            player_headers: [
                {text: "Username", value: "username"},
                {text: "Remove Player", value: "removePlayer"}
            ],
            teams: [],
            name_rules: [
                v => !!v || 'Username is required'
            ],
            edit_team_visible: false,
            edit_players_visible: false,
            message: "",
            action: "",
            valid: false,
            view_add_player_table: false,
            viewColors: false,
            primaryColor: "#ff0000",
            secondaryColor: "#ff0000"
        }
    },
    mounted: function () {
        this.$axios.get('teams').then(response => {
            const team_list = response.data;
            var teams = [];
            for (var i = 0; i < team_list.length; i++) {
                const player_list = team_list[i].players;
                var players = [];
                for (var j = 0; j < player_list.length; j++) {
                    players.push(player_list[j].username);
                }
                teams.push({
                    index: i,
                    id: response.data[i].id,
                    name: response.data[i].name,
                    captain: response.data[i].captain,
                    primaryColor: response.data[i].primaryColor,
                    secondaryColor: response.data[i].secondaryColor,
                    players: players
                })
            }
            this.teams = teams;
        })
    },
    methods: {
        selectPlayer(player) {
            this.selectedPlayer = player.value;
            if (!player.value) {
                this.viewColors = false;
            }
            else {
                this.viewColors = true;
            }
        },
        editTeam(team) {
            this.selectedTeam = JSON.parse(JSON.stringify(team));
            this.action = "Edit";
            if (team.captain) {
                this.selectedPlayer = team.captain;
                this.viewColors = true;
                this.primaryColor = team.primaryColor;
                this.secondaryColor = team.secondaryColor;
            }
            this.edit_team_visible = true;
        },
        deleteTeam(team) {
            if (!confirm(`Are you sure you want to delete ${team.name} and all database items associated with this team?`)) {
                return;
            }
            this.$axios.delete(`team/${team.id}`).then(() => {
                this.refresh();
            });
        },
        addPlayers() {
            this.$axios.get(`players/notonteam/${this.selectedTeam.id}`).then((response) => {
                if (response.status == 200) {
                    this.other_players = response.data;
                    this.view_add_player_table = true
                }  
                else console.log("An error has occurred")
            })
        },
        addPlayer(item) {
            if (!confirm(`Add ${item.username} to ${this.selectedTeam.name}?`)) {
                return;
            }
            this.$axios.post('/assign/player', {
                player_username: item.username,
                team_id: this.selectedTeam.id
            }).then((response) => {
                if (response.status == 200) {
                    const other_player_index = this.other_players.findIndex((player) => {
                        return player.username == item.username;
                    })
                    this.players.push(this.other_players[other_player_index]);
                    this.other_players.splice(other_player_index, 1);
                }
                else {
                    console.log("An error has occurred");
                }
            })

        },
        done() {
            this.edit_players_visible = false;
            this.view_add_player_table = false;
            this.refresh();
            this.selectedTeam = {};
        },
        editPlayers(item) {
            this.selectedTeam = JSON.parse(JSON.stringify(item));
            this.action = "Edit"
            this.edit_players_visible = true;
            var players = [];
            for (var i = 0; i < item.players.length; i++) {
                players.push({username: item.players[i]});
            }
            this.players = players;
        },
        removePlayer(item) {
            if (!confirm(`Remove ${item.username} from ${this.selectedTeam.name}?`)) {
                return;
            }
            this.$axios.delete(`/player/team/${item.username}/${this.selectedTeam.id}`).then((response) => {
                if (response.status == 200) {
                    const player_index = this.players.findIndex((player) => {
                        return player.username == item.username;
                    })
                    this.other_players.push(this.players[player_index]);
                    this.players.splice(player_index, 1);
                }
                else {
                    console.log("An error has occurred");
                }
            })
        },
        addTeam() {
            this.selectedTeam = {};
            this.action = "New";
            this.edit_team_visible = true;
        },
        postTeam() {
            if (!this.selectedPlayer) {
                this.selectedPlayer = null;
                this.primaryColor = null;
                this.secondaryColor = null;
            }
            this.$axios.post(`create/team`, {
                name: this.selectedTeam.name,
                captain: this.selectedPlayer,
                primaryColor: this.primaryColor,
                secondaryColor: this.secondaryColor,
            }).then((response) => {
                if (response.status == 200) {
                    this.edit_team_visible = false;
                    this.message = "";
                    this.selectedTeam = {};
                    this.selectedPlayer = null;
                    this.viewColors = false;
                    this.primaryColor = "#ff0000";
                    this.secondaryColor = "#ff0000";
                    this.refresh();
                }
                else {
                    this.message = "Error occurred. Please ensure all fields have valid input";
                }
            }).catch(() => {
                this.message = "Error occurred. Please ensure all fields have valid input";
            })
        },
        patchTeam() {
            if (!this.selectedPlayer) {
                this.selectedPlayer = null;
                this.primaryColor = null;
                this.secondaryColor = null;
            }
            this.$axios.patch(`change/team/${this.selectedTeam.id}`, {
                name: this.selectedTeam.name,
                captain: this.selectedPlayer,
                primaryColor: this.primaryColor,
                secondaryColor: this.secondaryColor,
            }).then((response) => {
                if (response.status == 200) {
                    this.edit_team_visible = false;
                    this.message = "";
                    this.selectedTeam = {};
                    this.selectedPlayer = null;
                    this.viewColors = false;
                    this.primaryColor = "#ff0000";
                    this.secondaryColor = "#ff0000";
                    this.refresh();
                }
                else {
                    this.message = "Error occurred. Please ensure all fields have valid input";
                }
            }).catch(() => {
                this.message = "Error occurred. Please ensure all fields have valid input";
            })
        },
        submitTeam() {
            if (this.action == "Edit") this.patchTeam();
            else this.postTeam();
        },
        cancel() {
            this.edit_team_visible = false;
            this.message = "";
            this.selectedTeam = {};
            this.selectedPlayer = null;
            this.viewColors = false;
            this.primaryColor = "#ff0000";
            this.secondaryColor = "#ff0000";
        },
        refresh() {
            this.$axios.get('teams').then(response => {
                const team_list = response.data;
                var teams = [];
                for (var i = 0; i < team_list.length; i++) {
                    const player_list = team_list[i].players;
                    var players = [];
                    for (var j = 0; j < player_list.length; j++) {
                        players.push(player_list[j].username);
                    }
                    teams.push({
                        index: i,
                        id: response.data[i].id,
                        name: response.data[i].name,
                        captain: response.data[i].captain,
                        primaryColor: response.data[i].primaryColor,
                        secondaryColor: response.data[i].secondaryColor,
                        players: players
                    })
                }
                this.teams = teams;
            })
        }
    }
}
</script>