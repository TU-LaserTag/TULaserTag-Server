# TULaserTag-Server
Server Side Laser Tag system

# ToDo
## Overall Implementations
* Infinite Lives and Infinite Ammo need to be implemented in server and Vue Application
* League Play in all aspects
* Different Styles of Play
* Negative Points for Friendly Fire or penalties
* Better way to communicate errors to user in Vue application
* Visual improvements as desired
* Complexity as desired
* Communication between players, admins, team captains using messaging system

## Suggested Styles
* Assassin - each person has a target they must shoot
* Capture the flag - multiple teams with one flag to catch


# State of each part of project and notes for possible future improvements
## Server
* Add databases as needed - add file into models section and into db.js as required
* Add columns in databases as needed
* All handler functions in db.js thoroughly tested with laser guns
* Add in appropriate handlers for league play
* Add other handlers as needed
* Remove unnecessary handlers
* Server information:
    * Username: lasertagger
    * Password: GetBlasted?

## Vue Application
### Home
* More aesthetically pleasing
* Add links as needed
* Add implementation to see if a game is paused or not
### Scores
* Add to More Stats icon
    * Battery Life of Arduino
    * Number of Friendly Fire shots
    * Rate of firing to time in game
    * Long and Short Range shots
* Auto-refresher
* Implementation if a game is paused
* Add names of guns to database, and place those in table in place of Mac Address of Arduino
### LTC
* None needed - improve as desired
### About us
* None needed - improve as desired
### Team Captain - section is commented out in SideBar.vue
* Complete page
* Sign in box only thing currently
* Create webpage for captains to view, edit, register team, control team, etc.
### Admin
#### Teams
* None needed - improve as desired
#### Players
* Remove password - possibility of allowing access to them, but doubtful
* Add roles as needed
#### Leagues - section is commented out in Admin.vue
* Create section - need to create Vue components as needed
* Need League table and Admin control
* Add, edit, delete leagues, teams, etc.
#### Guns
* Create way to swap more than 2 guns at once - simplest fix would be to take off the single-select Boolean value, but need to find a way to swap ids around
* Find way to add in names for guns, perhaps in database as well, and display those on the table
#### Announcements
* None needed - improve as desired

# Additional Notes
* Find a way to prevent a person from being on more than one team in a single game on server side - it is doable on app, but server needs failsafe
* Find a way to generate more colors
* Allow players to sign into website to see stats, teams; change password, username; make requests of admins; etc.
* Need to ensure clean databases after testing before starting production