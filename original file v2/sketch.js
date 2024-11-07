// --- Global Variables ---
let circles = [];  // store circle pattern
let beads = [];  //  store the beads
let maxBeads = 5000; // set max attempts to prevent overlap
let maxCircles = 1000;
let song; // set song to get audio data
let analyser; // set analyser to get amlitude data from song
let musicStarted = false; // detect the start of music
let button; // add a button to conrol the start and stop of music

// Load the song
function preload() {
  song = loadSound("assets/Iwamizu-Thiely.wav");
}

// --- Setup ---
function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  initialisePatterns(); // call function for the circle and the beads
  analyser = new p5.Amplitude();

  // Connect the input of the analyser to the song
  analyser.setInput(song);
  
  // Add a button for the start and stop of music
  button = createButton("Play/Pause");
  button.position((width - button.width) / 2, height - button.height - 2);
  button.mousePressed(play_pause);
}


// --- Initialize big circles and beads from the classes ---

// Learned about while loop from the coding train example
//https://thecodingtrain.com/tracks/code-programming-with-p5-js/code/4-loops/1-while-for

// Learned about circlepacking from happy coding
//https://happycoding.io/tutorials/p5js/creating-classes/circle-packing

//chatgpt was used to help troubleshoot the circle packing formula, since it initially would not run properly

// big circles
function initialisePatterns() {
  let attempts = 0; // starting point for generation
  
  // Use while loop to keep creating circles until it maxes out
  while (attempts < maxCircles) { 
    let size = random(width * 0.05, width * 0.15); // Set random size relative to canvas width
    let x = random(size / 2, width - size / 2); // Random x position
    let y = random(size / 2, height - size / 2); // Random y


    // Check for circle overlap
    let overlapping = false;
    for (let other of circles) {
      let d = dist(x, y, other.x, other.y); // calculates distance between the circles
      if (d < (size / 2 + other.size / 2)) { // checks for overlap based on combined radius
        overlapping = true;
        break;
      }
    }
    
    // keep adding circles until it overlaps!
    if (!overlapping) {
      circles.push(new CirclePattern(x, y, size));
    }
    
    attempts++;
  }

  // Now for the beads!!!!

  // Create small beads that avoid the main circle and eachother
  attempts = 0;
  while (attempts < maxBeads) { 
    let beadSize = random(width * 0.005, width * 0.02); //random bead size relative to canvas size
    let x = random(beadSize / 2, width - beadSize / 2); // random x position
    let y = random(beadSize / 2, height - beadSize / 2); //random y position

    // Check if bead overlaps with any main circles or other beads
    let overlapping = false;
    for (let circle of circles) {
      let d = dist(x, y, circle.x, circle.y); //distance between bead and each main circle
      if (d < (beadSize / 2 + circle.size / 2)) {
        overlapping = true;
        break;
      }
    }
    for (let bead of beads) {
      let d = dist(x, y, bead.x, bead.y);
      if (d < (beadSize / 2 + bead.size / 2)) {
        overlapping = true;
        break;
      }
    }

    // Add bead to array if it doesnt overlap
    if (!overlapping) {
      beads.push(new Bead(x, y, beadSize));
    }

    attempts++;
  }
}

// --- Draw Function ---
function draw() {
  background(10, 10, 50); //set background to navy blue

  let level = musicStarted ? analyser.getLevel() : 0; // get level from song when music started

  // Draw each bead
  for (let bead of beads) {
    let beadOpacity = map(level, 0, 1, 255, 50); // decrease opacity when level increase
    let beadSize = map(level, 0, 1, bead.initialSize, 0); // decrease size when level increase
    bead.display(beadOpacity, beadSize); // display the beads
  }

  // Draw each circle
  for (let circle of circles) {
    circle.display(level); //display the circles
  } 
}

// --- CirclePattern Class ---
class CirclePattern {
  constructor(x, y, size) {
    this.x = x; // x-coordinate
    this.y = y; // y-coordinate
    this.size = size;
    this.numLayers = int(random(3, 6)); //random number of layers
    this.colors = []; // store colors for each layer
    this.initialSizes = []; // store initial sizes for layers inside

    // create colors and sizes for layers to store
    for (let i = 0; i < this.numLayers; i++){
      this.colors.push(color(random(255), random(255),random(255)));
      this.initialSizes.push((this.size / this.numLayers) * (i + 1));
    }
  }

 //display the circles that alternate between lines and circles
  display(level) {
    push(); // Save transformation
    translate(this.x, this.y); // Move origin to centre of circle
    
    // Draw biggest circles
    let biggestLayerSize = this.size;
    noFill();
    stroke(this.colors[0]);
    strokeWeight(2);
    ellipse(0, 0, biggestLayerSize);

    // Draw each layer from outside to in
    for (let i = this.numLayers - 1; i > 0; i--) {
      let maxSize = this.size; // size of layers inside will not exceed the size of biggest circles 
      let minSize = this.initialSizes[i]; // the minimal sizes are the initial sizes
      let layerSize = map(level, 0, 1, minSize, maxSize); // increase radii when level increase
      let col = this.colors[i]; // use stored color for layers
      
      // between lines and dots
      if (i % 2 == 0) {
        this.drawDots(layerSize, col, i); // Even layers: draw dots
      } else {
        this.drawLines(layerSize, col, i); // Odd layers: draw lines
      }
    }
    
    pop(); // Restore transformation
  }

// Chatgpt was used to calculate the distribution of lines and dots inside each layer using methods

  // method to draw dots for layers
  drawDots(layerSize, col, i) {
    fill(col); 
    noStroke();
    ellipse(0, 0, layerSize); 

    let numDots = int(this.initialSizes[i] / 5); // Number of dots based on initial layer sizes
    let dotRadius = layerSize / 20; // Radius of each dot

    fill(255); // Set dot colour to white
    for (let i = 0; i < numDots; i++) {
      let angle = map(i, 0, numDots, 0, 360); // use map to distribute dots evenly in circle 
      let x = cos(angle) * layerSize / 2.5; // x-coordinate for each dot
      let y = sin(angle) * layerSize / 2.5; // y-coordinate for each dot
      ellipse(x, y, dotRadius); // Draw the dot
    }
  }

  // method to draw lines for layers  
  drawLines(layerSize, col, i) {
    stroke(col); // Set stroke colour
    strokeWeight(2);
    noFill();
    ellipse(0, 0, layerSize); // Draw the base circle

    let numLines = int(this.initialSizes[i] / 5); // Number of lines based on layer size
    for (let i = 0; i < numLines; i++) {
      let angle = map(i, 0, numLines, 0, 360); // use map to distribute lines evenly
      let x = cos(angle) * layerSize / 2.5; // x coordinate endpoints
      let y = sin(angle) * layerSize / 2.5; // y coordinate endpoints
      line(0, 0, x, y); // Draw line from centre to edge
    }
  }
}


// --- Bead Class ---
class Bead {
  constructor(x, y, beadSize) {
    this.x = x; // x of bead center
    this.y = y; // y of bead center
    this.size = beadSize; //diameter
    this.initialSize = beadSize;
    this.color = color(255, random(100, 200), 0); //determine bead color (oranges)
  }

  // Display the bead as a filled circle
  display(beadOpacity, beadSize) {
    fill(red(this.color), green(this.color), blue(this.color), beadOpacity); // change the opacity
    noStroke();
    ellipse(this.x, this.y, beadSize); // draw the bead
  }
}

// make the whole thing resizable and scalable
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  circles = []; //clear circles
  beads = []; // clear beads
  initialisePatterns(); // regenerate patterns
  button.position((width - button.width) / 2, height - button.height - 2);
}

// 
function play_pause() {
  if (song.isPlaying()) {
    song.stop();
    musicStarted = false;
  } else {
    song.play();
    musicStarted = true;
  }
}