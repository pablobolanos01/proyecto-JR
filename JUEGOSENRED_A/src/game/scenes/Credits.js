import { Scene } from "phaser";

export class Credits extends Scene {

    constructor() {
        super('Credits');
    }

    create() {
        const { width, height } = this.scale;

        // Fondo de créditos (primero para quedar detrás de textos y botón)
        const bg = this.add.image(width / 2, height / 2, 'bg-credits');
        bg.setDisplaySize(width, height);

        this.add.text(512, 150, 'STAR STUDIOS', {
            fontSize: '64px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(512, 200, 'Programación:\t Pablo Bolaños Gallego, Gabriel González Alcoreza, Ignacio Liñán Vicente', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(512, 230, 'Sonido:\t Gabriel González Alcoreza', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(512, 270, 'Assets:\t Pablo Bolaños Gallego, Gabriel González Alcoreza\nBasados en el pack de assets Space Pilot Adventure (https://lugmon.itch.io/spacepilotadventure)', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const backBtn = this.add.text(512, 700, 'Back', {
            fontSize: '32px',
            color: '#00ff00'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => backBtn.setStyle({ color: '#ffff00' }))
            .on('pointerout', () => backBtn.setStyle({ color: '#00ff00' }))
            .on('pointerdown', () => this.scene.start('MainMenu'));
    }
}