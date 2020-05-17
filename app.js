const titleContainer = document.querySelector(".title-container");
const moves = document.querySelector(".moves");
const timerEl = document.querySelector(".timer");
const moveCounterEl = document.getElementById("move-counter");
const words = document.querySelectorAll(".word"); // divs that hold spans in the title container
const gameplayContainer = document.querySelector(".gameplay-container"); // main div with everything in but the title
const boxContainer = document.querySelector(".box-container"); // div containing divs that serve as sides for the box
const boardContainer = document.querySelector(".board-container"); //div holds game board, gameplay-info and restart btn
const gameBoard = document.querySelector(".gameBoard");
const gameMenu = document.getElementById("game-menu"); //div with buttons
const menuButtons = gameMenu.querySelectorAll("button");
const resetBtn = document.getElementById("reset-btn");
const menuBtn = document.getElementById("menu-btn");
const scoreBtn = document.getElementById("score-btn");
const scoreContainer = document.querySelector(".score-container");
let squaresArray = []; //This array holds Square objects
let interval = null,
  seconds = 0,
  minutes = 0,
  checkArray = [];

//Animation for the menu will play after the game intro animation which lasts 3500ms
displayMenu(3500);

const track = {
  squares: 0, //When menu buttons are pressed this changes to the value of their data-squares attribute.
  clicks: 0,
  moveCounter: 0,
  winCondition: false, // Becomes true when matchedPaird are equal to squares / 2 (number of pairs on the board)
  matchedPairs: 0,
  elapsedTime: 0,
  difficulty: null,
};

// gameScore is stored in localStorage
let gameScore = {
  moves: null,
  time: null,
};

//This constructor makes Square objects which are represented on the DOM - called from renderGameBoard()

function Square(id, pairID) {
  this.id = id;
  this.pairID = pairID;
  this.realBackground = `url("./images/img${this.pairID}.png")`; // This is real background determined by pairID
  this.defaultBackground = `url("./images/cover2.png")`;
  this.el = null;

  this.render = function () {
    //Create a square element and append it to the gameBoard
    const squareEl = document.createElement("div");
    squareEl.id = this.id;
    squareEl.dataset.pairId = this.pairID;
    squareEl.classList.add("square");
    squareEl.style.backgroundImage = this.defaultBackground;
    gameBoard.append(squareEl);
    this.el = squareEl;
  };

  this.flipElement = function () {
    this.el.classList.add("flip");
    //Change the background image from default to real background with a slight delay so the change is not explicit. (transition on square element is 1000ms)
    setTimeout(() => {
      this.el.style.backgroundImage = this.realBackground;
    }, 350);
  };

  //This is called when there is no match.
  this.flipBack = function () {
    setTimeout(() => {
      //after 1000 ms, I want to flip it back - so to do it, .flip class gets removed.
      this.el.classList.remove("flip");
    }, 1000);
    // Change the background again when the rotation of the element is in at the right spot during transition (because .flip is being removed so the element is rotated back to original position)
    setTimeout(() => {
      this.el.style.backgroundImage = this.defaultBackground;
    }, 1350);
  };

  //When a square is matched, the element in the DOM gets greyed out by adding .greyed
  this.matched = function () {
    this.el.classList.add("greyed");
  };

  //This runs when game is won
  this.revealed = function () {
    this.el.classList.remove("greyed");
    this.el.classList.add("borderless");
  };
}

//************************************************ RENDERING GAME BOARD **************************************************************//

//Game Menu - clicks on different buttons determine difficulty or allow player to see his best scores
gameMenu.addEventListener("click", reactToClick);

function reactToClick(event) {
  const btn = event.target;
  //Determine how many squares should be on the game board
  if (btn.tagName === "BUTTON" && btn.id !== "score-btn") {
    switch (btn.id) {
      case "easy-btn":
        track.squares = 16;
        track.difficulty = "EASY";
        break;
      case "normal-btn":
        track.squares = 20;
        track.difficulty = "NORMAL";
        break;
      case "hard-btn":
        track.squares = 24;
        track.difficulty = "HARD";
        break;
    }
    // Disables clicking on menu buttons after a selection is made.
    disableClicking(2100);
    //Čim krene animacija za micanje boxContainera treba animirati i titleContainer - promjena sadrzaja u spanovima
    changeTitle("MOVESTIMER", "animateSpanChange");
    prepareBoard();
  }
}

//Change title letters only when game is triggered from the menu, NOT on ordinary reset.
function changeTitle(word, animation) {
  let delay = 0.5; // this grows by 0.1 for every letter in the title when it gets animated
  const letters = titleContainer.querySelectorAll("span");
  const newLetters = Array.from(word); // replacement letters will be turned into an array
  for (let i = 0; i < letters.length; i++) {
    letters[
      i
    ].style.animation = `${animation} 1s linear ${delay}s 1 normal forwards`;
    delay += 0.1;
    //content of each span will be changed to a new letter.
    letters[i].textContent = newLetters[i];
  }
  //Set delay back to default
  delay = 0.5;
}

//This function sets up the screen before actual game begins
function prepareBoard() {
  hideMenu();
  displayBoardContainer();
  toggleGameUI(2000);
}

//This function is called from displayBoardContainer() - renders game board based on passed in number of squares.
function renderGameBoard(amount) {
  //Every created object has its pair. pairID is incremented  when x is an even number - ensuring only 2 objects get the same pairID.
  let pairID = 0;
  for (let x = 0; x < amount; x++) {
    //Checking if pairID should change
    if (x % 2 === 0) {
      pairID += 1;
    }
    //On every iteration of the loop, create new Square object, id is equal to current x, pairId equal to current pairID.
    const square = new Square(x, pairID);
    //Push created object into squaresArray and shuffle the array below.
    squaresArray.push(square);
  }

  //Shuffle objects in the array before rendering
  let tempValue;
  let newPosition;

  for (let i = squaresArray.length - 1; i > 0; i--) {
    newPosition = Math.floor(Math.random() * (i + 1));

    // Swapping values.
    tempValue = squaresArray[i];
    squaresArray[i] = squaresArray[newPosition];
    squaresArray[newPosition] = tempValue;
  }
  //Now that the objects are shuffled, render elements on the screen.
  for (const square of squaresArray) {
    square.render();
  }
}

// Handle click events that occur on squares only.
function squareClickHandler({ target: el }) {
  if (el.classList.contains("square") && checkArray.length < 2) {
    track.clicks++;
    //Timer starts on first click.
    if (track.clicks === 1) {
      startTimer();
    }

    //On every click, search for the object that has the same id as the clicked element
    let square = clickedObject(el);
    //Object is pushed into this array
    checkArray.push(square);

    //When clicked, an element is flipped and becomes unclickable.
    square.flipElement();

    //If the array has 2 objects  inside - a check must be done to see if they match.
    if (checkArray.length === 2) {
      checkMatch(...checkArray);

      //After checking for match, empty the array
      checkArray = [];
    }
  }
}
gameBoard.addEventListener("click", squareClickHandler);

//****************************************************** GAMEPLAY FUNCTIONS *****************************************************//

//Square objects are passed in here to check if they match.
function checkMatch(square1, square2) {
  //While checking for match, clicking is disabled for 750ms
  disableClicking(750);
  //Track the number of moves - 2 clicks trigger checking for a match, and that counts as 1 move.
  trackMoves();

  //If it is a match - elements get greyed out via .matched()
  if (square1.pairID === square2.pairID) {
    new Audio("./sounds/matched.mp3").play();
    console.log("it's a match");
    square1.matched();
    square2.matched();
    //Number of matched pairs is incremented.
    track.matchedPairs += 1;
    console.log(track.matchedPairs);

    //Check win condition on every match
    track.winCondition =
      track.matchedPairs === track.squares / 2 ? true : false;
    console.log(track.winCondition);
    //Checking if match triggers win condition
    if (track.winCondition) {
      clearInterval(interval);
      //Store gameScore in localStorage
      storeGameScore();

      gameWon(track.matchedPairs, track.moveCounter);
      console.log("game is over!");
    }
  }
  //If there is no match, flip square elements back
  else {
    console.log("No match");
    square1.flipBack();
    square2.flipBack();
  }
}

//Find the object that the clicked square element belongs to - called from inside squareClickHandler()
function clickedObject(el) {
  for (const square of squaresArray) {
    if (parseInt(el.id) === square.id) {
      return square;
    }
  }
}

//When a move happens, increment counter and update screen - called from checkMatch()
function trackMoves() {
  track.moveCounter += 1;
  moves.textContent = `${track.moveCounter < 100 ? "0" : ""}${
    track.moveCounter < 10 ? "0" : ""
  }${track.moveCounter}`;
  console.log("Moves played: ", track.moveCounter);
}

//start Timer will be called when first click happens
function startTimer() {
  // When the timer starts, I want to increment seconds RIGHT AWAY, because setInterval takes 1000 ms to start incrementing it.
  seconds++;
  //The rest of the incrementing will be done by setInterval
  interval = setInterval(tickingTime, 1000);
}

function stopTimer() {
  //Clear the interval so that tickingTime() stops
  clearInterval(interval);
  //Reset values
  seconds = 0;
  minutes = 0;
  interval = null;
}

// tickingTime is called by setInterval every 1000ms after startTimer() is called.
function tickingTime() {
  seconds++;
  //Need to increment minutes when seconds reach 60, and reset seconds to 0
  if (seconds === 60) {
    minutes++;
    seconds = 0;
  }
  //Elapsed time is updated
  track.elapsedTime = `${minutes < 10 ? "0" : ""}${minutes}:${
    seconds < 10 ? "0" : ""
  }${seconds}`;
  //This gets displayed on the screen
  timerEl.textContent = track.elapsedTime;

  //I don't want hours to show
  if (minutes === 60) {
    timerEl.textContent = `MAX`;
    clearInterval(interval);
  }
}

// gameWon is called from inside checkMatch when win condition is true.
function gameWon(pairs, moves) {
  //ovdje logika za rank neki
  let rank = "";

  // some code here

  if (moves >= pairs * 3) {
    rank = "You are a goldfish! Try again!";
  } else if (moves >= pairs * 2) {
    rank = "Wow! You are a majestic elephant!";
  } else if (moves >= pairs * 1.5) {
    rank = "Nice...you might be a dolphin!";
  } else if (moves === pairs) {
    rank = "You are very lucky or a cheater! :)";
  }

  const messageContainer = document.createElement("div");
  messageContainer.classList.add("message-container");
  const message = document.createElement("p");
  message.textContent = rank;
  messageContainer.append(message);

  //After game is over, squares lose borders and gain back color.
  setTimeout(() => {
    new Audio("./sounds/win1.mp3").play();
    for (const square of squaresArray) {
      square.revealed();
    }
  }, 1000);

  setTimeout(() => {
    // Message is created.
    boardContainer.append(messageContainer);
  }, 3000);

  setTimeout(() => {
    // Message is removed.
    messageContainer.remove();
  }, 6000);
}

//******************************************* RESET GAME, EXIT GAME, BACK TO MENU ***************************************************

//Used in resetGame and exitGame
function setToDefault() {
  // Some properties need to be set to default (track.squares is only set to default in exitGame()
  track.clicks = 0;
  track.moveCounter = 0;
  track.winCondition = false;
  track.matchedPairs = 0;
  track.elapsedTime = 0;
  track.gameIsRunning = false;
  timerEl.textContent = "00:00";
  moves.textContent = "000";
  gameScore.moves = null;
  gameScore.time = null;
  squaresArray = [];
  checkArray = [];
}

// Exits game - this is called from backToMenu()
function exitGame() {
  stopTimer();
  setToDefault();
  track.squares = 0;
  toggleGameUI();
  setTimeout(() => {
    gameBoard.innerHTML = "";
  }, 2000);
}

//Resets game on the same difficulty.
resetBtn.addEventListener("click", resetGame);
function resetGame(event) {
  disableClicking(500);

  //Timer needs to stop and seconds, minutes and interval are set to default.
  stopTimer();
  setToDefault();
  //gameBoard fades out
  gameBoard.classList.add("fade-out");

  setTimeout(() => {
    //clear gameBoard and render new squares
    gameBoard.innerHTML = "";
    renderGameBoard(track.squares);
    //gameBoard fades in
    gameBoard.classList.remove("fade-out");
  }, 500);
}

//******************************************** SWITCHING BETWEEN MENU AND THE GAME **********************************************//
//Displays menu box on the screen
function displayMenu(delay) {
  //Menu is displayed
  gameplayContainer.classList.remove("remove-perspective"); // Vraća perspective na gameplay-container
  setTimeout(() => {
    boxContainer.style.display = "block";
    boxContainer.classList.add("grow-box");
  }, delay);
}

//Hides menu box from the screen.
function hideMenu() {
  boxContainer.classList.remove("grow-box");
  boxContainer.classList.add("shrink-box");
  setTimeout(() => {
    boxContainer.classList.remove("shrink-box"); //Nakon što se odvrtila animacija, mičem klasu .shrink-box
    boxContainer.style.display = "none"; // Removing game menu from the screen after the animations has played.
    gameplayContainer.classList.add("remove-perspective"); // miče perspective.
  }, 2000);
}

//Display boardContainer on the screen - called from prepareBoard()
function displayBoardContainer() {
  setTimeout(() => {
    boardContainer.classList.add("show-board-container");
    // Render gameBoard
    renderGameBoard(track.squares);
  }, 2100);
}

//Removes boardContainer from the screen - called from backToMenu()
function removeBoardContainer() {
  boardContainer.classList.add("fade-board-container");
  setTimeout(() => {
    boardContainer.classList.remove(
      "show-board-container",
      "fade-board-container"
    );
  }, 1500);
}

//Returns player to menu
function backToMenu() {
  disableClicking(2000);
  exitGame();
  removeBoardContainer();
  //title changes back to default letters
  changeTitle("BRAINTRAIN", "animateSpan");
  displayMenu(1500);
}
menuBtn.addEventListener("click", backToMenu);

// Show timer and moves in title container
function toggleGameUI(delay) {
  setTimeout(() => {
    moves.classList.toggle("show");
    timerEl.classList.toggle("show");
  }, delay);
}

// Disable clicking on certain points

function disableClicking(duration) {
  document.body.style.pointerEvents = "none";
  setTimeout(() => {
    document.body.style.pointerEvents = "auto";
  }, duration);
}

//************************************************** SCORE ********************************************************************/

//Storing game score - called from checkMatch when win condition is true.
function storeGameScore() {
  // Record current game moves and time
  gameScore.moves = track.moveCounter;
  gameScore.time = track.elapsedTime;

  // Store entire gameScore in local storage only if current score is better than stored score.

  const storedScore = JSON.parse(localStorage.getItem(track.difficulty));

  if (storedScore && storedScore.moves > gameScore.moves) {
    localStorage.setItem(track.difficulty, JSON.stringify(gameScore));
  } else if (!storedScore) {
    localStorage.setItem(track.difficulty, JSON.stringify(gameScore));
  }
}

//Retrieve game score - called from displayScore which fires when "Score" menu button is clicked.
function retrieveGameScore() {
  //Retrieve stored highscores

  const easyScore = JSON.parse(localStorage.getItem("EASY"));
  const normalScore = JSON.parse(localStorage.getItem("NORMAL"));
  const hardScore = JSON.parse(localStorage.getItem("HARD"));

  // Select list items
  const easy = document.getElementById("easy");
  const normal = document.getElementById("normal");
  const hard = document.getElementById("hard");

  //Interpolate highscore data
  if (easyScore) {
    easy.textContent = `Highscore on EASY is ${easyScore.moves} moves and ${easyScore.time} minutes.`;
  }
  if (normalScore) {
    normal.textContent = `Highscore on NORMAL is ${normalScore.moves} moves and ${normalScore.time} minutes.`;
  }
  if (hardScore) {
    hard.textContent = `Highscore on HARD is ${hardScore.moves} moves and ${hardScore.time} minutes.`;
  }
}

// Click handler for Score button
scoreBtn.addEventListener("click", displayScore);
function displayScore() {
  hideMenu();

  //Delay appending score so the hideMenu animation plays out.
  setTimeout(() => {
    retrieveGameScore();
    scoreContainer.classList.add("display-score");

    //Add fade-in class after a delay
    setTimeout(() => {
      scoreContainer.classList.add("fade-in");
    }, 100);

    //When returnBtn is pressed, first remove fade-in, than remove display-score class.
    const returnBtn = document.getElementById("return-btn");
    returnBtn.addEventListener("click", () => {
      scoreContainer.classList.remove("fade-in");
      setTimeout(() => {
        scoreContainer.classList.remove("display-score");
      }, 500);
      // Then display the menu with animation
      displayMenu(1000);
    });
  }, 2100);
}
