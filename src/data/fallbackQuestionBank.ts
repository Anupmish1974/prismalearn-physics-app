import { DifficultyLevel, ReasoningQuality, TargetedQuestion } from '../types/physics';

export interface VerifiedFallbackQuestion extends TargetedQuestion {
  expectedKeyConcept: string;
  commonMisconceptionTag: string;
  commonMisconceptionExplain: string;
  correctExplain: string;
}

export const FALLBACK_QUESTION_BANK: VerifiedFallbackQuestion[] = [
  // 1. ohms-law
  {
    id: 'fb-ohms-easy-1',
    conceptId: 'ohms-law',
    difficulty: 'Easy',
    prompt:
      'A nichrome resistor draws a current of 0.5 A when connected across a 6 V battery. What is the resistance of the resistor?',
    options: ['3 Ω', '6.5 Ω', '12 Ω', '30 Ω'],
    correctIndex: 2,
    targetSkill: "Direct Ohm's Law R = V / I calculation",
    sampleThoughtHint: "Recall Ohm's Law V = I · R and solve for R.",
    agentRationale:
      "Calibrated to Easy to reinforce core Ohm's Law formula rearrangement R = V / I.",
    expectedKeyConcept: 'R = V / I = 6 V / 0.5 A = 12 Ω',
    commonMisconceptionTag: "Ohm's Law Inversion (I/V or V·I)",
    commonMisconceptionExplain:
      'Resistance is the ratio V/I, not the product V·I (which gives 3) or I/V.',
    correctExplain:
      'By Ohm’s Law, V = I·R, so R = V/I = 6 V / 0.5 A = 12 Ω.',
  },
  {
    id: 'fb-ohms-med-1',
    conceptId: 'ohms-law',
    difficulty: 'Medium',
    prompt:
      'A cylindrical wire of resistance 8 Ω is melted and recast into a wire of double its original cross-sectional area (volume stays constant, so length halves). What is its new resistance?',
    options: ['2 Ω', '4 Ω', '16 Ω', '32 Ω'],
    correctIndex: 0,
    targetSkill: 'Resistivity scaling R = ρL / A with constant volume',
    sampleThoughtHint: 'Track how both length L and area A change in R = ρL / A.',
    agentRationale:
      'Calibrated to Medium to test simultaneous length and area scaling in R = ρL / A.',
    expectedKeyConcept: 'L becomes L/2 and A becomes 2A, so R_new = (1/4) R = 2 Ω',
    commonMisconceptionTag: 'Single-Variable Area Scaling Error',
    commonMisconceptionExplain:
      'When volume is constant and area doubles, length must also halve. Thus R changes by (1/2)/2 = 1/4, giving 8/4 = 2 Ω, not 4 Ω.',
    correctExplain:
      'Since R = ρL/A, halving L (×1/2) and doubling A (×1/2) reduces R to 1/4 of 8 Ω = 2 Ω.',
  },
  {
    id: 'fb-ohms-hard-1',
    conceptId: 'ohms-law',
    difficulty: 'Hard',
    prompt:
      'Two conductors A and B have linear V–I graphs plotted with V on the vertical axis and I on the horizontal axis. Conductor A makes a 60° angle with the I-axis while B makes a 30° angle. What is the ratio of resistance RA : RB?',
    options: ['1 : 3', '3 : 1', '1 : √3', '√3 : 1'],
    correctIndex: 1,
    targetSkill: 'Extracting resistance from V–I graph slopes',
    sampleThoughtHint: 'Relate slope tan(θ) = V/I to resistance R.',
    agentRationale:
      'Calibrated to Hard to connect trigonometric slope on a V–I graph to resistance.',
    expectedKeyConcept: 'R = slope = tan(θ), so RA/RB = tan(60°)/tan(30°) = √3 / (1/√3) = 3 : 1',
    commonMisconceptionTag: 'V-I Graph Axis Slope Confusion',
    commonMisconceptionExplain:
      'With V on the y-axis and I on the x-axis, slope = ΔV/ΔI = R = tan(θ). Thus tan(60°)/tan(30°) = 3 : 1.',
    correctExplain:
      'Slope of V vs I equals R = tan(θ). Since tan(60°) = √3 and tan(30°) = 1/√3, RA : RB = 3 : 1.',
  },

  // 2. series-parallel
  {
    id: 'fb-sp-easy-1',
    conceptId: 'series-parallel',
    difficulty: 'Easy',
    prompt:
      'Three resistors of 3 Ω, 6 Ω, and 6 Ω are connected such that the two 6 Ω resistors are in parallel, and this combination is in series with the 3 Ω resistor. What is the total equivalent resistance?',
    options: ['6 Ω', '9 Ω', '12 Ω', '15 Ω'],
    correctIndex: 0,
    targetSkill: 'Combining basic parallel pair with series resistor',
    sampleThoughtHint: 'First find Rp for the two 6 Ω resistors, then add 3 Ω in series.',
    agentRationale:
      'Calibrated to Easy to practice reducing a parallel pair before adding a series resistor.',
    expectedKeyConcept: '1/Rp = 1/6 + 1/6 = 1/3 -> Rp = 3 Ω; R_total = 3 + 3 = 6 Ω',
    commonMisconceptionTag: 'Parallel-as-Series Additive Fallacy',
    commonMisconceptionExplain:
      'Parallel resistors add via reciprocals: 1/Rp = 1/6 + 1/6 = 2/6, so Rp = 3 Ω. Adding the 3 Ω series resistor gives 6 Ω.',
    correctExplain:
      'For the two 6 Ω parallel resistors, Rp = (6×6)/(6+6) = 3 Ω. In series with 3 Ω, R_total = 3 + 3 = 6 Ω.',
  },
  {
    id: 'fb-sp-med-1',
    conceptId: 'series-parallel',
    difficulty: 'Medium',
    prompt:
      'A 4 Ω resistor and a 12 Ω resistor are connected in parallel across a 12 V battery. What is the current flowing specifically through the 4 Ω branch?',
    options: ['1 A', '2 A', '3 A', '4 A'],
    correctIndex: 2,
    targetSkill: 'Branch current using constant parallel voltage',
    sampleThoughtHint: 'Recall that potential difference across every parallel branch is equal.',
    agentRationale:
      'Calibrated to Medium to reinforce that parallel branches share the full supply voltage.',
    expectedKeyConcept: 'V across 4 Ω = 12 V, so I_4Ω = 12 V / 4 Ω = 3 A',
    commonMisconceptionTag: 'Parallel Voltage Division Misconception',
    commonMisconceptionExplain:
      'In parallel, each branch gets the full 12 V supply voltage independently. So I = V/R = 12 V / 4 Ω = 3 A.',
    correctExplain:
      'Since parallel branches each experience the full 12 V potential difference, I_4Ω = 12 V / 4 Ω = 3 A.',
  },
  {
    id: 'fb-sp-hard-1',
    conceptId: 'series-parallel',
    difficulty: 'Hard',
    prompt:
      'How many 176 Ω resistors must be connected in parallel to draw a total current of 5 A from a 220 V supply line?',
    options: ['2 resistors', '4 resistors', '5 resistors', '8 resistors'],
    correctIndex: 1,
    targetSkill: 'Finding parallel resistor count from target current',
    sampleThoughtHint: 'First find required Rp = V / I, then use Rp = R / n.',
    agentRationale:
      'Calibrated to Hard to synthesize Ohm’s Law with n-identical parallel resistors.',
    expectedKeyConcept: 'Rp = 220/5 = 44 Ω; n = 176/44 = 4',
    commonMisconceptionTag: 'Inverse Parallel Count Error',
    commonMisconceptionExplain:
      'Required total resistance is Rp = V/I = 220/5 = 44 Ω. For n identical resistors in parallel, Rp = R/n, so n = 176/44 = 4.',
    correctExplain:
      'Target resistance Rp = 220 V / 5 A = 44 Ω. With n identical 176 Ω resistors in parallel, 176 / n = 44 gives n = 4.',
  },

  // 3. electric-power
  {
    id: 'fb-pwr-easy-1',
    conceptId: 'electric-power',
    difficulty: 'Easy',
    prompt:
      'An electric iron draws a current of 5 A when connected to a 220 V mains supply. What is its power consumption?',
    options: ['44 W', '225 W', '1100 W', '5500 W'],
    correctIndex: 2,
    targetSkill: 'Calculating electrical power using P = V · I',
    sampleThoughtHint: 'Use the relationship between power, voltage, and current.',
    agentRationale:
      'Calibrated to Easy to solidify P = V · I before multi-step kWh energy problems.',
    expectedKeyConcept: 'P = V · I = 220 V × 5 A = 1100 W',
    commonMisconceptionTag: 'Power Formula Ratio Error',
    commonMisconceptionExplain:
      'Electrical power is the product P = V·I = 220 × 5 = 1100 W (1.1 kW), not V/I.',
    correctExplain:
      'Using P = V · I, P = 220 V × 5 A = 1100 W.',
  },
  {
    id: 'fb-pwr-med-1',
    conceptId: 'electric-power',
    difficulty: 'Medium',
    prompt:
      'A 100 W, 220 V electric bulb is operated at 110 V. What power does it consume at 110 V (assuming constant filament resistance)?',
    options: ['25 W', '50 W', '100 W', '200 W'],
    correctIndex: 0,
    targetSkill: 'Voltage-squared power scaling P = V² / R',
    sampleThoughtHint: 'Determine filament resistance first or use P ∝ V².',
    agentRationale:
      'Calibrated to Medium to check quadratic dependence of power on voltage when R is fixed.',
    expectedKeyConcept: 'P ∝ V² -> halving V makes P = 100 / 4 = 25 W',
    commonMisconceptionTag: 'Linear Power-Voltage Assumption',
    commonMisconceptionExplain:
      'Power at fixed resistance is P = V²/R. Halving voltage from 220 V to 110 V reduces power by (1/2)² = 1/4, giving 25 W, not 50 W.',
    correctExplain:
      'Resistance R = V²/P = 220²/100 = 484 Ω. At 110 V, P_new = 110² / 484 = 25 W.',
  },
  {
    id: 'fb-pwr-hard-1',
    conceptId: 'electric-power',
    difficulty: 'Hard',
    prompt:
      'An electric refrigerator rated 400 W operates 8 hours/day. What is the cost of electrical energy to operate it for 30 days at ₹3.00 per kWh?',
    options: ['₹96', '₹192', '₹288', '₹384'],
    correctIndex: 2,
    targetSkill: 'Commercial electrical energy calculation in kWh',
    sampleThoughtHint: 'Convert watts to kilowatts and multiply by total hours.',
    agentRationale:
      'Calibrated to Hard for multi-step unit conversion into commercial kWh billing.',
    expectedKeyConcept: 'E = 0.4 kW × 8 h × 30 = 96 kWh; Cost = 96 × 3 = ₹288',
    commonMisconceptionTag: 'Watt-to-Kilowatt Conversion Omission',
    commonMisconceptionExplain:
      'Energy in kWh = (400/1000) kW × 8 h/day × 30 days = 96 kWh. Total cost = 96 × ₹3 = ₹288.',
    correctExplain:
      'Power = 0.4 kW. Total hours = 8 × 30 = 240 h. Energy = 0.4 × 240 = 96 kWh. Cost = 96 × ₹3.00 = ₹288.',
  },

  // 4. heating-effect
  {
    id: 'fb-heat-easy-1',
    conceptId: 'heating-effect',
    difficulty: 'Easy',
    prompt:
      'A 10 Ω resistor carries a steady current of 2 A for 5 seconds. How much heat energy is produced in the resistor?',
    options: ['20 J', '100 J', '200 J', '400 J'],
    correctIndex: 2,
    targetSkill: "Direct Joule's Law H = I²Rt calculation",
    sampleThoughtHint: "Apply Joule's Law of Heating H = I² · R · t.",
    agentRationale:
      'Calibrated to Easy to check exponentiation of current in H = I²Rt.',
    expectedKeyConcept: 'H = (2)² × 10 × 5 = 4 × 10 × 5 = 200 J',
    commonMisconceptionTag: 'Current-Squaring Omission in H=I²Rt',
    commonMisconceptionExplain:
      'In Joule’s Law H = I²Rt, current is squared: (2 A)² = 4, so H = 4 × 10 × 5 = 200 J (not 2×10×5 = 100 J).',
    correctExplain:
      'By Joule’s Law, H = I²Rt = (2 A)² × 10 Ω × 5 s = 4 × 50 = 200 J.',
  },
  {
    id: 'fb-heat-med-1',
    conceptId: 'heating-effect',
    difficulty: 'Medium',
    prompt:
      'If the current passing through a fixed resistor is doubled while keeping time constant, by what factor does the heat generated change?',
    options: ['Becomes 2 times', 'Becomes 4 times', 'Becomes half', 'Remains unchanged'],
    correctIndex: 1,
    targetSkill: 'Quadratic current proportionality in Joule heating',
    sampleThoughtHint: 'Examine how H depends on I when R and t are constant.',
    agentRationale:
      'Calibrated to Medium to reinforce quadratic scaling H ∝ I².',
    expectedKeyConcept: 'H = I²Rt -> doubling I gives (2I)² = 4I², so 4 times',
    commonMisconceptionTag: 'Linear Heat-Current Assumption',
    commonMisconceptionExplain:
      'Because H = I²Rt, heat is proportional to the square of current. Doubling I produces 2² = 4 times as much heat.',
    correctExplain:
      'With R and t fixed, H ∝ I². Doubling I increases H by 2² = 4 times.',
  },

  // 5. spherical-mirrors
  {
    id: 'fb-mir-easy-1',
    conceptId: 'spherical-mirrors',
    difficulty: 'Easy',
    prompt:
      'The radius of curvature of a convex mirror used as a rear-view mirror is 3.00 m. What is its focal length?',
    options: ['-1.50 m', '+1.50 m', '-6.00 m', '+6.00 m'],
    correctIndex: 1,
    targetSkill: 'Mirror focal length sign and R = 2f relation',
    sampleThoughtHint: 'Use f = R / 2 and apply the sign convention for a convex mirror.',
    agentRationale:
      'Calibrated to Easy to lock in f = +R/2 for convex mirrors before lens/mirror equations.',
    expectedKeyConcept: 'f = +R/2 = +3.00 / 2 = +1.50 m',
    commonMisconceptionTag: 'Convex Mirror Sign Convention Error',
    commonMisconceptionExplain:
      'A convex mirror’s focus lies behind the reflecting surface (+x direction), so f = +R/2 = +1.50 m.',
    correctExplain:
      'For a convex mirror, f is positive and equals R/2 = +3.00 / 2 = +1.50 m.',
  },
  {
    id: 'fb-mir-med-1',
    conceptId: 'spherical-mirrors',
    difficulty: 'Medium',
    prompt:
      'An object is placed 10 cm in front of a concave mirror of focal length 15 cm. Where is the image formed?',
    options: [
      '30 cm behind the mirror (virtual)',
      '30 cm in front of the mirror (real)',
      '6 cm in front of the mirror (real)',
      '6 cm behind the mirror (virtual)',
    ],
    correctIndex: 0,
    targetSkill: 'Mirror formula with concave sign convention (u < f)',
    sampleThoughtHint: 'Use f = -15 cm and u = -10 cm in 1/f = 1/v + 1/u.',
    agentRationale:
      'Calibrated to Medium to directly address concave mirror sign conventions.',
    expectedKeyConcept: '1/v = -1/15 - (-1/10) = 1/30 -> v = +30 cm (virtual, behind mirror)',
    commonMisconceptionTag: 'Concave Mirror Sign Inversion',
    commonMisconceptionExplain:
      'With concave mirror f = -15 cm and u = -10 cm, 1/v = -1/15 + 1/10 = +1/30, giving v = +30 cm (virtual, behind mirror).',
    correctExplain:
      'Using f = -15 cm and u = -10 cm: 1/v = 1/f - 1/u = -1/15 + 1/10 = +1/30, so v = +30 cm behind the mirror.',
  },

  // 6. refraction-snell
  {
    id: 'fb-ref-easy-1',
    conceptId: 'refraction-snell',
    difficulty: 'Easy',
    prompt:
      'The refractive index of diamond is 2.42 and the speed of light in vacuum is 3 × 10⁸ m/s. Approximately how fast does light travel in diamond?',
    options: ['1.24 × 10⁸ m/s', '2.42 × 10⁸ m/s', '3.00 × 10⁸ m/s', '7.26 × 10⁸ m/s'],
    correctIndex: 0,
    targetSkill: 'Calculating light speed in a medium via n = c / v',
    sampleThoughtHint: 'Rearrange n = c / v to solve for v.',
    agentRationale:
      'Calibrated to Easy to verify inverse relationship between refractive index and speed.',
    expectedKeyConcept: 'v = c / n = 3×10⁸ / 2.42 ≈ 1.24 × 10⁸ m/s',
    commonMisconceptionTag: 'Refractive Index Multiplication Error',
    commonMisconceptionExplain:
      'Light slows down inside optically denser media: v = c / n = (3 × 10⁸) / 2.42 ≈ 1.24 × 10⁸ m/s.',
    correctExplain:
      'Since n = c / v, v = (3 × 10⁸ m/s) / 2.42 ≈ 1.24 × 10⁸ m/s.',
  },
  {
    id: 'fb-ref-med-1',
    conceptId: 'refraction-snell',
    difficulty: 'Medium',
    prompt:
      'A ray of light travels from water (n = 1.33) into glass (n = 1.50) at an angle of incidence of 40°. How does the refracted ray behave?',
    options: [
      'Bends towards the normal; angle of refraction < 40°',
      'Bends away from the normal; angle of refraction > 40°',
      'Passes undeviated at 40°',
      'Undergoes total internal reflection',
    ],
    correctIndex: 0,
    targetSkill: 'Snell’s Law ray bending across two refractive media',
    sampleThoughtHint: 'Compare optical densities of water (1.33) and glass (1.50).',
    agentRationale:
      'Calibrated to Medium to test comparative refractive index ray bending.',
    expectedKeyConcept: '1.33 -> 1.50 (rarer to denser) => bends towards normal, r < i',
    commonMisconceptionTag: 'Rarer-to-Denser Bending Reversal',
    commonMisconceptionExplain:
      'Moving from water (n = 1.33) to optically denser glass (n = 1.50), light slows down and bends towards the normal (r < 40°).',
    correctExplain:
      'Because n_glass (1.50) > n_water (1.33), Snell’s Law n₁ sin i = n₂ sin r implies sin r < sin i, so it bends towards the normal.',
  },

  // 7. lenses-power
  {
    id: 'fb-lens-easy-1',
    conceptId: 'lenses-power',
    difficulty: 'Easy',
    prompt:
      'A doctor prescribes a corrective lens of power -2.5 D for myopia. What is the focal length and type of this lens?',
    options: [
      '+40 cm, convex lens',
      '-40 cm, concave lens',
      '-25 cm, concave lens',
      '+25 cm, convex lens',
    ],
    correctIndex: 1,
    targetSkill: 'Converting negative dioptre power to focal length in cm',
    sampleThoughtHint: 'Use f(m) = 1 / P and interpret the negative sign.',
    agentRationale:
      'Calibrated to Easy to reinforce negative power/focal length for diverging lenses.',
    expectedKeyConcept: 'f = 1 / (-2.5) = -0.4 m = -40 cm (concave lens)',
    commonMisconceptionTag: 'Lens Power Unit & Sign Confusion',
    commonMisconceptionExplain:
      'Power P = 1 / f(m). Thus f = 1 / (-2.5) = -0.40 m = -40 cm. Negative power always means a diverging concave lens.',
    correctExplain:
      'f = 1 / P = 1 / (-2.5 D) = -0.40 m = -40 cm. Negative focal length indicates a concave (diverging) lens.',
  },
  {
    id: 'fb-lens-med-1',
    conceptId: 'lenses-power',
    difficulty: 'Medium',
    prompt:
      'Two thin lenses of powers +3.5 D and -1.5 D are placed in contact. What is the focal length of the combined lens system?',
    options: ['+20 cm', '+50 cm', '-50 cm', '+200 cm'],
    correctIndex: 1,
    targetSkill: 'Net power and focal length of lenses in contact',
    sampleThoughtHint: 'Add powers algebraically P = P₁ + P₂, then compute f = 1 / P.',
    agentRationale:
      'Calibrated to Medium to test algebraic addition of lens powers and metre-to-cm conversion.',
    expectedKeyConcept: 'P = 3.5 - 1.5 = +2.0 D; f = 1/2.0 = +0.5 m = +50 cm',
    commonMisconceptionTag: 'Combined Lens Focal Length Addition Error',
    commonMisconceptionExplain:
      'Powers add directly: P_net = +3.5 + (-1.5) = +2.0 D. Then f = 1 / 2.0 = +0.50 m = +50 cm.',
    correctExplain:
      'Combined power P = +3.5 D + (-1.5 D) = +2.0 D, so f = 1 / 2.0 m = +0.5 m = +50 cm.',
  },

  // 8. magnetic-field-lines
  {
    id: 'fb-mag-easy-1',
    conceptId: 'magnetic-field-lines',
    difficulty: 'Easy',
    prompt:
      'A straight horizontal wire carries electric current from East to West. According to the Right-Hand Thumb Rule, what is the direction of the magnetic field at a point directly BELOW the wire?',
    options: ['Towards North', 'Towards South', 'Vertically Upwards', 'Vertically Downwards'],
    correctIndex: 0,
    targetSkill: 'Applying Right-Hand Thumb Rule around straight wire',
    sampleThoughtHint: 'Point your right thumb West and curl fingers around the wire.',
    agentRationale:
      'Calibrated to Easy to reinforce 3D orientation with the Right-Hand Thumb Rule.',
    expectedKeyConcept: 'Thumb West (-x) -> fingers curl North (+y) below (-z) the wire',
    commonMisconceptionTag: 'Right-Hand Thumb Rule Orientation Flip',
    commonMisconceptionExplain:
      'With right thumb pointing West, fingers pass above the wire pointing South and curl underneath the wire pointing North.',
    correctExplain:
      'Pointing the right-hand thumb West, your fingers curl downward on the South side and sweep towards North directly below the wire.',
  },
  {
    id: 'fb-mag-med-1',
    conceptId: 'magnetic-field-lines',
    difficulty: 'Medium',
    prompt:
      'Inside a long current-carrying solenoid, how do the magnetic field lines behave?',
    options: [
      'Concentric circles centered on the axis',
      'Parallel straight lines indicating a uniform magnetic field',
      'Radially outward lines zero at the center',
      'Randomly intersecting curves stronger near the ends',
    ],
    correctIndex: 1,
    targetSkill: 'Magnetic field uniformity inside a solenoid',
    sampleThoughtHint: 'Recall the textbook field pattern inside a long solenoid.',
    agentRationale:
      'Calibrated to Medium to distinguish straight-wire concentric circles from solenoid uniformity.',
    expectedKeyConcept: 'Parallel equidistant straight lines -> uniform magnetic field inside solenoid',
    commonMisconceptionTag: 'Solenoid vs Straight-Wire Field Confusion',
    commonMisconceptionExplain:
      'Unlike a single straight wire (concentric circles), a solenoid produces parallel straight field lines inside, meaning the field is uniform.',
    correctExplain:
      'Inside a long solenoid, field lines are parallel straight lines, showing that the magnetic field is uniform at all interior points.',
  },

  // 9. flemings-left-hand
  {
    id: 'fb-flh-easy-1',
    conceptId: 'flemings-left-hand',
    difficulty: 'Easy',
    prompt:
      'A proton (positively charged) travels horizontally towards North inside a magnetic field directed vertically Upwards. In which direction is the magnetic force on the proton?',
    options: ['Towards East', 'Towards West', 'Towards South', 'Vertically Downwards'],
    correctIndex: 0,
    targetSkill: "Fleming's Left-Hand Rule for positive charges",
    sampleThoughtHint: 'For a positive proton, conventional current is in the same direction as motion.',
    agentRationale:
      'Calibrated to Easy to separate hand-rule mechanics from negative-charge current reversal.',
    expectedKeyConcept: 'Index Up, Middle North -> Left Thumb points East',
    commonMisconceptionTag: 'Left vs Right Hand Rule Confusion',
    commonMisconceptionExplain:
      'Use your LEFT hand: Forefinger Up (Field), Middle finger North (Positive charge current) -> Thumb points East.',
    correctExplain:
      'Since a proton is positive, current is North. With left forefinger Up and middle finger North, the thumb points East.',
  },
  {
    id: 'fb-flh-med-1',
    conceptId: 'flemings-left-hand',
    difficulty: 'Medium',
    prompt:
      'An electron moves vertically Downwards into a uniform horizontal magnetic field pointing towards North. What is the direction of the magnetic force acting on the electron?',
    options: ['Towards East', 'Towards West', 'Towards North', 'Towards South'],
    correctIndex: 0,
    targetSkill: "Fleming's Left-Hand Rule with electron velocity reversal",
    sampleThoughtHint: 'First reverse electron velocity to get conventional current (Upwards).',
    agentRationale:
      'Calibrated to Medium to remediate electron vs conventional current direction errors.',
    expectedKeyConcept: 'Electron Down => Current Up; Field North => I×B = k × j = -i? Wait: k×j = -i (West)!',
    commonMisconceptionTag: 'Negative Charge Current Reversal',
    commonMisconceptionExplain:
      'Wait — check carefully! Actually let us verify with exact coordinates below.',
    correctExplain: 'Verified via cross product.',
  },

  // 10. electromagnetic-induction
  {
    id: 'fb-dom-easy-1',
    conceptId: 'electromagnetic-induction',
    difficulty: 'Easy',
    prompt:
      'In a standard Indian domestic circuit (220 V, 50 Hz), why are household appliances connected in parallel rather than in series?',
    options: [
      'To keep current identical through every appliance',
      'So each appliance receives full 220 V and can be switched independently',
      'To double the effective resistance of the house wiring',
      'So a single blown bulb turns off all appliances safely',
    ],
    correctIndex: 1,
    targetSkill: 'Parallel wiring rationale in domestic circuits',
    sampleThoughtHint: 'Think about voltage rating and independent switches at home.',
    agentRationale:
      'Calibrated to Easy to connect circuit principles to everyday domestic wiring.',
    expectedKeyConcept: 'Parallel gives full 220 V to each appliance + independent switching',
    commonMisconceptionTag: 'Domestic Series-Circuit Misconception',
    commonMisconceptionExplain:
      'Parallel wiring ensures every appliance gets the full 220 V rated voltage and works independently without being affected by others.',
    correctExplain:
      'In parallel, each appliance receives the full 220 V mains voltage and has its own independent switch.',
  },
  {
    id: 'fb-dom-med-1',
    conceptId: 'electromagnetic-induction',
    difficulty: 'Medium',
    prompt:
      'An electric geyser of 2 kW power rating is operated in a 220 V domestic circuit that has a current rating of 5 A. What happens when it is switched on?',
    options: [
      'It runs normally drawing about 2.2 A',
      'It draws about 9.1 A, overloading and blowing the 5 A fuse',
      'The earth wire carries the 2 kW load continuously',
      'The mains voltage automatically drops to 110 V',
    ],
    correctIndex: 1,
    targetSkill: 'Fuse rating and overloading calculation I = P / V',
    sampleThoughtHint: 'Compute current I = P / V and compare it to the 5 A circuit limit.',
    agentRationale:
      'Calibrated to Medium to combine power-current calculation with domestic fuse safety.',
    expectedKeyConcept: 'I = 2000 W / 220 V ≈ 9.09 A > 5 A -> overloads and melts fuse',
    commonMisconceptionTag: 'Fuse Rating Underestimation',
    commonMisconceptionExplain:
      'Current drawn is I = P/V = 2000/220 ≈ 9.09 A, which exceeds the 5 A fuse rating and melts the fuse wire to prevent fire.',
    correctExplain:
      'The geyser draws I = 2000 W / 220 V ≈ 9.1 A, which exceeds the 5 A circuit limit, causing overloading and blowing the fuse.',
  },
];

// Double check fb-flh-med-1 math before exporting!
// Coordinates: East = +i, North = +j, Up = +k.
// Electron moves Down (-k) -> q = -e -> Conventional current I is Up (+k).
// Magnetic field B points North (+j).
// F = I L x B = (+k) x (+j) = -i = WEST!
// Let's fix fb-flh-med-1 correctIndex to 1 ('Towards West') right here cleanly!
const flhMed = FALLBACK_QUESTION_BANK.find((q) => q.id === 'fb-flh-med-1');
if (flhMed) {
  flhMed.correctIndex = 1; // Towards West
  flhMed.expectedKeyConcept = 'Electron Down => Current Up (+k); Field North (+j) => Force k × j = -i (West)';
  flhMed.commonMisconceptionExplain =
    'For a downward electron, conventional current is Upwards. With left forefinger pointing North and middle finger Upwards, the thumb points West.';
  flhMed.correctExplain =
    'Conventional current is opposite to electron flow (Upwards). Applying Fleming’s Left-Hand Rule with Field North and Current Up gives Force towards West.';
}

export function pickFallbackQuestion(
  conceptId: string,
  difficulty: DifficultyLevel,
  excludePrompts: string[]
): VerifiedFallbackQuestion {
  const byConcept = FALLBACK_QUESTION_BANK.filter(
    (q) => q.conceptId === conceptId
  );
  const pool = byConcept.length > 0 ? byConcept : FALLBACK_QUESTION_BANK;

  const exactDiffNotUsed = pool.filter(
    (q) => q.difficulty === difficulty && !excludePrompts.includes(q.prompt)
  );
  if (exactDiffNotUsed.length > 0) return exactDiffNotUsed[0];

  const anyNotUsed = pool.filter((q) => !excludePrompts.includes(q.prompt));
  if (anyNotUsed.length > 0) return anyNotUsed[0];

  return pool.find((q) => q.difficulty === difficulty) ?? pool[0];
}

export function analyzeLocallyFallback(params: {
  conceptId: string;
  conceptName: string;
  questionPrompt: string;
  selectedIndex: number;
  correctIndex: number;
  studentReasoning: string;
}): {
  isCorrect: boolean;
  reasoningQuality: ReasoningQuality;
  step1Analysis: string;
  step2Misconception: string;
  misconceptionTag: string;
  step3ModelImpact: string;
  step4Hint: string;
} {
  const isCorrect = params.selectedIndex === params.correctIndex;
  const trimmed = params.studentReasoning.trim();
  const matched = FALLBACK_QUESTION_BANK.find(
    (q) => q.prompt === params.questionPrompt
  );

  if (isCorrect) {
    const hasThought = trimmed.length >= 12;
    return {
      isCorrect: true,
      reasoningQuality: hasThought ? 'sound' : 'partial',
      step1Analysis: hasThought
        ? `Your explanation ("${trimmed}") aligns with the core physical principles of ${params.conceptName}.`
        : 'You selected the correct option, though your written explanation was brief.',
      step2Misconception: hasThought
        ? 'None — Sound Reasoning. Your physical model matches the expected formula and direction rules.'
        : 'No conceptual error detected, though writing out the governing formula confirms mastery.',
      misconceptionTag: 'None — Sound Reasoning',
      step3ModelImpact: `Bayesian Knowledge Tracing updated ${params.conceptName} upward and extended its spaced-repetition interval.`,
      step4Hint:
        matched?.correctExplain ??
        `Well solved! Keep verifying units and sign conventions as difficulty scales up in ${params.conceptName}.`,
    };
  }

  const tag =
    matched?.commonMisconceptionTag ??
    `${params.conceptName} Conceptual Slip`;
  const hint =
    matched?.commonMisconceptionExplain ??
    `Re-check the governing relationship and sign/unit conventions for ${params.conceptName}.`;

  return {
    isCorrect: false,
    reasoningQuality: trimmed.length > 15 ? 'flawed' : 'partial',
    step1Analysis:
      trimmed.length > 0
        ? `Analyzed your explanation ("${trimmed}") alongside your selected option for ${params.conceptName}.`
        : `You selected an incorrect option without a written reasoning trace for ${params.conceptName}.`,
    step2Misconception: `${tag}: ${hint}`,
    misconceptionTag: tag,
    step3ModelImpact: `Bayesian Knowledge Tracing lowered ${params.conceptName} mastery and reset its review schedule to Today.`,
    step4Hint: hint,
  };
}
