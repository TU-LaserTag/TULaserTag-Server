<template>
    <v-app>
        <nav-bar />
        <side-bar />
        <v-content>
            <v-container fluid>
                <router-view>
                </router-view>
            </v-container>
        </v-content>
        <v-footer app class="pa-3" color=#61578b>
            <v-layout justify-center class="font-weight-bold">
                <span class="white--text">Laser Tag &mdash; Taylor University Computer Science and Physics Departments</span>
            </v-layout>
        </v-footer>
    </v-app>
</template>

<script>
import NavBar from "./components/NavBar.vue";
import SideBar from "./components/SideBar.vue";

export default {
    name: "App",
    components: {
        NavBar,
        SideBar,
    }
};
</script>