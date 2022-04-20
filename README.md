# Special manoeuvers
#### Video Demo:
https://youtu.be/aR-_omJQbkE

#### Description:

##### Goal
The goal is to help people with performing parking manoeuvres with a car. More specifically help with their spatial understanding when reverse parking and parallel parking. These are some of the requirements for getting a dutch driving licence. I am currently training to do these manoeuvres and I want a way to train outside of driving classes. 

##### Approach
To achieve this goal I made a driving game where the player can perform these special manoeuvres. It’s a top-view game so that the player has a different perspective when doing these manoeuvres, this will hopefully improve their spatial understanding. The player can choose what they want to do and can experiment with the different manoeuvres. The player's goal is to do all the manoeuvres without hitting the curb. To make it a bit more fun I also wanted a narrative element: the game is actually an alien simulation that teaches aliens how to drive with the eventual goal of invading the earth. If you complete your training the invasion can begin. 

##### Result
The result is a top-view parking game made with HTML, Javascript, and Phaser 3 ( a desktop and mobile HTML5 game framework). The player is put in an open world with multiple parking goals. Their goal is to reach each goal without hitting the curb or the other cars. All the functions are made with Javascript using Phaser 3, I made the assets using Affinity designer, and the audio is from Soundtrack loops (Synth Fuel 2 | Drones & FX).

This game includes:
**Driving**, the player is in control of a relatively realistic car. They use the arrow keys to steer and accelerate/ decelerate, and the spacebar to break.
**UI**, the player is first greeted with an explanation of the game (goal, story , and controls). When playing they can always click the menu button to reset/ check the controls/ pause. When playing they can also see the steering wheel and tire.
**Obstacles**, if the player either hits the curb or a car the progress gets reset and the player has to try again.
**Goals**, to win the game the player has to stay in the goals for about a second. Each goal checks if the player has reached it and if they are standing still with a straight steering wheel. When all the requirements are met the score goes up and the goal no longer lights up.
**Audio**, if the player clicks a button, hits an obstacle, or reaches a goal audio will play. Audio makes the game feel a bit more real/ immersive.

##### Further development
Some ideas I wanted to implement if I had more time. 
-   Specific levels for each goal to better train each manoeuvre individually 
-   A tutorial for each manoeuvre
-   Noise from the engine and background audio
-   More interesting and harder levels
-   A timer to the level
