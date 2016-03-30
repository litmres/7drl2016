var Game = {
  display: null,
  stage: null,
  currentScreen: null,
  tileSize: {x: 34, y: 34},
  mapSize: {x: 13, y: 15},
  init: function() {
    this.display = PIXI.autoDetectRenderer(Game.mapSize.x * Game.tileSize.x, (Game.mapSize.y + 2) * Game.tileSize.y);
    document.querySelector('.game').appendChild(this.display.view);
    this.stage = new PIXI.Container();
    this.switchScreen(Game.Screen.playScreen);
    window.addEventListener('keydown', function(e) {
      if (e.keyCode === ROT.VK_SPACE ||
          e.keyCode === ROT.VK_DOWN ||
          e.keyCode === ROT.VK_UP) {
        e.preventDefault();
      }
      Game.currentScreen.handleInput('keydown', e);
    });
    return this;
  },
  refresh: function() {
    while (this.stage.children[0]) { this.stage.removeChild(this.stage.children[0]); }
    this.currentScreen.render(this.display);
  },
  switchScreen: function(screen) {
    if (this.currentScreen !== null) {
        this.currentScreen.exit();
    }
    this.currentScreen = screen;
    if (!this.currentScreen !== null) {
      this.currentScreen.enter();
      this.refresh();
    }
  }
};

window.addEventListener('load', function() {
  var tileAtlas = ["assets/i/tileset.json"];
  PIXI.loader.add(tileAtlas)
  .load(setup);

  function setup() {
    Game.init().refresh();
  }

}, false);