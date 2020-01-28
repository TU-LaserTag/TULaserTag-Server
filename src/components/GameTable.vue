<template>
    <div>
        <v-card position=absolute>
            <v-card-title>
                <v-row>
                    <v-col cols=4>
                        <v-btn color="#61578b" raised v-on:click="addGame">
                        <font color=white>Add Game</font>
                        </v-btn>
                        <v-btn class="ml-4" color="#61578b" raised v-on:click="refresh">
                        <font color=white>Refresh</font>
                        </v-btn>
                    </v-col>
                    <v-col cols=4>
                        <v-layout justify-center><h3>Game Table</h3></v-layout>
                    </v-col>
                    <v-spacer />
                    <v-col cols=2>
                        <v-text-field class="pt-0 mt-0" v-model="search" label="Search" single-line hide-details ></v-text-field>
                    </v-col>
                </v-row>
            </v-card-title>
            <v-data-table v-bind:headers="game_headers" v-bind:items="games" v-bind:search="search">
                <template slot="no-data">
                    <div>No games in database</div>
                </template>
                <template slot="no-results">
                    <div>No options found for search</div>
                </template>
                <template v-slot:item.maxammo="{ item }">
                    <v-icon v-if="(item.maxammo == -1)">mdi-infinity</v-icon>
                    <span v-if="(item.maxammo != -1)">{{item.maxammo}}</span>
                </template>
                <template v-slot:item.maxLives="{ item }">
                    <v-icon v-if="(item.maxLives == -1)">mdi-infinity</v-icon>
                    <span v-if="(item.maxLives != -1)">{{item.maxLives}}</span>
                </template>
                <template v-slot:item.pause="{ item }">
                    <v-icon>
                    {{ item.pause ? "mdi-checkbox-marked" : "mdi-checkbox-blank-outline" }}
                    </v-icon>
                </template>
                <template v-slot:item.editTeams="{ item }">
                    <v-icon v-if="(item.style == 'team')" color="#ae936c" medium title="Edit" @click='editTeams(item)'>
                        mdi-account-edit
                    </v-icon>
                </template>
                <template v-slot:item.editGame="{ item }">
                    <v-icon color="#ae936c" medium title="Edit" @click='editGame(item)'>
                        mdi-lead-pencil
                    </v-icon>
                </template>
                <template v-slot:item.deleteGame="{ item }">
                    <v-icon color="#ae936c" medium title="Delete" @click='deleteGame(item)'>
                        mdi-delete
                    </v-icon>
                </template>
            </v-data-table>
        </v-card>
        
        <div>
            <v-dialog persistent v-model="edit_game_visible" max-width=800px>
                <v-card>
                    <v-card-title>
                        <v-layout justify-center>
                        {{action}} Game
                        </v-layout>
                    </v-card-title>
                    <v-form v-model="valid" ref="form">
                        <v-card-text>
                                <v-label>Name</v-label>
                                <v-text-field v-bind:rules="name_rules" v-model="selectedGame.name" required>
                                </v-text-field>
                                <br>
                                <v-label>Host</v-label>
                                <host-dropdown v-bind:username="selectedPlayer" v-bind:game_id="selectedGame.id" v-on:selection="selectPlayer"></host-dropdown>
                                <br>
                                <v-row>
                                    <v-col>
                                        <div style="font-size:45px">Date: {{formattedDate}}</div>
                                        <br>
                                        <v-btn class="mb-12" color="#61578b" raised v-on:click="editDate">
                                            <font color=white>Change Date</font>
                                        </v-btn>
                                        <br>
                                        <v-label>Code</v-label>
                                        <v-text-field class="ma-0 pa-0" v-model="selectedGame.code">
                                        </v-text-field>
                                        <div class="mt-12" style="font-size:30px">Time Disabled: {{time_disabled}}s</div>
                                        <v-slider max=60 min=1 v-model="time_disabled">
                                        </v-slider>
                                        <v-checkbox class="ml-4 mr-4" color="#007476" disabled label="Pause Allowed" v-model="selectedGame.pause"></v-checkbox>
                                    </v-col>
                                    <v-col>
                                        <v-date-picker v-if="edit_date_visible" color="#61578b" v-model="date" show-current>
                                        </v-date-picker>
                                    </v-col>
                                </v-row>
                                <br><br>
                                <v-label>Maximum Lives</v-label>
                                <v-row>
                                    <v-text-field class=mx-3 :disabled=selectedGame.infiniteLives v-bind:rules="infinite_life_rules" v-model="selectedGame.maxLives"></v-text-field>
                                    <v-checkbox class="ml-12 mr-4" color="#007476" label="Infinite Lives" v-bind:rules="infinite_life_rules" v-model="selectedGame.infiniteLives"></v-checkbox>
                                </v-row>
                                <v-label>Maximum Ammunition</v-label>
                                <v-row>
                                    <v-text-field class=mx-3 :disabled=selectedGame.infiniteAmmo v-bind:rules="infinite_ammo_rules" v-model="selectedGame.maxammo"></v-text-field>
                                    <v-checkbox class="ml-12 mr-4" color="#007476" label="Infinite Ammo" v-bind:rules="infinite_ammo_rules" v-model="selectedGame.infiniteAmmo"></v-checkbox>
                                </v-row>
                                <v-row>
                                    <v-col cols=4>
                                    <v-checkbox class="ma-4" label="Solo Match" v-model="solo"></v-checkbox>
                                    </v-col>
                                    <v-col cols=4>
                                    <div v-if="!solo"> 
                                        <v-card>
                                            <v-card-text>
                                                <v-row>
                                                    <v-col cols=2>
                                                        <v-icon @click="decreaseTeams">mdi-minus</v-icon>
                                                    </v-col>
                                                    <v-spacer />
                                                    <v-col cols=8>
                                                        <v-layout justify-center>{{num_teams}} Teams</v-layout>
                                                    </v-col>
                                                    <v-spacer />
                                                    <v-col cols=2>
                                                        <v-icon @click="increaseTeams">mdi-plus</v-icon>
                                                    </v-col>
                                                </v-row>
                                            </v-card-text>
                                        </v-card>
                                    </div>
                                    </v-col>
                                    <v-col cols=4>
                                    <div v-if="!solo"> 
                                        <v-checkbox class="ma-4" label="Automatically create teams?" v-model="automatic"></v-checkbox>
                                    </div>
                                    </v-col>
                                </v-row>
                                <span style="color:red; font-size:17px">{{message}}</span>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer />
                            <v-btn v-on:click="submitGame">Submit</v-btn>
                            <v-btn v-on:click="cancel">Cancel</v-btn>
                        </v-card-actions>
                    </v-form>
                </v-card>
            </v-dialog>
        </div>
        <div>
            <v-dialog persistent v-model="edit_teams_visible" max-width=450px>
                <v-card>
                    <v-card-title>
                        <v-layout justify-center>
                            {{action}} Teams
                        </v-layout>
                    </v-card-title>
                    <v-card-text>
                        <v-data-table v-bind:headers="team_headers" v-bind:items="teams" v-bind:search="searchTeams">
                            <template slot="no-data">
                                <div>No teams in game</div>
                            </template>
                            <template slot="no-results">
                                <div>No options found for search</div>
                            </template>
                            <template v-slot:item.removeTeam="{ item }">
                                <v-icon color="#ff0000" medium title="Remove" @click='removeTeam(item)'>
                                    mdi-minus-circle
                                </v-icon>
                            </template>
                        </v-data-table>
                        <br>
                        <font color=red>{{message}}</font>
                        <br><br>
                        <v-layout justify-center>
                            <v-btn class=mx-12 color="#61578b" v-on:click="addTeams"><font color=white>Add Teams</font></v-btn>
                                <v-label>Teams in Game</v-label>
                                <integer-plusminus :min="min" :max="max" :step="step" v-model="number">
                                    <div class=my-1>{{number}}</div>
                                </integer-plusminus>
                        </v-layout>
                        <br><br>
                        <v-data-table v-if="view_add_team_table" v-bind:headers="other_team_headers" v-bind:items="other_teams" v-bind:search="searchOtherPlayer">
                            <template slot="no-results">
                                <div>No options found for search</div>
                            </template>
                            <template v-slot:item.addTeam="{ item }">
                                <v-icon color="#008800" medium title="Add" @click='addTeam(item)'>
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
import HostDropdown from './HostDropdown';
import {IntegerPlusminus} from 'vue-integer-plusminus'
export default {
    components: {HostDropdown, IntegerPlusminus},
    watch: {
        date() {
            this.formattedDate = this.formatDate(this.date);
            this.edit_date_visible = false;
        }
    },
    data: function() {
        return {
            date: new Date().toISOString().substr(0, 10),
            formattedDate: this.formatDate(new Date().toISOString().substr(0, 10)),
            number: 2,
            step: 1,
            min: 0,
            max: 8,
            time_disabled: 5,
            selectedGame: {},
            selectedPlayer: null,
            num_teams: 2,
            search: "",
            searchTeams: "",
            searchOtherPlayer: "",
            game_headers: [
                {text: "Id", value: "id"},
                {text: "Name", value: "name"},
                {text: "Host", value: "host"},
                {text: "Type of Game", value: "style"},
                {text: "Ammunition", value: "maxammo"},
                {text: "Time Gun Disabled (seconds)", value: "timedisabled"},
                {text: "Max Lives", value: "maxLives"},
                {text: "Pausing Possible", value: "pause"},
                {text: "Date", value: "date"},
                {text: "Code", value: "code"},
                {text: "Number of Teams", value: "num_teams"},
                {text: "Team Selection", value: "team_selection"},
                {text: "Teams", value: "teams"},
                {text: "Edit Teams", value: "editTeams"},
                {text: "Edit Game", value: "editGame"},
                {text: "Delete Game", value: "deleteGame"}
            ],
            other_teams: [],
            other_team_headers: [
                {text: "Name", value: "name"},
                {text: "Add Team", value: "addTeam"}
            ],
            teams: [],
            team_headers: [
                {text: "Name", value: "name"},
                {text: "Remove Team", value: "removeTeam"}
            ],
            games: [],
            name_rules: [
                v => !!v || 'Name is required'
            ],
            infinite_life_rules: [
                () => this.verifyLives()
            ],
            infinite_ammo_rules: [
                () => this.verifyAmmo()
            ],
            solo: false,
            automatic: false,
            edit_game_visible: false,
            edit_teams_visible: false,
            edit_date_visible: false,
            new_team_visible: false,
            message: "",
            action: "",
            valid: false,
            view_add_team_table: false,
            view_team_choices: true,
        }
    },
    mounted: function () {
        this.$axios.get('games/upcoming').then(response => {
            const game_list = response.data;
            var games = [];
            for (var i = 0; i < game_list.length; i++) {
                const team_list = game_list[i].teams;
                var teams = [];
                for (var j = 0; j < team_list.length; j++) {
                    teams.push(team_list[j].name);
                }
                games.push({
                    id: response.data[i].id,
                    name: response.data[i].name,
                    host: response.data[i].host,
                    style: response.data[i].style,
                    maxammo: response.data[i].maxammo,
                    infiniteAmmo: response.data[i].maxammo == -1,
                    timedisabled: response.data[i].timedisabled,
                    maxLives: response.data[i].maxLives,
                    infiniteLives: response.data[i].maxLives == -1,
                    pause: response.data[i].pause,
                    date: response.data[i].date,
                    code: response.data[i].code,
                    num_teams: response.data[i].num_teams,
                    team_selection: response.data[i].team_selection,
                    teams: teams,
                    team_list: game_list[i].teams
                })
            }
            this.games = games;
        })
    },
    methods: {
        verifyLives() {
            const r = (!!this.selectedGame.maxLives || this.selectedGame.infiniteLives || 'Absolutely no opporunity for success');
            console.log(r);
            return r;
        },
        verifyAmmo() {
            const r = (!!this.selectedGame.maxammo || this.selectedGame.infiniteAmmo || 'Still no opporunity for success');
            console.log(r);
            return r;
        },
        decreaseTeams() {
            if (this.num_teams > 2) this.num_teams--;
        },
        increaseTeams() {
            if (this.num_teams < 8) this.num_teams++;
        },
        editDate() {
            this.edit_date_visible = true;
        },
        formatDate(date) {
            if (!date) return null;
            
            const date_array = date.split("-");
            return `${date_array[1]}-${date_array[2]}-${date_array[0]}`;
        },
        selectPlayer(player) {
            this.selectedPlayer = player.value;
        },
        editGame(game) {
            this.selectedGame = JSON.parse(JSON.stringify(game));
            this.action = "Edit";
            this.selectedPlayer = game.host;
            this.time_disabled = game.timedisabled;
            this.solo = (game.style == 'solo');
            if (game.style != 'solo') {
                this.num_teams = game.num_teams;
            }
            this.automatic = (game.team_selection == 'automatic');
            this.edit_game_visible = true;
        },
        deleteGame(game) {
            if (!confirm(`Are you sure you want to delete ${game.name} and all database items associated with this game?`)) {
                return;
            }
            this.$axios.delete(`game/${game.id}`).then(() => {
                this.refresh();
            });
        },
        addTeams() {
            this.$axios.get(`teams/notingame/${this.selectedGame.id}`).then((response) => {
                if (response.status == 200) {
                    this.other_teams = response.data;
                    this.view_add_team_table = true
                }  
                else console.log("An error has occurred")
            })
        },
        addTeam(item) {
            if (!confirm(`Add ${item.name} to ${this.selectedGame.name}?`)) {
                return;
            }
            this.$axios.post('/create/contest', {
                team_id: item.id,
                game_id: this.selectedGame.id
            }).then((response) => {
                if (response.status == 200) {
                    const other_team_index = this.other_teams.findIndex((team) => {
                        return team.name == item.name;
                    })
                    this.teams.push(this.other_teams[other_team_index]);
                    this.other_teams.splice(other_team_index, 1);
                }
                else {
                    console.log("An error has occurred");
                }
            })

        },
        done() {
            if (this.number != this.teams.length) {
                this.message = "Number of teams assigned to game not equal to number of teams listed in game object";
            } 
            else if (this.number == 1) {
                this.message = "1 is not a valid number of teams"
            }
            else {
                if (this.number == 0) {
                    if (!confirm("This will change the type of game to solo. You can change this at any time by editing the game. Are you sure you want to do this?")) {
                        return;
                    }
                    this.$axios.patch(`change/game/${this.selectedGame.id}`, {
                        num_teams: 0,
                        style: "solo"
                    }).then(() => {
                        this.teams = [];
                        this.other_teams = []
                        this.edit_teams_visible = false;
                        this.view_add_team_table = false;
                        this.refresh();
                        this.selectedGame = {};
                        this.message = "";
                    })
                }
                else {
                    if (this.number != this.selectedGame.num_teams) {
                        this.$axios.patch(`change/game/${this.selectedGame.id}`, {
                            num_teams: this.number
                        }).then((response) => {
                            if (response.status == 200) {
                                this.teams = [];
                                this.other_teams = []
                                this.edit_teams_visible = false;
                                this.view_add_team_table = false;
                                this.refresh();
                                this.selectedGame = {};
                                this.message = "";
                            }
                            else this.message = "A problem occurred. Please check your input values and try again";
                        })
                    }
                    else {
                        this.teams = [];
                        this.other_teams = []
                        this.edit_teams_visible = false;
                        this.view_add_team_table = false;
                        this.refresh();
                        this.selectedGame = {};
                        this.message = "";
                    }
                }
            }
        },
        editTeams(item) {
            this.selectedGame = JSON.parse(JSON.stringify(item));
            this.action = "Edit"
            this.edit_teams_visible = true;
            var teams = [];
            for (var i = 0; i < item.team_list.length; i++) {
                teams.push({name: item.team_list[i].name, id: item.team_list[i].id});
            }
            this.teams = teams;
            this.number = item.num_teams;
        },
        removeTeam(item) {
            if (!confirm(`Remove ${item.name} from ${this.selectedGame.name}?`)) {
                return;
            }
            this.$axios.delete(`team/game/${item.id}/${this.selectedGame.id}`).then((response) => {
                if (response.status == 200) {
                    const team_index = this.teams.findIndex((team) => {
                        return team.name == item.name;
                    })
                    this.other_teams.push(this.teams[team_index]);
                    this.teams.splice(team_index, 1);
                }
                else {
                    console.log("An error has occurred");
                }
            })
        },
        addGame() {
            this.selectedGame = {infiniteLives: false, infiniteAmmo: false};
            this.action = "New";
            this.edit_game_visible = true;
        },
        postGame() {
            if (this.selectedPlayer == "") this.selectedPlayer = null;
            if (!this.selectedGame.code) this.selectedGame.code = "";

            if (this.solo) {
                this.selectedGame.style = "solo";
                this.num_teams = 0;
                this.selectedGame.team_selection = 'automatic';
            }
            else {
                this.selectedGame.style = "team"
                if (this.automatic) this.selectedGame.team_selection = 'automatic';
                else this.selectedGame.team_selection = 'manual';
            }

            if (this.selectedGame.infiniteAmmo) this.selectedGame.maxammo = -1;
            if (this.selectedGame.infiniteLives) this.selectedGame.maxLives = -1;

            this.$axios.post(`create/game`, {
                maxammo: this.selectedGame.maxammo,
                style: this.selectedGame.style,
                timedisabled: this.time_disabled,
                maxLives: this.selectedGame.maxLives,
                pause: this.selectedGame.pause,
                date: this.formattedDate,
                code: this.selectedGame.code,
                num_teams: this.num_teams,
                team_selection: this.selectedGame.team_selection,
                name: this.selectedGame.name,
                host: this.selectedPlayer
            }).then((response) => {
                this.edit_game_visible = false;
                this.message = "";
                this.selectedPlayer = null;
                this.refresh();
                this.num_teams = 2;
                this.solo = false;
                this.date = new Date().toISOString().substr(0, 10);
                this.formattedDate = this.formatDate(new Date().toISOString().substr(0, 10));
                this.time_disabled = 5;
                if (response.data.num_teams != 0) {
                    this.selectedGame = {
                        id: response.data.id,
                        name: response.data.name,
                        host: response.data.host,
                        style: response.data.style,
                        maxammo: response.data.maxammo,
                        infiniteAmmo: response.data.maxammo == -1,
                        timedisabled: response.data.timedisabled,
                        maxLives: response.data.maxLives,
                        infiniteLives: response.data.maxLives == -1,
                        pause: response.data.pause,
                        date: response.data.date,
                        code: response.data.code,
                        num_teams: response.data.num_teams,
                        team_selection: response.data.team_selection,
                        team_list: [],
                    }
                    this.editTeams(this.selectedGame);
                }
                else {
                    this.message = "Error occurred. Please ensure all fields have valid input";
                }
            }).catch(() => {
                this.message = "Error occurred. Please ensure all fields have valid input";
            })
        },
        patchGame() {
            if (this.selectedPlayer == "") this.selectedPlayer = null;
            if (!this.selectedGame.code) this.selectedGame.code = "";

            if (this.solo) {
                this.selectedGame.style = "solo";
                this.num_teams = 0;
                this.selectedGame.team_selection = 'automatic';
            }
            else {
                this.selectedGame.style = "team"
                if (this.automatic) this.selectedGame.team_selection = 'automatic';
                else this.selectedGame.team_selection = 'manual';
            }

            if (this.selectedGame.infiniteAmmo) this.selectedGame.maxammo = -1;
            if (this.selectedGame.infiniteLives) this.selectedGame.maxLives = -1;

            this.$axios.patch(`change/game/${this.selectedGame.id}`, {
                maxammo: this.selectedGame.maxammo,
                style: this.selectedGame.style,
                timedisabled: this.time_disabled,
                maxLives: this.selectedGame.maxLives,
                pause: this.selectedGame.pause,
                date: this.formattedDate,
                code: this.selectedGame.code,
                num_teams: this.num_teams,
                team_selection: this.selectedGame.team_selection,
                name: this.selectedGame.name,
                host: this.selectedPlayer
            }).then((response) => {
                if (response.status == 200) {
                    this.edit_game_visible = false;
                    this.message = "";
                    this.selectedPlayer = null;
                    this.refresh();
                    this.num_teams = 2;
                    this.solo = false;
                    this.date = new Date().toISOString().substr(0, 10);
                    this.formattedDate = this.formatDate(new Date().toISOString().substr(0, 10));
                    this.time_disabled = 5;
                    if (response.data.teams.length != response.data.num_teams) {
                        var teams = this.selectedGame.team_list;
                        this.selectedGame = {
                            id: response.data.id,
                            name: response.data.name,
                            host: response.data.host,
                            style: response.data.style,
                            maxammo: response.data.maxammo,
                            infiniteAmmo: response.data.maxammo == -1,
                            timedisabled: response.data.timedisabled,
                            maxLives: response.data.maxLives,
                            infiniteLives: response.data.maxLives == -1,
                            pause: response.data.pause,
                            date: response.data.date,
                            code: response.data.code,
                            num_teams: response.data.num_teams,
                            team_selection: response.data.team_selection,
                            team_list: teams,
                        }
                        this.editTeams(this.selectedGame);
                    }
                    else (this.selectedGame = {});
                }
                else {
                    this.message = "Error occurred. Please ensure all fields have valid input";
                }
            }).catch(() => {
                this.message = "Error occurred. Please ensure all fields have valid input";
            })
        },
        submitGame() {
            if (this.$refs.form.validate()) {
                if (this.action == "Edit") this.patchGame();
                else this.postGame();
            }
            else {
                this.message = "Not all fields are valid";
                return;
            }
        },
        cancel() {
            this.edit_game_visible = false;
            this.message = "";
            this.selectedGame = {};
            this.selectedPlayer = null;
        },
        refresh() {
            this.$axios.get('games/upcoming').then(response => {
                const game_list = response.data;
                var games = [];
                for (var i = 0; i < game_list.length; i++) {
                    const team_list = game_list[i].teams;
                    var teams = [];
                    for (var j = 0; j < team_list.length; j++) {
                        teams.push(team_list[j].name);
                    }
                    games.push({
                        id: response.data[i].id,
                        name: response.data[i].name,
                        host: response.data[i].host,
                        style: response.data[i].style,
                        maxammo: response.data[i].maxammo,
                        infiniteAmmo: response.data[i].maxammo == -1,
                        timedisabled: response.data[i].timedisabled,
                        maxLives: response.data[i].maxLives,
                        infiniteLives: response.data[i].maxLives == -1,
                        pause: response.data[i].pause,
                        date: response.data[i].date,
                        code: response.data[i].code,
                        num_teams: response.data[i].num_teams,
                        team_selection: response.data[i].team_selection,
                        teams: teams,
                        team_list: game_list[i].teams
                    })
                }
                this.games = games;
            })
        }
    }
}
</script>