import { Scene, Input } from "phaser";

const KeyCodes = Input.Keyboard.KeyCodes;
const STORAGE_KEY = 'star-explorer-settings';

// ---------------------------------------------------------------
// 1) DATOS: valores por defecto. los ajustes se almacenan en local storage, dentro del navegador web.
// ---------------------------------------------------------------

const defaults = {
    music: 0.7,   // volumen de música (0 a 1)
    sfx: 1,       // volumen de efectos (0 a 1)
    controls: {
        p1: { left: KeyCodes.A, right: KeyCodes.D, jump: KeyCodes.W, shoot: KeyCodes.SPACE },
        p2: { left: KeyCodes.LEFT, right: KeyCodes.RIGHT, jump: KeyCodes.UP, shoot: KeyCodes.ENTER }
    }
};

// Copia profunda para no modificar "defaults" por accidente
const copy = (obj) => JSON.parse(JSON.stringify(obj));

function load() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return saved ? { ...copy(defaults), ...saved } : copy(defaults);
    } catch (e) {
        return copy(defaults);
    }
}

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
}

// Los ajustes actuales. Impórtalos desde tu escena de juego: import { options } from './Settings'
export let options = load();

function resetOptions() {
    options = copy(defaults);
    save();
}

// Asigna una tecla a una acción. Si otra acción ya la usaba, se intercambian.
function setKey(player, action, keyCode) {
    const old = options.controls[player][action];

    for (const p of ['p1', 'p2']) {
        for (const a of ['left', 'right', 'jump', 'shoot']) {
            if (options.controls[p][a] === keyCode) options.controls[p][a] = old;
        }
    }

    options.controls[player][action] = keyCode;
    save();
}

// ---------------------------------------------------------------
// 2) FUNCIONES PARA USAR EN TU JUEGO
// ---------------------------------------------------------------

// En Game.create():  this.keys1 = createKeys(this, 'p1');
// En Game.update():  if (this.keys1.left.isDown) { ... }
export function createKeys(scene, player) {
    const c = options.controls[player];
    return {
        left: scene.input.keyboard.addKey(c.left),
        right: scene.input.keyboard.addKey(c.right),
        jump: scene.input.keyboard.addKey(c.jump),
        shoot: scene.input.keyboard.addKey(c.shoot)
    };
}

// Música: usa esta función en vez de scene.sound.play() para que el slider la controle
export function playMusic(scene, key) {
    const current = scene.sound.get(key);
    if (current && current.isPlaying) return current;   // ya está sonando

    const music = scene.sound.add(key, { loop: true, volume: options.music });
    music.isMusic = true;   // marca para que el slider sepa que es música
    music.play();
    return music;
}

// Efectos: usa esta función en vez de scene.sound.play()
export function playSfx(scene, key) {
    scene.sound.play(key, { volume: options.sfx });
}

// ---------------------------------------------------------------
// 3) ESCENA DE CONFIGURACIÓN
// ---------------------------------------------------------------

const ROWS = [
    { action: 'left', label: 'Move left' },
    { action: 'right', label: 'Move right' },
    { action: 'jump', label: 'Jump' },
    { action: 'shoot', label: 'Shoot' }
];

// Convierte un keyCode (65) en su nombre ("A")
const keyName = (code) => Object.keys(KeyCodes).find((name) => KeyCodes[name] === code) || '?';

export class Settings extends Scene {

    constructor() {
        super('Settings');
    }

    create() {
        const H = this.scale.height;
        this.waiting = null;                // tecla que estamos esperando (o null)
        this.keyTexts = { p1: {}, p2: {} }; // los textos de cada tecla

        this.add.text(512, 70, 'Settings', {
            fontSize: '64px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // --- Volumen ---
        this.musicSlider = this.makeSlider('Music', 190, options.music,
            (v) => {
                options.music = v;
                // Cambia el volumen de la música que ya esté sonando
                this.sound.sounds.forEach((s) => { if (s.isMusic) s.setVolume(v); });
            });

        this.sfxSlider = this.makeSlider('Effects', 280, options.sfx,
            (v) => { options.sfx = v; });

        // --- Controles ---
        this.add.text(512, 345, 'Controls', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(560, 395, 'Player 1', { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5);
        this.add.text(800, 395, 'Player 2', { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5);

        ROWS.forEach((row, i) => {
            const y = 450 + i * 50;

            this.add.text(180, y, row.label, { fontSize: '28px', color: '#ffffff' }).setOrigin(0, 0.5);

            // Un botón de texto por jugador. Al hacer clic, esperamos una tecla nueva.
            this.keyTexts.p1[row.action] = this.makeButton(560, y, '', 28, () => this.startRebind('p1', row.action));
            this.keyTexts.p2[row.action] = this.makeButton(800, y, '', 28, () => this.startRebind('p2', row.action));
        });

        this.refreshKeys();

        this.add.text(512, 650, 'Click a key, then press the new one (Esc to cancel)', {
            fontSize: '20px',
            color: '#999999'
        }).setOrigin(0.5);


        this.makeButton(380, H - 55, 'Reset', 32, () => {
            resetOptions();
            this.musicSlider.setValue(options.music);
            this.sfxSlider.setValue(options.sfx);
            this.sound.sounds.forEach((s) => { if (s.isMusic) s.setVolume(options.music); });
            this.cancelRebind();
        });

        this.makeButton(644, H - 55, 'Back', 32, () => this.scene.start('MainMenu'));

        // Escuchamos el teclado para reasignar teclas
        this.input.keyboard.on('keydown', (event) => this.onKeyDown(event));
    }

    // ----- Reasignar teclas -----

    startRebind(player, action) {
        this.cancelRebind();
        this.waiting = { player, action };
        this.keyTexts[player][action].setText('Press a key...').setColor('#00ffff');
    }

    cancelRebind() {
        this.waiting = null;
        this.refreshKeys();
    }

    onKeyDown(event) {
        // Si no estamos esperando una tecla, Esc vuelve al menú
        if (!this.waiting) {
            if (event.keyCode === KeyCodes.ESC) this.scene.start('MainMenu');
            return;
        }

        event.preventDefault();   // evita que Espacio o las flechas hagan scroll en la página

        if (event.keyCode !== KeyCodes.ESC) {
            setKey(this.waiting.player, this.waiting.action, event.keyCode);
        }

        this.cancelRebind();
    }

    // Pone en cada texto el nombre de su tecla actual
    refreshKeys() {
        for (const p of ['p1', 'p2']) {
            for (const row of ROWS) {
                this.keyTexts[p][row.action]
                    .setText(keyName(options.controls[p][row.action]))
                    .setColor('#00ff00');
            }
        }
    }

    // ----- Elementos de la interfaz -----

    // Botón de texto verde que se pone amarillo al pasar el ratón (igual que en MainMenu)
    makeButton(x, y, label, size, onClick) {
        const btn = this.add.text(x, y, label, {
            fontSize: size + 'px',
            color: '#00ff00'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => btn.setColor('#ffff00'))
            .on('pointerout', () => btn.setColor('#00ff00'))
            .on('pointerdown', onClick);

        return btn;
    }

    // Slider horizontal de 0 a 1. onChange(valor) se llama mientras lo arrastras.
    makeSlider(label, y, value, onChange) {
        const x = 312;      // inicio de la barra
        const width = 400;  // largo de la barra

        this.add.text(x, y - 35, label, { fontSize: '28px', color: '#ffffff' }).setOrigin(0, 0.5);
        const percent = this.add.text(x + width, y - 35, '', { fontSize: '28px', color: '#ffffff' }).setOrigin(1, 0.5);

        const track = this.add.rectangle(x, y, width, 20, 0x444444).setOrigin(0, 0.5)
            .setInteractive({ useHandCursor: true });
        const bar = this.add.rectangle(x, y, width, 20, 0x00ff00).setOrigin(0, 0.5);
        const knob = this.add.circle(x, y, 16, 0xffffff);

        // Mueve la barra y el círculo al valor dado (0 a 1)
        const setValue = (v) => {
            v = Math.min(Math.max(v, 0), 1);
            bar.setScale(Math.max(v, 0.001), 1);
            knob.x = x + width * v;
            percent.setText(Math.round(v * 100) + '%');
            return v;
        };

        const update = (pointer) => onChange(setValue((pointer.x - x) / width));

        let dragging = false;

        track.on('pointerdown', (pointer) => {
            dragging = true;
            update(pointer);
        });

        this.input.on('pointermove', (pointer) => {
            if (dragging) update(pointer);
        });

        this.input.on('pointerup', () => {
            if (!dragging) return;
            dragging = false;
            save();   // guardamos al soltar
        });

        setValue(value);

        return { setValue };
    }
}