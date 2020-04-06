var c;
var canvParent;
var allSongs;
var song; 
var currentSong, nextSong;
var manualSwitch;
var fft, fft2, spectrum, logAvg, octBands;
var trainSpeed, bassSpeed, bassdamp, midSpeed, midDamp, hiSpeed, hiDamp;
var bassVertices, firstMountainVect, midVertices;
var trees, stars;
var dayColor, nightColor, bgColor, bgLerp, bgFFTNoise, day;

function setup() {
  c = createCanvas(1000, 600);
  canvParent = document.getElementById("trainWindow");
  c.parent(canvParent);
  currentSong = 0;
  nextSong = 0;
  manualSwitch = false;

  allSongs = [];
  allSongs[0] = new p5.SoundFile("songs/0.mp3", songLoaded, loadFailed, songLoading);
  allSongs[0].setLoop(false);
  allSongs[0].playMode('restart');
  fft = new p5.FFT();
  fft2 = new p5.FFT();

  trainSpeed = new p5.Vector(5, 0);

  bassDamp = 0.6;
  bassSpeed = new p5.Vector(trainSpeed.x*bassDamp, 0);
  bassVertices = [];
  firstMountainVect = new p5.Vector(width, height);

  midDamp = 1;
  midSpeed = new p5.Vector(trainSpeed.x*midDamp, 0);
  midVertices = [];

  hiDamp = 1.5;
  hiSpeed = new p5.Vector(trainSpeed.x*hiDamp, 0);
  trees = [];

  day = true;
  dayColor = color(255);
  nightColor = color(0);
  bgLerp = 0;
  bgColor = lerpColor(dayColor, nightColor, bgLerp);
  
  stars = [];
  for (i=0;i<100;i++){
    stars[i] = new p5.Vector(random(0, width), random(0, height));
  }
}

function draw() {
  
  fft.analyze();
  spectrum = fft2.analyze();

  octBands = fft.getOctaveBands(1);
  logAvg = fft.logAverages(octBands);
  
  background(bgColor);
  timeOfDay();

  allSongs[currentSong].onended(endSound);
  
  // allSongs[currentSong].onended(endSound);

  push();
    starScape();
  pop();

  push();
    fourier();
  pop();

  push();
    bassMountains();
  pop();

  push();
    craggyMids();
  pop();

  push();
    translate(0, 10);
    highTrees();
  pop();
}

function fourier(){
  
  fft2.smooth(0.995);
  noStroke();
  fill(0);
  for (i = 0; i< spectrum.length; i++){
    var y = map(i, 0, spectrum.length*0.3, 0, height);
    var w = map(spectrum[i], 0, 255, width, 0);
    rect(0, y, w, 0.2);
  }

  
  // console.log(logAvg);


  
}

function timeOfDay(){
  if (day){
    if (bgLerp > 0){
      bgLerp -= 0.001;
    } else {
      bgLerp = 0;
    }
  } else {
    if (bgLerp < 1){
      bgLerp += 0.001;
    } else {
      bgLerp = 1;
    }
  }

  bgColor = lerpColor(dayColor, nightColor, bgLerp);
}

function starScape(){
  for (i=0;i<stars.length;i++){
    push();
      noStroke();
      fill(255);
      ellipse(stars[i].x, stars[i].y - map(spectrum[i], 0, 255, 0, 100), random(0, 3));
    pop();
  }
}

function bassMountains(){
  // BASS MOUNTAINS!!

  if (fft.getEnergy("bass") > 100){
    bassVertices.push(new p5.Vector(width, height-(fft.getEnergy("bass")*1.5)));
  }

  push();
    translate(0, 50);
    beginShape();
      noStroke();
      fill(100);
      // loop through the array, use those vectors as vertices
      
      for (j=0;j<bassVertices.length;j++){
        vertex(firstMountainVect.x, firstMountainVect.y);
        vertex(bassVertices[j].x, bassVertices[j].y);
        vertex(width*2, height);
      }
      
      
    endShape();
  pop();

  if (firstMountainVect.x > -width){
    firstMountainVect = p5.Vector.sub(firstMountainVect, bassSpeed);
  }

  for (i=0;i<bassVertices.length;i++){
    // move to the left
    bassVertices[i] = p5.Vector.sub(bassVertices[i], bassSpeed);

    // if one gets past the window, remove it
    if (bassVertices[i].x < -50){
      bassVertices.shift();
    }

  }

  if (bassVertices.length > 0 || bassVertices.length > 200){
    if (bassVertices[0].x < -50){
      bassVertices.shift();
    }
  }
}

function craggyMids(){
  // CRAGGY MIDS!

  if (fft.getEnergy("mid") > 20){
    midVertices.push(new p5.Vector(width, height-(fft.getEnergy("mid")*2)));
  }

  push();
    translate(0, 40);
    beginShape();
      // stroke(255);
      noStroke();
      fill(50);
      // loop through the array, use those vectors as vertices
      vertex(-width, height*5);
      for (j=0;j<midVertices.length;j++){
        vertex(midVertices[j].x, midVertices[j].y);
      }
      vertex(width*2, height);
      
    endShape();
  pop();

  for (i=0;i<midVertices.length;i++){
    // move to the left
    midVertices[i] = p5.Vector.sub(midVertices[i], midSpeed);

    // if one gets past the window, remove it
    // if (midVertices[i].x < -width){
    //   midVertices.shift();
    // }

  }

  if (midVertices.length > 0 || midVertices.length > 200){
    if (midVertices[0].x < -width){
      midVertices.shift();
    }
  }
}

function highTrees(){
  // add trees
  if (fft.getEnergy("treble") > 13){
    trees.push(new Tree(width, height, 20, random(0, height*0.5)));
  }

  for (i=0;i<trees.length;i++){
    //show them
    trees[i].show();

    // move left
    trees[i].pos = p5.Vector.sub(trees[i].pos, hiSpeed);

    // remove trees
  }
  if (trees.length > 0 || trees.length > 200){
    if (trees[0].pos.x < 0){
      trees.shift();
    }
  }
}

function mousePressed(){
  manualSwitch = true;

  // if (mouseX > width*0.5){
  //   songSwitchForward();
  // } else {
  //   songSwitchBackward();
  // }

}

function keyPressed(){
  // manualSwitch = true;
  if (keyCode == 188){
    songSwitchBackward();
  } else if (keyCode == 190){
    songSwitchForward();
  } else if (keyCode == 78){
    allSongs[currentSong].rate(0.001);
  } else if (keyCode == 77){
    allSongs[currentSong].rate(1);
  } else if (keyCode == 66){
    if (day){
      day = false;
    } else {
      day = true;
    }
  }
}

function endSound(elt){
    // console.log("just ended " + currentSong);
  if (manualSwitch == false){
    // console.log("just ended " + currentSong);
    songSwitchForward();
    firstMountainVect = new p5.Vector(width, height);
  }
}

function songSwitchForward(){
  manualSwitch = true;

  nextSong = (currentSong + 1) % 40;

  allSongs[currentSong].stop();
  allSongs[nextSong] = new p5.SoundFile("songs/" + nextSong + ".mp3", songLoaded, loadFailed, songLoading);

  
  console.log(nextSong);
  // if (allSongs[nextSong] == undefined){
  //   allSongs[nextSong] = new p5.SoundFile("songs/" + nextSong + ".mp3", songLoaded, loadFailed, songLoading);
  // } else {
  //   songLoaded();
  //   manualSwitch = false;
  // }
  
}

function songSwitchBackward(){
  manualSwitch = true;

  if (currentSong > 0){
    nextSong = (currentSong - 1);
  } else {
    nextSong = 39;
  }

  allSongs[currentSong].stop();
  allSongs[nextSong] = new p5.SoundFile("songs/" + nextSong + ".mp3", songLoaded, loadFailed, songLoading);
  
  console.log(nextSong);
  // if (allSongs[nextSong] == undefined){
    // allSongs[nextSong] = new p5.SoundFile("songs/" + nextSong + ".mp3", songLoaded, loadFailed, songLoading);
  // } else {
  //   songLoaded();
  //   manualSwitch = false;
  // }
}

function songLoaded(){
  allSongs[nextSong].setLoop(false);
  allSongs[nextSong].playMode('restart');
  allSongs[nextSong].play();
  currentSong = nextSong;
  manualSwitch = false;
  
}

function songLoading(){
  // fill(255, 150, 0);
  // ellipse(width/2, height/2, 300);
}

function loadFailed(){
  // fill(0, 150, 0);
  // ellipse(width/2, height/2, 300);
}


var Tree = function(x, y, w, h){
  this.pos = new p5.Vector(x, y);
  this.size = new p5.Vector(w, h);

  this.show = function(){
    // noStroke();
    fill(200);
    stroke(200);
    strokeWeight(10);
    rectMode(CENTER);
    // translate(0, -100);
    // rect(this.pos.x, this.pos.y, this.size.x, this.size.y);
    line(this.pos.x, this.pos.y, this.pos.x, this.pos.y - this.size.y);
  }
}