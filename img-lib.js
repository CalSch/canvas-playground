class Color {
	r; g; b;
	constructor(v1, v2, v3) {
		this.r = this.g = this.b = 0;

		if (
			typeof v1 === 'number' && 
			typeof v2 === 'number' && 
			typeof v3 === 'number'
		) {
			this.r = v1;
			this.g = v2;
			this.b = v3;
		} else if (v1 &&
			typeof v1[0] === 'number' && typeof v1[1] === 'number' && typeof v1[2] === 'number'
		) {
			this.r = v1[0];
			this.g = v1[1];
			this.b = v1[2];
		} else if (v1 instanceof Color) {
			this.r = v1.r;
			this.g = v1.g;
			this.b = v1.b;
		}
	}
}

function hsl(h, s, l) {
	let r, g, b;

	if (s == 0) {
		r = g = b = l; // achromatic
	} else {
		let hue2rgb = function hue2rgb(p, q, t) {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		}

		let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		let p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}
	let [r2, g2, b2] = [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	return new Color(r2, g2, b2);
}

function lum(v) {
	return new Color(v, v, v)
}

const WHITE=  new Color( 255, 255, 255 )
const BLACK=  new Color( 0  , 0  , 0   )
const RED=    new Color( 255, 0  , 0   )
const GREEN=  new Color( 0  , 255, 0   )
const BLUE=   new Color( 0  , 0  , 255 )
const YELLOW= new Color( 255, 255, 0   )
const CYAN=   new Color( 0  , 255, 255 )
const MAGENTA=new Color( 255, 0  , 255 )

function lerp(a,b,t) {
	return a*(1-t)+b*t
}
function lerpColor(a,b,t) {
	return new Color(
		lerp(a.r,b.r,t),
		lerp(a.g,b.g,t),
		lerp(a.b,b.b,t),
	)
}