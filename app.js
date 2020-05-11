const choiceContainer = document.querySelector(".choice-container");
const boardContainer = document.querySelector(".board-container");
const gameBoard = document.querySelector(".gameBoard");
let selectionArray = [];

let state = {
  gameIsRunning: false, //When play button is pressed, this changes to true
  gameChoices: {
    easy: 8,
    normal: 10,
    hard: 12,
  },
  selectionCount: 0, //if this is 2 and state.matched je true, onda se ovo resetira na 0 i karte ostaju kako jesu
  matched: false,
  movesPlayed: 0, // svaki put kad selectionCount se popne na 2, odigrane su dvije karte i movesPlayed se povisi za 1
};
// play button
const playBtn = document.getElementById("easy-btn");
playBtn.addEventListener("click", startGameHandler);

//pairArray - this array will hold Pair objects
let pairArray = [];
// selectedPair array will hold 2 numbers for comparison

// Constructor function for Pair objects
//The x it recieves comes from the for loop - I use this for object id, looking up an img, and for setting data-unique on html divs I'm creating as squares.
function Pair(x) {
  this.x = x;
  this.img = `url("/images/cover2.png"), linear-gradient(black, black), url("/images/img${this.x}.png")`;

  this.first = {
    pairID: this.x,
    actualImg: `url("/images/img${this.x}.png")`,
    name: "First",
  };
  this.second = {
    pairID: this.x,
    actualImg: `url("/images/img${this.x}.png")`,
    name: "Second",
  };

  this.render = function () {
    //Iterate over all properties of itself (a Pair object's render function will iterate over the entire object to see if an object is there to be rendered)
    for (const property in this) {
      //Random delay is implemented so that objects from inside one Pair don't end up always next to each other because of rendering order.
      let randomDelay = Math.floor(Math.random() * 300) + 10;
      // if type of propety is an object - render a square
      if (typeof this[property] === "object") {
        let squareEl = document.createElement("div");
        squareEl.classList.add("square");
        squareEl.style.backgroundImage = this.img;
        squareEl.dataset.pairId = this.x; // thus will serve for comparing if two clicked elements are a match.
        setTimeout(() => {
          gameBoard.append(squareEl);
        }, randomDelay);
      }
    }
  };
}

function startGameHandler() {
  //Game is running
  state.gameIsRunning = true;
  //Remove choiceContainer from the screen
  choiceContainer.style.display = "none";
  boardContainer.classList.add("flexed");

  //Create Pair objects based on difficulty
  for (let x = 1; x <= state.gameChoices.easy; x++) {
    pairArray.push(new Pair(x));
  }
  console.log(pairArray);

  for (let pair of pairArray) {
    pair.render();
  }
}

// Event delegation
gameBoard.addEventListener("click", (event) => {
  if (event.target.classList.contains("square")) {
    event.target.classList.add("flip");
    console.log(
      "this is pair id of the targeted element: ",
      event.target.dataset.pairId,
      event.target
    );

    //get the pairdId from the element and store it in an array
    selectionArray.push(parseInt(event.target.dataset.pairId));
    //Check if there is 2 elements in selectionArray
    if (selectionArray.length === 2) {
      console.log("Comparing...");

      if (selectionArray[0] === selectionArray[1]) {
        console.log("It's a match!");
      } else {
        console.log("it is not a match!!!");
      }
      // Empty the array in both cases
      selectionArray = [];
    }

    console.log(selectionArray);

    setTimeout(() => {
      event.target.classList.remove("flip");
    }, 1000);
  }
});
