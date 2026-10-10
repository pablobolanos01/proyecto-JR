
import { Scene } from 'phaser';

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    create() {
        this.cameras.main.setBackgroundColor('#101827');

        // Datos exportados del nivel original de Unity
        const nivel = this.cache.json.get('nivel1');
        const mapping = this.cache.json.get('tile-mapping');

        if (!nivel || !mapping) {
            console.error('Error: no se han cargado los datos del nivel.');
            return;
        }

        const tileSize = 32;
        const worldWidth = nivel.width * tileSize;
        const worldHeight = nivel.height * tileSize;

        const frames = new Map(
            mapping.map(tile => [tile.unityIndex, tile.frame])
        );

        // Reconstrucción gráfica y física del escenario
        this.tiles = this.add.container(0, 0);
        this.platforms = this.physics.add.staticGroup();

        let colocados = 0;
        let collidersCreados = 0;

        for (const tile of nivel.tiles) {
            const frame = frames.get(tile.tileIndex);

            if (frame === undefined) {
                console.warn('Tile sin correspondencia:', tile.tileIndex);
                continue;
            }

            const x = (tile.x - nivel.originX) * tileSize;
            const y = (
                nivel.originY + nivel.height - 1 - tile.y
            ) * tileSize;

            const imagen = this.add.image(
                x, y, 'space-base', frame
            ).setOrigin(0, 0);

            this.tiles.add(imagen);
            colocados++;

            const bloque = this.add.zone(
                x + tileSize / 2,
                y + tileSize / 2,
                tileSize,
                tileSize
            );

            this.physics.add.existing(bloque, true);
            this.platforms.add(bloque);
            collidersCreados++;
        }

        console.log('Tiles reconstruidos:', colocados);
        console.log('Colliders creados:', collidersCreados);

        // Límites del mundo
        this.physics.world.setBounds(
            0, 0, worldWidth, worldHeight
        );

        this.cameras.main.setBounds(
            0, 0, worldWidth, worldHeight
        );

        // Suelo provisional
        this.ground = this.add.rectangle(
            worldWidth / 2,
            worldHeight - 16,
            worldWidth,
            32,
            0x526477,
            0.35
        );

        this.physics.add.existing(this.ground, true);

        // Jugador
        this.player = this.physics.add.sprite(
            200, 500, 'player', 16
        );

        this.player.setScale(2);
        this.player.setCollideWorldBounds(true);
        
        // Efecto visual del disparo, independiente del jugador
        this.fireSprite = this.add.image(
            this.player.x,
            this.player.y,
            'player-fire'
        );

this.fireSprite.setScale(2);
this.fireSprite.setVisible(false);
this.fireSprite.setDepth(this.player.depth + 1);


        // Animaciones del jugador
        this.anims.create({
            key: 'player-idle',
            frames: [
                { key: 'player', frame: 16 },
                { key: 'player', frame: 17 }
            ],
            frameRate: 4,
            repeat: -1
        });

        this.anims.create({
            key: 'player-walk',
            frames: this.anims.generateFrameNumbers('player', {
                frames: [48, 49, 50, 51]
            }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'player-jump',
            frames: [
                { key: 'player', frame: 96 }
            ],
            frameRate: 1,
            repeat: -1
        });

        this.player.play('player-idle');

        // Colisiones del jugador
        this.physics.add.collider(
            this.player,
            this.ground
        );

        this.physics.add.collider(
            this.player,
            this.platforms
        );

        // Sistema de proyectiles del jugador
        this.bullets = this.physics.add.group({
            allowGravity: true
        });

        // Los proyectiles se destruyen al impactar
        this.physics.add.overlap(
            this.bullets,
            this.platforms,
            (bullet) => {
                bullet.destroy();
            }
        );

        this.physics.add.overlap(
            this.bullets,
            this.ground,
            (bullet) => {
                bullet.destroy();
            }
        );

        // Disparo mediante clic izquierdo
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.shoot();
            }
        });

        // Cámara
        this.cameras.main.startFollow(this.player);

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('A,D,W,SPACE');

        // HUD
        this.add.text(
            20,
            20,
            'PROYECTO JR - UNITY TO PHASER',
            {
                fontSize: '22px',
                color: '#ffffff'
            }
        ).setScrollFactor(0).setDepth(100);

        console.log(
            'Dimensiones del nivel:',
            worldWidth,
            'x',
            worldHeight
        );
    }

    shoot() {
        if (!this.player || !this.player.active) return;

        const direction = this.player.flipX ? -1 : 1;

        // En Unity el arma estaba desplazada 0.6 unidades.
        // Utilizamos un desplazamiento visual equivalente aproximado.
        const spawnX = this.player.x + direction * 38;
        const spawnY = this.player.y;

        const bullet = this.bullets.create(
            spawnX,
            spawnY,
            'player-bullet'
        );

        bullet.setScale(2);
        bullet.setVelocityX(direction * 700);
        bullet.setVelocityY(0);

        // Collider aproximado, pendiente de ajuste con Unity
        bullet.body.setSize(17, 6);
        bullet.body.setAllowGravity(true);

        // Mantener la orientación de la bala
        bullet.setFlipX(direction < 0);

        // Referencia para controlar su alcance
        bullet.spawnX = spawnX;
    }

    update() {
        if (!this.player) return;

        const speed = 250;
        const jump = -400;

        const left =
            this.cursors.left.isDown ||
            this.keys.A.isDown;

        const right =
            this.cursors.right.isDown ||
            this.keys.D.isDown;

        const jumping =
            this.cursors.up.isDown ||
            this.keys.W.isDown ||
            this.keys.SPACE.isDown;

        // Movimiento horizontal
        if (left) {
            this.player.setVelocityX(-speed);
            this.player.setFlipX(true);
        } else if (right) {
            this.player.setVelocityX(speed);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        // Salto
        if (jumping && this.player.body.blocked.down) {
            this.player.setVelocityY(jump);
        }

        // Animaciones
        if (!this.player.body.blocked.down) {
            this.player.play('player-jump', true);
        } else if (left || right) {
            this.player.play('player-walk', true);
        } else {
            this.player.play('player-idle', true);
        }

        // Destruir proyectiles al superar su alcance
        for (const bullet of this.bullets.getChildren()) {
            if (
                bullet.active &&
                Math.abs(bullet.x - this.player.x) > 480
            ) {
                bullet.destroy();
            }
        }
    }
}
