<template>
    <div>
        <v-card>
            <v-card-title>
                <v-row>
                    <v-col cols=4>
                        <v-btn class="ml-2" color="#61578b" raised v-on:click="addGun">
                        <font color=white>Add Gun</font>
                        </v-btn>
                        <v-btn class="ml-2" color="#61578b" raised v-on:click="swapGunTable">
                        <font color=white>Swap Guns</font>
                        </v-btn>
                        <v-btn class="ml-2" color="#61578b" raised v-on:click="refresh">
                        <font color=white>Refresh</font>
                        </v-btn>
                    </v-col>
                    <v-col cols=4>
                        <v-layout justify-center><h3>Gun Table</h3></v-layout>
                    </v-col>
                    <v-spacer />
                    <v-col cols=2>
                        <v-text-field class="pt-0 mt-0" v-model="search" label="Search" single-line hide-details ></v-text-field>
                    </v-col>
                </v-row>
            </v-card-title>
            <v-row>
                <v-col>
                    <v-layout justify-center><h4>Used Guns</h4></v-layout>
                    <v-data-table v-bind:headers="gun_headers" v-bind:items="used_guns" v-bind:search="search">
                        <template slot="no-data">
                            <div>No guns in database</div>
                        </template>
                        <template slot="no-results">
                            <div>No options found for search</div>
                        </template>
                        <template v-slot:item.editGun="{ item }">
                            <v-icon color="#ae936c" medium title="Edit" @click='editGun(item)'>
                                mdi-lead-pencil
                            </v-icon>
                        </template>
                    </v-data-table>
                </v-col>
                <v-divider vertical />
                <v-col>
                    <v-layout justify-center><h4>Unused Guns</h4></v-layout>
                    <v-data-table v-bind:headers="gun_headers" v-bind:items="unused_guns" v-bind:search="search">
                        <template slot="no-data">
                            <div>No guns in database</div>
                        </template>
                        <template slot="no-results">
                            <div>No options found for search</div>
                        </template>
                        <template v-slot:item.editGun="{ item }">
                            <v-icon color="#ae936c" medium title="Edit" @click='editGun(item)'>
                                mdi-lead-pencil
                            </v-icon>
                        </template>
                    </v-data-table>
                </v-col>
            </v-row>
        </v-card>
        
        <div>
            <v-dialog persistent v-model="edit_gun_visible" max-width=800px>
                <v-card>
                    <v-card-title>
                        <v-layout justify-center>
                        {{action}} Gun
                        </v-layout>
                    </v-card-title>
                    <v-form v-model="valid">
                        <v-card-text>
                            <v-label>Mac Address</v-label>
                            <v-text-field v-bind:rules="mac_address_rules" v-model="selectedGun.mac_address">
                            </v-text-field>
                            <br>
                            <span style="color:red; font-size:17px">{{message}}</span>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer />
                            <v-btn v-on:click="submitGun" :disabled="!valid">Submit</v-btn>
                            <v-btn v-on:click="cancel">Cancel</v-btn>
                        </v-card-actions>
                    </v-form>
                </v-card>
                
            </v-dialog>
        </div>
        <div>
            <v-dialog persistent v-model="swap_guns_visible" max-width="800px">
                <v-card>
                    <v-card-title>
                        <v-layout justify-center>
                            Swap Guns
                        </v-layout>
                    </v-card-title>
                    <v-row>
                        <v-col>
                            <v-layout justify-center><h4>Used Guns</h4></v-layout>
                            <v-data-table v-model="used_selections" v-bind:headers="swap_gun_headers" v-bind:items="used_guns" v-bind:search="search" show-select single-select>
                                <template slot="no-data">
                                    <div>No guns in database</div>
                                </template>
                                <template slot="no-results">
                                    <div>No options found for search</div>
                                </template>
                            </v-data-table>
                        </v-col>
                        <v-divider vertical />
                        <v-col>
                            <v-layout justify-center><h4>Unused Guns</h4></v-layout>
                            <v-data-table v-model="unused_selections" v-bind:headers="swap_gun_headers" v-bind:items="unused_guns" v-bind:search="search" show-select single-select>
                                <template slot="no-data">
                                    <div>No guns in database</div>
                                </template>
                                <template slot="no-results">
                                    <div>No options found for search</div>
                                </template>
                            </v-data-table>
                        </v-col>
                    </v-row>
                    <v-row>
                        <span style="color:red; font-size:17px">{{message}}</span>
                    </v-row>
                    <v-card-actions>
                        <v-col cols=3>
                        </v-col>
                        <v-col>
                            <v-layout justify-center>
                                <v-btn color="#61578b" raised v-on:click="swapGuns">
                                    <font color=white>Swap Guns</font>
                                </v-btn>
                            </v-layout>
                        </v-col>
                        <v-col cols=2>
                        </v-col>    
                        <v-btn v-on:click="done" class="ma-0 pa-0">Done</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </div>
    </div>
</template>

<script>
export default {
    data: function() {
        return {
            used_selections: [],
            unused_selections: [],
            search: "",
            edit_gun_visible: false,
            swap_guns_visible: false,
            action: "",
            valid: false,
            selectedGun: {},
            mac_address_rules: [
                v => !!v || 'Mac Address is required'
            ],
            used_guns: [],
            unused_guns: [],
            gun_headers: [
                {text: "Id", value: "id"},
                {text: "Mac Address", value: "mac_address"},
                {text: "Edit Gun", value: "editGun"},
            ],
            swap_gun_headers: [
                {text: "Id", value: "id"},
                {text: "Mac Address", value: "mac_address"}
            ],
            message: ""
        }
    },
    mounted: function() {
        this.$axios.get('guns').then(response => {
            const used_gun_list = response.data.used_list;
            const unused_gun_list = response.data.not_used_list;
            var used_guns = [];
            var unused_guns = [];
            for (var i = 0; i < used_gun_list.length; i++) {
                used_guns.push({
                    index: i,
                    id: used_gun_list[i].id,
                    mac_address: used_gun_list[i].mac_address,
                })
            }
            for (var j = 0; j < unused_gun_list.length; j++) {
                unused_guns.push({
                    index: j,
                    id: unused_gun_list[j].id,
                    mac_address: unused_gun_list[j].mac_address,
                })
            }
            this.used_guns = used_guns;
            this.unused_guns = unused_guns
        })
    },
    methods: {
        refresh() {
            this.$axios.get('guns').then(response => {
                const used_gun_list = response.data.used_list;
                const unused_gun_list = response.data.not_used_list;
                var used_guns = [];
                var unused_guns = [];
                for (var i = 0; i < used_gun_list.length; i++) {
                    used_guns.push({
                        index: i,
                        id: used_gun_list[i].id,
                        mac_address: used_gun_list[i].mac_address,
                    })
                }
                for (var j = 0; j < unused_gun_list.length; j++) {
                    unused_guns.push({
                        index: j,
                        id: unused_gun_list[j].id,
                        mac_address: unused_gun_list[j].mac_address,
                    })
                }
                this.used_guns = used_guns;
                this.unused_guns = unused_guns
            })
        },
        editGun(gun) {
            this.selectedGun = JSON.parse(JSON.stringify(gun));
            this.action = "Edit";
            this.edit_gun_visible = true;
        },
        swapGunTable() {
            this.unused_selections = [],
            this.used_selections = [],
            this.swap_guns_visible = true;
        },
        addGun() {
            this.selectedGun = {};
            this.action = "New";
            this.edit_gun_visible = true;
        },
        submitGun() {
            if (this.action == "Edit") this.patchGun();
            else this.postGun();
        },
        patchGun() {
            this.$axios.patch(`gun`, {
                gun_id: this.selectedGun.id,
                mac_address: this.selectedGun.mac_address,
            }).then((response) => {
                if (response.status == 200) {
                    this.edit_gun_visible = false;
                    this.message = "";
                    this.selectedGun = {};
                    this.refresh();
                }
                else {
                    this.message = "Error occurred. Please ensure all fields have valid input";
                }
            }).catch(() => {
                this.message = "Error occurred. Please ensure all fields have valid input";
            })
        },
        postGun() {
            this.$axios.post(`create/gun`, {
                mac_address: this.selectedGun.mac_address,
            }).then((response) => {
                if (response.status == 200) {
                    this.edit_gun_visible = false;
                    this.message = "";
                    this.selectedGun = {};
                    this.refresh();
                }
                else {
                    this.message = "Error occurred. Please ensure all fields have valid input";
                }
            }).catch(() => {
                this.message = "Error occurred. Please ensure all fields have valid input";
            })
        },
        cancel() {
            this.selectedGun = {};
            this.edit_gun_visible = false;
            this.message = "";
        },
        done() {
            this.swap_guns_visible = false;
            this.used_selections = [];
            this.unused_selections = [];
            this.refresh;
            this.message = "";
        },
        swapGuns() {
            const used_selections = this.used_selections;
            const unused_selections = this.unused_selections;
            if (used_selections.length != unused_selections.length) {
                this.message = "Amount of guns being swapped are not equal"
                return;
            }
            else if (used_selections.length == 0) return;
            var gun_objects = [];
            for (var i = 0; i < used_selections.length; i++) {
                gun_objects.push({
                    current_gun_id: used_selections[i].id, 
                    new_gun_id: unused_selections[i].id,
                    mac_address: used_selections[i].mac_address
                });
                gun_objects.push({
                    current_gun_id: unused_selections[i].id,
                    new_gun_id: used_selections[i].id,
                    mac_address: unused_selections[i].mac_address
                });
            }
            this.$axios.patch('change/guns', gun_objects).then((response) =>{
                if (response.status == 200) {
                    for (var k = 0; k < used_selections.length; k++) {
                        var temp = this.used_guns[used_selections[k].index];
                        this.used_guns[used_selections[k].index] = this.unused_guns[unused_selections[k].index];
                        this.unused_guns[unused_selections[k].index] = temp;
                    }
                    this.used_selections = [];
                    this.unused_selections = [];
                    this.message = "";
                    this.refresh();
                }
            })
        }
    }
}
</script>