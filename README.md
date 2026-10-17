# Fairway Tour

A top-down golf career game that runs in the browser. Everything lives in one file, `index.html`.

## Play

Open the folder in VS Code and run `index.html` with the Live Server extension (right-click, Open with Live Server).

## Controls

- Drag back from anywhere and release to swing. A longer pull hits harder.
- Pull past the white tick to overswing (up to 110%) for extra distance, with a risk of a hook or slice.
- Clubs are picked for you. Tap a club or press 1 to 4 to switch.
- V views the whole hole, L opens the leaderboard, M toggles sound.

## Features

- A full career across four tiers: Amateur, Mini-Tour, Challenger Tour, and Pro Tour, with 8 events each (32 courses)
- A fixed schedule per tier, two events per season, then a Tour Championship for the top 6 in the standings
- Standings points for every finish (majors and the Championship count double); the top 2 move up a tier
- Miss promotion and you can try Q-School, where only a win gets you through
- Entry fees and steep, tour-style payouts; if you're short, the fee comes out of your winnings
- Settings include parkland, pines, coast, Hill Country, desert, Galveston links, Caddo Lake bayou, and the windy Panhandle
- Pro shop with four club tiers, special balls, and ball colors
- Sponsors on every tier (two on the Challenger and Pro Tours): pick one goal per sponsor before each event, clear a Bronze, Silver, Gold, or Legendary set of goals, and earn that sponsor's exclusive gear
- Signature clubs from sponsors, fixed to the tier they come from, each with a specialty and a drawback; swap them into your bag in place of your shop clubs
- Sponsor-only cosmetics: striped polos, hat and pants colors, ball colors, and a gold watch, all listed in the shop with the sponsor that awards each one, sortable by type, sponsor, or level
- Your sponsor goals show on the in-round leaderboard with live progress
- Sloped greens with break arrows, plus tiered greens with steps between levels
- A realistic cup: a dead-center putt only drops if it would have stopped about 12 feet past, chips get even less, and off-center balls lip out
- 15 hole archetypes based on classic golf design: island green, Redan, Biarritz, Eden, bunker ring, long par 3, dogleg, Road hole, Cape, split fairway, Leven, bottle neck, drivable par 4, peninsula green, Hell bunker, reachable par 5, Sahara waste carry, and more
- Big Bend plays as a true desert course: rocky scrub off the fairway, mesquite, sotol, ocotillo, and boulders
- Pot bunkers, desert waste areas, drop zones, and the occasional lone tree in the fairway
- Pin positions rotate every time you play an event
- Courses blend into their surroundings past the white out-of-bounds stakes: thickening woods, pine forest, coastal dunes and ocean, Hill Country limestone, desert mesas, and azaleas
- Seasons follow the tour calendar: soft spring ground with rain, firm and fast summer, gusty fall wind with leaves, slick winter greens with snow, each with its own music
- Later events get narrower fairways, smaller greens, more trees, and stronger fields
- Fairway, rough, sand, green, water, trees, and wind
- A different roster of rivals on every tier, with a live leaderboard; the Pro Tour has one clear best player at the top
- Win Pro Tour Player of the Year to become Texas Champion, with a career recap and an invitation to the National Tour; after that, the Pro field gets sharper every year
- The National Tour: you plus 15 state champions (home states on the leaderboard), 9-hole events across the country, three national majors, and a National Championship
- Top 10 keep their National cards; 11th or worse goes back to Texas, and new state champions replace the bottom 6 every year
- Texas Pro Player of the Year winners move up to the National Tour, and old nemeses can come back as state champions with their rivalry intact
- Seven National course looks, each with its own scenery and twist: Rocky Mountain thin air (+8% carry), Pacific cliffs where the sea wind never drops, Arizona desert resort with brutal misses, soft Florida turf that stops the ball, Carolina sandhills with crowned greens, Midwest parkland with heavy rough, and Northeast links fescue
- National winter events are played in the sun belt, with no snow
- A 1,000-point Hall of Fame earned only on the National Tour, with an induction ceremony, a wall of legends, and rare rival inductees
- A nemesis who emerges from a close finish, follows you up the tiers, and plays as a Bomber, Grinder, or Showman; beat them 5 times to settle the rivalry
- A Career tab with stats, nemesis history, and a trophy case for championships, majors, tour cards, Q-School, Player of the Year, and rivalries
- Generated music and sound effects
- Customizable golfer with a name, skin tone, shirt, pants, and hat, plus a full swing animation
- Progress saves in the browser (localStorage)

## Roadmap

- National sponsors
- Two-round majors with a cut on the Pro and National tours
- Tension music on the final hole of a major, themed to the season
- Achievements
- Driving range, free practice, and a scorecard button
- New Game+
