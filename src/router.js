import Vue from "vue";
import Router from "vue-router";

import Home from "./pages/Home.vue";
import Admin from "./pages/Admin.vue";
import About from "./pages/About.vue";
import Scores from "./pages/Scores.vue";
import LTC from "./pages/LTC.vue";
import TeamCaptain from "./pages/TeamCaptain.vue";

Vue.use(Router);

export default new Router({
    mode: "history",
    base: process.env.BASE_URL,
    routes: [
        {name: "home-page", path: "/", component: Home},
        {name: "admin", path: "/admin/", component: Admin},
        {name: "about-us", path: "/about/", component: About},
        {name: "scores", path: "/scores/", component: Scores},
        {name: "ltc", path: "/ltc/", component: LTC},
        {name: "team-captain", path: "/teamcaptain/", component: TeamCaptain}
    ]
})