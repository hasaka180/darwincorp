/**
 * Shared world-space layout for the /links retro CRT scene.
 *
 * The link list is a real DOM element mounted *inside* the Three.js scene
 * (via CSS3DRenderer) at the position of the screen glass, so the mesh
 * builder and the DOM overlay read the same numbers and stay registered no
 * matter how the monitor tilts.
 */

export const DEVICE_ASPECT = 854 / 1585; // width / height, the frame's CSS aspect-ratio

// World units visible vertically at z = 0 (the screen plane).
export const VIEW_HEIGHT = 20;
export const CAMERA_FOV = 26;

// --- screen (the glass) ---------------------------------------------------
export const SCREEN_W = 8;
export const SCREEN_H = 10.9;
export const SCREEN_TOP = 6.75;
export const SCREEN_BOTTOM = SCREEN_TOP - SCREEN_H;
export const SCREEN_Y = (SCREEN_TOP + SCREEN_BOTTOM) / 2;

// --- casing ----------------------------------------------------------------
export const BEZEL = 0.55;
export const BEZEL_BOTTOM = 1.3; // the taller control band below the glass
export const CASING_W = SCREEN_W + BEZEL * 2;
export const CASING_TOP = SCREEN_TOP + BEZEL;
export const CASING_BOTTOM = SCREEN_BOTTOM - BEZEL_BOTTOM;
export const CASING_H = CASING_TOP - CASING_BOTTOM;
export const CASING_Y = (CASING_TOP + CASING_BOTTOM) / 2;
export const CASING_DEPTH = 3.4;

// --- system unit under the monitor ----------------------------------------
export const NECK_H = 0.3;
export const BASE_W = 8.4;
export const BASE_H = 1.8;
export const BASE_D = 3.8;
export const BASE_TOP = CASING_BOTTOM - NECK_H;
export const BASE_BOTTOM = BASE_TOP - BASE_H;
export const BASE_Y = (BASE_TOP + BASE_BOTTOM) / 2;

// --- desk / keyboard / mouse -------------------------------------------------
export const DESK_Y = BASE_BOTTOM;
export const KEYBOARD_W = 6.2;
export const KEYBOARD_D = 1.7;
export const KEYBOARD_H = 0.36;
export const KEYBOARD_Z = 2.0;
export const MOUSE_X = KEYBOARD_W / 2 + 0.9;
export const MOUSE_Z = 2.2;
