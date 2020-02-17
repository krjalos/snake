export default class Snake {
    #params = { // Params can be changed during init and re-init.
        speed: 8, // inital speed, # of moves per second
        speedMultiplicator: 1.1, // speed increase with each bite,
        fieldWidth: 50, // sections number
        fieldHeight:50, // sections number
        length:10, // initial length
        sectionSize:10, // section size in pixels
        gameElement: document.querySelector(".snake-wrapper .game"),  // game wrapper
        scoreElement: document.querySelector(".snake-wrapper .score"), // score and info box wrapper
        testSpeed:0, // testing puposes, seen in #zedIzDead() function
        turns:0 // testing puposes, seen in #zedIzDead() function
    };

    #state = { // state if the current game
        occupies: [], // array, containing coordinates of all snake "segments", used to move and render the snake
        directionCoordinates: { // fastest way to deny backwards move. Direction set in coordinates
            '-2':[0, -1],
            '2':[0, 1],
            '-1':[-1, 0],
            '1':[1, 0]
        },
        direction:'-2', // current direction of movement
        lastDirection: '-2', // last direction of movement
        gameInited: false, // default settings set and game ready to play
        gameInProgress: false, // current game in progress
        score:0, // current score
        field: {}, // object containing all unoccupied sections
        foodPosition: false, // current position of the food
        lastPlace:[-1,-1] // last position of snake tail, used to clear the section
    };

    init = (args) => {

        if(args){
            this.#extend(this.#params, args); // rewrite only existing parameters
        }

        this.#params.speed = Math.max(parseInt(this.#params.speed), 0); //speed is integer and above 0
        this.#params.speedMultiplicator = Math.max(Number(this.#params.speedMultiplicator), 0); //speed is number and above 0
        this.#params.sectionSize = Math.max(Number(this.#params.sectionSize), 1);
        this.#params.fieldWidth = Math.max(Math.max(parseInt(this.#params.fieldWidth), 0), 10); // field size is integer, above 0 and reasonable
        this.#params.fieldHeight = Math.max(Math.max(parseInt(this.#params.fieldHeight), 0), 10); // field size is integer, above 0 and reasonable
        this.#params.length = Math.min(this.#params.fieldHeight - 1, Math.max(parseInt(this.#params.length), 0)); // ensure initial length fits into field, number and above 0

        if(!this.#state.gameInited){ // set of actions to be performed on first init only

            this.#keyboardOn(); // keyboard events

            this.#state.canvas = document.createElement('canvas');
            this.#state.canvasContext = this.#state.canvas.getContext("2d");

            this.#params.gameElement.appendChild(this.#state.canvas); // adds the canvas to the body element

            this.#state.gameInited = true;
        }

        this.#state.canvas.width = this.#params.fieldWidth * this.#params.sectionSize;
        this.#state.canvas.height = this.#params.fieldHeight * this.#params.sectionSize;

        this.#resetGame();
    };

    #resetGame = () => {

        this.#stopGame(); // Stop game in case it was in progress

        this.#extend(this.#state, this.#params); // reset
        this.#state.testSpeed = 0;
        this.#state.turns = 0;
        this.#state.score = 0;
        this.#state.occupies = [];
        this.#state.direction = '-2';
        this.#state.lastDirection = "-2";
        this.#state.foodPosition = false;
        this.#state.sectionSize = this.#params.sectionSize;
        this.#state.lastPlace = [-1, -1];
        this.#state.field = {...Array(this.#state.fieldWidth * this.#state.fieldHeight).fill(true)}; // create a list of empty fields, quickest way to find empty space for food.

        let startingX = Math.round(this.#state.fieldWidth / 2 - 1),
            startingY = Math.round((this.#state.fieldHeight - this.#state.length) / 2 - 1);

        for(let i = 0; i < this.#state.length; i++) {
            delete this.#state.field[startingY * this.#state.fieldWidth + startingX];
            this.#state.occupies.push([startingX, startingY++]); // initial snake position
        }

        this.#placeFood();

        this.#render(true);

        this.#state.gameInProgress = false;
    };

    #keyboardOn = () => {
        document.addEventListener('keydown', this.#bindKeys);
    };

    #keyboardOff = () => { // not used here, but could be used to temporary disable access to game
        document.removeEventListener('keydown', this.#bindKeys);
    };

    #bindKeys = (event) => {

        switch(event.key) {
            case "ArrowDown":
                this.#handleArrow("2");
                break;
            case "ArrowUp":
                this.#handleArrow("-2");
                break;
            case "ArrowLeft":
                this.#handleArrow("-1");
                break;
            case "ArrowRight":
                this.#handleArrow("1");
                break;
        }
    };

    #handleArrow = (input) => {
        if(parseInt(input) + parseInt(this.#state.lastDirection) !== 0) { // Prevent backwards movement
            this.#state.direction = input;
        }
        if(this.#state.gameInited === true && this.#state.gameInProgress === false){
            this.#startGame();
        }
    };

    #stopGame = () => {
        clearTimeout(this.#state.timeout); // clear latest move timeout
    };

    #startGame = () => {
        this.#state.gameInProgress = true;
        this.#params.scoreElement.innerHTML = "0";
        this.#nextTurn();
    };

    #placeFood = () => {

        let keysOnly = Object.keys(this.#state.field); // get list of free field sections

        if(keysOnly.length === 0) {

            this.#winGame(); // if there is nowhere to put the place to - the game is won

            return false;
        }

        let newPosition = keysOnly[Math.round((keysOnly.length - 1) * Math.random())]; // random selection of free section

        this.#state.foodPosition = [newPosition % this.#state.fieldWidth, Math.floor(newPosition / this.#state.fieldWidth)]; // translate into coordinates

        return true;
    };

    #nextTurn = () => { // evaluate new position for snake and food and render it
        this.#move();
        this.#render(false);
    };

    #move = () => {

        this.#state.lastDirection = this.#state.direction;

        let nextplace = [this.#state.occupies[0][0] + this.#state.directionCoordinates[this.#state.direction][0], this.#state.occupies[0][1] + this.#state.directionCoordinates[this.#state.direction][1]];

        delete this.#state.field[nextplace[1] * this.#state.fieldWidth + nextplace[0]]; // remove corresponding section from free sections list

        this.#state.occupies.unshift(nextplace); //place new "head" position at the start of array

        if(this.#state.foodPosition[0] === nextplace[0] && this.#state.foodPosition[1] === nextplace[1]){ // check if new head position is in the food square
            if(!this.#placeFood()){ // check if there is a space for new food and place it in random place
                return false;
            }
            this.#state.speed = this.#state.speed * this.#state.speedMultiplicator; //increment speed

            this.#params.scoreElement.innerHTML = ++this.#state.score; // increase score
        }else {
            this.#state.lastPlace[0] = this.#state.occupies[this.#state.occupies.length - 1][0]; // evaluate new last position
            this.#state.lastPlace[1] = this.#state.occupies[this.#state.occupies.length - 1][1]; // evaluate new last position
            this.#state.field[this.#state.lastPlace[1] * this.#state.fieldWidth + this.#state.lastPlace[0]] = true; // return section to the list of free ones
            this.#state.occupies.pop(); // "remove" tail section of the snake (whole array shifted forward)
        }

        if(!this.#zedIzDead()){ // check if snake landed on the segment over the edge of field or on itself. Timeout next turn in case it's ok
            let timeout = 1000 / this.#state.speed;

            this.#state.timeout = setTimeout(function(){
                this.#nextTurn();
            }.bind(this), timeout);
        }
    };

    #zedIzDead = () => {

        let isDead = false;

        if(this.#state.occupies[0][0] < 0 // check if snake is outside the field
            || this.#state.occupies[0][1] < 0
            || this.#state.occupies[0][0] > this.#state.fieldWidth - 1
            || this.#state.occupies[0][1] > this.#state.fieldHeight - 1){

            isDead = true;
        }


        /* didn't have time to test on longer snake arrays, but it seems, that for is slightly faster than filter, below: */

        // let t0 = performance.now();

        for(let i = 1; i < this.#state.occupies.length; i++) {
            if(this.#state.occupies[i][0] === this.#state.occupies[0][0] && this.#state.occupies[i][1] === this.#state.occupies[0][1]){ // if snake head is on other snake segment
                isDead = true;
            }
        }

        // this.#state.turns++;

        // if(this.#state.occupies.slice(1).filter(array => (array[0] === this.#state.occupies[0][0] && array[1] === this.#state.occupies[0][1])).length){
        //     isDead = true;
        // }

        // let t1 = performance.now();
        // this.#state.testSpeed += t1 - t0;

        if(isDead) {
            // console.log(this.#state.testSpeed / this.#state.turns); // testing purposes
            this.#gameOver();
        }

        return isDead;
    };

    #gameOver = () => {
        this.#resetGame();
        this.#params.scoreElement.innerHTML = "Sorry, your snake is in another castle. Score is " +  this.#state.score + " though.<br>Press any arrow to start a new snake";
    };

    #winGame = () => {
        this.#resetGame();
        this.#params.scoreElement.innerHTML = "Incredible victory score of " +  this.#state.score + ".<br>You could try changing size and speed though. Press any arrow for a new game";
    };

    #render = (initial) => {

        /* We are rendering each turn into canvas. Full redraw of the canvas happens only on game start and reset. */
        /* During move turn we are re-rendering only food and snake head and clearing snake tail */

        if(initial === true) {
            this.#state.canvasContext.clearRect(0, 0, this.#state.canvas.width, this.#state.canvas.height);

            this.#state.occupies.forEach(section => this.#state.canvasContext.fillRect(section[0] * this.#state.sectionSize, section[1] * this.#state.sectionSize, this.#state.sectionSize, this.#state.sectionSize));
        }

        this.#state.canvasContext.clearRect(this.#state.lastPlace[0] * this.#state.sectionSize, this.#state.lastPlace[1] * this.#state.sectionSize, this.#state.sectionSize, this.#state.sectionSize);

        this.#state.canvasContext.fillRect(this.#state.foodPosition[0] * this.#state.sectionSize, this.#state.foodPosition[1] * this.#state.sectionSize,this.#state.sectionSize, this.#state.sectionSize );

        this.#state.canvasContext.fillRect(this.#state.occupies[0][0] * this.#state.sectionSize, this.#state.occupies[0][1] * this.#state.sectionSize,this.#state.sectionSize, this.#state.sectionSize);

    };

    #extend = (target, source) => {

        if (source !== undefined && source !== null && source instanceof Object) {

            for (let key in source) {
                if(source.hasOwnProperty(key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }
}