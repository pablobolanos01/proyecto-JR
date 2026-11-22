import * as Phaser from 'phaser';
import { createKeys, playMusic, playSfx } from './Settings';

const { Scene } = Phaser;

export class Game extends Scene {
    constructor() { super('Game'); }

    create() {
        //cargar ajustes
        //playMusic();
        this.keys1 = createKeys(this, 'p1');
        this.keys2 = createKeys(this, 'p2');
        this.cameras.main.setBackgroundColor('#101827');
        const level = this.cache.json.get('nivel1');
        const mapping = this.cache.json.get('tile-mapping');
        const objects = this.cache.json.get('nivel1-objetos');
        if (!level || !mapping || !Array.isArray(objects)) {
            throw new Error('Faltan nivel1, tile-mapping o nivel1-objetos en Preloader.js');
        }
        this.level = level;
        this.unit = 32; // Mismo tamano que la celda del nivel exportado
        this.worldWidth = level.width * this.unit;
        this.worldHeight = level.height * this.unit;
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

        const frames = new Map(mapping.map(t => [t.unityIndex, t.frame]));
        this.platforms = this.physics.add.staticGroup();
        for (const tile of level.tiles) {
            const frame = frames.get(tile.tileIndex);
            if (frame === undefined) continue;
            const x = (tile.x - level.originX) * this.unit;
            const y = (level.originY + level.height - 1 - tile.y) * this.unit;
            this.add.image(x, y, 'space-base', frame).setOrigin(0, 0);
            const body = this.add.zone(x + 16, y + 16, 32, 32);
            this.physics.add.existing(body, true);
            this.platforms.add(body);
        }
        // Suelo de seguridad heredado del prototipo anterior; retirar al validar el tilemap.
        this.ground = this.add.rectangle(this.worldWidth / 2, this.worldHeight - 16, this.worldWidth, 32, 0x526477, 0.35);
        this.physics.add.existing(this.ground, true);

        this.health1 = 3; //salud j1
        this.health2 = 3; //salud j2
        this.score = 0;
        this.coinCount = 0;
        this.finished = false;
        this.invulnerableUntil = 0;
        this.player1Bullets = this.physics.add.group();
        this.player2Bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.coins = this.physics.add.group({ allowGravity: false, immovable: true });
        this.healthItems = this.physics.add.group({ allowGravity: false, immovable: true });

        const start = objects.find(o => o.type === 'player');
        const spawn = start ? this.toPixels(start) : { x: 200, y: 500 };
        this.player1 = this.physics.add.sprite(spawn.x, spawn.y, 'player', 16);
        this.player2 = this.physics.add.sprite(spawn.x - 50, spawn.y, 'player', 16);
        this.player1.setScale(2).setCollideWorldBounds(true);
        this.player2.setScale(2).setCollideWorldBounds(true);
        this.player1.body.setSize(22, 29).setOffset(5, 3);
        this.player2.body.setSize(22, 29).setOffset(5, 3);
        this.registerAnimations();
        this.player1.play('player-idle');
        this.player2.play('player-idle');
        this.fireSprite1 = this.add.image(this.player1.x, this.player1.y, 'player-fire').setScale(2).setDepth(20).setVisible(false);
        this.fireSprite2 = this.add.image(this.player2.x, this.player2.y, 'player-fire').setScale(2).setDepth(20).setVisible(false);

        for (const obj of objects) {
            const p = this.toPixels(obj);
            if (obj.type === 'enemy') {
                const enemy = this.enemies.create(p.x, p.y, 'enemy', 16);
                enemy.setScale(2).setCollideWorldBounds(true);
                enemy.body.setSize(22, 29).setOffset(5, 3);
                enemy.setData('nextShot', this.time.now + Phaser.Math.Between(800, 2200));
                enemy.play('enemy-idle');
            } else if (obj.type === 'coin') {
                const coin = this.add.circle(p.x, p.y, 10, 0xffd54a);
                this.physics.add.existing(coin);
                coin.body.setAllowGravity(false).setImmovable(true);
                this.coins.add(coin);
            } else if (obj.type === 'health') {
                const item = this.add.rectangle(p.x, p.y, 23, 23, 0x45d881);
                this.add.text(p.x, p.y, '+', { fontSize: '23px', color: '#ffffff' }).setOrigin(0.5).setDepth(5);
                this.physics.add.existing(item);
                item.body.setAllowGravity(false).setImmovable(true);
                this.healthItems.add(item);
            }
        }
        this.enemyCount = this.enemies.countActive();
        for (const entity of [this.player1, this.player2, this.enemies]) {
            this.physics.add.collider(entity, this.platforms);
            this.physics.add.collider(entity, this.ground);
        }
        this.physics.add.overlap(this.player1Bullets, this.platforms, bullet => bullet.destroy());
        this.physics.add.overlap(this.player2Bullets, this.platforms, bullet => bullet.destroy());
        this.physics.add.overlap(this.enemyBullets, this.platforms, bullet => bullet.destroy());
        this.physics.add.overlap(this.player1Bullets, this.ground, bullet => bullet.destroy());
        this.physics.add.overlap(this.player2Bullets, this.ground, bullet => bullet.destroy());
        this.physics.add.overlap(this.enemyBullets, this.ground, bullet => bullet.destroy());
        this.physics.add.overlap(this.player1Bullets, this.enemies, (bullet, enemy) => {
            if (!bullet.active || !enemy.active) return;
            bullet.destroy(); enemy.destroy();
            this.score += 500; this.enemyCount--;
            this.updateHud();
            if (this.enemyCount === 0) this.finish(true);
        });
        this.physics.add.overlap(this.enemyBullets, this.player1, (obj1, obj2) => {
            const bullet = obj1 === this.player1 ? obj2 : obj1;
            if (!bullet || bullet === this.player1 || !bullet.active) return;
            const fromX = bullet.x;
            bullet.destroy();
            this.damagePlayer1(fromX, 'proyectil');
        });


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

        this.physics.add.overlap(this.player1, this.enemies, (_player, enemy) => this.damagePlayer(enemy.x, 'contacto'));
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
        this.cameras.main.startFollow(this.player1); //se debe cambiar para que siga a los dos jugadores (similar a super smash bros, no se como se hace)
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('A,D,W,SPACE,J,L,I');
        this.keys1.shoot.on("down", () => this.p1Shoot());
        this.keys2.shoot.on("down", () => this.p2Shoot());
        this.hud = this.add.text(20, 20, '', { fontFamily: 'monospace', fontSize: '22px', color: '#ffffff', backgroundColor: '#00000099', padding: { x: 10, y: 8 } })
            .setScrollFactor(0).setDepth(100);
        this.updateHud();
        console.log('Objetos Unity importados:', objects.length, 'Enemigos:', this.enemyCount);
    }

    toPixels(o) {
        return {
            x: (o.x - this.level.originX) * this.unit,
            y: (this.level.originY + this.level.height - o.y) * this.unit
        };
    }

    registerAnimations() {
        const anim = (key, texture, frames, rate, repeat = -1) => {
            if (!this.anims.exists(key)) this.anims.create({ key, frames: this.anims.generateFrameNumbers(texture, { frames }), frameRate: rate, repeat });
        };
        anim('player-idle', 'player', [16, 17], 4);
        anim('player-walk', 'player', [48, 49, 50, 51], 6);
        anim('player-jump', 'player', [96], 1); // Se conserva el frame validado en el prototipo.
        anim('enemy-idle', 'enemy', [16, 17], 4);
        anim('enemy-walk', 'enemy', [48, 49, 50, 51], 6);
    }

    p1Shoot() {
        if (this.finished || !this.player1.active) return;
        const dir = this.player1.flipX ? -1 : 1;
        const x = this.player1.x + dir * 38;
        const bullet = this.player1Bullets.create(x, this.player1.y, 'player-bullet');
        bullet.setScale(2).setVelocity(dir * 700, 0).setFlipX(dir < 0);
        bullet.body.setAllowGravity(false);
        this.fireSprite1.setPosition(x, this.player1.y).setFlipX(dir < 0).setVisible(true);
        if (this.fireTimer) this.fireTimer.remove();
        this.fireTimer = this.time.delayedCall(100, () => this.fireSprite1.setVisible(false));
    }

    p2Shoot() {
        if (this.finished || !this.player2.active) return;
        const dir = this.player2.flipX ? -1 : 1;
        const x = this.player2.x + dir * 38;
        const bullet = this.player2Bullets.create(x, this.player2.y, 'player-bullet');
        bullet.setScale(2).setVelocity(dir * 700, 0).setFlipX(dir < 0);
        bullet.body.setAllowGravity(false);
        this.fireSprite2.setPosition(x, this.player2.y).setFlipX(dir < 0).setVisible(true);
        if (this.fireTimer) this.fireTimer.remove();
        this.fireTimer = this.time.delayedCall(100, () => this.fireSprite2.setVisible(false));
    }

    enemyShoot(enemy, dir) {
        const bullet = this.enemyBullets.create(enemy.x + dir * 38, enemy.y, 'enemy-bullet');
        bullet.setScale(2).setVelocity(dir * 460, 0).setFlipX(dir < 0);
        bullet.body.setAllowGravity(false);
    }

    damagePlayer1(fromX, cause = 'desconocido') {
        if (this.finished || this.health1 <= 0 || this.time.now < this.invulnerableUntil) return;
        this.health1 = Math.max(0, this.health1 - 1);
        this.invulnerableUntil = this.time.now + 1800;
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
        if (this.finished || this.health2 <= 0 || this.time.now < this.invulnerableUntil) return;
        this.health2 = Math.max(0, this.health2 - 1);
        this.invulnerableUntil = this.time.now + 1800;
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
        this.hud?.setText(`VIDA: ${this.health1}/3   PUNTOS: ${this.score}   MONEDAS: ${this.coinCount}   ENEMIGOS: ${this.enemyCount}`);
    }

    finish(won) {
        if (this.finished) return;
        this.finished = true;
        this.fireSprite1.setVisible(false);
        this.player1.setVelocity(0, 0);
        this.player1.body.enable = false;
        for (const enemy of this.enemies.getChildren()) {
            if (enemy.active) enemy.setVelocity(0, 0);
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
            `${label}\nPUNTOS: ${this.score}\nENEMIGOS RESTANTES: ${this.enemyCount}\n\nPULSA R PARA REINICIAR`,
            { fontSize: '32px', fontFamily: 'monospace', color: '#ffffff', align: 'center', lineSpacing: 14 })
            .setOrigin(0.5).setScrollFactor(0).setDepth(200);
        this.input.keyboard.once('keydown-R', () => this.scene.restart());
    }
    update(time, delta) {
        //GESTION J1
        if (this.finished || !this.player1?.active) return;
        const left1 = this.keys1.left.isDown;
        const right1 = this.keys1.right.isDown;
        const jump1 = this.keys1.jump.isDown;
        const shoot1 = this.keys1.shoot.isDown;
        if (left1) { this.player1.setVelocityX(-250); this.player1.setFlipX(true); }
        else if (right1) { this.player1.setVelocityX(250); this.player1.setFlipX(false); }
        else this.player1.setVelocityX(0);
        if (jump1 && this.player1.body.blocked.down) this.player1.setVelocityY(-400);
        if (!this.player1.body.blocked.down) this.player1.play('player-jump', true);
        else if (left1 || right1) this.player1.play('player-walk', true);
        else this.player1.play('player-idle', true);
        if (this.time.now > this.invulnerableUntil) this.player1.clearTint();
        if (this.fireSprite1.visible) this.fireSprite1.setPosition(this.player1.x + (this.player1.flipX ? -38 : 38), this.player1.y);

        //GESTION J2
        if (this.finished || !this.player2?.active) return;
        const left2 = this.cursors.left.isDown;
        const right2 = this.cursors.right.isDown;
        const jump2 = this.cursors.up.isDown;
        if (left2) { this.player2.setVelocityX(-250); this.player2.setFlipX(true); }
        else if (right2) { this.player2.setVelocityX(250); this.player2.setFlipX(false); }
        else this.player2.setVelocityX(0);
        if (jump2 && this.player2.body.blocked.down) this.player2.setVelocityY(-400);
        if (!this.player2.body.blocked.down) this.player2.play('player-jump', true);
        else if (left2 || right2) this.player2.play('player-walk', true);
        else this.player2.play('player-idle', true);
        if (this.time.now > this.invulnerableUntil) this.player2.clearTint();
        if (this.fireSprite2.visible) this.fireSprite2.setPosition(this.player2.x + (this.player2.flipX ? -38 : 38), this.player2.y);

        for (const enemy of this.enemies.getChildren()) {
            if (!enemy.active) continue;
            const dx = this.player1.x - enemy.x;
            const distance = Math.abs(dx);
            const dir = Math.sign(dx) || 1;
            enemy.setFlipX(dir < 0);
            if (distance >= 5 * this.unit && distance <= 15 * this.unit) {
                enemy.setVelocityX(dir * 64); // 2 unidades Unity/s * 32 px/unidad
                enemy.play('enemy-walk', true);
            } else {
                enemy.setVelocityX(0);
                enemy.play('enemy-idle', true);
            }
            if (distance < 14 * this.unit && time >= enemy.getData('nextShot')) {
                // Aproximacion temporal a la probabilidad 1/32 por FixedUpdate original.
                this.enemyShoot(enemy, dir);
                enemy.setData('nextShot', time + Phaser.Math.Between(400, 1300));
            }
        }
        for (const bullet of [...this.player1Bullets.getChildren(), ...this.enemyBullets.getChildren()]) {
            if (bullet.active && (!bullet.body || bullet.x < 0 || bullet.x > this.worldWidth || bullet.y > this.worldHeight || Math.abs(bullet.x - this.player1.x) > 1300)) bullet.destroy();
        }
    }
}


