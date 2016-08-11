Game.Entity.actions = {};

Game.Entity.actions.playerAction = function () {
  if (this.isCheckmatedPlayer()) {
    this.dies();
    return;
  }
  Game.currentScreen.unlockInput();
  this.map.engine.lock();
  Game.refresh();
};

Game.Entity.actions.playerDie = function (killer) {
  var thisPlayer = this;
  return new Promise(function(resolve) {
    Game.currentScreen.gameEnded = true;
    thisPlayer.map.targets.shift();
    thisPlayer.map.removeEntity(thisPlayer);
    console.log('GAME OVER');
    resolve(true);
  });
};

Game.Entity.actions.die = function (killer) {
  var thisEntity = this;
  return new Promise(function(resolve) {
    thisEntity.map.removeEntity(thisEntity);
    resolve(true);
  });
};

Game.Entity.actions.decoyDie = function (killer) {
  var thisDecoy = this;
  return new Promise(function(resolve) {
    thisDecoy.map.targets.pop();
    thisDecoy.map.removeEntity(thisDecoy);
    resolve(true);
  });
};

Game.Entity.actions.botDie = function (killer) {
  if (killer.niceToBots === false) {
    var thisBot = this;
    return new Promise(function(resolve) {
      var loot = Object.create(Game.Item).init(Game.Item.templates.datachip);
      thisBot.map.addItem(thisBot.x, thisBot.y, loot);
      thisBot.map.removeEntity(thisBot);
      console.log(killer.tile, 'killed', thisBot.tile);
      resolve(true);
    });
  } else {
    return Promise.resolve(false);
  }
};

Game.Entity.actions.randomWalk = function () {
  var targetCell;
  if (this.canPhase) {
    targetCell = this.cellHere().neigbors().random();
  } else {
    targetCell = this.cellHere().randomLink();
  }
  return this.tryMove(targetCell.x, targetCell.y, this.map);
};

Game.Entity.actions.seekPlayer = function () {
  var entity = this;
  var target = entity.map.targets.slice(-1)[0];
  if (!target) {
    return Promise.resolve(false);
  }
  var pathfinder = Object.create(Game.Pathfinder).init(entity.map.grid, target,
  function passable(here, there) {
    return ((here.linked(there)) || 
            (entity.canTunnel && there.dug) ||
            (entity.canDig) || // and diggable
            (entity.canPhase)
          ) && !there.impassable;
  });
  var targetCell = pathfinder.getApproachFrom(entity.x, entity.y);
  return this.tryMove(targetCell.x, targetCell.y, this.map);
};

Game.Entity.actions.botMove = function () {
  if (this.isAngry) {
    this.relax(5);
  } else {
    this.frustrate(1);
  }
  var bot = this;
  return Game.Entity.actions.seekPlayer.call(this)
  .then(function(didSeek) { 
    if (!didSeek) {
      bot.frustrate(2);
      return Game.Entity.actions.randomWalk.call(bot);
    }
  });
};

Game.Entity.actions.fall = function () {
  var thisEntity = this;
  var targetCell = this.cellHere().south;
  var passableTargetCell = targetCell && !targetCell.impassable;
  var canKeepFalling = passableTargetCell && (targetCell.dug || this.canDig);
  var canStartFalling = passableTargetCell && targetCell.dug && this.map.unoccupiedAt(targetCell.x, targetCell.y);
  var isFalling = this.falling > 0;
  var isFallingHard = this.falling > 1;

  if ((isFalling && canKeepFalling) || (!isFalling && canStartFalling)) {
    return thisEntity.tryMove(targetCell.x, targetCell.y, thisEntity.map).then(function(fell) {
      if (fell) {
        thisEntity.falling += 1;
      }
      return true;
    });
  } else if (isFalling && !canKeepFalling) {
    if (isFallingHard) {
      thisEntity.kill(thisEntity); // crash!
    } else { // else, gentle fall. stop falling and don't break;
      thisEntity.falling = 0;
    }
    return Promise.resolve(true);
  } else {
    thisEntity.falling = 0;
    return Promise.resolve(false);
  }
};

Game.Entity.actions.crateBreak = function (killer) {
  if (killer === this || killer === 'explosion') {
    var x = this.x;
    var y = this.y;
    var map = this.map;
    var crateType = this.crateType;
    this.map.removeEntity(this);
    if (crateType !== undefined) {
      Game.Crates.doAction(crateType, x, y, map);
      Game.Crates.identify(crateType);
    }
  }
}

Game.Entity.actions.randomWalk = function () {
  var targetCell = this.cellHere().randomLink();
  if (targetCell) {
    return this.tryMove(targetCell.x, targetCell.y, this.map);
  }
  return false;
};

Game.Entity.actions.gotoNextLevel = function () {
  Game.currentScreen.nextLevel();
};

Game.Entity.actions.nullAction = function() {return Promise.resolve();};
