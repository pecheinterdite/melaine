/////////////////////////////////////////////////////////////////////
//////////////////////DECLARATIONS///////////////////////////////////
/////////////////////////////////////////////////////////////////////

//Define variables for posenet
let video, poseNet, pose, skeleton;

//Define initial tracking variables for right wrist frequency (X axis)
let freqWristR, oscWristR;

//Define initial tracking variables for left wrist frequency (Y axis)
let freqWristL, oscWristL;

//Define sliding oscillators
let freqSlidingOscX, slidingOscX;
let freqSlidingOscY, slidingOscY;

//2D Array for right wrist coordinates (X) when stored
let rightWristCoordinatesX = [];
let rightWristCoordinatesY = [];

//Array for storing tuned X coordinates of right wrist
let rightWristXTuned = [];

//2D Array for right wrist coordinates (X) when stored
let leftWristCoordinatesX = [];
let leftWristCoordinatesY = [];

//Array for storing tuned Y coordinates of left wrist
let leftWristYTuned = [];

//Variables for amplitude and the state of the experience
let state = 0;

//Variable for border image
let border;

//Variables for fonts
let cirkaLight;
let cirkaBold;

//Variables for frequency label arrays
let leftLabels = [];
let rightLabels = [];

//Variable for shifting webcam feed onscreen
let shiftX = 120;
let shiftY = 50;

//States for stop/start
let lState = 1;
let rState = 1;

//Click states for right hand
let previousClickXRightHand;
let previousClickYRightHand;
let currentClickXRightHand;
let currentClickYRightHand;

//Click states for left hand
let previousClickXLeftHand;
let previousClickYLeftHand;
let currentClickXLeftHand;
let currentClickYLeftHand;

/////////////////////////////////////////////////////////////////////
/////////////////////PRELOAD/////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

function preload() {

  //Preload border image
  border = loadImage('assets/border.png');

  //Preload fonts
  cirkaLight = loadFont('assets/Cirka-Light.otf');
  cirkaBold = loadFont('assets/Cirka-Bold.otf');
}

/////////////////////////////////////////////////////////////////////
/////////////////////SETUP///////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

function setup() {

  //Create canvas
  let cnv = createCanvas(windowWidth, windowHeight);

  //Create webcam feed 
  video = createCapture({
    audio: false,
    video: {
      width: windowWidth - windowWidth / 15,
      height: windowHeight
    }
  }, function () {
    console.log('ready to peep')
  });

  //Initialise posenet
  poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on('pose', gotPoses);

  //Create oscillator for left wrist
  oscWristL = new p5.Oscillator('square');

  //Create oscillator for right wrist
  oscWristR = new p5.Oscillator('triangle');

  //Create sliding oscillators
  slidingOscX = new p5.Oscillator('sawtooth');
  slidingOscY = new p5.Oscillator('sawtooth');

}

/////////////////////////////////////////////////////////////////////
/////////////////////GOT POSES///////////////////////////////////////
/////////////////////////////////////////////////////////////////////

function gotPoses(poses) {

  //Initialising posenet once poses are defined
  if (poses.length > 0) {
    pose = poses[0].pose;
    skeleton = poses[0].skeleton;
  }
}

/////////////////////////////////////////////////////////////////////
/////////////////////MODEL LOADED////////////////////////////////////
/////////////////////////////////////////////////////////////////////

function modelLoaded() {

  //Model has loaded
  console.log('poseNet ready');

  //Left wrist oscillator starts
  oscWristL.start();
  oscWristL.amp(1, 0.5);

  //Right wrist oscillator starts
  oscWristR.start();
  oscWristR.amp(1, 0.5);
}

/////////////////////////////////////////////////////////////////////
////////////////////DRAW/////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

function draw() {

  textFont(cirkaBold);
  textSize(15);

  /////////////////////////////////////////////////////////////////////
  ///////////////////STATE 0///////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  if (state == 0) {

    //Background image
    border.resize(width, height);
    image(border, 0, 0);

    //Click to start square
    square(width / 2 - 50, height / 2 - 50, 100);
    stroke(255);
    text('Melaine', width / 2 - 27, height / 2 + 5);

  }

  else if (state == 1) {

    border.resize(width, height);
    image(border, 0, 0);

    //Add webcam video to canvas
    image(video, shiftX, shiftY);

    //Add borders to webcam video
    border.resize(width / 15, height);
    image(border, width - width / 15, 0);

    //If this check isn't carried out, there will be an error message
    //as no pose has been detected that can then be used to draw the ellipse
    if (pose) {

      //Cycle through all keypoints
      for (let i = 0; i < pose.keypoints.length; i++) {

        //Define d in relation to distance between left eye and right eye, so that
        //the points are drawn smaller when subject is further away from the camera
        //and larger when the subject is closer
        let eyeR = pose.rightEye;
        let eyeL = pose.leftEye;
        let d = dist(eyeR.x, eyeR.y, eyeL.x, eyeL.y);

        //Draw keypoints
        noStroke();
        let x = (pose.keypoints[i].position.x) + shiftX;
        let y = (pose.keypoints[i].position.y) + shiftY;
        //Only draw wrists as otherwise visual can be very confusing, especially when confidence levels are low
        if (pose.keypoints[i].part == "leftWrist" || pose.keypoints[i].part == "rightWrist") {
          fill(202, 108, 213);;
        } else {
          noFill();
        }
        ellipse(x, y, d / 2);
      }

      //Cycle through skeleton
      for (let i = 0; i < skeleton.length; i++) {

        //Skeleton is a 2D array, so indexes 0 and 1 are accessed on each iteration
        let a = skeleton[i][0];
        let b = skeleton[i][1];

        //Draw skeleton lines
        strokeWeight(2);
        stroke(255);
        line(a.position.x + shiftX, a.position.y + shiftY, b.position.x + shiftX, b.position.y + shiftY);
      }

      //Left wrist position mapped on y axis to between C4 and C5
      freqWristL = map(pose.leftWrist.y, 0, height, 261.63, 523.25);

      //Right wrist position mapped on x axis to between C3 and C4
      freqWristR = map(pose.rightWrist.x, 0, width, 130.81, 261.63);

      //Frequency of left wrist oscillator changes as it moves around
      oscWristL.freq(freqWristL);

      //Frequency of right wrist oscillator changes as it moves around
      oscWristR.freq(freqWristR);
    }

    textSize(25);

    //Button for adding new frequencies to X axis (right hand)
    stroke(255);
    fill(255, 75, 20);
    square(width - width / 15, 0, width / 15);
    noStroke();
    fill(255);
    text('R(X)', width - width / 15 + 2, ((width / 15) / 8) * 3);

    //Button for adding new frequencies to Y axis (left hand)
    stroke(255);
    fill(255, 75, 20);
    square(width - width / 15, width / 15 + 20, width / 15);
    noStroke();
    fill(255);
    text('L(Y)', width - width / 15 + 2, (width / 15 + 20) + ((width / 15) / 8) * 3);

    //Button for triggering next state
    stroke(255);
    fill(255, 75, 20);
    square(width - width / 15, height - width / 15 * 2, width / 15);
    noStroke();
    fill(255);
    text('Next', width - width / 15 + 2, ((height - ((width / 15) * 2)) + ((width / 15) / 8) * 3));

    //Instructions
    fill(255);
    rect(0, height - width / 15, width - width / 15, width / 15);
    fill(0);
    textSize(15);
    text('Click R(X) button to store position of right hand on X axis', 10, height - width / 15 + ((width / 15) / 8) * 3);
    text('Click L(Y) button to store position of left hand on Y axis', 10, height - width / 15 + ((width / 15) / 8) * 6);
  }

  /////////////////////////////////////////////////////////////////////
  ///////////////////STATE 2///////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  else if (state == 2) {

    //Left wrist oscillator stops
    oscWristL.stop();

    //Right wrist oscillator stops
    oscWristR.stop();

    border.resize(width, height);
    image(border, 0, 0);


    textSize(15);

    //Each position from the right wrist coordinate arrays are plotted
    for (let i = 0; i <= rightWristCoordinatesX.length; i++) {
      fill(255, 75, 20);
      square(rightWristCoordinatesX[i], rightWristCoordinatesY[i], 30);
      //Label each plot - check first to decide whether it should be above or below the square
      fill(255);
      if (rightWristCoordinatesY[i] + 25 > height - 10) {
        text(rightLabels[i], rightWristCoordinatesX[i], rightWristCoordinatesY[i] - 2);
      }
      else {
        text(rightLabels[i], rightWristCoordinatesX[i], rightWristCoordinatesY[i] + 32);
      }
    }

    //Each position from the left wrist coordinate arrays is plotted
    for (let i = 0; i <= leftWristCoordinatesX.length; i++) {
      fill(75, 20, 255);
      square(leftWristCoordinatesX[i], leftWristCoordinatesY[i], 30);
      //Label each plot - check first to decide whether it should be above or below the square
      fill(255);
      if (leftWristCoordinatesY[i] + 25 > height - 10) {
        text(leftLabels[i], leftWristCoordinatesX[i], rightWristCoordinatesY[i] - 2);
      }
      else {
        text(leftLabels[i], leftWristCoordinatesX[i], leftWristCoordinatesY[i] + 32);
      }
    }

    state = 3;
  }

  else if (state = 3) {

    if (mouseIsPressed) {

      //If clicked in right hand
      for (let i = 0; i < rightWristCoordinatesX.length; i++) {

        if (mouseX > rightWristCoordinatesX[i] && mouseX < rightWristCoordinatesX[i] + 30 &&
          mouseY > rightWristCoordinatesY[i] && mouseY < rightWristCoordinatesY[i] + 30) {

          //Oscillator slides around between right hand points with the mouse
          slidingOscX.start();
          slidingOscX.amp(0.5, 1);
          freqSlidingOscX = map(mouseY, 0, width, 130.81, 261.63)
          slidingOscX.freq(freqSlidingOscX);
        }
      }

      //If clicked in left hand
      for (let i = 0; i < leftWristCoordinatesX.length; i++) {

        if (mouseX > leftWristCoordinatesX[i] && mouseX < leftWristCoordinatesX[i] + 30 &&
          mouseY > leftWristCoordinatesY[i] && mouseY < leftWristCoordinatesY[i] + 30) {

          //Oscillator slides around between left hand points with the mouse
          slidingOscY.start();
          slidingOscY.amp(0.5, 1);
          freqSlidingOscY = map(mouseY, 0, height, 261.63, 523.25);
          slidingOscY.freq(freqSlidingOscY);
        }
      }
    }
  }
}


/////////////////////////////////////////////////////////////////////
////////////////MOUSE CLICKED////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

function mouseClicked() {

  if (state == 0) {
    state = 1;
  }

  /////////////////////////////////////////////////////////////////////
  ///////////////////STATE 1///////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////
  else if (state == 1) {

    //User start audio
    userStartAudio();

    //If next state trigger button is clicked
    if (mouseX > width - width / 15 && mouseX < width && mouseY > height - width / 15 * 2 && mouseY < height) {

      //State 1 is triggered
      state = 2;

      //If button to add new X frequency (right wrist) is clicked
    } else if (mouseX > width - width / 15 && mouseX < width && mouseY > 0 && mouseY < width / 15) {

      //Add right wrist coordinates to arrays
      rightWristCoordinatesX.push(pose.rightWrist.x);
      rightWristCoordinatesY.push(pose.rightWrist.y);
      console.log(rightWristCoordinatesX, rightWristCoordinatesY);

      //Mapped version of the X value of the right wrist is stored as the actual frequency of the scale degree
      //Round number to 3dp
      let unroundedTunedRightX = map(pose.rightWrist.x, 0, width, 130.81, 261.31);
      rightWristXTuned.push(unroundedTunedRightX);
      let roundedTunedRightX = nf(unroundedTunedRightX, 1, 3);
      rightLabels.push(roundedTunedRightX);

      console.log(rightWristXTuned);

      //If button to add new Y frequency (left wrist) is clicked
    } else if (mouseX > width - width / 15 && mouseX < width && mouseY > width / 15 + 20 && mouseY < (width / 15 * 2) + 20) {

      //Add left wrist coordinates to arrays
      leftWristCoordinatesX.push(pose.leftWrist.x);
      leftWristCoordinatesY.push(pose.leftWrist.y);
      console.log(leftWristCoordinatesX, leftWristCoordinatesY);

      //Mapped version of the Y value of the left wrist is stored as the actual frequency of the scale degree
      //Round number to 3dp
      let unroundedTunedLeftY = map(pose.leftWrist.y, 0, height, 261.63, 523.25);
      leftWristYTuned.push(unroundedTunedLeftY);
      let roundedTunedLeftY = nf(unroundedTunedLeftY, 1, 3);
      leftLabels.push(roundedTunedLeftY);
      console.log(leftWristYTuned);
    }
  }

  /////////////////////////////////////////////////////////////////////
  ///////////////////STATE 3///////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  else if (state == 3) {


    /////////////////////////////////////////////////////////////////////
    ////////////////RIGHT HAND///////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////

    //Check if click is in any of the plotted coordinates for the right hand
    for (let i = 0; i < rightWristCoordinatesX.length; i++) {

      if (mouseX > rightWristCoordinatesX[i] && mouseX < rightWristCoordinatesX[i] + 30 &&
        mouseY > rightWristCoordinatesY[i] && mouseY < rightWristCoordinatesY[i] + 30) {

        currentClickXRightHand = rightWristCoordinatesX[i];
        currentClickYRightHand = rightWristCoordinatesY[i];
        console.log('PREVIOUS ' + previousClickXRightHand, previousClickYRightHand);
        console.log('CURRENT ' + currentClickXRightHand, currentClickYRightHand);

        //If current click and previous click are in the same box
        if (currentClickXRightHand == previousClickXRightHand && currentClickYRightHand == previousClickYRightHand) {

          //If the oscillator was already playing, it stops
          if (rState == -1) {
            oscWristR.stop();
            rState = 1;
          }

          //If it wasn't already playing, it starts
          else if (rState == 1) {
            oscWristR.amp(1, 1);
            oscWristR.start();
            oscWristR.freq(rightWristXTuned[i]);
            console.log('Frequency: ' + rightWristXTuned[i]);
            rState = -1;
          }
        }

        else {

          //If the oscillator was already playing but a new box has been clicked
          //or if the oscillator was not already playing
          //the frequency of the currently clicked box plays
          if ((rState == -1 && previousClickXRightHand != currentClickXRightHand
            && previousClickYRightHand != currentClickYRightHand) || rState == 1) {
            oscWristR.amp(1, 1);
            oscWristR.start();
            oscWristR.freq(rightWristXTuned[i]);
            console.log('Frequency: ' + rightWristXTuned[i]);
            rState = -1;
          }

          //If oscillator was already playing and new box has not been clicked, it stops
          else if (rState == 1) {
            oscWristR.stop();
            rState = 1;
          }
        }
      }
    }


    previousClickXRightHand = currentClickXRightHand;
    previousClickYRightHand = currentClickYRightHand;



    /////////////////////////////////////////////////////////////////////
    ////////////////LEFT HAND////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////

    //Check if the click is in any of the plotted coordinates for the left hand
    for (let i = 0; i < leftWristCoordinatesX.length; i++) {

      if (mouseX > leftWristCoordinatesX[i] && mouseX < leftWristCoordinatesX[i] + 30 &&
        mouseY > leftWristCoordinatesY[i] && mouseY < leftWristCoordinatesY[i] + 30) {

        currentClickXLeftHand = leftWristCoordinatesX[i];
        currentClickYLeftHand = leftWristCoordinatesY[i];
        console.log('PREVIOUS ' + previousClickXLeftHand, previousClickYLeftHand);
        console.log('CURRENT ' + currentClickXLeftHand, currentClickYLeftHand);


        //If current click and previous click are in the same box
        if (currentClickXLeftHand == previousClickXLeftHand && currentClickYLeftHand == previousClickYLeftHand) {
          //If the oscillator was already playing, it stops
          if (lState == -1) {
            oscWristL.stop();
            lState = 1;
          }
          //If it wasn't already playing, it starts
          else if (lState == 1) {
            oscWristL.amp(1, 1);
            oscWristL.start();
            oscWristL.freq(leftWristYTuned[i]);
            console.log('Frequency: ' + leftWristYTuned[i]);
            lState = -1;
          }
        }

        else {

          //If the oscillator was already playing but a new box has been clicked
          //or if the oscillator was not already playing
          //the frequency of the currently clicked box plays
          if ((lState == -1 && previousClickXLeftHand != currentClickXLeftHand
            && previousClickYLeftHand != currentClickYLeftHand) || lState == 1) {
            oscWristL.amp(1, 1);
            oscWristL.start();
            oscWristL.freq(leftWristYTuned[i]);
            console.log('Frequency: ' + leftWristYTuned[i]);
            lState = -1;
          }


          //If oscillator was already playing and new box has not been clicked, it stops
          else if (lState == 1) {
            oscWristL.stop();
            lState = 1;
          }
        }
      }
    }

    previousClickXLeftHand = currentClickXLeftHand;
    previousClickYLeftHand = currentClickYLeftHand;
  }
}

function mouseReleased() {
  slidingOscX.stop();
  slidingOscY.stop();
}
