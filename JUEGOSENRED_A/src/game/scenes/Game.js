import * as Phaser from 'phaser';
import { createKeys, playMusic } from './Settings';

const { Scene } = Phaser;

export class Game extends Scene {
    constructor() { super('Game'); }

    create() {
        //cargar ajustes
        //playMusic();
        this.keys1 = createKeys(this, 'p1');
        this.keys2 = createKeys(this, 'p2');
        this.cameras.main.setBackgroundColor('#101827');

        // Guarda el ancho y alto del escenario y configura los límites de físicas y cámara
        const width = this.scale.width;
        const height = this.scale.height;
        this.worldWidth = width;
        this.worldHeight = height;

        this.physics.world.setBounds(0, 0, width, height);
        this.cameras.main.setBounds(0, 0, width, height);

        // Crea la imagen de fondo ajustada al escenario y detrás de las entidades
        const bg = this.add.image(width / 2, height / 2, 'bg-escenario');
        bg.setDisplaySize(width, height);
        bg.setDepth(-10);
        bg.setAlpha(1);

        // En false oculta las cajas amarillas dejando las zonas de colisión invisibles
        const SHOW_DEBUG_BOXES = false;
        // Grupo estático que almacena todas las zonas sólidas pisables del escenario
        this.solids = this.physics.add.staticGroup();

        // Crea una zona de colisión estática (visible si SHOW_DEBUG_BOXES es true, invisible si es false)
        const addFloor = (x, y, w, h) => {
            const box = SHOW_DEBUG_BOXES
                ? this.add.rectangle(x, y, w, h, 0xffcc00, 0.35).setDepth(5)
                : this.add.zone(x, y, w, h);
            this.physics.add.existing(box, true);
            this.solids.add(box);
        };

        // Pasarela inferior principal
        addFloor(width * 0.500, height * 0.818, width * 1.000, height * 0.042);

        // Plataformas flotantes
        addFloor(width * 0.500, height * 0.082, width * 0.145, height * 0.036); // Superior con antena centrada
        addFloor(width * 0.375, height * 0.295, width * 0.115, height * 0.055); // Superior izquierda
        addFloor(width * 0.568, height * 0.270, width * 0.075, height * 0.105); // Bloque central alto
        addFloor(width * 0.255, height * 0.455, width * 0.120, height * 0.050); // Media izquierda
        addFloor(width * 0.648, height * 0.398, width * 0.145, height * 0.065); // Media derecha
        addFloor(width * 0.790, height * 0.468, width * 0.080, height * 0.030); // Pequeña derecha

        // Estructura izquierda
        addFloor(width * 0.045, height * 0.655, width * 0.090, height * 0.255); // Bloque alto izquierdo
        addFloor(width * 0.112, height * 0.695, width * 0.045, height * 0.175); // Escalón 1
        addFloor(width * 0.155, height * 0.730, width * 0.045, height * 0.105); // Escalón 2
        addFloor(width * 0.195, height * 0.760, width * 0.038, height * 0.045); // Escalón bajo izquierdo

        // Estructura central
        addFloor(width * 0.435, height * 0.645, width * 0.155, height * 0.275); // Bloque central izquierdo
        addFloor(width * 0.535, height * 0.650, width * 0.095, height * 0.265); // Unión central
        addFloor(width * 0.635, height * 0.690, width * 0.115, height * 0.185); // Tejadillo / bloque central derecho

        // Estructura derecha
        addFloor(width * 0.945, height * 0.665, width * 0.110, height * 0.235); // Bloque alto derecho
        addFloor(width * 0.870, height * 0.715, width * 0.045, height * 0.135); // Escalón medio derecho
        addFloor(width * 0.828, height * 0.755, width * 0.042, height * 0.055); // Escalón bajo derecho

        this.health1 = 3; //salud j1
        this.health2 = 3; //salud j2
        this.score = 0;
        this.coinCount = 0;
        this.finished = false;
        this.isPaused = false;
        this.debugGodMode = false; // Cambiar a true solo durante pruebas
        this.invulnerableUntil1 = 0;
        this.invulnerableUntil2 = 0;
        this.player1Bullets = this.physics.add.group();
        this.player2Bullets = this.physics.add.group();
        this.coins = this.physics.add.group({ allowGravity: false, immovable: true });
        this.healthItems = this.physics.add.group({ allowGravity: false, immovable: true });

        // Altura inicial de ambos jugadores sobre el suelo y aparición en lados opuestos
        const spawnY = height * 0.72;
        this.player1 = this.physics.add.sprite(width * 0.18, spawnY, 'player', 16).setDepth(10);
        this.player2 = this.physics.add.sprite(width * 0.82, spawnY, 'player', 16).setDepth(10);

        // Orienta al jugador 1 hacia la derecha y al jugador 2 hacia la izquierda
        this.player1.setScale(2).setCollideWorldBounds(true).setFlipX(false);
        this.player2.setScale(2).setCollideWorldBounds(true).setFlipX(true);
        this.player1.body.setSize(22, 29).setOffset(5, 3);
        this.player2.body.setSize(22, 29).setOffset(5, 3);
        this.registerAnimations();
        this.player1.play('player-idle');
        this.player2.play('player-idle');
        this.fireSprite1 = this.add.image(this.player1.x, this.player1.y, 'player-fire').setScale(2).setDepth(20).setVisible(false);
        this.fireSprite2 = this.add.image(this.player2.x, this.player2.y, 'player-fire').setScale(2).setDepth(20).setVisible(false);

        // Colisiones de ambos jugadores con las zonas sólidas del escenario
        for (const entity of [this.player1, this.player2]) {
            this.physics.add.collider(entity, this.solids);
        }
        // Destruye las balas de ambos jugadores al chocar contra las zonas sólidas
        this.physics.add.overlap(this.player1Bullets, this.solids, bullet => bullet.destroy());
        this.physics.add.overlap(this.player2Bullets, this.solids, bullet => bullet.destroy());

        //CODIGO PARA QUE LOS JUGADORES PUEDAN ATACARSE
        this.physics.add.overlap(this.player1Bullets, this.player2, (obj1, obj2) => {
            const bullet = obj1 === this.player2 ? obj2 : obj1;
            if (!bullet || bullet === this.player2 || !bullet.active) return;
            const fromX = bullet.x;
            bullet.destroy();
            this.damagePlayer2(fromX, 'proyectil');
        });

        this.physics.add.overlap(this.player2Bullets, this.player1, (obj1, obj2) => {
            const bullet = obj1 === this.player1 ? obj2 : obj1;
            if (!bullet || bullet === this.player1 || !bullet.active) return;
            const fromX = bullet.x;
            bullet.destroy();
            this.damagePlayer1(fromX, 'proyectil');
        });

        this.physics.add.overlap(this.player1, this.coins, (_player, coin) => {
            if (!coin.active) return;
            coin.destroy(); this.coinCount++; this.score += 100;
            if (this.coinCount % 5 === 0 && this.health1 < 3) this.health1++;
            this.updateHud();
        });

        this.physics.add.overlap(this.player1, this.healthItems, (_player, item) => {
            if (!item.active) return;
            item.destroy(); this.score += 200; this.health1 = Math.min(3, this.health1 + 1);
            this.updateHud();
        });
        //j2 puede recoger objetos de salud (su indicador no existe todavia)
        this.physics.add.overlap(this.player2, this.healthItems, (_player, item) => {
            if (!item.active) return;
            item.destroy(); this.score += 200; this.health2 = Math.min(3, this.health2 + 1);
            this.updateHud();
        });
        // Cámara fija: muestra el escenario completo y permite ver a ambos jugadores.
        this.keys1.shoot.on("down", () => this.p1Shoot());
        this.keys2.shoot.on("down", () => this.p2Shoot());
        this.hud = this.add.text(20, 20, '', { fontFamily: 'monospace', fontSize: '22px', color: '#ffffff', backgroundColor: '#00000099', padding: { x: 10, y: 8 } })
            .setScrollFactor(0).setDepth(100);
        this.updateHud();

        this.pauseText = this.add.text(width / 2, height / 2,
            'PAUSA\nPulsa P para continuar',
            { fontSize: '32px', color: '#ffffff', backgroundColor: '#000000', align: 'center', padding: { x: 20, y: 15 } })
            .setOrigin(0.5).setScrollFactor(0).setDepth(200).setVisible(false);

        this.input.keyboard.on('keydown-P', () => {
            if (this.finished) return;
            this.isPaused = !this.isPaused;
            if (this.isPaused) this.physics.pause();
            else this.physics.resume();
            this.pauseText.setVisible(this.isPaused);
        });

        this.input.keyboard.on('keydown-ESC', () => {
            if (this.isPaused || this.finished) this.physics.resume();
            this.isPaused = false;
            this.scene.start('MainMenu');
        });

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.input.keyboard.off('keydown-P');
            this.input.keyboard.off('keydown-ESC');
        });
    }

    registerAnimations() {
        const anim = (key, texture, frames, rate, repeat = -1) => {
            if (!this.anims.exists(key)) this.anims.create({ key, frames: this.anims.generateFrameNumbers(texture, { frames }), frameRate: rate, repeat });
        };
        anim('player-idle', 'player', [16, 17], 4);
        anim('player-walk', 'player', [48, 49, 50, 51], 6);
        anim('player-jump', 'player', [96], 1); // Se conserva el frame validado en el prototipo.
    }

    p1Shoot() {
        if (this.finished || this.isPaused || !this.player1.active) return;
        const dir = this.player1.flipX ? -1 : 1;
        const x = this.player1.x + dir * 38;
        const bullet = this.player1Bullets.create(x, this.player1.y, 'player-bullet');
        bullet.setScale(2).setVelocity(dir * 700, 0).setFlipX(dir < 0);
        bullet.body.setAllowGravity(false);
        this.fireSprite1.setPosition(x, this.player1.y).setFlipX(dir < 0).setVisible(true);
        if (this.fireTimer1) this.fireTimer1.remove();
        this.fireTimer1 = this.time.delayedCall(100, () => { if (this.fireSprite1?.active) this.fireSprite1.setVisible(false); });
    }

    p2Shoot() {
        if (this.finished || this.isPaused || !this.player2.active) return;
        const dir = this.player2.flipX ? -1 : 1;
        const x = this.player2.x + dir * 38;
        const bullet = this.player2Bullets.create(x, this.player2.y, 'player-bullet');
        bullet.setScale(2).setVelocity(dir * 700, 0).setFlipX(dir < 0);
        bullet.body.setAllowGravity(false);
        this.fireSprite2.setPosition(x, this.player2.y).setFlipX(dir < 0).setVisible(true);
        if (this.fireTimer2) this.fireTimer2.remove();
        this.fireTimer2 = this.time.delayedCall(100, () => { if (this.fireSprite2?.active) this.fireSprite2.setVisible(false); });
    }

    damagePlayer1(fromX, cause = 'desconocido') {
        if (this.debugGodMode || this.finished || this.health1 <= 0 || this.time.now < this.invulnerableUntil1) return;
        this.health1 = Math.max(0, this.health1 - 1);
        this.invulnerableUntil1 = this.time.now + 1800;
        console.log(`[COMBATE] ${cause}: vida ${this.health1}/3, t=${Math.round(this.time.now)}ms`);
        this.updateHud();
        if (this.health1 === 0) {
            this.finish(false);
            return;
        }
        // Retroceso desactivado temporalmente para depurar el daÃƒÂ±o.
        this.player1.setTint(0xff7777);
        this.time.delayedCall(250, () => { if (this.player1?.active && !this.finished) this.player1.clearTint(); });
    }

    damagePlayer2(fromX, cause = 'desconocido') {
        if (this.debugGodMode || this.finished || this.health2 <= 0 || this.time.now < this.invulnerableUntil2) return;
        this.health2 = Math.max(0, this.health2 - 1);
        this.invulnerableUntil2 = this.time.now + 1800;
        console.log(`[COMBATE] ${cause}: vida ${this.health2}/3, t=${Math.round(this.time.now)}ms`);
        this.updateHud();
        if (this.health2 === 0) {
            this.finish(false);
            return;
        }
        // Retroceso desactivado temporalmente para depurar el daÃƒÂ±o.
        this.player2.setTint(0xff7777);
        this.time.delayedCall(250, () => { if (this.player2?.active && !this.finished) this.player2.clearTint(); });
    }

    updateHud() {
        this.hud?.setText(`J1: ${this.health1}/3   J2: ${this.health2}/3\nPUNTOS: ${this.score}   MONEDAS: ${this.coinCount}`);
    }



    finish(won) {
        if (this.finished) return;
        this.finished = true;
        this.fireSprite1.setVisible(false);
        this.fireSprite2.setVisible(false);
        for (const player of [this.player1, this.player2]) {
            player.setVelocity(0, 0);
            player.body.enable = false;
        }
        // Secuencia de muerte independiente de las animaciones del spritesheet.
        // El original Unity se incorporara al identificar todos sus fileIDs.
        if (!won) {
            if (this.health1 <= 0) {
                this.player1.anims.stop();
                this.player1.setTint(0xff6666);
                this.tweens.add({
                    targets: this.player1, angle: 90, alpha: 0.15, y: this.player1.y - 24,
                    duration: 900, ease: 'Sine.easeInOut',
                    onComplete: () => this.showEndScreen(false)
                });
            }
            if (this.health2 <= 0) {
                this.player2.anims.stop();
                this.player2.setTint(0xff6666);
                this.tweens.add({
                    targets: this.player2, angle: 90, alpha: 0.15, y: this.player2.y - 24,
                    duration: 900, ease: 'Sine.easeInOut',
                    onComplete: () => this.showEndScreen(false)
                });
            }
        } else {
            this.showEndScreen(true);
        }
    }

    showEndScreen(won) {
        this.physics.pause();
        const label = won ? 'NIVEL COMPLETADO' : 'GAME OVER';
        this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2,
            this.cameras.main.width, this.cameras.main.height, 0x080d1b, 0.83)
            .setScrollFactor(0).setDepth(199);
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2,
            `${label}\nPUNTOS: ${this.score}\n\nPULSA R PARA REINICIAR`,
            { fontSize: '32px', fontFamily: 'monospace', color: '#ffffff', align: 'center', lineSpacing: 14 })
            .setOrigin(0.5).setScrollFactor(0).setDepth(200);
        this.input.keyboard.once('keydown-R', () => this.scene.restart());
    }

    update(time, delta) {
        //GESTION J1
        if (this.isPaused || this.finished || !this.player1?.active) return;
        const left1 = this.keys1.left.isDown;
        const right1 = this.keys1.right.isDown;
        const jump1 = this.keys1.jump.isDown;
        if (left1) { this.player1.setVelocityX(-250); this.player1.setFlipX(true); }
        else if (right1) { this.player1.setVelocityX(250); this.player1.setFlipX(false); }
        else this.player1.setVelocityX(0);
        if (jump1 && this.player1.body.blocked.down) this.player1.setVelocityY(-400);
        if (!this.player1.body.blocked.down) this.player1.play('player-jump', true);
        else if (left1 || right1) this.player1.play('player-walk', true);
        else this.player1.play('player-idle', true);
        if (this.time.now > this.invulnerableUntil1) this.player1.clearTint();
        if (this.fireSprite1.visible) this.fireSprite1.setPosition(this.player1.x + (this.player1.flipX ? -38 : 38), this.player1.y);

        //GESTION J2
        if (this.finished || !this.player2?.active) return;
        const left2 = this.keys2.left.isDown;
        const right2 = this.keys2.right.isDown;
        const jump2 = this.keys2.jump.isDown;
        if (left2) { this.player2.setVelocityX(-250); this.player2.setFlipX(true); }
        else if (right2) { this.player2.setVelocityX(250); this.player2.setFlipX(false); }
        else this.player2.setVelocityX(0);
        if (jump2 && this.player2.body.blocked.down) this.player2.setVelocityY(-400);
        if (!this.player2.body.blocked.down) this.player2.play('player-jump', true);
        else if (left2 || right2) this.player2.play('player-walk', true);
        else this.player2.play('player-idle', true);
        if (this.time.now > this.invulnerableUntil2) this.player2.clearTint();
        if (this.fireSprite2.visible) this.fireSprite2.setPosition(this.player2.x + (this.player2.flipX ? -38 : 38), this.player2.y);

        for (const bullet of [...this.player1Bullets.getChildren(), ...this.player2Bullets.getChildren()]) {
            if (bullet.active && (!bullet.body || bullet.x < 0 || bullet.x > this.worldWidth || bullet.y < 0 || bullet.y > this.worldHeight)) bullet.destroy();
        }
    }
}