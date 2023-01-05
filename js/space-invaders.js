const path = "sounds/hurt.mp3";

/* SOUND EFFECTS OBJECT ATTEMPT */
class SoundEffect {
  constructor(path) {
    this.audioCtx = undefined;
    this.sample = undefined;
    this.samplesSources = [];

    /* browsers generally require user input before allowing the creation
    of a new AudioContext object (to avoid needless annoyance) */
    window.addEventListener(
      "keydown",
      function (e) {
        if (e.code === "Enter") {
          this.audioCtx = new AudioContext();
          this.setupSamples(path);
        }
      }.bind(this)
    );
  }
  async getAudioBuffer(path) {
    const response = await fetch(path);

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
    return audioBuffer;
  }
  async setupSamples(path) {
    let audioBuffer = await this.getAudioBuffer(path);

    for (let idx = 0; idx < 150; idx += 1) {
      let sampleSource = this.audioCtx.createBufferSource();
      sampleSource.buffer = audioBuffer;
      sampleSource.connect(this.audioCtx.destination);
      this.samplesSources.push(sampleSource);
    }
  }
  playSample() {
    let sampleSource = this.samplesSources.pop();
    sampleSource.start(0, 0.1);
  }
}

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const imageBackground = new Image(60, 45); // Using optional size for image
imageBackground.src = "images/space-background.jpg";
const imageMeteor = new Image(30, 30); // Using optional size for image
imageMeteor.src = "images/meteor.png";
const imageShipRow2 = new Image(30, 30); // Using optional size for image
imageShipRow2.src = "images/ship-2.png";
const imageShipRow3 = new Image(30, 30); // Using optional size for image
imageShipRow3.src = "images/ship-3.png";
const imageShipRow4 = new Image(30, 30); // Using optional size for image
imageShipRow4.src = "images/ship-4.png";
const imageShipRow5 = new Image(30, 30); // Using optional size for image
imageShipRow5.src = "images/ship-5.png";
const imageBonusShip = new Image(30, 30); // Using optional size for image
imageBonusShip.src = "images/bonus-ship.png";

class InteractiveElement {
  constructor(leftX, topY, width, height) {
    this.leftX = leftX;
    this.topY = topY;
    this.width = width;
    this.height = height;
  }
  getLeftX() {
    return this.leftX;
  }
  getRightX() {
    return this.leftX + this.width;
  }
  getTopY() {
    return this.topY;
  }
  getBottomY() {
    return this.topY + this.height;
  }
  setLeftX(val) {
    this.leftX = val;
  }
  setTopY(val) {
    this.topY = val;
  }
  setWidth(width) {
    this.width = width;
  }
  setHeight(height) {
    this.height = height;
  }
}

class Laser extends InteractiveElement {
  constructor(leftX, topY, width = 4, height = 15) {
    super(leftX, topY, width, height);
    this.hit = false;
  }
  draw(color) {
    ctx.fillStyle = color;
    ctx.fillRect(this.leftX, this.topY, this.width, this.height);
  }
  move(shotDirection, speed) {
    this.topY += speed * shotDirection;
  }
  strikesTarget() {
    this.hit = true;
  }
  struckTarget() {
    return this.hit;
  }
}

class PlayerLaser extends Laser {
  static COLOR = "pink";
  static SHOT_DIRECTION = -1;

  constructor(leftX, topY) {
    super(leftX, topY);
  }
  draw() {
    super.draw(PlayerLaser.COLOR);
  }
  move() {
    super.move(PlayerLaser.SHOT_DIRECTION, 10);
  }
}

class AlienLaser extends Laser {
  static COLOR = "blue";
  static SHOT_DIRECTION = 1;

  constructor(leftX, topY) {
    super(leftX, topY);
  }
  draw() {
    super.draw(AlienLaser.COLOR);
  }
  move() {
    super.move(AlienLaser.SHOT_DIRECTION, 2);
  }
}

const explodeMixin = {
  hit: false,
  destroyed: false,
  innerRadius: 0,
  outerRadius: 0,
  explodeSoundEffect: new SoundEffect(path),

  suffersHit() {
    this.hit = true;
    this.boom();
  },
  isHit() {
    return this.hit;
  },
  isDestroyed() {
    return this.destroyed;
  },
  explode() {
    // get coordinates of center point and radius of outside corners
    let cornerRadius = Math.sqrt(this.width ** 2 + this.height ** 2) / 2;
    let centerX = this.leftX + this.width / 2;
    let centerY = this.topY + this.height / 2;

    // draw the initial blast circle
    ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.outerRadius, 0, 2 * Math.PI);
    ctx.fill();

    // once blast circle has reached outer radius, inner circle grows from inside until outer circle disappears
    // only after explosion completes is 'destroyed' set to true (which means it will no longer be part of fleet)
    if (this.outerRadius < cornerRadius) {
      this.outerRadius += 10;
    } else {
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.beginPath();
      ctx.arc(
        this.leftX + this.width / 2,
        this.topY + this.height / 2,
        this.innerRadius,
        0,
        2 * Math.PI
      );
      ctx.fill();
      if (this.innerRadius < this.outerRadius) {
        this.innerRadius += 6;
      } else {
        this.destroyed = true;
      }
    }
  },
  boom() {
    this.explodeSoundEffect.playSample();
  },
};

// explodeMixin.boom = playSample;

class AlienShip extends InteractiveElement {
  static HEIGHT = 30;

  constructor(leftX, topY) {
    super(leftX, topY, AlienShip.HEIGHT, AlienShip.HEIGHT);
    // this.color = "orange";
    this.points = 1;
    // this.hit = false;
    // this.destroyed = false;
    // this.innerRadius = 0;
    // this.outerRadius = 0;
  }
  draw() {
    if (!this.isDestroyed()) {
      // ctx.fillStyle = this.color;
      // ctx.fillRect(this.leftX, this.topY, this.width, this.height);
      if (this.row === 1) {
        ctx.drawImage(
          imageMeteor,
          this.leftX,
          this.topY,
          AlienShip.HEIGHT,
          AlienShip.HEIGHT
        );
      } else if (this.row === 2) {
        ctx.drawImage(
          imageShipRow2,
          this.leftX,
          this.topY,
          AlienShip.HEIGHT,
          AlienShip.HEIGHT
        );
      } else if (this.row === 3) {
        ctx.drawImage(
          imageShipRow3,
          this.leftX,
          this.topY,
          AlienShip.HEIGHT,
          AlienShip.HEIGHT
        );
      } else if (this.row === 4) {
        ctx.drawImage(
          imageShipRow4,
          this.leftX,
          this.topY,
          AlienShip.HEIGHT,
          AlienShip.HEIGHT
        );
      } else {
        ctx.drawImage(
          imageShipRow5,
          this.leftX,
          this.topY,
          AlienShip.HEIGHT,
          AlienShip.HEIGHT
        );
      }

      // this.leftX === 250, this.topY === 300

      // ctx.fillStyle = 'green';
      // ctx.fillRect(this.leftX, this.topY, 30, 30);
      // ctx.fillStyle = '#fc03c6';
      // ctx.fillRect(this.leftX, this.topY, 30, 12);
      // ctx.fillRect(this.leftX + 10, this.topY, 10, 14);
      // ctx.fillRect(this.leftX, this.topY, 5, 20);
      // ctx.fillRect(this.leftX + 25, this.topY, 5, 20);
      // ctx.fillStyle = '#fffab8';
      // ctx.fillRect(this.leftX + 10, this.topY + 20, 10, 6);
      // ctx.fillStyle = '#d0f5f7';
      // ctx.fillRect(this.leftX + 5, this.topY + 16, 5, 3);
      // ctx.fillRect(this.leftX + 20, this.topY + 16, 5, 3);
      // ctx.fillStyle = '#ff2b59';
      // ctx.beginPath();
      // ctx.arc(this.leftX + 13, this.topY + 20, 2, Math.PI, 0);
      // ctx.closePath();
      // ctx.fill();
      // ctx.beginPath();
      // ctx.arc(this.leftX + 17, this.topY + 20, 2, Math.PI, 0);
      // ctx.closePath();
      // ctx.fill();
      // ctx.beginPath();
      // ctx.arc(this.leftX + 15, this.topY + 28, 3, Math.PI, 0);
      // ctx.closePath();
      // ctx.fill();
      // ctx.strokeStyle = '#363233';
      // ctx.strokeRect(this.leftX + 10, this.topY + 4, 10, 10);
      // ctx.strokeRect(this.leftX + 10, this.topY + 4, 5, 5);
      // ctx.strokeRect(this.leftX + 15, this.topY + 4, 5, 5);
      // ctx.strokeRect(this.leftX + 15, this.topY + 9, 5, 5);
      // ctx.strokeRect(this.leftX + 5, this.topY + 7, 5, 5);
      // ctx.strokeRect(this.leftX + 20, this.topY + 7, 5, 5);
      // ctx.strokeRect(this.leftX + 13, this.topY, 4, 5);
    }
    if (this.hit) {
      this.explode();
    }
  }
  // explode() {
  //   // get coordinates of center point and radius of outside corners
  //   let cornerRadius = Math.sqrt(this.width ** 2 + this.height ** 2) / 2;
  //   let centerX = this.leftX + this.width / 2;
  //   let centerY = this.topY + this.height / 2;

  //   // draw the initial blast circle
  //   ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
  //   ctx.beginPath();
  //   ctx.arc(centerX, centerY, this.outerRadius, 0, 2 * Math.PI);
  //   ctx.fill();

  //   // once blast circle has reached outer radius, inner circle grows from inside until outer circle disappears
  //   // only after explosion is complete is destroyed set to true (which means it will no longer be part of fleet)
  //   if (this.outerRadius < cornerRadius) {
  //     this.outerRadius += 10;
  //   } else {
  //       ctx.fillStyle = 'rgba(0, 0, 0, 1)';
  //       ctx.beginPath();
  //       ctx.arc(this.leftX + this.width / 2, this.topY + this.height / 2, this.innerRadius, 0, 2 * Math.PI);
  //       ctx.fill();
  //       if (this.innerRadius < cornerRadius) {
  //         this.innerRadius += 6;
  //       } else {
  //         this.destroyed = true;
  //       }
  //   }
  // }
  moveX(distance) {
    this.leftX += distance;
  }
  moveDown(distance) {
    this.topY += distance;
  }
  shoot() {
    let laser = new AlienLaser(
      this.getLeftX() + AlienShip.HEIGHT / 2 - 1,
      this.getTopY()
    );
    return laser;
  }
  /*
    in order to make sure points are only counted once, we store value in a temp 
    variable and then set the value of points to 0
  */
  getPoints() {
    return this.points;
  }
  setPoints(val) {
    this.points = val;
  }
}

Object.assign(AlienShip.prototype, explodeMixin);

class Fleet extends InteractiveElement {
  constructor() {
    super(0, 50, 380, 170); // lose the magic constants!
    // this.timeElapsed = 0;
    // this.startTime = undefined;
    this.directionX = 1;
    // this.columnSet = new Set();
    // this.rowSet = new Set();
    this.ships = [];
    this.lasers = [];
    this.timeSinceLastShot = 0;
    this.timeOfLastShot = 0;
    // this.rows = {};
    // this.columns = {};
    /* 
      creates 55 ships in 5 rows and 11 columns, populates rowSet and 
      colSet (which are used to track all non-empty rows and columns) and populates
      the rows and cols objects, which track the number of ships left in each row and column
    */
    for (let column = 1; column <= 11; column += 1) {
      for (let row = 1; row <= 5; row += 1) {
        let offsetX = this.leftX + (column - 1) * (AlienShip.HEIGHT + 5);
        let offsetY = this.topY + (row - 1) * (AlienShip.HEIGHT + 5);
        let ship = new AlienShip(offsetX, offsetY);
        ship.column = column;
        ship.row = row;
        this.ships.push(ship);
        // this.columnSet.add(column);
        // this.rowSet.add(row);
        // this.columns[column] === undefined ? this.columns[column] = 1 : this.columns[column] += 1;
        // this.rows[row] === undefined ? this.rows[row] = 1 : this.rows[row] += 1;
      }
    }
  }
  draw() {
    // ctx.fillStyle = 'yellow';
    // ctx.fillRect(this.leftX, this.topY, this.width, this.height);
    // this.updateBounds();
    this.removeDestroyedShips();
    this.ships.forEach((ship) => ship.draw());
  }
  drawLasers() {
    this.lasers = this.lasers.filter(
      (laser) => laser.getBottomY() < 780 && !laser.struckTarget()
    );
    this.lasers.forEach((laser) => laser.draw());
  }
  updateBounds() {
    let minCol = Math.min(...this.columnSet);
    let maxCol = Math.max(...this.columnSet);
    let minRow = Math.min(...this.rowSet);
    let maxRow = Math.max(...this.rowSet);
    this.setLeftX(this.getLeftX() + (minCol - 1) * 35);
    this.width = (maxCol - minCol + 1) * 35 - 5;
    this.setTopY(this.getTopY() + (minRow - 1) * 35);
    this.height = (maxRow - minRow + 1) * 35 - 5;
  }
  removeDestroyedShips() {
    this.ships = this.ships.filter((ship) => !ship.isDestroyed());
  }
  // getShipCount() {
  //   return this.ships.length;
  // }
  move(timestamp) {
    // if (this.startTime === undefined) {
    //   this.startTime = timestamp;
    // }
    // this.timeElapsed = timestamp - this.startTime;
    // if (this.timeElapsed >= this.leftX) {
    //   this.leftX += 5;
    //   this.startTime = undefined;
    // }
    if (this.getRightX() >= 505 && this.directionX > 0) {
      this.directionX *= -1;
      this.moveDown();
    } else if (this.getLeftX() <= 5 && this.directionX < 0) {
      this.directionX *= -1;
      this.moveDown();
    } else if (this.timeStepElapsed(timestamp, 350)) {
      this.leftX += 10 * this.directionX;
      this.ships.forEach((ship) => ship.moveX(10 * this.directionX));
    }
    this.moveLasers();
  }
  moveLasers() {
    this.lasers.forEach((laser) => laser.move());
  }
  shoot(timestamp, playerLeftX) {
    this.timeSinceLastShot = timestamp - this.timeOfLastShot;

    if (this.timeSinceLastShot >= 4000) {
      let xOffsets = [];
      this.ships.forEach((ship) =>
        xOffsets.push(Math.abs(ship.getLeftX() - playerLeftX))
      );
      let shortestOffset = Math.min(...xOffsets);
      let possibleShooters = this.ships.filter(
        (ship) => Math.abs(ship.getLeftX() - playerLeftX) === shortestOffset
      );
      let shooterIndex = Math.floor(Math.random() * possibleShooters.length);
      let shooter = possibleShooters[shooterIndex];
      let laser = shooter.shoot();
      this.lasers.push(laser);
      this.timeOfLastShot = timestamp;
    }
  }
  moveDown() {
    this.ships.forEach((ship) => ship.moveDown(AlienShip.HEIGHT));
    this.setTopY(this.getTopY() + AlienShip.HEIGHT);
  }
  getShipCount() {
    return this.ships.length;
  }
}

// the stepSize argument allows us to specify how much time must elapse before a value is changed
const timerMixin = {
  timeElapsed: 0,
  startTime: undefined,

  timeStepElapsed(timestamp, stepSize) {
    if (this.startTime === undefined) {
      this.startTime = timestamp;
    }
    this.timeElapsed = timestamp - this.startTime;
    if (this.timeElapsed >= stepSize) {
      this.startTime = undefined;
      return true;
    }
  },
};

Object.assign(Fleet.prototype, timerMixin);

class Player extends InteractiveElement {
  static WIDTH = 30;
  static HEIGHT = 30;
  static ROW_TOP = 640;
  static COLOR = "yellow";
  // couldn't use this as reset() due to presence of super (which can only be in constructor)
  constructor() {
    let startX = 510 / 2 - Player.WIDTH / 2; // REPLACE MAGIC CONSTANTS!!
    super(startX, Player.ROW_TOP, Player.WIDTH, Player.HEIGHT);
    this.keyboardInput = new KeyboardInput();
    this.timeSinceLastShot = 0;
    this.timeOfLastShot = 0;
    this.lasers = [];
  }
  draw() {
    // ctx.fillStyle = Player.COLOR;
    // ctx.beginPath();
    // ctx.moveTo(this.leftX, this.topY + this.height);
    // ctx.lineTo(this.leftX + this.width / 2, this.topY);
    // ctx.lineTo(this.leftX + this.width, this.topY + this.height);
    // ctx.closePath();
    // ctx.fill();
    if (!this.isDestroyed()) {
      ctx.fillStyle = Player.COLOR;
      ctx.beginPath();
      ctx.moveTo(this.leftX, this.topY + this.height);
      ctx.lineTo(this.leftX + this.width / 2, this.topY);
      ctx.lineTo(this.leftX + this.width, this.topY + this.height);
      ctx.closePath();
      ctx.fill();
    }
    if (this.hit) {
      this.explode();
    }
  }

  drawLasers() {
    this.lasers = this.lasers.filter(
      (laser) => laser.getBottomY() > 0 && !laser.struckTarget()
    );
    this.lasers.forEach((laser) => laser.draw());
  }
  moveLasers() {
    this.lasers.forEach((laser) => laser.move());
  }
  move(timestamp) {
    if (this.keyboardInput.left && this.leftX > 0) {
      this.leftX -= 5;
    } else if (this.keyboardInput.right && this.leftX + this.width < 510) {
      this.leftX += 5;
    }
    this.moveLasers();
  }
  shoot(timestamp) {
    this.timeSinceLastShot = timestamp - this.timeOfLastShot;

    if (this.keyboardInput.space && this.timeSinceLastShot >= 250) {
      let centerX = this.leftX + this.width / 2;
      let laser = new PlayerLaser(centerX - 1, Player.ROW_TOP);
      this.lasers.push(laser);
      this.timeOfLastShot = timestamp;
      this.keyboardInput.space = false;
    }
  }
}

Object.assign(Player.prototype, timerMixin);
Object.assign(Player.prototype, explodeMixin);

class UFO extends InteractiveElement {
  static WIDTH = 60;
  static HEIGHT = 20;

  constructor() {
    let leftX = 680 + Math.floor(Math.random() * 3000);
    let topY = 40 + Math.floor(Math.random() * 500);
    super(leftX, topY, UFO.WIDTH, UFO.HEIGHT);
    this.points = 10;
  }
  draw() {
    if (!this.isDestroyed()) {
      // ctx.fillStyle = 'green';
      // ctx.fillRect(this.leftX, this.topY, this.width, this.height);
      ctx.drawImage(
        imageBonusShip,
        this.leftX,
        this.topY,
        this.width,
        this.height
      );
    }
    if (this.hit) {
      this.explode();
    }
  }
  move(timestamp) {
    if (this.timeStepElapsed(timestamp, 10)) {
      this.leftX -= 4;
    }
  }
  getPoints() {
    return this.points;
  }
  setPoints(val) {
    this.points = val;
  }
}

Object.assign(UFO.prototype, timerMixin);
Object.assign(UFO.prototype, explodeMixin);

// Seems like screen dimensions should be constants but how to make accessible to all elements?

class Score {
  static HEIGHT = 30;
  static WIDTH = 5 * Score.HEIGHT;

  constructor() {
    this.count = 0;
  }
  draw() {
    ctx.fillStyle = "blue";
    // ctx.fillRect(510 - Score.WIDTH, 5, Score.WIDTH, Score.HEIGHT);
    ctx.lineWidth = 2;
    ctx.font = "bold 30px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${this.count}`, canvas.width - 10, 35);
  }
  incrementCount(points) {
    this.count += points;
    // console.log(points);
  }
}

//   ctx.strokeStyle = 'yellow';
//     ctx.lineWidth = 2;
//     ctx.font = '50px sans-serif';
//     ctx.textAlign = 'center';
//     ctx.strokeText('SPACE INVADERS!', canvas.width / 2, 300);

//     ctx.strokeStyle = 'green';
//     ctx.lineWidth = 2;
//     ctx.font = '20px Courier';
//     ctx.textAlign = 'center';
// ctx.strokeText('press enter to start new game', canvas.width / 2, 330);

class GameElements {
  constructor() {
    this.reset();
  }
  reset() {
    this.fleet = new Fleet();
    this.player = new Player();
    this.UFO = new UFO();
    this.score = new Score();
    this.playerLives = 3;
    this.newGame = true; // use this to prevent the game from repeatedly calling constructor when win or lose screen displays
  }
  draw() {
    if (this.newGame) this.newGame = false;
    this.fleet.draw(); // lasers fired by fleet and player are part of fleet and player's respective states
    this.fleet.drawLasers();
    this.player.draw();
    this.player.drawLasers();
    this.UFO.draw();
    this.score.draw();
  }

  checkFleetOrUFOHit() {
    // updates element values -maybe timestamp goes in here?
    this.player.lasers.forEach((laser) => {
      if (this.intersect(laser, this.fleet)) {
        this.fleet.ships.forEach((ship) => {
          if (this.intersect(laser, ship)) {
            ship.suffersHit();
            // playSample();
            // console.log(samplesSources.length);
            // console.log(ship.getPoints());
            // if points have already been added to score we won't call incrementCount() again
            if (ship.getPoints() > 0) {
              this.score.incrementCount(ship.getPoints());
              ship.setPoints(0);
            }

            /*
              when a ship is hit we check coordinates of all remaining ships
              and update the leftX, width, and topY properties of Fleet as needed
            */
            let remainingShips = this.fleet.ships.filter(
              (ship) => !ship.isHit()
            );
            let leftXVals = [];
            let topYVals = [];

            remainingShips.forEach((ship) => {
              leftXVals.push(ship.getLeftX());
              topYVals.push(ship.getTopY());
            });

            let leftmostLeftX = Math.min(...leftXVals);
            let rightmostLeftX = Math.max(...leftXVals);
            let width = rightmostLeftX - leftmostLeftX + AlienShip.HEIGHT;
            let topMostTopY = Math.min(...topYVals);
            let lowestTopY = Math.max(...topYVals);
            let height = lowestTopY - topMostTopY + AlienShip.HEIGHT;

            this.fleet.setLeftX(leftmostLeftX);
            this.fleet.setWidth(width);
            this.fleet.setTopY(topMostTopY);
            this.fleet.setHeight(height);

            laser.strikesTarget();
          }
        });
      } else if (this.intersect(laser, this.UFO)) {
        this.UFO.suffersHit();
        laser.strikesTarget();
        console.log("laser struck target");
        console.log(laser.struckTarget());
        if (this.UFO.getPoints() > 0) {
          this.score.incrementCount(this.UFO.getPoints());
          this.UFO.setPoints(0);
        }
      }
    });
    if (this.UFO.isDestroyed() || this.UFO.getLeftX() < 0) {
      this.UFO = new UFO();
    }
  }

  checkPlayerHit() {
    // updates element values -maybe timestamp goes in here?
    this.fleet.lasers.forEach((laser) => {
      if (this.intersect(laser, this.player)) {
        this.player.suffersHit();
      }
      if (this.player.isDestroyed()) {
        this.playerLives -= 1;
        // console.log(this.playerLives);
        this.player = new Player();
      }
    });
  }

  moveAndShoot(timestamp) {
    // calls move() on all elements -probably need to pass in timestamp as arg
    this.fleet.move(timestamp);
    this.fleet.shoot(timestamp, this.player.getLeftX());
    this.player.move(timestamp);
    this.player.shoot(timestamp);
    this.UFO.move(timestamp);
  }

  playerLost() {
    // return true when player has lost three lives or fleet reaches player row
    return (
      this.playerLives === 0 || this.fleet.getBottomY() >= this.player.getTopY()
    );
  }

  playerWon() {
    // return true when no alien ships are left
    return this.fleet.getShipCount() === 0;
  }

  intersectX(obj1, obj2) {
    return (
      (obj1.getRightX() > obj2.getLeftX() &&
        obj1.getRightX() <= obj2.getRightX()) ||
      (obj1.getLeftX() >= obj2.getLeftX() && obj1.getLeftX() < obj2.getRightX())
    );
  }

  intersectY(obj1, obj2) {
    return (
      (obj1.getTopY() < obj2.getBottomY() &&
        obj1.getTopY() >= obj2.getTopY()) ||
      (obj1.getBottomY() <= obj2.getBottomY() &&
        obj1.getBottomY() > obj2.getTopY())
    );
  }

  intersect(obj1, obj2) {
    return this.intersectX(obj1, obj2) && this.intersectY(obj1, obj2);
  }
}

// this class has the window listen for keydown and keyup events and update the instance's values accordingly
class KeyboardInput {
  constructor() {
    this.reset();
    window.addEventListener("keydown", this.getKeydownCode.bind(this));
    window.addEventListener("keyup", this.getKeyupCode.bind(this));
  }

  reset() {
    this.enter = false;
    this.space = false;
    this.right = false;
    this.left = false;
  }

  getKeydownCode = function (e) {
    switch (e.code) {
      case "ArrowLeft":
        this.left = true;
        break;
      case "ArrowRight":
        this.right = true;
        break;
      case "Space":
        this.space = true;
        break;
      case "Enter":
        this.enter = true;
        break;
    }
  };

  getKeyupCode = function (e) {
    if (e.code === "ArrowLeft") {
      this.left = false;
    } else if (e.code === "ArrowRight") {
      this.right = false;
    }
  };
}

class SpaceInvadersGame {
  constructor() {
    this.won = false;
    this.lost = false;
    this.keyboardInput = new KeyboardInput();
    this.gameElements = new GameElements();
    // this.display = new Display();
  }

  play() {
    requestAnimationFrame(this.animationLoop.bind(this));
  }

  initialState() {
    return !this.won && !this.lost && !this.keyboardInput.enter;
  }

  startedFirstGame() {
    return !this.won && !this.lost && this.keyboardInput.enter;
  }

  playerWon() {
    return this.won && !this.lost && !this.keyboardInput.enter;
  }

  playerLost() {
    return this.lost && !this.won && !this.keyboardInput.enter;
  }

  playAgain() {
    return (this.won || this.lost) && this.keyboardInput.enter;
  }

  animationLoop(timestamp) {
    if (this.initialState()) {
      this.drawIntroScreen();
    } else if (this.startedFirstGame()) {
      this.drawActionScreen(timestamp);
    } else if (this.playerWon()) {
      this.drawPlayerWonScreen();
      if (!this.gameElements.newGame) this.gameElements.reset();
    } else if (this.playerLost()) {
      this.drawPlayerLostScreen();
      if (!this.gameElements.newGame) this.gameElements.reset();
    } else if (this.playAgain()) {
      this.won = false;
      this.lost = false;
      this.drawActionScreen();
    }

    requestAnimationFrame(this.animationLoop.bind(this));
  }

  drawIntroScreen() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 510, 680);
    ctx.drawImage(imageBackground, 0, 0, 510, 680);

    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 2;
    ctx.font = "50px sans-serif";
    ctx.textAlign = "center";
    ctx.strokeText("SPACE INVADERS!", canvas.width / 2, 300);

    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.font = "20px Courier";
    ctx.textAlign = "center";
    ctx.strokeText("press enter to start new game", canvas.width / 2, 330);
  }

  drawActionScreen(timestamp) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 510, 680);
    ctx.drawImage(imageBackground, 0, 0, 510, 680);
    this.gameElements.draw(); // draw all current elements in their correct state and position
    this.gameElements.checkFleetOrUFOHit(); // checks whether any elements have collided and updates their status
    this.gameElements.checkPlayerHit();

    if (this.gameElements.playerWon()) {
      this.won = true;
      this.keyboardInput.reset();
    }

    if (this.gameElements.playerLost()) {
      this.lost = true;
      this.keyboardInput.reset();
    }

    this.gameElements.moveAndShoot(timestamp); // move all elements according to game rules
  }

  drawPlayerWonScreen() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 510, 680);
    ctx.drawImage(imageBackground, 0, 0, 510, 680);

    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 2;
    ctx.font = "35px sans-serif";
    ctx.textAlign = "center";
    ctx.strokeText("YOU SAVED THE PLANET!", canvas.width / 2, 300);

    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.font = "25px Courier";
    ctx.textAlign = "center";
    ctx.strokeText("press enter to play again", canvas.width / 2, 330);
  }

  drawPlayerLostScreen() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 510, 680);

    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 2;
    ctx.font = "25px sans-serif";
    ctx.textAlign = "center";
    ctx.strokeText("ALL YOUR BASE ARE BELONG TO US!", canvas.width / 2, 300);

    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.font = "20px Courier";
    ctx.textAlign = "center";
    ctx.strokeText("press enter to play again", canvas.width / 2, 330);
  }
}

const game = new SpaceInvadersGame();
game.play();

// const canvas = document.querySelector('canvas');
// const ctx = canvas.getContext('2d');

// class Rectangle {
//   constructor() {
//     this.leftX = 200;
//     this.topY = 300;
//     this.width = 100;
//     this.height = 15;
//     this.innerRadius = 0;
//     this.outerRadius = 0;
//     this.destroyed = false;
//   }
//   draw() {
//     ctx.fillStyle = 'orange';
//     ctx.fillRect(this.leftX, this.topY, this.width, this.height);
//   }
//   explode() {
//     let cornerRadius = Math.sqrt(this.width ** 2 + this.height ** 2) / 2;
//     let centerX = this.leftX + this.width / 2;
//     let centerY = this.topY + this.height / 2;
//     ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
//     ctx.beginPath();
//     ctx.arc(centerX, centerY, this.outerRadius, 0, 2 * Math.PI);
//     ctx.fill();

//     if (this.outerRadius < cornerRadius) {
//       this.outerRadius += 10;
//     } else {
//       ctx.fillStyle = 'rgba(0, 0, 0, 1)';
//       ctx.beginPath();
//       ctx.arc(this.leftX + this.width / 2, this.topY + this.height / 2, this.innerRadius, 0, 2 * Math.PI);
//       ctx.fill();
//       if (this.innerRadius < cornerRadius) {
//         this.innerRadius += 6;
//       } else {
//         this.destroyed = true;
//       }
//     }
//   }
// }

// // let rect = new Rectangle();
// let timeElapsed = 0;
// let timeStarted = undefined;
// let rect = new Rectangle();

// const animationLoop = (timestamp) => {
//   ctx.fillStyle = 'black';
//   ctx.fillRect(0, 0, 510, 680);

//   if (timeStarted === undefined) {
//     timeStarted = timestamp;
//   }

//   timeElapsed = timestamp - timeStarted;

//   if (timeElapsed > 2000) {
//     rect = new Rectangle();
//     timeStarted = timestamp;
//   }
//   if (!rect.destroyed) {
//     rect.draw();
//     rect.explode();
//   }
//   requestAnimationFrame(animationLoop);

// }

// requestAnimationFrame(animationLoop);
