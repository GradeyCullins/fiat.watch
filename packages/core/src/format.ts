/**
 * Money formatting.
 *
 * The Rails app this replaces had THREE formatters that disagreed with each
 * other on its own data:
 *
 *   - `sprintf("%.2f", float)`            → rounds the binary double
 *   - `BigDecimal(v.to_s).round(2)`       → rounds the decimal digits, half-up
 *   - Rails `number_to_currency`          → same as BigDecimal
 *
 * Eight real prices in the dataset rendered differently depending on which
 * code path you hit — `/costs/gas/1980` showed `$1.25` while its own
 * "See calculation" link showed `$1.24`. Every price in the BLS average-price
 * series carries three decimals, so the .xx5 tie case is the NORM here, not
 * an edge case.
 *
 * We standardise on half-up: it is what two of the three did, what users
 * expect of money, and what the user-facing price pages already showed.
 *
 * Note this rules out `toFixed(2)`, which rounds the binary value and would
 * faithfully reproduce the *buggy* formatter:
 *
 *   (1.245).toFixed(2)  === "1.24"   ← wrong (binary 1.245 is just under)
 *   formatUsd(1.245)    === "$1.25"  ← right
 *
 * The trick is that `Number.prototype.toString` yields the shortest string
 * that round-trips — "1.245" — which is exactly what Ruby's `Float#to_s`
 * hands to `BigDecimal`. Rounding that decimal string reproduces Ruby
 * precisely, without pulling in a decimal library.
 */

/** Round a number to `dp` decimal places, half-up, on its decimal representation. */
export function roundHalfUp(value: number, dp = 2): string {
  if (!Number.isFinite(value)) throw new RangeError(`Cannot format ${value}`);

  const negative = value < 0 || Object.is(value, -0);
  const s = expandExponential(Math.abs(value));

  const dot = s.indexOf(".");
  let intPart = dot === -1 ? s : s.slice(0, dot);
  const fracPart = dot === -1 ? "" : s.slice(dot + 1);

  let keptFrac: string;

  if (fracPart.length <= dp) {
    keptFrac = fracPart.padEnd(dp, "0");
  } else {
    const kept = fracPart.slice(0, dp);
    const roundUp = fracPart.charCodeAt(dp) >= 53; // '5'
    if (!roundUp) {
      keptFrac = kept;
    } else {
      // Increment the kept digits as an integer, carrying into intPart.
      const bumped = (BigInt(kept === "" ? "0" : kept) + 1n).toString();
      if (dp === 0) {
        intPart = (BigInt(intPart) + 1n).toString();
        keptFrac = "";
      } else if (bumped.length > dp) {
        // e.g. "99" + 1 = "100" → carry one into the integer part
        intPart = (BigInt(intPart) + 1n).toString();
        keptFrac = "".padEnd(dp, "0");
      } else {
        keptFrac = bumped.padStart(dp, "0");
      }
    }
  }

  const body = keptFrac === "" ? intPart : `${intPart}.${keptFrac}`;
  return negative && Number(body) !== 0 ? `-${body}` : body;
}

/** `$1,234.56`. The single money formatter for the whole app. */
export function formatUsd(value: number): string {
  const rounded = roundHalfUp(value, 2);
  const negative = rounded.startsWith("-");
  const [intPart, fracPart] = (negative ? rounded.slice(1) : rounded).split(".");
  const grouped = intPart!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}$${grouped}.${fracPart}`;
}

/**
 * `toString()` switches to exponential notation at >=1e21 and <1e-6. Our
 * domain never reaches those, but a formatter that silently emits "1e+21"
 * is a bug waiting to happen, so normalise defensively.
 */
function expandExponential(n: number): string {
  const s = String(n);
  if (!/e/i.test(s)) return s;

  const [mantissa, expRaw] = s.split(/e/i);
  const exp = Number(expRaw);
  const negative = mantissa!.startsWith("-");
  const digits = negative ? mantissa!.slice(1) : mantissa!;
  const [whole, frac = ""] = digits.split(".");
  const all = whole! + frac;
  const pointPos = whole!.length + exp;

  let out: string;
  if (pointPos <= 0) out = `0.${"0".repeat(-pointPos)}${all}`;
  else if (pointPos >= all.length) out = all + "0".repeat(pointPos - all.length);
  else out = `${all.slice(0, pointPos)}.${all.slice(pointPos)}`;

  return negative ? `-${out}` : out;
}
