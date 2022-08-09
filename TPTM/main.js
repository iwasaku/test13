//console.log = function () { };  // ログを出す時にはコメントアウトする
const debug_flag = false;

const SCREEN_WIDTH = 1280;             // スクリーン幅
const SCREEN_HEIGHT = 2436;                 // スクリーン高さ
const SCREEN_CENTER_X = SCREEN_WIDTH / 2;   // スクリーン幅の半分
const SCREEN_CENTER_Y = SCREEN_HEIGHT / 2;  // スクリーン高さの半分

const FPS = 60; // 60フレ

const FONT_FAMILY = "'misaki_gothic','Meiryo',sans-serif";
const ASSETS = {
    "nmls": "./resource/new_nmls_128.png",
    "rock": "./resource/rock_128.png",

    "chinu": "./resource/chinu_128.png",
    "rabuka": "./resource/rabuka_128.png",

    "bg_sprite": "./resource/bg.png",
    "fg0_sprite": "./resource/fg.png",
    "fg1_sprite": "./resource/fg_blk.png",
};
const fallSE = new Howl({
    src: 'https://iwasaku.github.io/test7/NEMLESSSTER/resource/fall.mp3?20200708'
});
const coinSE = new Howl({
    src: 'https://iwasaku.github.io/test7/NEMLESSSTER/resource/coin05.mp3'
});

// 定義
const PL_STATUS = defineEnum({
    INIT: {
        value: 0,
        isStarted: Boolean(0),  // スタートしてない
        isDead: Boolean(0),     // 死んでない
        isAccKey: Boolean(0),   // キー入力を受け付けない
        string: 'init'
    },
    READY: {
        value: 1,
        isStarted: Boolean(0),  // スタートしてない
        isDead: Boolean(0),     // 死んでない
        isAccKey: Boolean(1),   // キー入力を受け付けない
        string: 'ready'
    },
    START: {
        value: 1,
        isStarted: Boolean(1),  // スタート済み
        isDead: Boolean(0),     // 死んでない
        isAccKey: Boolean(1),   // キー入力を受け付ける
        string: 'start'
    },
    DEAD_INIT: {
        value: 3,
        isStarted: Boolean(0),  // スタートしてない
        isDead: Boolean(1),     // 死んだ
        isAccKey: Boolean(0),   // キー入力を受け付けない
        string: 'dead_init'
    },
    DEAD: {
        value: 4,
        isStarted: Boolean(0),  // スタートしてない
        isDead: Boolean(1),     // 死んだ
        isAccKey: Boolean(0),   // キー入力を受け付けない
        string: 'dead'
    },
});

// 定義
const FISH_DEF = defineEnum({
    CHINU: {
        spr: "chinu",
        w: 128,
        h: 128,
        colw: 0.5,
        colh: 0.5,
        spd: 8,
        sinMax: 400,
    },
    RABUKA: {
        spr: "rabuka",
        w: 594,
        h: 128,
        colw: 0.9,
        colh: 0.5,
        spd: 6,
        sinMax: 0,
    },
});

//
class CharaStatus {
    constructor() {
        this.lv = 1;
        this.gavasss = 0;
    }
    initPlayer() {
    }
}

// 表示プライオリティは 0：奥 → 4：手前 の順番
let group0 = null;  // bg0  黒色
let group1 = null;  // bg1  水色
let group2 = null;  // enemy,item
let group3 = null;  // rock
let group4 = null;  // fg   ライトステンシル
let group5 = null;  // player
let group6 = null;  // status
let bgSprite = null;
let fgSprite = [null, null, null];

const DIR_KEY_DEF = defineEnum({
    NONE: {
        value: -1,
        addX: 0,
        addY: 0,
    },
    LEFT: {
        value: 1,
        addX: -1,
        addY: 0,
    },
    RIGHT: {
        value: 2,
        addX: 1,
        addY: 0,
    },
    UP: {
        value: 3,
        addX: -1,
        addY: 0,
    },
    DOWN: {
        value: 4,
        addX: 1,
        addY: 0,
    },
});

let player = null;
var rockLeftArray = [];
var rockRightArray = [];
let eAlpha = 0;
let eBeta = 0;
let eGamma = 0;
var randomSeed = [3557, 3557];
var randomMode = Boolean(0);
let dbgMsg = "";

tm.main(function () {
    // アプリケーションクラスを生成
    var app = tm.display.CanvasApp("#world");
    app.resize(SCREEN_WIDTH, SCREEN_HEIGHT);    // サイズ(解像度)設定
    app.fitWindow();                            // 自動フィッティング有効
    app.background = "rgba(77, 136, 255, 1.0)"; // 背景色
    app.fps = FPS;                              // フレーム数

    var loading = tm.ui.LoadingScene({
        assets: ASSETS,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    });

    // 読み込み完了後に呼ばれるメソッドを登録
    loading.onload = function () {
        app.replaceScene(LogoScene());
    };

    // ローディングシーンに入れ替える
    app.replaceScene(loading);

    // 実行
    app.run();
});

/*
 * ロゴ
 */
tm.define("LogoScene", {
    superClass: "tm.app.Scene",

    init: function () {
        this.superInit();
        this.fromJSON({
            children: [
                {
                    type: "Label", name: "logoLabel",
                    x: SCREEN_CENTER_X,
                    y: SCREEN_CENTER_Y,
                    fillStyle: "#888",
                    fontSize: 64,
                    fontFamily: FONT_FAMILY,
                    text: "UNOFFICIAL GAME",
                    align: "center",
                },
            ]
        });
        this.localTimer = 0;
    },

    update: function (app) {
        // 時間が来たらタイトルへ
        //if (++this.localTimer >= 5 * app.fps)
        this.app.replaceScene(TitleScene());
    }
});

/*
 * タイトル
 */
tm.define("TitleScene", {
    superClass: "tm.app.Scene",

    init: function () {
        this.superInit();
        this.fromJSON({
            children: [
                {
                    type: "Label", name: "titleLabel",
                    x: SCREEN_CENTER_X,
                    y: SCREEN_CENTER_Y,
                    fillStyle: "#fff",
                    fontSize: 160,
                    fontFamily: FONT_FAMILY,
                    text: "TPTM",
                    align: "center",
                },
                {
                    type: "FlatButton", name: "startButton",
                    init: [
                        {
                            text: "START",
                            fontFamily: FONT_FAMILY,
                            fontSize: 96,
                            width: 512,
                            height: 160,
                            bgColor: "hsl(240, 0%, 70%)",
                        }
                    ],
                    x: SCREEN_CENTER_X,
                    y: SCREEN_CENTER_Y + 320,
                },
            ]
        });
        this.localTimer = 0;

        var self = this;
        this.startButton.onpointingstart = function () {
            window.addEventListener('deviceorientation', function (e) {
                //                let tmp = getQuaternion(e.alpha, e.beta, e.gamma);
                //                eAlpha = tmp[0];    // e.alpha  未使用
                //                eBeta = tmp[1];     // e.beta   縦加速（-180～180°）
                //                eGamma = tmo[2];    // e.gamma  横加速（-90～90°）
                eAlpha = e.alpha;  //未使用
                eBeta = e.beta;  //縦加速（-180～180°）
                eGamma = e.gamma;  //横加速（-90～90°）
            }, false);
            //            requestDeviceOrientationPermission();
            self.app.replaceScene(GameScene());
        };
    },

    update: function (app) {
        app.background = "rgba(0, 0, 0, 1.0)"; // 背景色
    }
});

/*
 * ゲーム
 */
tm.define("GameScene", {
    superClass: "tm.app.Scene",

    init: function () {
        this.superInit();
        if (!randomMode) {
            randomSeed[0] = 3557;
            randomSeed[1] = 3557;
        }
        group0 = tm.display.CanvasElement().addChildTo(this);   // BG0（黒色）
        group1 = tm.display.CanvasElement().addChildTo(this);   // BG1（水色）
        group2 = tm.display.CanvasElement().addChildTo(this);   // 敵、アイテム
        group3 = tm.display.CanvasElement().addChildTo(this);   // 岩
        group4 = tm.display.CanvasElement().addChildTo(this);   // FG（ライトステンシル）
        group5 = tm.display.CanvasElement().addChildTo(this);   // プレイヤー
        group6 = tm.display.CanvasElement().addChildTo(this);   // ステータス

        bgSprite = tm.display.Sprite("bg_sprite", SCREEN_WIDTH, SCREEN_HEIGHT).addChildTo(group1);
        bgSprite.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y);
        bgSprite.setAlpha(1.0);
        fgSprite = [null, null, null];
        fgSprite[0] = tm.display.Sprite("fg1_sprite", SCREEN_WIDTH, SCREEN_HEIGHT).addChildTo(group4);
        fgSprite[0].setPosition(SCREEN_CENTER_X - SCREEN_HEIGHT, SCREEN_CENTER_Y);
        fgSprite[0].setAlpha(0.0);
        fgSprite[1] = tm.display.Sprite("fg0_sprite", SCREEN_WIDTH, SCREEN_HEIGHT).addChildTo(group4);
        fgSprite[1].setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y);
        fgSprite[1].setAlpha(0.0);
        fgSprite[2] = tm.display.Sprite("fg1_sprite", SCREEN_WIDTH, SCREEN_HEIGHT).addChildTo(group4);
        fgSprite[2].setPosition(SCREEN_CENTER_X + SCREEN_HEIGHT, SCREEN_CENTER_Y);
        fgSprite[2].setAlpha(0.0);

        clearArrays();
        player = new PlayerSprite().addChildTo(group4);
        for (let ii = 0; ii < 22; ii++) {
            let rockL = RockSprite(ii, SCREEN_CENTER_X - 128 * 9, 128 * ii).addChildTo(group3);
            rockLeftArray.push(rockL);
            let rockR = RockSprite(ii, SCREEN_CENTER_X + 128 * 9, 128 * ii).addChildTo(group3);
            rockRightArray.push(rockR);
        }

        this.fromJSON({
            children: [
                {
                    type: "Label", name: "nowDepthLabel",
                    x: SCREEN_CENTER_X,
                    y: 64,
                    fillStyle: "#fff",
                    shadowColor: "#000",
                    shadowBlur: 10,
                    fontSize: 128,
                    fontFamily: FONT_FAMILY,
                    text: "0m",
                    align: "center",
                },
                {
                    type: "Label", name: "nowScoreLabel",
                    x: SCREEN_CENTER_X,
                    y: SCREEN_HEIGHT - 64,
                    fillStyle: "#fff",
                    shadowColor: "#000",
                    shadowBlur: 10,
                    fontSize: 128,
                    fontFamily: FONT_FAMILY,
                    text: "0",
                    align: "center",
                },
                {
                    type: "Label", name: "gameOverLabel",
                    x: SCREEN_CENTER_X,
                    y: SCREEN_CENTER_Y - 512,
                    fillStyle: "#fff",
                    shadowColor: "#000",
                    shadowBlur: 50,
                    fontSize: 192,
                    fontFamily: FONT_FAMILY,
                    text: "GAME OVER",
                    align: "center",
                },
                {
                    type: "FlatButton", name: "tweetButton",
                    init: [
                        {
                            text: "TWEET",
                            fontFamily: FONT_FAMILY,
                            fontSize: 96,
                            width: 400,
                            bgColor: "hsl(205, 81%, 63%)",
                        }
                    ],
                    x: SCREEN_CENTER_X + 300,
                    y: SCREEN_CENTER_Y + 128,
                    alpha: 0.0,
                },
                {
                    type: "FlatButton", name: "restartButton",
                    init: [
                        {
                            text: "RESTART",
                            fontFamily: FONT_FAMILY,
                            fontSize: 96,
                            width: 400,
                            bgColor: "hsl(240, 0%, 70%)",
                        }
                    ],
                    x: SCREEN_CENTER_X - 300,
                    y: SCREEN_CENTER_Y + 128,
                    alpha: 0.0,
                },
            ]
        });

        this.tweetButton.sleep();
        this.restartButton.sleep();

        var self = this;
        this.restartButton.onpointingstart = function () {
            // playerのremove
            if (player != null) {
                player.remove();
                player = null;
            }
            self.app.replaceScene(GameScene());
        };

        this.nowDepthLabel.text = "0m";
        this.nowScoreLabel.text = "9999";
        this.buttonAlpha = 0.0;
        frame = 0;
    },

    // main loop
    update: function (app) {

        if ((player.status === PL_STATUS.DEAD_INIT) || (player.status === PL_STATUS.DEAD)) {
            if (player.status === PL_STATUS.DEAD_INIT) {
                fallSE.play();
                player.status = PL_STATUS.DEAD;
            }
            player.ySpd = 0;

            var self = this;
            // tweet ボタン
            this.tweetButton.onclick = function () {
                var twitterURL = tm.social.Twitter.createURL({
                    type: "tweet",
                    text: "TPTM 水深" + (player.depth / 100.0).toFixed(2) + "m に到達（スコア：" + player.score + "）",
                    hashtags: ["ネムレス", "NEMLESSS"],
                    url: "https://iwasaku.github.io/test13/TPTM/",
                });
                window.open(twitterURL);
            };

            this.buttonAlpha += 0.05;
            if (this.buttonAlpha > 1.0) {
                this.buttonAlpha = 1.0;
            }
            this.gameOverLabel.setAlpha(this.buttonAlpha);
            this.tweetButton.setAlpha(this.buttonAlpha);
            this.restartButton.setAlpha(this.buttonAlpha);
            if (this.buttonAlpha > 0.7) {
                this.tweetButton.wakeUp();
                this.restartButton.wakeUp();
            }
        } else {
            if (!player.status.isStarted) {
                this.gameOverLabel.setAlpha(0.0);
                player.status = PL_STATUS.READY;
            }

            rockScroll();
        }

        this.nowDepthLabel.text = (player.depth / 100.0).toFixed(2) + "m";
        this.nowScoreLabel.text = player.score;

        ++frame;
    }
});

/*
 * Player
 */
tm.define("PlayerSprite", {
    superClass: "tm.app.AnimationSprite",
    init: function () {
        let ss = tm.asset.SpriteSheet({
            // 画像
            image: "nmls",
            // １コマのサイズ指定および全コマ数
            frame: {
                width: 128,
                height: 128,
                count: 6
            },
            // アニメーションの定義（開始コマ、終了コマ+1、次のアニメーション,wait）
            animations: {
                "nmls": [0, 1, "nmls", 1],
                "left0": [1, 2, "left1", 15],
                "left1": [2, 3, "left0", 15],
                "right0": [3, 4, "right1", 15],
                "right1": [4, 5, "right0", 15],
            }
        });

        this.superInit(ss, 128, 128);
        this.direct = '';
        this.xPos = SCREEN_CENTER_X;
        this.yPos = 0 + 64;
        this.xAcc = 0.0;
        this.yAcc = 0.0;
        this.xSpd = -1;
        this.ySpd = 0.0;
        this.setPosition(this.xPos, this.yPos).setScale(1, 1);
        this.setInteractive(false);
        this.setBoundingType("rect");
        this.gotoAndPlay("left0");
        this.aminBase = "left";
        this.aminCount = 0;

        this.status = PL_STATUS.INIT;
        this.depth = 0;
        this.score = 0;
        this.oxygen = 100 * FPS;    // 100秒分
        this.xFlag = 1; // for debug
        this.oldDepth = 0;
        this.fishDepth = 0;
        this.ySpdCounter = 0;
        this.ySpdTotal = 0;
    },

    update: function (app) {
        if (this.status.isStarted) {

            this.xAcc = eGamma / 90.0;

            let tmpBeta = eBeta;
            if (tmpBeta < 0) tmpBeta = 0;
            else if (tmpBeta > 90) tmpBeta = 90;
            this.yAcc = (tmpBeta - 45) / 45.0;

            let depthRatio = 1 + ((player.depth / 100000.0) * 0.5);
            if (depthRatio >= 1.5) depthRatio = 1.5;
            // for debug
            if (debug_flag) {
                this.xAcc = 1 * this.xFlag;
                this.yAcc = 0.1;
            }

            this.xSpd += this.xAcc * depthRatio;
            if (this.xSpd >= 64.0) this.xSpd = 64.0;
            if (this.xSpd <= -64.0) this.xSpd = -64.0;

            this.ySpd += this.yAcc * depthRatio;
            if (this.ySpd >= 64.0) this.ySpd = 64.0;
            if (this.ySpd <= 1.0) this.ySpd = 1.0;
            if (debug_flag) {
                if (this.ySpd >= 32.0) this.ySpd = 32.0;
            }

            this.xPos += this.xSpd;
            this.depth += this.ySpd;

            this.ySpdCounter++;
            this.ySpdTotal += this.ySpd;
            if (this.depth >= this.oldDepth + 100) {
                // 1mごとにスコア加算
                this.score += Math.round(this.ySpdTotal / this.ySpdCounter);
                this.oldDepth = this.depth;
                this.ySpdCounter = 0;
                this.ySpdTotal = 0;
            }
            if (this.depth >= this.fishDepth + 2000) {
                // 20mごとに魚が発生
                if (this.depth < 10000) {
                    // 100mまでは何も出現しない
                } else if (this.depth < 50000) {
                    // 1/8の確率でCHINUが出現
                    // 7/8の確率で出現しない
                    if (myRandom(1, 1, 8) === 1) {
                        new FishSprite(FISH_DEF.CHINU).addChildTo(group2);
                    }
                } else if (this.depth < 80000) {
                    // 1/4の確率で魚が出現
                    if (myRandom(1, 1, 4) === 1) {
                        // 1/8の確率でRABUKAが出現
                        // 7/8の確率でCHINUが出現
                        if (myRandom(1, 1, 8) === 1) {
                            new FishSprite(FISH_DEF.RABUKA).addChildTo(group2);
                        } else {
                            new FishSprite(FISH_DEF.CHINU).addChildTo(group2);
                        }
                    }
                } else {
                    // 1/2の確率でRABUKAが出現
                    // 1/2の確率で何も出現しない
                    if (myRandom(1, 1, 2) === 1) {
                        new FishSprite(FISH_DEF.RABUKA).addChildTo(group2);
                    }
                }
                this.fishDepth = this.depth;
            }
            // for debug
            if (debug_flag) {
                if (this.xFlag === 1) {
                    if (this.xPos >= SCREEN_WIDTH) {
                        this.xPos = SCREEN_WIDTH;
                        this.xSpd = 0;
                        this.xFlag = -1;
                    }
                }
                if (this.xFlag === -1) {
                    if (this.xPos <= 0) {
                        this.xPos = 0;
                        this.xSpd = 0;
                        this.xFlag = 1;
                    }
                }
            } else {
                if (this.xSpd <= 0) {
                    this.xFlag = -1;
                } else {
                    this.xFlag = 1;
                }
            }
            this.setPosition(this.xPos, this.yPos).setScale(-this.xFlag, 1);

            // playerの情報と１フレずれると見た目もずれてしまうのでココに処理を書く
            fgSprite[0].setPosition(player.x - SCREEN_WIDTH, SCREEN_CENTER_Y);
            fgSprite[1].setPosition(player.x, SCREEN_CENTER_Y);
            fgSprite[2].setPosition(player.x + SCREEN_WIDTH, SCREEN_CENTER_Y);
            if (player.depth < 100000) {
                bgSprite.setAlpha(1.0 - (player.depth / 100000.0));
            } else if (player.depth < 200000) {
                bgSprite.setAlpha(0.0);
            }
            if (player.depth < 80000) {
                fgSprite[0].setAlpha(0.0);
                fgSprite[1].setAlpha(0.0);
                fgSprite[2].setAlpha(0.0);
            } else if (player.depth < 180000) {
                let tmpAlpha = ((player.depth - 80000) * 0.9) / 100000.0;
                fgSprite[0].setAlpha(tmpAlpha);
                fgSprite[1].setAlpha(tmpAlpha);
                fgSprite[2].setAlpha(tmpAlpha);
            } else {
                fgSprite[0].setAlpha(0.9);
                fgSprite[1].setAlpha(0.9);
                fgSprite[2].setAlpha(0.9);
            }
        } else {
            if (this.status === PL_STATUS.READY) {
                this.yPos += 16;
                this.depth += 16;
                if (this.yPos >= SCREEN_CENTER_Y - 336) {
                    this.status = PL_STATUS.START;
                }
                this.setPosition(this.xPos, this.yPos).setScale(-this.xFlag, 1);
            }
        }
    },
});

/*
 * Fish
 */
tm.define("FishSprite", {
    superClass: "tm.app.Sprite",

    init: function (fishDef) {
        this.spriteName = fishDef.spr;
        this.xSize = fishDef.w;
        this.ySize = fishDef.h;
        this.xCol = fishDef.colw;
        this.yCol = fishDef.colh;

        this.superInit(this.spriteName, this.xSize, this.ySize);
        this.direct = '';
        this.setInteractive(false);
        this.setBoundingType("rect");
        this.xSpdFlag = (myRandom(1, 0, 1) === 0) ? -1 : 1;
        if (this.xSpdFlag === 1) {
            this.xPos = 0 - this.xSize;
        } else {
            this.xPos = SCREEN_WIDTH + this.xSize;
        }
        this.yPos = SCREEN_HEIGHT + this.ySize * (myRandom(1, 2, 5));
        this.yOfs = 0;
        if (fishDef.sinMax === 0) {
            this.yOfsMax = 0;
        } else {
            this.yOfsMax = myRandom(1, 10, fishDef.sinMax) / 10.0;
        }
        this.setPosition(this.xPos, this.yPos).setScale(-this.xSpdFlag, 1);
        this.xSpd = fishDef.spd * (myRandom(1, 5, 20) / 10.0);
        this.counter = myRandom(1, 0, 90);
    },

    update: function (app) {
        if (player.status.isDead) return;
        this.xPos += this.xSpd * this.xSpdFlag;
        this.yPos -= player.ySpd;
        this.yOfs = Math.sin(this.counter * 0.25) * this.yOfsMax;
        this.setPosition(this.xPos, this.yPos + this.yOfs).setScale(-this.xSpdFlag, 1);

        if (this.xSpdFlag >= 0) {
            if (this.xPos >= SCREEN_WIDTH + this.xSize) {
                this.xSpdFlag = -this.xSpdFlag;
            }
        } else {
            if (this.xPos < 0 - this.xSize) {
                this.xSpdFlag = -this.xSpdFlag;
            }
        }
        // 画面上端から出た?
        if (this.yPos < -128) {
            this.remove();
            return;
        }
        this.counter++;
        // 自機との衝突判定
        if (chkCollisionRectEne2Player(this, player)) {
            player.status = PL_STATUS.DEAD;
        }
    },
});

/*
 * Rock
 */
tm.define("RockSprite", {
    superClass: "tm.app.Sprite",

    init: function (idx, posX, posY) {
        this.spriteName = "rock";
        this.superInit(this.spriteName, 1280, 128);
        this.direct = '';
        this.setInteractive(false);
        this.setBoundingType("rect");
        this.idx = idx;
        this.xPos = posX;
        this.yPos = posY;
        this.setPosition(this.xPos, this.yPos).setScale(1, 1.2);
        this.ySpd = 0;
        this.ySpdFlag = 1;
        this.xSize = 1280;
        this.ySize = 128;
        this.xCol = 0.9;
        this.yCol = 0.9;
    },

    update: function (app) {
        this.yPos -= player.ySpd;
        this.setPosition(this.xPos, this.yPos);

        if (player.status.isDead) return;
        // 自機との衝突判定
        if (chkCollisionRectEne2Player(this, player)) {
            player.status = PL_STATUS.DEAD;

        }
    },
});

function rockScroll() {
    let self = this;

    let tmpRockLeft = null;
    let tmpRockRight = null;
    for (let ii = self.rockLeftArray.length - 1; ii >= 0; ii--) {
        if (self.rockLeftArray[ii].yPos <= -128) {
            tmpRockLeft = self.rockLeftArray[ii];
            break;
        }
    }
    if (tmpRockLeft !== null) {
        for (let ii = self.rockRightArray.length - 1; ii >= 0; ii--) {
            if (self.rockRightArray[ii].idx === tmpRockLeft.idx) {
                tmpRockRight = self.rockRightArray[ii];
                break;
            }
        }

        // 最後尾のxPos、yPosを取得
        let eolPos = getEndOfLinePos();

        // XPosは範囲内でランダム
        // ±128固定か、通路の幅から求めるか
        let tmpXpos = eolPos.x + ((myRandom(0, 0, 20) - 10) / 10.0) * 128.0;
        if (tmpXpos <= 128 * 3) tmpXpos = 128 * 3;
        if (tmpXpos >= SCREEN_WIDTH - 128 * 3) tmpXpos = SCREEN_WIDTH - 128 * 3;

        // Yposは+128pxで決め打ちOK
        var tmpYpos = eolPos.y + 128;
        tmpRockLeft.yPos = tmpYpos;
        tmpRockRight.yPos = tmpYpos;

        // 通路の幅の広さ
        // +6~+10
        let tmpMin = 90;
        let tmpMax = 100;
        if (player.depth < 10000) {
            tmpMin = 80;
            tmpMax = 100;
        } else if (player.depth < 20000) {
            tmpMin = 90;
            tmpMax = 100;
        } else if (player.depth < 30000) {
            tmpMin = 80;
            tmpMax = 100;
        } else if (player.depth < 40000) {
            tmpMin = 70;
            tmpMax = 100;
        } else if (player.depth < 50000) {
            tmpMin = 80;
            tmpMax = 100;
        } else if (player.depth < 60000) {
            tmpMin = 90;
            tmpMax = 100;
        } else if (player.depth < 70000) {
            tmpMin = 80;
            tmpMax = 100;
        } else if (player.depth < 80000) {
            tmpMin = 70;
            tmpMax = 100;
        } else if (player.depth < 90000) {
            tmpMin = 60;
            tmpMax = 100;
        } else if (player.depth < 100000) {
            tmpMin = 70;
            tmpMax = 100;
        } else if (player.depth < 110000) {
            tmpMin = 60;
            tmpMax = 100;
        } else if (player.depth < 120000) {
            tmpMin = 80;
            tmpMax = 100;
        } else if (player.depth < 130000) {
            tmpMin = 60;
            tmpMax = 100;
        } else if (player.depth < 140000) {
            tmpMin = 80;
            tmpMax = 90;
        } else if (player.depth < 150000) {
            tmpMin = 60;
            tmpMax = 100;
        } else if (player.depth < 160000) {
            tmpMin = 70;
            tmpMax = 90;
        } else if (player.depth < 170000) {
            tmpMin = 60;
            tmpMax = 100;
        } else if (player.depth < 180000) {
            tmpMin = 70;
            tmpMax = 90;
        } else if (player.depth < 190000) {
            tmpMin = 60;
            tmpMax = 100;
        } else if (player.depth < 200000) {
            tmpMin = 80;
            tmpMax = 90;
        } else if (player.depth < 210000) {
            tmpMin = 60;
            tmpMax = 100;
        } else if (player.depth < 220000) {
            tmpMin = 70;
            tmpMax = 90;
        } else if (player.depth < 230000) {
            tmpMin = 60;
            tmpMax = 90;
        } else if (player.depth < 240000) {
            tmpMin = 60;
            tmpMax = 80;
        } else {
            tmpMin = 60;
            tmpMax = 70;
        }
        tmpRockLeft.xPos = tmpXpos - 128 * (myRandom(0, tmpMin, tmpMax) / 10.0);
        tmpRockRight.xPos = tmpXpos + 128 * (myRandom(0, tmpMin, tmpMax) / 10.0);
        if (tmpRockLeft.xPos < SCREEN_CENTER_X - 128 * 9) tmpRockLeft.xPos = SCREEN_CENTER_X - 128 * 9;
        if (tmpRockRight.xPos > SCREEN_CENTER_X + 128 * 9) tmpRockRight.xPos = SCREEN_CENTER_X + 128 * 9;
    }
}

function getEndOfLinePos() {
    var self = this;
    let ret = tm.geom.Vector2(SCREEN_CENTER_X, Number.MIN_VALUE);
    let tmpRockL = null;
    let tmpRockR = null;
    for (let ii = 0; ii < self.rockLeftArray.length; ii++) {
        if (ret.y < self.rockLeftArray[ii].yPos) {
            ret.y = self.rockLeftArray[ii].yPos;
            tmpRockL = self.rockLeftArray[ii];
        }
    }
    for (let ii = 0; ii < self.rockRightArray.length; ii++) {
        if (tmpRockL.idx === self.rockRightArray[ii].idx) {
            tmpRockR = self.rockRightArray[ii];
            break;
        }
    }
    ret.x = (tmpRockL.xPos + tmpRockR.xPos) / 2;
    return ret;
}

// 配列クリア
function clearArrays() {
    var self = this;

    for (let ii = self.rockLeftArray.length - 1; ii >= 0; ii--) {
        let tmp = self.rockLeftArray[ii];
        if (tmp.parent == null) console.log("NULL!!");
        else tmp.remove();
        self.rockLeftArray.erase(tmp);
    }
    for (let ii = self.rockRightArray.length - 1; ii >= 0; ii--) {
        let tmp = self.rockRightArray[ii];
        if (tmp.parent == null) console.log("NULL!!");
        else tmp.remove();
        self.rockRightArray.erase(tmp);
    }
}

// 指定の範囲で乱数を求める
// ※start < end
// ※startとendを含む
function myRandom(idx, start, end) {
    if (randomMode) {
        var max = (end - start) + 1;
        return Math.floor(Math.random() * Math.floor(max)) + start;
    } else {
        var mod = (end - start) + 1;
        randomSeed[idx] = (randomSeed[idx] * 5) + 1;
        for (; ;) {
            if (randomSeed[idx] < 2147483647) break;
            randomSeed[idx] -= 2147483647;
        }
        return (randomSeed[idx] % mod) + start;
    }
}

function getQuaternion(alpha, beta, gamma) {
    var _x = beta ? beta * degtorad : 0; // beta value
    var _y = gamma ? gamma * degtorad : 0; // gamma value
    var _z = alpha ? alpha * degtorad : 0; // alpha value

    var cX = Math.cos(_x / 2);
    var cY = Math.cos(_y / 2);
    var cZ = Math.cos(_z / 2);
    var sX = Math.sin(_x / 2);
    var sY = Math.sin(_y / 2);
    var sZ = Math.sin(_z / 2);

    var w = cX * cY * cZ - sX * sY * sZ;
    var x = sX * cY * cZ - cX * sY * sZ;
    var y = cX * sY * cZ + sX * cY * sZ;
    var z = cX * cY * sZ + sX * sY * cZ;

    return [x, y, z, w];
}

/**
 * 矩形当たり判定
 * https://yttm-work.jp/collision/collision_0005.html
 * @param {*} rect_a_x 
 * @param {*} rect_a_y 
 * @param {*} rect_a_w 
 * @param {*} rect_a_h 
 * @param {*} rect_b_x 
 * @param {*} rect_b_y 
 * @param {*} rect_b_w 
 * @param {*} rect_b_h 
 * @returns 
 */
function chkCollisionRect(rect_a_x, rect_a_y, rect_a_w, rect_a_h, rect_b_x, rect_b_y, rect_b_w, rect_b_h) {
    if (debug_flag) return false;
    // X軸、Y軸の距離
    distance_x = Math.abs(rect_a_x - rect_b_x);
    distance_y = Math.abs(rect_a_y - rect_b_y);

    // ２つの矩形のX軸、Y軸のサイズの和を算出する
    size_sum_x = (rect_a_w + rect_b_w) / 2.0;
    size_sum_y = (rect_a_h + rect_b_h) / 2.0;

    // サイズの和と距離を比較する
    if ((distance_x < size_sum_x) && (distance_y < size_sum_y)) {
        return true;
    }
    return false;
}
function chkCollisionRectOfs(rect_a_x, rect_a_y, rect_a_x_ofs, rect_a_y_ofs, rect_a_w, rect_a_h, rect_b_x, rect_b_y, rect_b_x_ofs, rect_b_y_ofs, rect_b_w, rect_b_h) {
    return chkCollisionRect(rect_a_x + rect_a_x_ofs, rect_a_y + rect_a_y_ofs, rect_a_w, rect_a_h, rect_b_x + rect_b_x_ofs, rect_b_y + rect_b_y_ofs, rect_b_w, rect_b_h);
}
function chkCollisionRectEne2Player(tmpEne, tmpPlayer) {
    return chkCollisionRect(tmpEne.x, tmpEne.y, tmpEne.xSize * tmpEne.xCol, tmpEne.ySize * tmpEne.yCol, tmpPlayer.x, tmpPlayer.y, 128 * 0.9, 128 * 0.9);
}
