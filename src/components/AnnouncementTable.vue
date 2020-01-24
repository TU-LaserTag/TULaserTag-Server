<template>
    <div>
        <v-card width="800px">
            <v-card-title>
                <v-row>
                    <v-col cols=4>
                        <v-row>
                        <v-btn class="ml-2" color="#61578b" raised v-on:click="addAnnouncement">
                        <font color=white>Add Announcement</font>
                        </v-btn>
                        </v-row>
                        <v-row>
                        <v-btn class="my-3 ml-2" color="#61578b" raised v-on:click="refresh">
                        <font color=white>Refresh</font>
                        </v-btn>
                        </v-row>
                    </v-col>
                    <v-col cols=4>
                        <v-layout justify-center><h3>Announcement Table</h3></v-layout>
                    </v-col>
                    <v-spacer />
                    <v-col cols=2>
                        <v-text-field class="pt-0 mt-0" v-model="search" label="Search" single-line hide-details ></v-text-field>
                    </v-col>
                </v-row>
            </v-card-title>
            <v-data-table v-bind:headers="announcement_headers" v-bind:items="announcements" v-bind:search="search" show-expand>
                <template slot="no-data">
                    <div>No announcements in database</div>
                </template>
                <template slot="no-results">
                    <div>No options found for search</div>
                </template>
                <template v-slot:item.editAnnouncement="{ item }">
                    <v-icon color="#ae936c" medium title="Edit" @click='editAnnouncement(item)'>
                        mdi-lead-pencil
                    </v-icon>
                </template>
                <template v-slot:item.deleteAnnouncement="{ item }">
                    <v-icon color="#ae936c" medium title="Delete" @click='deleteAnnouncement(item)'>
                        mdi-delete
                    </v-icon>
                </template>
                <template v-slot:expanded-item="{headers, item}">
                    <td :colspan="announcement_headers.length"><br>{{item.announcement}}<br><br></td>
                    </template>
            </v-data-table>
        </v-card>
        
        <div>
            <v-dialog persistent v-model="edit_announcement_visible" max-width=800px>
                <v-card>
                    <v-card-title>
                        <v-layout justify-center>
                        {{action}} Announcement
                        </v-layout>
                    </v-card-title>
                    <v-form v-model="valid">
                        <v-card-text>
                            <v-label>Announcement</v-label>
                            <v-textarea v-bind:rules="announcement_rules" v-model="selectedAnnouncement.announcement">
                            </v-textarea>
                            <br>
                            <v-label>Game Id</v-label>
                            <game-id-dropdown v-bind:id="selectedGameId"
                            v-on:selection="selectGameId"></game-id-dropdown>
                            <span style="color:red; font-size:17px">{{message}}</span>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer />
                            <v-btn v-on:click="submitAnnouncement" :disabled="!valid">Submit</v-btn>
                            <v-btn v-on:click="cancel">Cancel</v-btn>
                        </v-card-actions>
                    </v-form>
                </v-card>
            </v-dialog>
        </div>
    </div>
</template>

<script>
import GameIdDropdown from './GameIdDropdown';
export default {
    components: {GameIdDropdown},
    data: function() {
        return {
            search: "",
            edit_announcement_visible: false,
            action: "",
            valid: false,
            selectedAnnouncement: {},
            announcement_rules: [
                v => !!v || 'Announcement is required'
            ],
            announcements: [],
            announcement_headers: [
                {text: "Id", value: "id"},
                {text: "Time", value: "time"},
                {text: "Game Id", value: "game_id"},
                {text: "Edit Announcement", value: "editAnnouncement"},
                {text: "Delete Announcement", value: "deleteAnnouncement"},
                {text: '', value: 'data-table-expand'}
            ],
            selectedGameId: null,
            message: ""
        }
    },
    mounted: function() {
        this.$axios.get('announcements').then(response => {
            const announcement_list = response.data;
            var announcements = [];
            for (var i = 0; i < announcement_list.length; i++) {
                announcements.push({
                    id: response.data[i].id,
                    announcement: response.data[i].announcement,
                    game_id: response.data[i].game_id,
                    time: response.data[i].time,
                })
            }
            this.announcements = announcements;
        })
    },
    methods: {
        refresh() {
            this.$axios.get('announcements').then(response => {
            const announcement_list = response.data;
            var announcements = [];
            for (var i = 0; i < announcement_list.length; i++) {
                announcements.push({
                    id: response.data[i].id,
                    announcement: response.data[i].announcement,
                    game_id: response.data[i].game_id,
                    time: response.data[i].time,
                })
            }
            this.announcements = announcements;
            })
        },
        editAnnouncement(announcement) {
            this.selectedAnnouncement = JSON.parse(JSON.stringify(announcement));
            this.action = "Edit";
            if (announcement.game_id) {
                this.selectedGameId = announcement.game_id;
            }
            this.edit_announcement_visible = true;
        },
        addAnnouncement() {
            this.selectedAnnouncement = {};
            this.action = "New";
            this.edit_announcement_visible = true;
        },
        deleteAnnouncement(announcement) {
            if (!confirm(`Are you sure you want to delete this announcement?`)) {
                return;
            }
            this.$axios.delete(`announcements/${announcement.id}`).then(() => {
                this.refresh();
            });
        },
        submitAnnouncement() {
            if (this.action == "Edit") this.patchAnnouncement();
            else this.postAnnouncement();
        },
        patchAnnouncement() {
            if (!this.selectedGameId) this.selectedGameId = null;
            this.$axios.patch(`announcements/${this.selectedAnnouncement.id}`, {
                announcement: this.selectedAnnouncement.announcement,
                game_id: this.selectedGameId,
                time: new Date()
            }).then((response) => {
                if (response.status == 200) {
                    this.edit_announcement_visible = false;
                    this.message = "";
                    this.selectedAnnouncement = {};
                    this.selectedGameId = null;
                    this.refresh();
                }
                else {
                    this.message = "Error occurred. Please ensure all fields have valid input";
                }
            }).catch(() => {
                this.message = "Error occurred. Please ensure all fields have valid input";
            })
        },
        postAnnouncement() {
            if (!this.selectedGameId) this.selectedGameId = null;
            this.$axios.post(`announcements`, {
                announcement: this.selectedAnnouncement.announcement,
                game_id: this.selectedGameId,
                time: new Date()
            }).then((response) => {
                if (response.status == 200) {
                    this.edit_announcement_visible = false;
                    this.message = "";
                    this.selectedAnnouncement = {};
                    this.selectedGameId = null;
                    this.refresh();
                }
                else {
                    this.message = "Error occurred. Please ensure all fields have valid input";
                }
            }).catch(() => {
                this.message = "Error occurred. Please ensure all fields have valid input";
            })
        },
        selectGameId(selection) {
            this.selectedGameId = selection.value;
        },
        cancel() {
            this.selectedAnnouncement = {};
            this.edit_announcement_visible = false;
            this.message = "";
        }
    }
}
</script>
