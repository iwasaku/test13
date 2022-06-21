//console.log = function () { };  // ログを出す時にはコメントアウトする

const SCREEN_WIDTH = 1280 - 128;             // スクリーン幅
const SCREEN_HEIGHT = 2436;                 // スクリーン高さ
const SCREEN_CENTER_X = SCREEN_WIDTH / 2;   // スクリーン幅の半分
const SCREEN_CENTER_Y = SCREEN_HEIGHT / 2;  // スクリーン高さの半分

const FPS = 60; // 60フレ

const FONT_FAMILY = "'misaki_gothic','Meiryo',sans-serif";
const ASSETS = {
    "nmls": "./resource/new_nmls_128.png",
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
let group0 = null;  // bg0
let group1 = null;  // bg1
let group2 = null;  // enemy,item
let group3 = null;  // fg
let group4 = null;  // player
let group5 = null;  // status

const DIR_KEY_DEF = defineEnum({
    NONE: {
        value: -1,
        addX: 0,
        addY: 0,
    },
    LEFT: {
        value: 2,
        addX: -1,
        addY: 0,
    },
    RIGHT: {
        value: 6,
        addX: 1,
        addY: 0,
    },
});

let player = null;
let eAlpha = 0;
let eBeta = 0;
let eGamma = 0;
var randomSeed = 3557;
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
                    text: "TPTM\n22",
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
                eAlpha = e.alpha;   // 未使用
                eBeta = e.beta; // 縦加速（-180～180°）
                eGamma = e.gamma;   // 横加速（-90～90°）
            }, false);
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
        if (!randomMode) randomSeed = 3557;

        group0 = tm.display.CanvasElement().addChildTo(this);   // BG0（水色）
        group1 = tm.display.CanvasElement().addChildTo(this);   // BG1（黒色）
        group2 = tm.display.CanvasElement().addChildTo(this);   // 敵、アイテム
        group3 = tm.display.CanvasElement().addChildTo(this);   // FG（ライトステンシル）
        group4 = tm.display.CanvasElement().addChildTo(this);   // プレイヤー
        group5 = tm.display.CanvasElement().addChildTo(this);   // ステータス

        player = new PlayerSprite().addChildTo(group4);

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

            var self = this;
            // tweet ボタン
            this.tweetButton.onclick = function () {
                var twitterURL = tm.social.Twitter.createURL({
                    type: "tweet",
                    text: "TPTM 水深" + player.depth + "m に到達（スコア：" + player.score + "）",
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
                player.status = PL_STATUS.START;
            }
        }
        this.nowDepthLabel.text = player.depth + "m";
        this.nowDepthLabel.text = dbgMsg;
        this.nowScoreLabel.text = player.score;
        this.nowScoreLabel.text = "[" + eAlpha + "," + eBeta + "," + eGamma + "]";

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
        this.zRot = 0;
        this.xBgPos = 4;
        this.yBgPos = 5;
        this.isEven = true;
        this.xOfs = this.isEven ? 64 : 0;
        this.xPos = (this.xBgPos * 128) + this.xOfs;
        this.yPos = (this.yBgPos * 128) + 64;
        this.setPosition(this.xPos, this.yPos).setScale(1, 1);
        this.setInteractive(false);
        this.setBoundingType("rect");
        this.gotoAndPlay("left0");
        this.aminBase = "left";
        this.aminCount = 0;

        this.status = PL_STATUS.INIT;
        this.depth = 0;
        this.score = 0;
        this.oxygen = 100 * FPS;
    },

    update: function (app) {
    },
});

const requestDeviceOrientationPermission = () => {
    if (
        DeviceOrientationEvent &&
        typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
        // iOS 13+ の Safari
        // 許可を取得
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    // 許可を得られた場合、deviceorientationをイベントリスナーに追加
                } else {
                    // 許可を得られなかった場合の処理
                }
            })
            .catch(console.error) // https通信でない場合などで許可を取得できなかった場合
    } else {
        // 上記以外のブラウザ
    }
}

// 指定の範囲で乱数を求める
// ※start < end
// ※startとendを含む
function myRandom(start, end) {
    if (randomMode) {
        var max = (end - start) + 1;
        return Math.floor(Math.random() * Math.floor(max)) + start;
    } else {
        var mod = (end - start) + 1;
        randomSeed = (randomSeed * 5) + 1;
        for (; ;) {
            if (randomSeed < 2147483647) break;
            randomSeed -= 2147483647;
        }
        return (randomSeed % mod) + start;
    }
}
