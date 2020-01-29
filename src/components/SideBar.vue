<template>
      <v-navigation-drawer permanent app clipped expandOnHover color="black">
        <v-list
          nav
          class="py-0"
        >
          
          <v-list-item color=white v-bind:to="{name: 'scores', params: {id: -1}}">
            <v-list-item-icon>
              <v-icon color="#ae936c">mdi-scoreboard-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-title><div onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'" style="font-size:20px; color:#ae936c">Live scores</div></v-list-item-title>
          </v-list-item>

        <v-list-item color=white link v-bind:to="{ name: 'ltc'}">
          <v-list-item-icon>
            <v-icon color="#ae936c">mdi-script-text-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title><div onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'" style="font-size:20px; color:#ae936c">LTC</div></v-list-item-title>
        </v-list-item>

        <v-list-item color=white link v-bind:to="{ name: 'about-us'}">
          <v-list-item-icon>
            <v-icon color="#ae936c">mdi-information-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title><div onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'" style="font-size:20px; color:#ae936c">About this site</div></v-list-item-title>
        </v-list-item>

        <!-- <v-list-item color=white link v-bind:to="{ name: 'team-captain'}">
          <v-list-item-icon>
            <v-icon color="#ae936c">mdi-account-circle-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title><div onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'" style="font-size:20px; color:#ae936c">Team Captain</div></v-list-item-title>
        </v-list-item> -->

        <v-list-item color=white link v-bind:to="{ name: 'admin'}">
          <v-list-item-icon>
            <v-icon color="#ae936c">mdi-lock-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title><div onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'" style="font-size:20px; color:#ae936c">Admin</div></v-list-item-title>
        </v-list-item>

        </v-list>
      </v-navigation-drawer>
</template>