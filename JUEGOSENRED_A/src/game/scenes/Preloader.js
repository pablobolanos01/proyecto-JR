import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload() {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        // Fondos de escenas (ajusta la ruta si los guardas en una subcarpeta como 'backgrounds/')
        this.load.image('bg-credits', 'bg_creditos.jpg');
        this.load.image('bg-settings', 'bg_settings.jpg');
        this.load.image('bg-main-menu', 'bg_mainMenu.jpg');
        this.load.image('bg-escenario', 'bg_escenario.jpg');

        this.load.image('logo', 'logo.png');
        // Nivel original exportado desde Unity
        this.load.spritesheet('space-base', 'tiles/space-base.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.json('nivel1', 'tiles/nivel1.json');
        this.load.json('nivel1-objetos', 'tiles/nivel1-objetos.json');
        this.load.json('tile-mapping', 'tiles/tile-mapping.json');
        this.load.spritesheet('player', 'characters/player.png', {
            frameWidth: 32,
            frameHeight: 32,
            margin: 16,
            spacing: 16
        });

        this.load.image('player-bullet', 'characters/player-bullet.png');
        this.load.image('player-fire', 'characters/player-fire.png');

        //audio y música
        // Carga la música de fondo del menú principal desde public/assets/audio/mainmenu.mp3
        this.load.audio('music-menu', 'audio/mainmenu.mp3');

        // Carga la música de fondo durante la partida desde public/assets/audio/partida.mp3
        this.load.audio('music-game', 'audio/partida.mp3');

        // Carga el efecto de sonido de salto desde public/assets/audio/salto.mp3
        this.load.audio('sfx-jump', 'audio/salto.mp3');

        // Carga el efecto de sonido de disparo láser desde public/assets/audio/disparoLaser.mp3
        this.load.audio('sfx-shoot', 'audio/disparoLaser.mp3');
    }

    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}