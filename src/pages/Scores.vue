<template>
    <div>
        <v-layout justify-center><h1 style="color:#61578b">Score Page</h1></v-layout>
        <v-container>
            <v-row>
                <v-col>
                    <v-layout justify-center>
                        <v-card width="500px" height="70px" style="padding:10px" color="#61578b" raised>
                            <game-dropdown v-bind:id="selectedGameId" v-on:selection="selectGame"
                            ></game-dropdown>
                        </v-card>
                    </v-layout>
                </v-col>
            </v-row>
        </v-container>
        <br>
        <team-scores-table v-if="(teams && table)" v-bind:id=selectedGameId>
        </team-scores-table>
        <solo-scores-table v-if="(!teams && table)" v-bind:id=selectedGameId>
        </solo-scores-table>
    </div>
</template>

<script>
import GameDropdown from "../components/GameDropdown";
import SoloScoresTable from "../components/SoloScoresTable";
import TeamScoresTable from "../components/TeamScoresTable";
export default {
    name: "Scores",
    components: {GameDropdown, SoloScoresTable, TeamScoresTable},
    watch: {
        $route(to) {
            // if the user selects blank, reset the page.
            if (!to.params.id) {
                this.$router.push({ name: 'scores', params: {id: -1}});
            }
            if (to.params.id == -1) this.table = false;
            this.selectedGameId = parseInt(to.params.id);
        }
    },
    data: function() {
        return {
            teams: false,   
            selectedGameId: -1,
            table: false
        }
    },
    mounted: function() {
        if (this.$route.params.id != 0) {
            this.selectedGameId = parseInt(this.$route.params.id);
            if (this.$route.params.id != -1) this.table = true;
        }
        else this.$router.push({ name: 'scores', params: {id: -1}})
    },
    methods: {
        selectGame(game_id) {
            this.teams = game_id.teams;
            this.table = game_id.table;
            this.$router.push({ name: 'scores', params: {id: game_id.value}});
        },
    }
}
</script>