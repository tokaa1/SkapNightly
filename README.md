# Modified version by Premiering
# For ViperHCF (Duncan, Timothy, Nephi, Xeify)

# SkapNightly: a fun fork of [SkapClient](https://nky5223.github.io/SkapClient)
SkapNightly is a fork of SkapClient made for looks, and customizability. [SkapClient](https://nky5223.github.io/SkapClient) is an unofficial client for the game [skap.io](https://skap.io). This project will likely only receive bug fixes from since the codebase is difficult to work with and there are new things coming :)

## No, you're not getting your own special hat, chat color, skin, etc.
Accounts which have special cosmetics in game are staying the same as [SkapClient](https://nky5223.github.io/SkapClient). No one else is getting anything special.

## Project Structure
The repo contains the static files of the game client. The code is very messy and unreadable, and I was only to add small refactors to the original codebase. For testing, you can use any simple static server program from Node, Python, etc. Unfortunately, due to the recaptcha, any forks of this project or the original SkapClient will not work unless the creator of skap.io adds your link to his recaptcha.

## Problems that are server related, not client-side
- Unable to leave the game.
- Unable to create games after joining a room.
- Unable to change hats during the session (refresh/tab) you recieved them.
- Unable to change player color without changing worlds.
- Staying logged in after logging out while in game.
