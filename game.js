const isMobile = /Mobi|Android/i.test(navigator.userAgent);

class InitScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InitScene' });
    }
    preload() {
        this.load.image('loading_image', 'assets/images/blurred_background.png');
    }

    create() {
        this.scene.start('PreloaderScene');
    }
}

class PreloaderScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloaderScene' });
    }
    preload() {
        this.bg = this.add.image(config.width / 2, config.height / 2, 'loading_image').setOrigin(0.5, 0.5);
        const bgTexture = this.textures.get('loading_image').getSourceImage();
        const scaleX = config.width / bgTexture.width;
        const scaleY = config.height / bgTexture.height;
        const scale = Math.max(scaleX, scaleY);
        this.bg.setScale(scale);

        const dpr = window.devicePixelRatio || 1;
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;
        // Progress text
        const progressText = this.add.text(width / 2, height / 2, 'Loading... (0%)', {
            font: `bold ${18 * dpr}px Arial`,
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Listen to progress event
        this.load.on('progress', (value) => {
            progressText.setText(`Loading... (${Math.round(value * 100)}%)`);
        });
        this.load.on('complete', () => {
            progressText.setText('Loading complete!');
        });

        // Load all assets needed for the game
        this.load.audio("main-theme", "assets/audio/theme_song.mp3");
        this.load.image('background', 'assets/images/earth_background.png');
        this.load.image('moon-bg', 'assets/images/moon_background.png');

        if (isMobile) {
            this.load.image('groom', 'assets/images/groom250.png');
            this.load.image('bride', 'assets/images/bride230.png');
            this.load.image('wedding_arch', 'assets/images/weddingarch450.png');
            this.load.image('rocket', 'assets/images/rocketship350.png');
            this.load.image('save-the-date', 'assets/images/save-the-date-phone.png');
        } else {
            this.load.image('groom', 'assets/images/groom170.png');
            this.load.image('bride', 'assets/images/bride150.png');
            this.load.image('wedding_arch', 'assets/images/weddingarch400300.png');
            this.load.image('rocket', 'assets/images/rocketship250.png');
            this.load.image('save-the-date', 'assets/images/save-the-date-landscape.png');
        }
    }

    create() {
        this.scene.start('EarthScene');
    }
}

class EarthScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EarthScene' });
    }

    create() {
        const dpr = window.devicePixelRatio || 1;
        this.backgroundMusic = this.sound.add("main-theme", { loop: true });
        this.input.once('pointerdown', function () {
            this.sound.unlock();
            this.backgroundMusic.play();
        }, this);


        this.bg = this.add.image(config.width / 2, config.height / 2, 'background').setOrigin(0.5, 0.5);
        const bgTexture = this.textures.get('background').getSourceImage();
        const scaleX = config.width / bgTexture.width;
        const scaleY = config.height / bgTexture.height;
        // Prevent upscaling: only downscale or crop
        // 'Cover' scaling: always fill the screen, may crop image
        const scale = Math.max(scaleX, scaleY);
        this.bg.setScale(scale);

        // Start fullscreen with the whole image
        this.cameras.main.setZoom(1);
        this.cameras.main.centerOn(config.width / 2, config.height / 2);

        // Calculate visible region of the background image after scaling/cropping
        // and anchor groom/rocket to a specific point in the image
        // Set anchor points in the image (as a percentage of the image)
        const groomAnchor = { x: 0.2, y: 0.83 };
        const rocketAnchor = { x: 0.77, y: 0.87 };

        // Get background image size and scale
        const bgWidth = bgTexture.width;
        const bgHeight = bgTexture.height;
        // scale is already calculated above
        // Calculate the size of the visible region in the image
        const visibleWidth = config.width / scale;
        const visibleHeight = config.height / scale;
        // Calculate the top-left corner of the visible region in the image
        const offsetX = (bgWidth - visibleWidth) / 2;
        const offsetY = (bgHeight - visibleHeight) / 2;
        // X position as a percentage of visible screen (canvas), Y anchored to image
        const groomX = 0.2 * config.width; // 20% from left of visible screen
        const rocketX = 0.8 * config.width;
        // Y position anchored to image (so it matches the same feature across devices)
        const groomImgY = groomAnchor.y * bgHeight;
        const rocketImgY = rocketAnchor.y * bgHeight;
        const groomY = (groomImgY - offsetY) * scale;
        const rocketY = (rocketImgY - offsetY) * scale;

        this.groom = this.add.image(groomX, groomY, 'groom').setOrigin(0.5, 1).setInteractive();
        // let groomScale = Math.min(config.width, config.height) / 512 * 0.8;
        // groomScale = Math.min(groomScale, 1);
        this.groom.setScale(1);

        this.rocket = this.add.image(rocketX, rocketY, 'rocket').setOrigin(0.5, 1).setInteractive();
        // let rocketScale = Math.min(config.width, config.height) / 512 * 0.8;
        // rocketScale = Math.min(rocketScale, 1);
        this.rocket.setScale(1);


        // Prepare aesthetic tooltip above groom, but hide it initially
        // Make tooltip wider and add padding for better word wrapping
        const minTooltipWidth = 140;
        const tooltipPadding = 12 * dpr;
        // On mobile, use a smaller width to avoid overflow
        const tooltipWidth = isMobile ? Math.min(Math.max(config.width * 0.32, minTooltipWidth), config.width - 12 * dpr) : 320;
        const tooltipHeight = (isMobile ? 38 : 80) * dpr;
        const tooltipX = groomX;
        const tooltipY = groomY - this.groom.displayHeight - tooltipHeight;
        this.groomTooltipBg = this.add.rectangle(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 0x222222, 0.95).setOrigin(0.5, 0);
        this.groomTooltipBg.setStrokeStyle(2 * dpr, 0xffffff);
        this.groomTooltipTitle = this.add.text(tooltipX, tooltipY + 5 * dpr, "Groom", {
            font: isMobile ? `bold ${9 * dpr}px Arial` : `bold ${18 * dpr}px Arial`,
            fill: "#ffd700",
            align: "center"
        }).setOrigin(0.5, 0);
        this.groomTooltipMsg = this.add.text(
            tooltipX,
            tooltipY + (isMobile ? 14 * dpr : 32 * dpr),
            "Oops! I overslept! I need to get to the Moon quickly!",
            {
                font: isMobile ? `${8 * dpr}px Arial` : `${16 * dpr}px Arial`,
                fill: "#fff",
                wordWrap: { width: tooltipWidth - tooltipPadding },
                align: "center"
            }
        ).setOrigin(0.5, 0);
        // Hide all tooltip elements initially
        this.groomTooltipBg.visible = false;
        this.groomTooltipTitle.visible = false;
        this.groomTooltipMsg.visible = false;
        this.groomStartX = groomX;
        this.groomStartY = groomY;
        this.rocketStartX = rocketX;
        this.rocketStartY = rocketY;
        this.rocketLaunched = false;
        this.groomWalking = false;
        // Start zoomed out, show whole image
        this.cameras.main.setZoom(1);
        this.cameras.main.centerOn(config.width / 2, config.height / 2);

        // Tooltip is visible from the start
        // Tooltip is hidden at start; will show after first click
        this.groomTooltipBg.visible = false;
        this.groomTooltipTitle.visible = false;
        this.groomTooltipMsg.visible = false;
        this.rocket.input.enabled = false;

        // Add 'Click anywhere to continue' overlay text in the center
        const continueText = this.add.text(config.width / 2, config.height / 4, 'Click anywhere to move the groom', {
            font: isMobile ? `bold ${19 * dpr}px Arial` : `bold ${36 * dpr}px Arial`,
            fill: '#ffd700',
            align: 'center',
            stroke: '#222',
            strokeThickness: 3 * dpr,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4 * dpr, fill: true }
        }).setOrigin(0.5);
        continueText.setDepth(1000);
        continueText.visible = true;

        // State: 0 = first message, 1 = second message, 2 = walking
        this.tooltipState = 0;
        this.groomStep = 0;
        const totalSteps = 3;
        const startX = groomX;
        const endX = rocketX;
        const stepDelta = (endX - startX) / totalSteps;

        const showSecondTooltip = () => {
            this.groomTooltipMsg.setText("Glad I prepared my rocket!");
            this.rocket.input.enabled = true;
            this.tooltipState = 1;
        };

        // Add persistent 'Almost there!' textbox with title, hidden initially
        this.almostThereBg = this.add.rectangle(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 0x222222, 0.95).setOrigin(0.5, 0);
        this.almostThereBg.setStrokeStyle(2 * dpr, 0xffffff);
        this.almostThereTitle = this.add.text(tooltipX, tooltipY + 5 * dpr, 'Groom', {
            font: isMobile ? `bold ${12 * dpr}px Arial` : `bold ${18 * dpr}px Arial`,
            fill: '#ffd700',
            align: 'center'
        }).setOrigin(0.5, 0);
        this.almostThereText = this.add.text(
            tooltipX,
            tooltipY + (isMobile ? 20 * dpr : 32 * dpr),
            'Almost there!',
            {
                font: isMobile ? `${11 * dpr}px Arial` : `${16 * dpr}px Arial`,
                fill: '#fff',
                wordWrap: { width: tooltipWidth - 20 },
                align: 'center'
            }
        ).setOrigin(0.5, 0);
        this.almostThereBg.visible = false;
        this.almostThereTitle.visible = false;
        this.almostThereText.visible = false;

        // Add persistent 'Just one more step!' textbox with title, hidden initially
        this.oneMoreStepBg = this.add.rectangle(0, 0, tooltipWidth, tooltipHeight, 0x222222, 0.95).setOrigin(0.5, 0);
        this.oneMoreStepBg.setStrokeStyle(2 * dpr, 0xffffff);
        this.oneMoreStepTitle = this.add.text(0, 0, 'Groom', {
            font: isMobile ? `bold ${12 * dpr}px Arial` : `bold ${18 * dpr}px Arial`,
            fill: '#ffd700',
            align: 'center'
        }).setOrigin(0.5, 0);
        this.oneMoreStepText = this.add.text(
            0,
            0,
            'Just one more step!',
            {
                font: isMobile ? `${11 * dpr}px Arial` : `${16 * dpr}px Arial`,
                fill: '#fff',
                wordWrap: { width: tooltipWidth - 20 },
                align: 'center'
            }
        ).setOrigin(0.5, 0);
        this.oneMoreStepBg.visible = false;
        this.oneMoreStepTitle.visible = false;
        this.oneMoreStepText.visible = false;

        const walkStep = () => {
            if (!this.groomWalking && !this.rocketLaunched && this.tooltipState === 1 && this.groomStep < totalSteps) {
                this.groomTooltipBg.visible = false;
                this.groomTooltipTitle.visible = false;
                this.groomTooltipMsg.visible = false;
                this.groomWalking = true;
                this.groomStep++;
                // Hide 'Almost there!' as soon as the groom starts his second step
                if (this.groomStep === 2) {
                    this.almostThereBg.visible = false;
                    this.almostThereTitle.visible = false;
                    this.almostThereText.visible = false;
                }
                // Hide 'Just one more step!' as soon as the groom starts his third step
                if (this.groomStep === 3) {
                    this.oneMoreStepBg.visible = false;
                    this.oneMoreStepTitle.visible = false;
                    this.oneMoreStepText.visible = false;
                }
                let targetX = startX + stepDelta * this.groomStep;
                // Clamp to rocketX on last step
                if (this.groomStep === totalSteps) targetX = endX;
                this.tweens.add({
                    targets: this.groom,
                    x: targetX,
                    y: this.groom.y,
                    duration: 1000,
                    ease: 'Power2',
                    onUpdate: () => {
                        // Move textbox with groom during walk
                        if (this.groomStep === 1) {
                            const groomDisplayHeight = this.groom.displayHeight;
                            const aboveGroomY = this.groom.y - groomDisplayHeight - 10 * dpr;
                            this.almostThereBg.x = this.groom.x;
                            this.almostThereBg.y = aboveGroomY;
                            this.almostThereTitle.x = this.groom.x;
                            this.almostThereTitle.y = aboveGroomY + 5 * dpr;
                            this.almostThereText.x = this.groom.x;
                            this.almostThereText.y = aboveGroomY + (isMobile ? 20 * dpr : 32 * dpr);
                        }
                    },
                    onComplete: () => {
                        this.groomWalking = false;
                        // Show and position 'Almost there!' after first walk only
                        if (this.groomStep === 1) {
                            this.almostThereBg.x = this.groom.x;
                            this.almostThereBg.y = tooltipY;
                            this.almostThereTitle.x = this.groom.x;
                            this.almostThereTitle.y = tooltipY + 5 * dpr;
                            this.almostThereText.x = this.groom.x;
                            this.almostThereText.y = tooltipY + (isMobile ? 20 * dpr : 32 * dpr);
                            this.almostThereBg.visible = true;
                            this.almostThereTitle.visible = true;
                            this.almostThereText.visible = true;
                        }
                        // Show and position 'Just one more step!' after second walk only
                        if (this.groomStep === 2) {
                            this.oneMoreStepBg.x = this.groom.x;
                            this.oneMoreStepBg.y = tooltipY;
                            this.oneMoreStepTitle.x = this.groom.x;
                            this.oneMoreStepTitle.y = tooltipY + 5 * dpr;
                            this.oneMoreStepText.x = this.groom.x;
                            this.oneMoreStepText.y = tooltipY + (isMobile ? 20 * dpr : 32 * dpr);
                            this.oneMoreStepBg.visible = true;
                            this.oneMoreStepTitle.visible = true;
                            this.oneMoreStepText.visible = true;
                        }
                        if (this.groomStep === totalSteps) {
                            this.groom.visible = false;
                            this.rocketLaunched = true;
                            this.launchRocket();
                            this.tooltipState = 2;
                            // Hide 'Almost there!' when leaving
                            this.almostThereBg.visible = false;
                            this.almostThereTitle.visible = false;
                            this.almostThereText.visible = false;
                        }
                    }
                });
            }
        };

        let firstClick = true;
        this.input.on('pointerdown', () => {
            if (firstClick) {
                continueText.visible = false;
                firstClick = false;
                // Show the first tooltip message above the groom
                this.groomTooltipBg.visible = true;
                this.groomTooltipTitle.visible = true;
                this.groomTooltipMsg.visible = true;
                return;
            }
            if (this.tooltipState === 0) {
                showSecondTooltip();
            } else if (this.tooltipState === 1) {
                walkStep();
            }
        });
        this.rocket.on('pointerdown', () => {
            if (this.tooltipState === 1) walkStep();
        });
    }

    launchRocket() {
        // Rocket and groom move smoothly, background stays fixed
        // Set moon position as percentage of canvas size
        const moonY = config.height * 0.30;
        this.tweens.add({
            targets: this.rocket,
            x: this.rocket.x, // keep X constant
            y: moonY,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                this.scene.start('MoonScene');
            }
        });
    }
}


class MoonScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MoonScene' });
    }

    create() {
        const dpr = window.devicePixelRatio || 1;

        this.bg = this.add.image(config.width / 2, config.height / 2, 'moon-bg').setOrigin(0.5, 0.5);
        const bgTexture = this.textures.get('moon-bg').getSourceImage();
        const scaleX = config.width / bgTexture.width;
        const scaleY = config.height / bgTexture.height;
        const scale = Math.max(scaleX, scaleY);
        this.bg.setScale(scale);
        this.cameras.main.setZoom(1);
        this.cameras.main.centerOn(config.width / 2, config.height / 2);

        const groomAnchor = { x: isMobile ? 0.2 : 0.33, y: 0.62 };
        const brideAnchor = { x: 0.52 };
        const weddingAnchor = { x: 0.5, y: 0.64 };

        const bgHeight = bgTexture.height;
        const visibleHeight = config.height / scale;
        const offsetY = (bgHeight - visibleHeight) / 2;

        const groomX = groomAnchor.x * config.width;
        const groomImgY = groomAnchor.y * bgHeight;
        const groomY = (groomImgY - offsetY) * scale;
        const brideX = brideAnchor.x * config.width;
        const brideY = groomY;

        this.groom = this.add.image(groomX, groomY, 'groom').setOrigin(0.5, 1).setInteractive();
        let groomScale = Math.min(config.width, config.height) / 512 * 0.8;
        groomScale = Math.min(groomScale, 1);
        this.groom.setScale(groomScale);


        this.bride = this.add.image(brideX, brideY, 'bride').setOrigin(0.5, 1).setInteractive();
        let brideScale = Math.min(config.width, config.height) / 512 * 0.8;
        brideScale = Math.min(brideScale, 1);
        this.bride.setScale(brideScale);

        const weddingArchX = 0.5 * config.width;
        const weddingArchYImgY = weddingAnchor.y * bgHeight;
        const weddingArchY = (weddingArchYImgY - offsetY) * scale;
        this.weddingArch = this.add.image(weddingArchX, weddingArchY, 'wedding_arch').setOrigin(0.5, 1).setInteractive();
        let weddingArchScale = Math.min(config.width, config.height) / 512 * 0.8;
        weddingArchScale = Math.min(weddingArchScale, 1);
        this.weddingArch.setScale(weddingArchScale);


        // Prepare aesthetic tooltip above groom, but hide it initially
        const tooltipWidth = isMobile ? Math.max(config.width * 0.35, 110) : 320;
        const tooltipHeight = (isMobile ? 50 : 80) * dpr;
        const tooltipX = groomX;
        // Calculate tooltip Y so the textbox sits just above the groom's head, with proportional offset
        // const tooltipYOffset = isMobile ? this.groom.displayHeight * 0.6 : this.groom.displayHeight * 0.6;
        const tooltipY = groomY - this.groom.displayHeight - tooltipHeight;
        // Tooltip background
        this.groomTooltipBg = this.add.rectangle(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 0x222222, 0.95).setOrigin(0.5, 0);
        this.groomTooltipBg.setStrokeStyle(2 * dpr, 0xffffff);
        // Tooltip title
        this.groomTooltipTitle = this.add.text(tooltipX, tooltipY + 5 * dpr, "Groom", {
            font: isMobile ? `bold ${12 * dpr}px Arial` : `bold ${18 * dpr}px Arial`,
            fill: "#ffd700",
            align: "center"
        }).setOrigin(0.5, 0);
        // Tooltip message
        this.groomTooltipMsg = this.add.text(
            tooltipX,
            tooltipY + (isMobile ? 20 * dpr : 32 * dpr), // move text lower on desktop
            "She's absolutely stunning!",
            {
                font: isMobile ? `${11 * dpr}px Arial` : `${16 * dpr}px Arial`,
                fill: "#fff",
                wordWrap: { width: tooltipWidth - 20 }
            }
        ).setOrigin(0.5, 0);

        this.input.once('pointerdown', () => {
            this.groomTooltipBg.setVisible(false);
            this.groomTooltipTitle.setVisible(false);
            this.groomTooltipMsg.setVisible(false);
            this.tweens.add({
                targets: this.groom,
                x: isMobile ? 0.47 * config.width : 0.49 * config.width,
                duration: 2000,
                ease: 'Power2',
                onComplete: () => {
                    this.scene.start('SaveTheDateScene');
                }
            });
        });
    }
}

class SaveTheDateScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SaveTheDateScene' });
    }

    create() {
        // Background rectangle (letterbox color)
        this.add
            .rectangle(config.width / 2, config.height / 2, config.width, config.height, 0x040402)
            .setOrigin(0.5);

        // Add background image centered
        this.bg = this.add.image(config.width / 2, config.height / 2, 'save-the-date').setOrigin(0.5);

        // Device pixel ratio (important if your config width/height were multiplied by DPR)
        const dpr = window.devicePixelRatio || 1;

        // Full width of the visible canvas
        const screenWidth = config.width; // keep your config.width
        const screenHeight = config.height; // keep your config.height

        // Calculate aspect ratios
        const imageAspect = this.bg.width / this.bg.height;
        const screenAspect = screenWidth / screenHeight;

        // COVER behavior: scale image to fill width, crop height if needed
        if (imageAspect < screenAspect) {
            // Image is narrower than screen — scale by width
            this.bg.displayWidth = screenWidth;
            this.bg.scaleY = this.bg.scaleX;
        } else {
            // Image is wider or taller — scale by width anyway to cover
            this.bg.displayWidth = screenWidth;
            this.bg.scaleY = this.bg.scaleX;
        }

        // Center image vertically
        this.bg.setPosition(screenWidth / 2, screenHeight / 2);
    }
}


function getCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    let width, height;
    width = window.innerWidth;
    height = window.innerHeight;
    return {
        width: Math.round(width * dpr),
        height: Math.round(height * dpr),
        cssWidth: width,
        cssHeight: height,
        dpr: dpr
    };
}

const canvasSize = getCanvasSize();
const config = {
    type: Phaser.AUTO,
    width: canvasSize.width,
    height: canvasSize.height,
    parent: 'game',
    backgroundColor: '#222',
    audio: {
        disableWebAudio: true
    },
    scene: [InitScene, PreloaderScene, EarthScene, MoonScene, SaveTheDateScene],
    defaultScene: 'InitScene',
    scale: {
        mode: Phaser.Scale.NONE,
        width: canvasSize.width,
        height: canvasSize.height,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);

