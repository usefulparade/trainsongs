var c;
var canvParent;
var frame;
var font, displayText, buttonText, trackMin, trackSec, trackSecFixed, trackCurrentMin, trackCurrentSec, TrackCurrentSecFixed, timeText, currentSongFixed;
var allSongs;
var song; 
var currentSong, nextSong;
var manualSwitch;
var fft, fft2, spectrum, logAvg, octBands;
var trainSpeed, bassSpeed, bassdamp, midSpeed, midDamp, hiSpeed, hiDamp, deltaDamp;
var bassVertices, firstMountainVect, midVertices;
var trees, stars;
var dayColor, nightColor, bgColor, bgLerp, bgFFTNoise, day;

var mouse, buttons, backbtn, fwdbtn, pausebtn, playbtn, nightbtn, speedupbtn, slowdownbtn, buttonOver;

var ticketPunchAlpha, ticket, ticketPunched, ticketText;

function preload(){
  frame = loadImage('img/frame.png');
  ticket = loadImage('img/ticket.png');
  ticketPunched = loadImage('img/ticket-punched.png');
  font = loadFont('fontB.ttf');
}

function setup() {
  var context = getAudioContext();
  context.suspend();

  c = createCanvas(1000, 600);
  canvParent = document.getElementById("trainWindow");
  c.parent(canvParent);
  currentSong = 0;
  nextSong = 0;
  manualSwitch = false;

  allSongs = [];
  allSongs[0] = new p5.SoundFile("songs/0.mp3");
  allSongs[0].setLoop(false);
  // allSongs[0].playMode('restart');
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

  deltaDamp = 0.1;

  day = true;
  dayColor = color(255);
  nightColor = color(0);
  bgLerp = 0;
  bgColor = lerpColor(dayColor, nightColor, bgLerp);
  
  stars = [];
  for (i=0;i<100;i++){
    stars[i] = new p5.Vector(random(0, width), random(0, height));
  }

  image(frame, 0, 0);
  textFont(font);
  mouse = new p5.Vector(0, 0);
  buttons = [];
  backbtn = new MiniDiscButton(58, 485, 45, "back");
  fwdbtn = new MiniDiscButton(111, 503, 45, "fwd");
  pausebtn = new MiniDiscButton(39, 522, 45, "pause");
  playbtn = new MiniDiscButton(89, 543, 45, "play");
  nightbtn = new MiniDiscButton(36, 582, 45, "night");
  speedupbtn = new MiniDiscButton(209, 502, 30, "spd up");
  slowdownbtn = new MiniDiscButton(162, 584, 30, "spd dwn");
  buttons.push(backbtn);
  buttons.push(fwdbtn);
  buttons.push(pausebtn);
  buttons.push(playbtn);
  buttons.push(nightbtn);
  buttons.push(speedupbtn);
  buttons.push(slowdownbtn);
  buttonText = "";
  buttonOver = false;

  trackMin = (allSongs[currentSong].duration() / 60).toString().slice(0, 1);
  trackSec = (allSongs[currentSong].duration() % 60).toString().slice(0, 2);
  if (trackSec > 10){
    trackSecFixed = trackSec;
  } else {
    trackSecFixed = "0" + trackSec.slice(0, 1);
  }

  ticketPunchAlpha = 255;
  ticketText = "*kshht* please punch your ticket before we embark";

}

function draw() {
  
  fft.analyze();
  spectrum = fft2.analyze();

  octBands = fft.getOctaveBands(1);
  logAvg = fft.logAverages(octBands);
  
  background(bgColor);
  timeOfDay();

  allSongs[currentSong].onended(endSound);

  if (bgLerp != 0){
    push();
      starScape();
    pop();
  }

  if (bgLerp != 1){
    push();
      fourierClouds();
    pop();
  }

  push();
    bassMountains();
  pop();

  push();
    craggyMids();
  pop();

  push();
    translate(0, 150);
    highTrees();
  pop();

  image(frame, 0, 0, width, height);
  push();
    miniDiscText();
  pop();

  buttonsHandler();

  mouse = new p5.Vector(mouseX, mouseY);
  // console.log(mouse)

  audioContextCheck();

}

function fourierClouds(){
  
  fft2.smooth(0.995);
  stroke(0);
  strokeWeight(0.5);
  for (i = 0; i< spectrum.length; i+=5){
    var y = map(i, 0, spectrum.length*0.3, 0, height);
    var w = map(spectrum[i], 0, 255, width, 0);
    // rect(0, y, w, 0.2);
    line(0, y, w, y);
  }

  
  // console.log(logAvg);


  
}

function miniDiscText(){

  trackCurrentMin = (allSongs[currentSong].currentTime() / 60).toString().slice(0, 1);
  trackCurrentSec = (allSongs[currentSong].currentTime() % 60).toString().slice(0, 2);
  if (trackCurrentSec > 10){
    trackCurrentSecFixed = trackCurrentSec;
  } else {
    trackCurrentSecFixed = "0" + trackCurrentSec.slice(0, 1);
  }

  if (currentSong < 10){
    currentSongFixed = "0" + (currentSong+1);
  } else {
    currentSongFixed = (currentSong+1);
  }

  timeText = "" + trackCurrentMin + ":" + trackCurrentSecFixed + "/" + trackMin + ":" + trackSecFixed;
  displayText = "tr " + currentSongFixed + "  " + timeText;
  push();
  translate(0, height-220);
  rotate(0.3);
  shearX(-0.25);
  textSize(24);
  fill(200)
  stroke(0);
    textAlign(LEFT);
    text(displayText, 0, 0);
    textAlign(RIGHT);
    text(buttonText, 100, 25);
  pop();
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
  bassSpeed = new p5.Vector(trainSpeed.x*bassDamp*deltaTime*deltaDamp, 0);
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
  midSpeed = new p5.Vector(trainSpeed.x*midDamp*deltaTime*deltaDamp, 0);

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
  hiSpeed = new p5.Vector(trainSpeed.x*hiDamp*deltaTime*deltaDamp, 0);
  // add trees
  // if (fft.getEnergy("treble") > 13){
  //   // trees.push(new Tree(width, height, 20, random(0, height*0.5)));
  //   trees.push(new Tree(width, height, deltaDamp*10, fft.getEnergy("treble")*5));
  // }

  if (fft.getEnergy("treble") > 18){
    // trees.push(new Tree(width, height, 20, random(0, height*0.5)));
    trees.push(new Tree(width, height, deltaDamp*300, fft.getEnergy("treble")*10));
  }

  for (i=0;i<trees.length;i++){
    //show them
    trees[i].show();

    // move left
    trees[i].pos = p5.Vector.sub(trees[i].pos, hiSpeed);

    // remove trees
  }
  if (trees.length > 0 || trees.length > 150){
    if (trees[0].pos.x < 0){
      trees.shift();
    }
  }
}

function mousePressed(){
  for (i=0;i<buttons.length;i++){
    if (buttons[i].over){
      buttons[i].do();
    }
  }
  if (getAudioContext().state !== "running"){
    userStartAudio();
    ticket = ticketPunched;
    ticketText = "thank you, and safe travels *kshht*";
    if (allSongs[0].isLoaded()){
      songLoaded();
    } else {
      allSongs[0] = new p5.SoundFile("songs/0.mp3", songLoaded);
    }

  }

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
    // console.log(getAudioContext().state)
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

  trackMin = (allSongs[nextSong].duration() / 60).toString().slice(0, 1);
  trackSec = (allSongs[nextSong].duration() % 60).toString().slice(0, 2);
  if (trackSec > 10){
    trackSecFixed = trackSec;
  } else {
    trackSecFixed = "0" + trackSec.slice(0, 1);
  }

  allSongs[nextSong].setLoop(false);
  // allSongs[nextSong].playMode('restart');
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

function buttonsHandler(){
  buttonOver = false;
  for (i=0;i<buttons.length;i++){
    buttons[i].show();

    if (buttons[i].over == true){
      buttonText = buttons[i].id;
      buttonOver = true;
    }
  }

  if (!buttonOver){
    buttonText = "";
  }
}


var Tree = function(x, y, w, h){
  this.pos = new p5.Vector(x, y);
  this.size = new p5.Vector(w, h);

  this.show = function(){
    // noStroke();
    fill(200);
    stroke(200);
    strokeWeight(deltaDamp*70);
    rectMode(CENTER);
    // translate(0, -100);
    // rect(this.pos.x, this.pos.y, this.size.x, this.size.y);
    line(this.pos.x, this.pos.y, this.pos.x, this.pos.y - this.size.y);
  }
}

var MiniDiscButton = function(x, y, r, id){
  this.pos = new p5.Vector(x, y);
  this.r = r;
  this.over = false;
  this.distance = mouse.dist(this.pos);
  this.id = id;

  this.show = function(){
    this.distance = mouse.dist(this.pos);
    push();
      // stroke(100);
      // fill(200);
      // ellipse(this.pos.x, this.pos.y, this.r);
    pop();
    // console.log(this.distance);
    if (this.distance < this.r*0.5){
      this.over = true;
    } else {
      this.over = false;
    }
  }

  this.do = function(){
    // songSwitchForward();
    if (this.id == "play"){
      allSongs[currentSong].rate(1);
    } else if (this.id == "pause"){
      allSongs[currentSong].rate(0.001);
    } else if (this.id == "fwd"){
      songSwitchForward();
    } else if (this.id == "back"){
      songSwitchBackward();
    } else if (this.id == "spd up"){
      if (deltaDamp <= 1){
        deltaDamp += 0.05;
      }
      if (deltaDamp > 1){
        deltaDamp = 1;
      }
    } else if (this.id == "spd dwn"){
      if (deltaDamp > 0.1){
        deltaDamp -= 0.05;
      }
      if (deltaDamp <= 0.1){
        deltaDamp = 0.1;
      }
    } else if (this.id == "night"){
      if (day && bgLerp == 0){
        day = false;
      } else if (!day && bgLerp == 1) {
        day = true;
      } else {

      }
    } else {

    }
  }
}

function audioContextCheck(){

  if (getAudioContext().state == "running"){
    if (ticketPunchAlpha > 0){
      ticketPunchAlpha -= 2;
    }
  }

  if (ticketPunchAlpha > 0){
    push();
      noStroke();
      fill(0, 0, 0, ticketPunchAlpha);
      rect(0, 0, width, height);
    pop();
    push();
      noStroke();
      textAlign(CENTER);
      textSize(28);
      fill(255, 255, 255, ticketPunchAlpha);
      text(width/2, 2*(height/3));
      text(ticketText, width/2, 2*(height/3)+30);
    pop();


    push();
      angleMode(RADIANS);
      translate(width/2, height/2 + (255-ticketPunchAlpha)*2)
      rotate(1-(ticketPunchAlpha/255));
      imageMode(CENTER);
      image(ticket, 0, 0);
    pop();
  }
}