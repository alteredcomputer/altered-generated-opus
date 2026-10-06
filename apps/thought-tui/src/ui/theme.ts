/**
 * The D172 visual system in truecolor: a monochrome ramp stepped by lightness, one ground for every
 * panel, hairlines at the cursor gray. Text at 100, 75, 50, and 25 percent; surfaces at 1/16, 3/32,
 * and 1/8. Colour is reserved for marketing surfaces, so there is none here.
 */
export const gray = {
    6: "#101010",
    9: "#181818",
    12: "#202020",
    25: "#404040",
    50: "#808080",
    75: "#bfbfbf",
    100: "#ffffff"
} as const

export const color = {
    bg: gray[6],
    bgHover: gray[9],
    bgCursor: gray[12],
    bgChip: gray[12],
    fg: gray[100],
    fgMuted: gray[50],
    fgFaint: gray[25],
    accent: gray[75],
    rule: gray[12]
} as const

/** Horizontal padding of rows and panels, in cells (the web's 3ch). */
export const inset = 3
