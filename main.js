var config = {
    type: Phaser.AUTO,
    width: 1500,
    height: 900,
    backgroundColor: '#f4f4f4',

    physics: {
        default: 'matter',
        matter: {
            //debug: true,
            gravity: {
                x: 0,
                y: 0
            }
        }
    },

    scene: {
        preload: preload,
        create: create,
        update: update
    }
        
};

var game = new Phaser.Game(config);

// Variables
let car_speed = 0;
let maxSpeed = 60;

let steering_wheel;
let steering_rotation = 0;
let front_wheels;
let rotation_speed = 0.3;

let isPlaying = false;
let score = 0;
// The minimum amount of seconds the player has to stay on the goal
let minTime = 1; 


// Teleportation spots
let tpSpots = [
    {x:1200, y:1699, angle:-45},    // Achteruit schuin vak
    {x:1070, y:1091, angle:136},    // Vooruit schuin vak
    {x:1485, y:120, angle:90},      // File parkeren
    {x:1289, y:695, angle:90},      // File parkeren
    {x:-144, y:770, angle:-180},    // Achteruit in een vak
    {x:231, y:1202, angle:-90}      // Vooruit in een vak
];

// How much can the player vary from the goal
let variation = {
    x: 20,
    y: 20,
    angle: 10,
};

function preload ()
{
    // Load in the assets
    this.load.image('car', 'assets/car.png');
    this.load.image('car_tire', 'assets/car_tire.png');
    this.load.image('parking_lot', 'assets/parking_lot.png');
    this.load.image('bg', 'assets/bg.png');
    this.load.image('front_wheels', 'assets/front_wheels.png');
    // Goal
    this.load.image('goal', 'assets/goal_available.png');
    this.load.image('goal_almost', 'assets/goal_almost.png');
    this.load.image('goal_correct', 'assets/goal_correct.png');    
    // UI
    this.load.image('steering_wheel', 'assets/steering_wheel.png');
    this.load.image('tire', 'assets/tire.png');
    // - Buttons
    this.load.image('ui_close', 'assets/ui_close.png');
    this.load.image('ui_close_over', 'assets/ui_close_over.png');
    this.load.image('ui_close_down', 'assets/ui_close_down.png');
    this.load.image('ui_menu', 'assets/ui_menu.png');
    this.load.image('ui_menu_over', 'assets/ui_menu_over.png');
    this.load.image('ui_menu_down', 'assets/ui_menu_down.png');
    this.load.image('ui_next', 'assets/ui_next.png');
    this.load.image('ui_next_over', 'assets/ui_next_over.png');
    this.load.image('ui_next_down', 'assets/ui_next_down.png');
    this.load.image('ui_reset', 'assets/ui_reset.png');
    this.load.image('ui_reset_over', 'assets/ui_reset_over.png');
    this.load.image('ui_reset_down', 'assets/ui_reset_down.png');
    // - Screens
    this.load.image('ui_begin', 'assets/ui_begin.png');
    this.load.image('ui_options', 'assets/ui_options.png');
    this.load.image('ui_end', 'assets/ui_won.png');
    // Audio
    this.load.audio('click', 'assets/audio/click.mp3')
    this.load.audio('hit', 'assets/audio/hit.mp3')
    this.load.audio('win1', 'assets/audio/win1.mp3')
    this.load.audio('win2', 'assets/audio/win2.mp3')
    // Misc.
    this.load.image('point', 'assets/point.png');
        
}

function create ()
{
    //############
    // ## AUDIO ##
    //############
    
    audio_click = this.sound.add('click');
    audio_hit = this.sound.add('hit');
    audio_win1 = this.sound.add('win1');
    audio_win2 = this.sound.add('win2');
    
    // Add assets to the screen
    bg = this.add.image(config.width/2, config.height/2, 'bg');
    
    //############
    //## PLAYER ##
    //############
    
    // The front velocity causes the player to move, the car 'follows' the front wheels.
    front_wheels = this.matter.add.image(config.width/2, config.height/2, 'front_wheels');
    front_wheels.setCollisionCategory(false);
    // Function that teleports the player
    front_wheels.teleport = function(x, y, angle){
        this.x = x;
        this.y = y;
        player.angle = angle;
        player.x = front_wheels.x + (-Math.sin(player.rotation) * 165);
        player.y = front_wheels.y + (Math.cos(player.rotation) * 165);
        car_speed = 0;
    };
    
    // Create the player car with it's origin point at the back wheels
    player_car = this.add.image(0,-100, 'car');
    // Car tires: front left, front right, bottom left, bottom right
    tires = [
        this.add.image(-53, -210, 'car_tire'),
        this.add.image(53, -210, 'car_tire'),
        //this.add.image(-50, 0, 'car_tire'),
        //this.add.image(50, 0, 'car_tire')
    ];
    
    container = this.add.container(config.width/2, config.height/2 - 150);
    container.setSize(player_car.width-30, player_car.height-20);
    container.add([tires[0], tires[1], player_car]);
    player = this.matter.add.gameObject(container);
    //player.setOrigin(0.5, 0.781);
    
    var Bodies = Phaser.Physics.Matter.Matter.Bodies;

    var rectA = Bodies.rectangle(0, -80, 110, 290);
    var rectB = Bodies.rectangle(0, -80, 60, 330);

    var compoundBody = Phaser.Physics.Matter.Matter.Body.create({
        parts: [ rectA, rectB ]
    });
    player.setExistingBody(compoundBody).setIgnoreGravity(true);
    player.body.position.y += 100;
    player.setToSleep();
    
    //#################
    //## UI ELEMENTS ##
    //#################
    // I am sure this part of the code could be significantly more compact and clear. Probably by abstracting the buttons and the panels (making a custom object/function). 
        
    steering_wheel = this.add.image(config.width - 150, config.height - 150, 'steering_wheel');
    tire = this.add.image(config.width - 150, config.height - 400, 'tire');
    scorelabel = this.add.text(config.width - 400, 80, "0 / 7", {color: '#FFF', fontSize: '50px'});
    //scorelabel.setFont("'Dubai'"); <- changing the font seems to change te font size as well
    
    //Beginning screen
    beginContainer = this.add.container(config.width/2, config.height/2);
    beginContainer.setSize(300, 300);
    beginPanel = this.add.image(0, 0, 'ui_begin');
    begin_ui_next = this.add.image(500, 270, 'ui_next');
    begin_ui_next.setInteractive();
    begin_ui_next.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => { begin_ui_next.setTexture('ui_next_down'), beginContainer.setVisible(false), isPlaying = true, resetProgress(), player.setAwake(), audio_click.play()});
    begin_ui_next.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => { begin_ui_next.setTexture('ui_next_over'), begin_ui_next.scale = 1.1});
    begin_ui_next.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => { begin_ui_next.setTexture('ui_next'), begin_ui_next.scale = 1});
    
    beginContainer.add([beginPanel, begin_ui_next]);
    
    // Options
    //optionContainer = this.add.container(config.width/2, config.height/2);
    //optionContainer.setSize(300, 300);
    
    optionPanel = this.add.image(config.width/2, config.height/2, 'ui_options');
    option_ui_reset = this.add.image(config.width/2 + 20, config.height/2 + 270, 'ui_reset');
    option_ui_reset.setInteractive();
    option_ui_reset.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => { option_ui_reset.setTexture('ui_reset_down'), setVisible(false, containerOptions), isPlaying = true, resetProgress(), audio_click.play()});
    option_ui_reset.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => { option_ui_reset.setTexture('ui_reset_over'), option_ui_reset.scale = 1.1});
    option_ui_reset.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => { option_ui_reset.setTexture('ui_reset'), option_ui_reset.scale = 1});
    option_ui_close = this.add.image(config.width/2 + 500, config.height/2 -270, 'ui_close');
    option_ui_close.setInteractive();
    option_ui_close.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => { option_ui_close.setTexture('ui_close_down'), setVisible(false, containerOptions), isPlaying = true, audio_click.play()});
    option_ui_close.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => { option_ui_close.setTexture('ui_close_over'), option_ui_close.scale = 1.1});
    option_ui_close.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => { option_ui_close.setTexture('ui_close'), option_ui_close.scale = 1});
    option_ui_next = this.add.image(config.width/2 + 500, config.height/2 + 270, 'ui_next');
    option_ui_next.setInteractive();
    option_ui_next.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => { option_ui_next.setTexture('ui_next_down'), setVisible(false, containerOptions), isPlaying = true, audio_click.play()});
    option_ui_next.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => { option_ui_next.setTexture('ui_next_over'), option_ui_next.scale = 1.1});
    option_ui_next.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => { option_ui_next.setTexture('ui_next'), option_ui_next.scale = 1});
    
    //optionContainer.add([optionPanel, option_ui_close, option_ui_next, option_ui_reset]);
    containerOptions = [
        optionPanel, option_ui_close, option_ui_next, option_ui_reset
    ];
    setVisible(false, containerOptions);
    //optionContainer.setVisible(false);
    
    options_button = this.add.image(config.width - 150, 100, 'ui_menu');
    options_button.setInteractive();
    options_button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {options_button.setTexture('ui_menu_down'), setVisible(true, containerOptions), isPlaying = false, audio_click.play()});
    options_button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => { options_button.setTexture('ui_menu_over'), options_button.scale = 1.1});
    options_button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => { options_button.setTexture('ui_menu'), options_button.scale = 1});
    
    // End screen
    endPanel = this.add.image(config.width/2, config.height/2, 'ui_end');
    end_ui_reset = this.add.image(config.width/2 + 20, config.height/2 + 270, 'ui_reset');
    end_ui_reset.setInteractive();
    end_ui_reset.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => { end_ui_reset.setTexture('ui_reset_down'), setVisible(false, containerEnd), isPlaying = true, resetProgress(), audio_click.play()});
    end_ui_reset.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => { end_ui_reset.setTexture('ui_reset_over'), end_ui_reset.scale = 1.1});
    end_ui_reset.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => { end_ui_reset.setTexture('ui_reset'), end_ui_reset.scale = 1});
    
    end_ui_next = this.add.image(config.width/2 + 500, config.height/2 + 270, 'ui_next');
    end_ui_next.setInteractive();
    end_ui_next.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => { end_ui_next.setTexture('ui_next_down'), setVisible(false, containerEnd), isPlaying = true, audio_click.play()});
    end_ui_next.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => { end_ui_next.setTexture('ui_next_over'), end_ui_next.scale = 1.1});
    end_ui_next.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => { end_ui_next.setTexture('ui_next'), end_ui_next.scale = 1});
    
    containerEnd = [
        endPanel, end_ui_reset, end_ui_next
    ];
    setVisible(false, containerEnd);
    
    //###########
    //## WORLD ##
    //###########
    
    // Obstacles    
    this.matter.add.image(890, -1140, 'car').setRectangle(player_car.width - 30, player_car.height-20).setAngle(0);
    this.matter.add.image(378, -783, 'car').setRectangle(player_car.width - 30, player_car.height-20).setAngle(-45);
    this.matter.add.image(-400, 90, 'car').setRectangle(player_car.width - 30, player_car.height-20).setAngle(-90);
    this.matter.add.image(-227, 1430, 'car').setRectangle(player_car.width - 30, player_car.height-20).setAngle(0);
    this.matter.add.image(-603, 1430, 'car').setRectangle(player_car.width - 30, player_car.height-20).setAngle(180);
    this.matter.add.image(-423, 2254, 'car').setRectangle(player_car.width - 30, player_car.height-20).setAngle(180);
    this.matter.add.image(130, 2280, 'car').setRectangle(player_car.width - 30, player_car.height-20).setAngle(180);
    
    // Curb bounding box     
    curbs = [
        {x:214, y:-926, w:12, h:812}, {x:274, y:-441, w:12, h:60}, {x:279, y:-1306, w:12, h:60}, {x:361, y:-358, w:12, h:60}, {x:367, y:-1220, w:12, h:60}, {x:469, y:-251, w:12, h:60}, {x:463, y:-1130, w:12, h:60}, {x:537, y:-1171, w:12, h:285}, {x:236, y:1453, w:12, h:374}, {x:234, y:2270, w:12, h:355}, {x:-854, y:944, w:12, h:367}, {x:504, y:1173, w:12, h:826}, {x:504, y:2288, w:12, h:320}, {x:994, y:1596, w:12, h:1703}, {x:963, y:-637, w:12, h:1357}, {x:963, y:-637, w:12, h:1357}, {x:750, y:-1328, w:413, h:12}, {x:531, y:-92, w:12, h:253}, {x:1615, y:799, w:438, h:12}, {x:1178, y:645, w:143, h:12}, {x:1541, y:156, w:910, h:12}, {x:-1198, y:1459, w:12, h:2031}, {x:-833, y:158, w:196, h:11}, {x:381, y:159, w:71, h:12}, {x:357, y:2052, w:220, h:12}, {x:353, y:1671, w:207, h:12}, {x:-778, y:1208, w:54, h:12}, {x:-778, y:670, w:54, h:12}, {x:429, y:670, w:54, h:12}, {x:472, y:2096, w:54, h:12}, {x:467, y:1628, w:54, h:12}, {x:-819, y:1159, w:54, h:12}, {x:-819, y:718, w:54, h:12}, {x:471, y:718, w:54, h:12}, {x:1033, y:708, w:54, h:12}, {x:1898, y:752, w:54, h:12}, {x:1331, y:752, w:54, h:12}, {x:1029, y:118, w:54, h:12}, {x:-1202, y:373, w:53, h:11}, {x:-696, y:104, w:53, h:11}, {x:399, y:105, w:228, h:12}, {x:1070, y:667, w:45, h:12}, {x:1953, y:696, w:45, h:12}, {x:2703, y:507, w:20, h:12}, {x:2714, y:436, w:20, h:12}, {x:2715, y:364, w:20, h:12}, {x:2695, y:277, w:20, h:12}, {x:2659, y:198, w:20, h:12}, {x:2612, y:133, w:20, h:12}, {x:2684, y:562, w:20, h:12}, {x:2649, y:625, w:20, h:12}, {x:2601, y:682, w:20, h:12}, {x:2549, y:77, w:20, h:12}, {x:2542, y:733, w:20, h:12}, {x:2473, y:35, w:20, h:12}, {x:2456, y:778, w:20, h:12}, {x:2368, y:6, w:20, h:12}, {x:2363, y:799, w:20, h:12}, {x:2271, y:5, w:20, h:12}, {x:2266, y:800, w:20, h:12}, {x:2169, y:27, w:20, h:12}, {x:2175, y:780, w:20, h:12}, {x:2085, y:70, w:20, h:12}, {x:2102, y:746, w:20, h:12}, {x:2022, y:121, w:20, h:12}, {x:2038, y:699, w:20, h:12}, {x:1993, y:646, w:20, h:12}, {x:1275, y:692, w:45, h:12}, {x:984, y:55, w:45, h:12}, {x:-1055, y:198, w:75, h:11}, {x:-1151, y:271, w:75, h:11}, {x:-647, y:48, w:75, h:11}, {x:388, y:58, w:295, h:12}, {x:344, y:1697, w:115, h:12}, {x:344, y:2023, w:115, h:12}, {x:749, y:2459, w:494, h:12}, {x:-472, y:2474, w:1421, h:12}, {x:-253, y:1231, w:979, h:12}, {x:-175, y:648, w:1136, h:12}, {x:-190, y:11, w:765, h:12}
    ]
    for (let i = 0; i < curbs.length; i++) {
        //console.log(i);
        //// this.matter.add.rectangle(-190, 11, 765, 12, { angle: 0, isStatic: true }, true, 0.01, 10);
        eval("this.matter.add.rectangle("+curbs[i].x+", "+curbs[i].y+", "+curbs[i].w+", "+curbs[i].h+", {isStatic: true }, true, 0.01, 10);");
    }
    
    this.matter.world.on('collisionstart', function (event, obj1, obj2) {
        console.log("Collision detected!", obj1.id, obj2.id);
        audio_hit.play();
        player.setToSleep();
        car_speed = 0;
        isPlaying = false;
        steering_rotation = 0;
        let set = setTimeout(resetProgress, 1000);
    });
    
    // the goals
    goals = [
        {x:301, y:-586, angle:135},     // Achteruit schuin vak
        {x:449, y:-966, angle:-45},     // Vooruit schuin vak
        {x:1530, y:713, angle:90},      // File parkeren
        {x:150, y:90, angle:-90},       // File parkeren
        {x:-57, y:1333, angle:180},     // Achteruit in een vak
        {x:-416, y:1528, angle:0},      // Vooruit in een vak
        {x:890, y:-619, angle:0}        // Stop achter een auto
    ];
    
    // Iterate through the goal array to place the goals
    for (let i = 0; i < goals.length; i++) {
        eval('goal' + i + "= this.add.image("+goals[i].x+", "+goals[i].y+", 'goal');");
        eval("goal"+i+".angle = "+goals[i].angle+";");
        eval("goal"+i+".alpha = 0.9;");
        eval("goal"+i+".setOrigin(0.5, 0.781);");
        // Adds function that checks if the player matches the x, y, and angle of the goal
        eval("goal"+i+".doesOverlap = function() { return this.x + variation.x >= player.x && this.x - variation.x <= player.x && this.y + variation.y >= player.y && this.y - variation.y <= player.y && this.angle + variation.angle >= player.angle && this.angle - variation.angle <= player.angle;}");
    }
    
    //############
    // ## MISC. ##
    //############
    
    // Add layers and assign objects to the layers
    let bg_layer = this.add.layer();
    bg_layer.add([bg]);
    bg_layer.setDepth(-1);
    let fg_layer = this.add.layer();
    fg_layer.add([player, front_wheels]);
    fg_layer.setDepth(0);
    ui_layer = this.add.layer();
    ui_layer.add([steering_wheel, tire, options_button, scorelabel, beginContainer]);
    ui_layer.setDepth(1);
    
    // Add the elements in the array to the UI layer
    addToLayer('ui_layer', containerOptions);
    addToLayer('ui_layer', containerEnd);
    
    // Make the GUI elements are static
    for (let i = 0; i < ui_layer.list.length; i++) {
        ui_layer.list[i].setScrollFactor(0, 0);
    }
    
    // Make the camera follow the player (limited to the background)
    this.cameras.main.startFollow(front_wheels);
    this.cameras.main.setBounds(-bg.displayWidth/2 + config.width/2, -bg.displayHeight/2 + config.height/2, bg.displayWidth, bg.displayHeight);
    // this.cameras.main.zoom = 0.5;
    
    // Initialise cursorkeys
    cursors = this.input.keyboard.createCursorKeys();
    
}

let feedbackScore = 0;

function update (time, delta)
{
    if (isPlaying)
        movement();

    //Check if the player overlaps with any of the goals
    for (let i = 0; i < goals.length; i++){
        if (eval("goal"+i+".doesOverlap()") && eval("goal"+i+".alpha < 0.99")){
            // When the player overlaps with the goal
            eval("goal"+i+".alpha = 0.8;");
            eval("goal"+i+".setTexture('goal_almost');");
            
            // Ensure the player stays in the correct position for 1 second with a straight steering wheel
            if (steering_rotation > -2 && steering_rotation < 2 && car_speed == 0) {
                // When the player is standing still in goal with a straight steering wheel
                eval("goal"+i+".alpha = 0.90;");
                
                
                this.time.delayedCall(100 * minTime, () => {
                    if(eval("goal"+i+".doesOverlap()") && steering_rotation > -2 && steering_rotation < 2 && eval("goal"+i+".alpha < 0.99" && car_speed == 0)){
                        feedbackScore++;
                        if (feedbackScore >= 10){
                            eval("goal"+i+".alpha = 1;");
                            eval("goal"+i+".setTexture('goal_correct');");
                            console.log("succesfully reached goal " + i);
                            audio_win2.play();
                            feedbackScore = 0;
                            score++;
                            
                            scorelabel.text = score + ' / ' + goals.length;
                            if (score >= goals.length){
                                // The player reached all the goals
                                console.log("You won!!");
                                audio_win1.play();
                                setVisible(true, containerEnd);
                                isPlaying = false;
                            }
                        }
                    } else{
                        feedbackScore = 0;
                    }
                });
                
            } else{
                eval("goal"+i+".alpha = 0.35;");
                eval("goal"+i+".setTexture('goal_almost');");
            }
            
        } else if (eval("goal"+i+".alpha < 0.99")){
            // When the player leaves the goal
            eval("goal"+i+".alpha = 0.95;");
            eval("goal"+i+".setTexture('goal');");
        }
    }    
    
}

function movement()
{
    
    // Rotate the steering wheel with the left and right keys
    if (cursors.left.isDown && steering_rotation > -45){
        // Rotate left, extra when pressing shift
        if (cursors.shift.isDown)
            steering_rotation -= rotation_speed;
        else
            steering_rotation -= rotation_speed * 2;
    } else if(cursors.right.isDown && steering_rotation < 45){
        // Rotate right, extra when pressing shift
        if (cursors.shift.isDown)
            steering_rotation += rotation_speed;
        else
            steering_rotation += rotation_speed * 2;
    }
    
    // Change rotation steering wheel and tire
    tire.angle = steering_rotation;
    front_wheels.angle = steering_rotation + player.angle;
    steering_wheel.angle = steering_rotation * 10;
    tires[0].angle = steering_rotation;
    tires[1].angle = steering_rotation;
    
    // Up and down keys add speed to the car
    if (cursors.up.isDown && car_speed < maxSpeed){
        car_speed += 0.04;
    } else if(cursors.down.isDown){
        car_speed -= 0.04;
    }    

    // Move the front wheels
    //front_wheels.x = front_wheels.x + (Math.sin(front_wheels.rotation) * car_speed);
    //front_wheels.y = front_wheels.y + (-Math.cos(front_wheels.rotation) * car_speed);
    front_wheels.setVelocityX(Math.sin(front_wheels.rotation) * car_speed);
    front_wheels.setVelocityY(-Math.cos(front_wheels.rotation) * car_speed);
    
    // Move the car to the front wheels
    // Point
    let target = Phaser.Math.Angle.BetweenPoints(player, front_wheels);
    player.rotation = target + 1.5707963267948966;
    // Move with offset
    player.x = front_wheels.x + (-Math.sin(player.rotation) * 215);
    player.y = front_wheels.y + (Math.cos(player.rotation) * 215);
    
    
    // Break when the spacebar is hit
    if(cursors.space.isDown){
        if (car_speed > 1 || car_speed < -1){
            car_speed /= 1.1;
        } else {
            car_speed = 0;
        }
        //console.log();
    }
    
}

function setVisible(bool, array)
{
    if (bool){
        // Set everything in the array to visible
        for (let i = 0; i < array.length; i++) {
            array[i].setVisible(true);
        }
    }
    else{
        // Set everything in the array to invisible
        for (let i = 0; i < array.length; i++) {
            array[i].setVisible(false);
        }
    }
}

function addToLayer(myLayer, array){
    for (let i = 0; i < array.length; i++) {
        eval(myLayer+".add(array["+i+"])");
    }  
}

function resetProgress(){
    // reset Car position
    front_wheels.teleport(config.width/2, config.height/2, 0);
    // reset score
    score = 0;
    scorelabel.text = score + ' / ' + goals.length;
    // reset achieved goals
    for (let i = 0; i < goals.length; i++) {
        eval("goal"+i+".alpha = 0.9;");   
    }
    player.setAwake();
    isPlaying = true;
}
