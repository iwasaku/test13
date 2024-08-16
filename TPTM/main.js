phina.globalize();

console.log = function () { };  // ログを出す時にはコメントアウトする
const debug_flag = false;

const SCREEN_WIDTH = 1280;             // スクリーン幅
const SCREEN_HEIGHT = 2436;                 // スクリーン高さ
const SCREEN_CENTER_X = SCREEN_WIDTH / 2;   // スクリーン幅の半分
const SCREEN_CENTER_Y = SCREEN_HEIGHT / 2;  // スクリーン高さの半分

const FPS = 60; // 60フレ

const FONT_FAMILY = "'misaki_gothic','Meiryo',sans-serif";
const ASSETS = {
    image: {
        "nmls": "./resource/new_nmls_128.png",
        "rock": "./resource/rock_128.png",

        "chinu": "./resource/chinu_128.png",
        "rabuka": "./resource/rabuka_128.png",

        "sea_sprite": "./resource/sea.png",
        "splash_anim": "./resource/splash.png",

        "bg_sprite": "./resource/bg.png",
        "fg0_sprite": "./resource/fg.png",
        "fg1_sprite": "./resource/fg_blk.png",
    },
    spritesheet: {
        "splash_ss":
        {
            // フレーム情報
            "frame": {
                "width": 202, // 1フレームの画像サイズ（横）
                "height": 75, // 1フレームの画像サイズ（縦）
                "cols": 14, // フレーム数（横）
                "rows": 1, // フレーム数（縦）
            },
            // アニメーション情報
            "animations": {
                "wait": { // アニメーション名
                    "frames": [13],
                    "next": "wait",
                    "frequency": 1,
                },
                "splash": { // アニメーション名
                    "frames": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                    "next": "wait",
                    "frequency": 4,
                },
            }
        },
        nmls_ss: {
            // フレーム情報
            "frame": {
                "width": 128, // 1フレームの画像サイズ（横）
                "height": 128, // 1フレームの画像サイズ（縦）
                "cols": 6, // フレーム数（横）
                "rows": 1, // フレーム数（縦）
            },
            // アニメーション情報
            "animations": {
                "nmls": {
                    "frames": [0],
                    "next": "nmls",
                    "frequency": 1,
                },
                "left": {
                    "frames": [1, 2],
                    "next": "left",
                    "frequency": 15,
                },
                "right": {
                    "frames": [3, 4],
                    "next": "right",
                    "frequency": 15,
                },
            }
        }
    },
    sound: {
        "fall_se": 'https://iwasaku.github.io/test11/UT-404/SSS3/resource/t01/21.mp3'
    }
};

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

// 表示プライオリティは 0：奥 → 4：手前 の順番
let group0 = null;  // bg0  黒色
let group1 = null;  // bg1  水色
let group2 = null;  // enemy,item
let group3 = null;  // rock
let group4 = null;  // fg   ライトステンシル
let group5 = null;  // player
let group6 = null;  // status
let bgSprite = null;
let seaSprite = null;
let fgSprite = [null, null, null, null];

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
let splash = null;
var rockLeftArray = [];
var rockRightArray = [];
let eAlpha = 0;
let eBeta = 0;
let eGamma = 0;
var randomSeed = [3557, 3557];
var randomMode = Boolean(0);
let dbgMsg = "";

// 共有ボタン用
let postText = null;
const postURL = "https://iwasaku.github.io/test13/TPTM/";
const postTags = "#ネムレス #NEMLESSS";

phina.main(function () {
    var app = GameApp({
        startLabel: 'logo',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        assets: ASSETS,
        fps: FPS,
        backgroundColor: 'black',

        // シーンのリストを引数で渡す
        scenes: [
            {
                className: 'LogoScene',
                label: 'logo',
                nextLabel: 'title',
            },

            {
                className: 'TitleScene',
                label: 'title',
                nextLabel: 'game',
            },
            {
                className: 'GameScene',
                label: 'game',
                nextLabel: 'game',
            },
        ]
    });

    // iOSなどでユーザー操作がないと音がならない仕様対策
    // 起動後初めて画面をタッチした時に『無音』を鳴らす
    app.domElement.addEventListener('touchend', function dummy() {
        var s = phina.asset.Sound();
        s.loadFromBuffer();
        s.play().stop();
        app.domElement.removeEventListener('touchend', dummy);
    });

    // fps表示
    //app.enableStats();

    // 実行
    app.run();
});

/*
* ローディング画面をオーバーライド
*/
phina.define('LoadingScene', {
    superClass: 'DisplayScene',

    init: function (options) {
        this.superInit(options);
        // 背景色
        var self = this;
        var loader = phina.asset.AssetLoader();

        // 明滅するラベル
        let label = phina.display.Label({
            text: "",
            fontSize: 64,
            fill: 'white',
        }).addChildTo(this).setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y);

        // ロードが進行したときの処理
        loader.onprogress = function (e) {
            // 進捗具合を％で表示する
            label.text = "{0}%".format((e.progress * 100).toFixed(0));
        };

        // ローダーによるロード完了ハンドラ
        loader.onload = function () {
            // Appコアにロード完了を伝える（==次のSceneへ移行）
            self.flare('loaded');
        };

        // ロード開始
        loader.load(options.assets);
    },
});

/*
 * ロゴ
 */
phina.define("LogoScene", {
    superClass: 'DisplayScene',

    init: function (option) {
        this.superInit(option);
        this.localTimer = 0;
        this.font1 = false;
        this.font2 = false;
    },

    update: function (app) {
        // フォントロード完了待ち
        var self = this;
        document.fonts.load('10pt "misaki_gothic"').then(function () {
            self.font1 = true;
        });
        document.fonts.load('10pt "icomoon"').then(function () {
            self.font2 = true;
        });
        if (this.font1 && this.font2) {
            self.exit();
        }

    }
});

/*
 * タイトル
 */
phina.define("TitleScene", {
    superClass: 'DisplayScene',

    init: function (option) {
        this.superInit(option);

        this.titleLabel = Label({
            text: "TPTM\n1.1",
            fontSize: 160,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y - 128,
        }).addChildTo(this);
        this.startButton = Button({
            text: "START",
            fontSize: 96,
            fontFamily: FONT_FAMILY,
            fill: "#444",
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y + 320,
            cornerRadius: 8,
            width: 512,
            height: 160,
        }).addChildTo(this);
        this.localTimer = 0;

        var self = this;
        this.startButton.onpush = function () {
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
            self.exit();
        };
    },

    update: function (app) {
        app.background = "rgba(0, 0, 0, 1.0)"; // 背景色
    }
});

/*
 * ゲーム
 */
phina.define("GameScene", {
    superClass: 'DisplayScene',

    init: function (option) {
        this.superInit(option);

        if (!randomMode) {
            randomSeed[0] = 3557;
            randomSeed[1] = 3557;
        }
        group0 = DisplayElement().addChildTo(this);   // BG0（水色）
        group1 = DisplayElement().addChildTo(this);   // BG1（）
        group2 = DisplayElement().addChildTo(this);   // 敵、アイテム
        group3 = DisplayElement().addChildTo(this);   // 岩
        group4 = DisplayElement().addChildTo(this);   // FG（ライトステンシル）
        group5 = DisplayElement().addChildTo(this);   // プレイヤー
        group6 = DisplayElement().addChildTo(this);   // ステータス

        bgSprite = phina.display.Sprite("bg_sprite").addChildTo(group0);
        bgSprite.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y).setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        bgSprite.alpha = 1.0;
        seaSprite = phina.display.Sprite("sea_sprite").addChildTo(group1);
        seaSprite.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y - 640 - 128).setSize(SCREEN_WIDTH, SCREEN_HEIGHT / 2.5);
        seaSprite.alpha = 1.0;
        fgSprite = [null, null, null, null];
        fgSprite[0] = phina.display.Sprite("fg1_sprite").addChildTo(group4);
        fgSprite[0].setPosition(SCREEN_CENTER_X - SCREEN_HEIGHT, SCREEN_CENTER_Y).setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        fgSprite[0].alpha = 0.0;
        fgSprite[1] = phina.display.Sprite("fg0_sprite").addChildTo(group4);
        fgSprite[1].setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y + 64).setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        fgSprite[1].alpha = 0.0;
        fgSprite[2] = phina.display.Sprite("fg1_sprite").addChildTo(group4);
        fgSprite[2].setPosition(SCREEN_CENTER_X + SCREEN_HEIGHT, SCREEN_CENTER_Y).setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        fgSprite[2].alpha = 0.0;
        fgSprite[3] = phina.display.Sprite("fg1_sprite").addChildTo(group4);
        fgSprite[3].setPosition(SCREEN_CENTER_X, -SCREEN_CENTER_Y + 64).setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        fgSprite[3].alpha = 0.0;

        clearArrays();
        player = new PlayerSprite().addChildTo(group4);
        splash = new SplashSprite().addChildTo(group4);
        for (let ii = 0; ii < 22; ii++) {
            let xOfs = 9;
            if (ii < 8) {
                // 0〜7
                xOfs = 10;
            } else if (ii < 16) {
                // 8〜15
                xOfs = 10 - ((ii - 8) / 8);
            } else {
                xOfs = 9;
            }
            let rockL = RockSprite(ii, SCREEN_CENTER_X - 128 * xOfs, 128 * ii).addChildTo(group3);
            rockLeftArray.push(rockL);
            let rockR = RockSprite(ii, SCREEN_CENTER_X + 128 * xOfs, 128 * ii).addChildTo(group3);
            rockRightArray.push(rockR);
        }

        this.nowDepthLabel = Label({
            text: "0m",
            fontSize: 128,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_CENTER_X,
            y: 64,
        }).addChildTo(group6);
        this.nowScoreLabel = Label({
            text: "0",
            fontSize: 128,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_CENTER_X,
            y: SCREEN_HEIGHT - 64,
        }).addChildTo(group6);
        this.gameOverLabel = Label({
            text: "GAME OVER",
            fontSize: 192,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            shadow: "#000",
            shadowBlur: 50,
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y - 512,
        }).addChildTo(group6);

        // X
        this.xButton = Button({
            text: String.fromCharCode(0xe902),
            fontSize: 96,
            fontFamily: "icomoon",
            fill: "#7575EF",
            x: SCREEN_CENTER_X - 300 - 160,
            y: SCREEN_CENTER_Y + 128,
            cornerRadius: 8,
            width: 120,
            height: 120,
        }).addChildTo(group6);
        this.xButton.onclick = function () {
            // https://developer.x.com/en/docs/twitter-for-websites/tweet-button/guides/web-intent
            let shareURL = "https://x.com/intent/tweet?text=" + encodeURIComponent(postText + "\n" + postTags + "\n") + "&url=" + encodeURIComponent(postURL);
            window.open(shareURL);
        };
        this.xButton.alpha = 0.0;
        this.xButton.sleep();

        // threads
        this.threadsButton = Button({
            text: String.fromCharCode(0xe901),
            fontSize: 96,
            fontFamily: "icomoon",
            fill: "#7575EF",
            x: SCREEN_CENTER_X - 300,
            y: SCREEN_CENTER_Y + 128,
            cornerRadius: 8,
            width: 120,
            height: 120,
        }).addChildTo(group6);
        this.threadsButton.onclick = function () {
            // https://developers.facebook.com/docs/threads/threads-web-intents/
            // web intentでのハッシュタグの扱いが環境（ブラウザ、iOS、Android）によって違いすぎるので『#』を削って通常の文字列にしておく
            let shareURL = "https://www.threads.net/intent/post?text=" + encodeURIComponent(postText + "\n\n" + postTags.replace(/#/g, "")) + "&url=" + encodeURIComponent(postURL);
            window.open(shareURL);
        };
        this.threadsButton.alpha = 0.0;
        this.threadsButton.sleep();

        // bluesky
        this.bskyButton = Button({
            text: String.fromCharCode(0xe900),
            fontSize: 96,
            fontFamily: "icomoon",
            fill: "#7575EF",
            x: SCREEN_CENTER_X - 300 + 160,
            y: SCREEN_CENTER_Y + 128,
            cornerRadius: 8,
            width: 120,
            height: 120,
        }).addChildTo(group6);
        this.bskyButton.onclick = function () {
            // https://docs.bsky.app/docs/advanced-guides/intent-links
            let shareURL = "https://bsky.app/intent/compose?text=" + encodeURIComponent(postText + "\n" + postTags + "\n" + postURL);
            window.open(shareURL);
        };
        this.bskyButton.alpha = 0.0;
        this.bskyButton.sleep();

        this.restartButton = Button({
            text: "RESTART",
            fontSize: 96,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#B2B2B2",
            x: SCREEN_CENTER_X + 300,
            y: SCREEN_CENTER_Y + 128,
            cornerRadius: 8,
            width: 400,
            height: 120,
        }).addChildTo(group6);
        this.restartButton.alpha = 0.0;
        this.restartButton.sleep();

        var self = this;
        this.restartButton.onpush = function () {
            // playerのremove
            if (player != null) {
                player.remove();
                player = null;
            }
            self.exit();
        };

        this.nowDepthLabel.text = "0m";
        this.nowScoreLabel.text = "0";
        this.buttonAlpha = 0.0;
        frame = 0;
    },

    // main loop
    update: function (app) {

        if ((player.status === PL_STATUS.DEAD_INIT) || (player.status === PL_STATUS.DEAD)) {
            if (player.status === PL_STATUS.DEAD_INIT) {
                SoundManager.play("fall_se");
                player.status = PL_STATUS.DEAD;
            }
            player.ySpd = 0;
            postText = "TPTM 1.1\n水深" + (player.depth / 100.0).toFixed(2) + "m に到達\nスコア：" + player.score;

            this.buttonAlpha += 0.05;
            if (this.buttonAlpha > 1.0) {
                this.buttonAlpha = 1.0;
            }
            this.gameOverLabel.alpha = this.buttonAlpha;
            this.xButton.alpha = this.buttonAlpha;
            this.threadsButton.alpha = this.buttonAlpha;
            this.bskyButton.alpha = this.buttonAlpha;
            this.restartButton.alpha = this.buttonAlpha;
            if (this.buttonAlpha > 0.7) {
                this.xButton.wakeUp();
                this.threadsButton.wakeUp();
                this.bskyButton.wakeUp();
                this.restartButton.wakeUp();
            }
        } else {
            if (!player.status.isStarted) {
                this.gameOverLabel.alpha = 0.0;
                player.status = PL_STATUS.READY;
            }

            rockScroll();
            if (seaSprite.y >= -SCREEN_HEIGHT) {
                seaSprite.y -= player.ySpd;
            }
        }

        this.nowDepthLabel.text = (player.depth / 100.0).toFixed(2) + "m";
        this.nowScoreLabel.text = player.score;

        ++frame;
    }
});

/*
 * Splash
 */
phina.define("SplashSprite", {
    superClass: 'Sprite',
    init: function (option) {
        this.superInit("splash_anim", 202, 75);
        this.anim = FrameAnimation('splash_ss').attachTo(this);
        this.anim.fit = false;
        this.direct = '';
        this.xPos = SCREEN_CENTER_X;
        this.yPos = SCREEN_CENTER_Y - 320;
        this.setPosition(this.xPos, this.yPos).setScale(4, 2);
        this.setInteractive(false);
        this.setBoundingType("rect");
        this.anim.gotoAndPlay("wait");

        this.status = 0;
    },

    update: function (app) {
        if (this.status === 0) {
            if (player.y >= this.yPos - 26) {
                this.anim.gotoAndPlay("splash");
                this.status = 1;
            }
        } else if (this.status === 1) {
            if (this.y >= -SCREEN_HEIGHT) {
                this.y -= player.ySpd;
            } else {
                this.status = 2;
            }
        }
    },
});

/*
 * Player
 */
phina.define("PlayerSprite", {
    superClass: 'Sprite',
    init: function (option) {
        this.superInit("nmls", 128, 128);
        this.anim = FrameAnimation('nmls_ss').attachTo(this);
        this.anim.fit = false;
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
        this.anim.gotoAndPlay("left");
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
            if (this.depth >= this.fishDepth + 1000) {
                // 20mごとに魚が発生
                if (this.depth < 1500) {
                    // 15mまでは何も出現しない
                } else if (this.depth < 10000) {
                    // 1/5の確率でCHINUが出現
                    if (myRandom(1, 1, 5) === 1) {
                        new FishSprite(FISH_DEF.CHINU).addChildTo(group2);
                    }
                } else if (this.depth < 50000) {
                    // 1/4の確率でCHINUが出現
                    if (myRandom(1, 1, 4) === 1) {
                        new FishSprite(FISH_DEF.CHINU).addChildTo(group2);
                    }
                } else if (this.depth < 80000) {
                    // 1/3の確率で魚が出現
                    if (myRandom(1, 1, 3) === 1) {
                        // 1/4の確率でRABUKAが出現
                        // 3/4の確率でCHINUが出現
                        if (myRandom(1, 1, 4) === 1) {
                            new FishSprite(FISH_DEF.RABUKA).addChildTo(group2);
                        } else {
                            new FishSprite(FISH_DEF.CHINU).addChildTo(group2);
                        }
                    }
                } else {
                    // 1/2の確率でRABUKAが出現
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
            fgSprite[1].setPosition(player.x, SCREEN_CENTER_Y + 128);
            fgSprite[2].setPosition(player.x + SCREEN_WIDTH, SCREEN_CENTER_Y);
            fgSprite[3].setPosition(player.x, -SCREEN_CENTER_Y + 128);
            if (player.depth < 100000) {
                bgSprite.alpha = 1.0 - (player.depth / 100000.0);
            } else if (player.depth < 200000) {
                bgSprite.alpha = 0.0;
            }
            let tmpAlpha = 0.0;
            if (player.depth < 80000) {
                tmpAlpha = 0.0;
            } else if (player.depth < 180000) {
                tmpAlpha = ((player.depth - 80000) * 0.9) / 100000.0;
            } else {
                tmpAlpha = 0.9;
            }
            for (let ii = 0; ii < fgSprite.length; ii++) {
                fgSprite[ii].alpha = tmpAlpha;
            }
        } else {
            if (this.status === PL_STATUS.READY) {
                this.yPos += 16;
                if (this.yPos >= SCREEN_CENTER_Y - 240) {
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
phina.define("FishSprite", {
    superClass: "Sprite",

    init: function (fishDef) {
        this.spriteName = fishDef.spr;
        this.xSize = fishDef.w;
        this.ySize = fishDef.h;
        this.xCol = fishDef.colw;
        this.yCol = fishDef.colh;

        this.superInit(this.spriteName);
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
        this.setPosition(this.xPos, this.yPos).setSize(this.xSize, this.ySize).setScale(-this.xSpdFlag, 1);
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
            player.status = PL_STATUS.DEAD_INIT;
        }
    },
});

/*
 * Rock
 */
phina.define("RockSprite", {
    superClass: "Sprite",

    init: function (idx, posX, posY) {
        this.spriteName = "rock";
        this.superInit(this.spriteName);
        this.direct = '';
        this.setInteractive(false);
        this.setBoundingType("rect");
        this.idx = idx;
        this.xPos = posX;
        this.yPos = posY;
        this.setPosition(this.xPos, this.yPos).setSize(1280, 128).setScale(1, 1.2);
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
            player.status = PL_STATUS.DEAD_INIT;

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
            // 0〜100
            tmpMin = 80;
            tmpMax = 100;
        } else if (player.depth < 20000) {
            // 100〜200
            tmpMin = 90;
            tmpMax = 100;
        } else if (player.depth < 30000) {
            // 200〜300
            tmpMin = 80;
            tmpMax = 100;
        } else if (player.depth < 40000) {
            // 300〜400
            tmpMin = 70;
            tmpMax = 100;
        } else if (player.depth < 50000) {
            // 400〜500
            tmpMin = 80;
            tmpMax = 100;
        } else if (player.depth < 60000) {
            // 500〜600
            tmpMin = 90;
            tmpMax = 100;
        } else if (player.depth < 70000) {
            // 600〜700
            tmpMin = 80;
            tmpMax = 100;
        } else if (player.depth < 80000) {
            // 700〜800
            tmpMin = 70;
            tmpMax = 100;
        } else if (player.depth < 90000) {
            // 800〜900
            tmpMin = 60;
            tmpMax = 100;
        } else if (player.depth < 100000) {
            // 900〜1000
            tmpMin = 70;
            tmpMax = 100;
        } else if (player.depth < 110000) {
            // 1000〜1100
            tmpMin = 60;
            tmpMax = 100;
        } else if (player.depth < 120000) {
            // 1100〜1200
            tmpMin = 80;
            tmpMax = 100;
        } else if (player.depth < 130000) {
            // 1200〜1300
            tmpMin = 60;
            tmpMax = 100;
        } else if (player.depth < 140000) {
            // 1300〜1400
            tmpMin = 80;
            tmpMax = 90;
        } else if (player.depth < 150000) {
            // 1400〜1500
            tmpMin = 60;
            tmpMax = 100;
        } else if (player.depth < 152500) {
            // 1500〜1525
            tmpMin = 60;
            tmpMax = 90;
        } else if (player.depth < 160000) {
            // 1525〜1600
            tmpMin = 70;
            tmpMax = 90;
        } else if (player.depth < 170000) {
            // 1600〜1700
            tmpMin = 60;
            tmpMax = 100;
        } else if (player.depth < 172500) {
            // 1700〜1725
            tmpMin = 60;
            tmpMax = 90;
        } else if (player.depth < 180000) {
            // 1725〜1800
            tmpMin = 70;
            tmpMax = 90;
        } else if (player.depth < 190000) {
            // 1800〜1900
            tmpMin = 60;
            tmpMax = 100;
        } else if (player.depth < 195000) {
            // 1900〜1950
            tmpMin = 60;
            tmpMax = 90;
        } else if (player.depth < 200000) {
            // 1950〜2000
            tmpMin = 80;
            tmpMax = 90;
        } else if (player.depth < 205000) {
            // 2000〜2050
            tmpMin = 60;
            tmpMax = 90;
        } else if (player.depth < 210000) {
            // 2050〜2100
            tmpMin = 60;
            tmpMax = 100;
        } else if (player.depth < 215000) {
            // 2100〜2150
            tmpMin = 60;
            tmpMax = 90;
        } else if (player.depth < 220000) {
            // 2150〜2200
            tmpMin = 70;
            tmpMax = 90;
        } else if (player.depth < 225000) {
            // 2200〜2250
            tmpMin = 60;
            tmpMax = 80;
        } else if (player.depth < 230000) {
            // 2250〜2300
            tmpMin = 60;
            tmpMax = 90;
        } else if (player.depth < 235000) {
            // 2300〜2350
            tmpMin = 60;
            tmpMax = 70;
        } else if (player.depth < 240000) {
            // 2350〜2400
            tmpMin = 60;
            tmpMax = 80;
        } else if (player.depth < 245000) {
            // 2400〜2450
            tmpMin = 60;
            tmpMax = 70;
        } else if (player.depth < 250000) {
            // 2450〜2500
            tmpMin = 80;
            tmpMax = 100;
        } else {
            // 2500〜
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
    let ret = phina.geom.Vector2(SCREEN_CENTER_X, Number.MIN_VALUE);
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
