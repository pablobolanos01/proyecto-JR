import { Scene } from "phaser";

export class MainMenu extends Scene {

    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;

        // Fondo del menú principal (primero para quedar detrás de textos y botones)
        const bg = this.add.image(width / 2, height / 2, 'bg-main-menu');
        bg.setDisplaySize(width, height);

        this.add.text(512, 150, 'STAR EXPLORER', {
            fontSize: '64px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const localBtn = this.add.text(512, 320, 'Local Multiplayer', {
            fontSize: '32px',
            color: '#00ff00'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => localBtn.setStyle({ color: '#ffff00' }))
            .on('pointerout', () => localBtn.setStyle({ color: '#00ff00' }))
            .on('pointerdown', () => this.scene.start('Game'));

        const setBtn = this.add.text(512, 380, 'Settings', {
            fontSize: '32px',
            color: '#00ff00'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => setBtn.setStyle({ color: '#ffff00' }))
            .on('pointerout', () => setBtn.setStyle({ color: '#00ff00' }))
            .on('pointerdown', () => this.scene.start('Settings'));

        const credBtn = this.add.text(512, 440, 'Credits', {
            fontSize: '32px',
            color: '#00ff00'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => credBtn.setStyle({ color: '#ffff00' }))
            .on('pointerout', () => credBtn.setStyle({ color: '#00ff00' }))
            .on('pointerdown', () => this.scene.start('Credits'));
    }
}