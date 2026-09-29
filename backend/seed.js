const { getDb } = require('./src/db');
const db = getDb();

// Codes start empty — real codes are added by admin or submitted by users
db.prepare('DELETE FROM redeem_codes').run();

// ── WEAPONS ───────────────────────────────────────────────────
db.prepare('DELETE FROM loadouts').run();
db.prepare('DELETE FROM weapons').run();
const insertWeapon = db.prepare(
  'INSERT INTO weapons (name,slug,category,description,base_damage,fire_rate,range,mobility,control,image_url) VALUES (?,?,?,?,?,?,?,?,?,?)'
);
const weapons = [
  ['AK-47',       'ak-47',       'Assault Rifle', 'High damage, moderate recoil. Best for mid-range.',          85, 55, 70, 60, 55, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/65/AK-47_type_II_noBG.png/500px-AK-47_type_II_noBG.png'],
  ['M4',          'm4',          'Assault Rifle', 'Balanced AR. Low recoil, consistent damage output.',         72, 70, 75, 68, 78, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/68/PEO_M4_Carbine_RAS_M68_CCO.png/500px-PEO_M4_Carbine_RAS_M68_CCO.png'],
  ['MP5',         'mp5',         'SMG',           'Fast TTK at close range. Dominant in BR and MP.',            65, 88, 45, 85, 72, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4d/Heckler_%26_Koch_MP5-1.jpg/500px-Heckler_%26_Koch_MP5-1.jpg'],
  ['Kilo 141',    'kilo-141',    'Assault Rifle', 'Low recoil laser beam. Meta pick for ranked.',               74, 68, 80, 65, 85, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/M21A.jpg/500px-M21A.jpg'],
  ['DL Q33',      'dl-q33',      'Sniper',        'One-shot chest sniper. Dominant in BR.',                     95, 20, 98, 40, 60, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Barrett-M82A1-Independence-Day-2017-IZE-048-white.jpg/500px-Barrett-M82A1-Independence-Day-2017-IZE-048-white.jpg'],
  ['Fennec',      'fennec',      'SMG',           'Fastest fire rate SMG. Shreds at close range.',              58, 98, 35, 90, 65, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Kriss_Vector_SMG_Realistic.png/500px-Kriss_Vector_SMG_Realistic.png'],
  ['Rytec AMR',   'rytec-amr',   'Sniper',        'Semi-auto sniper. Explosive rounds available.',              90, 35, 95, 38, 55, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cb/Remington_Model_700.JPG/500px-Remington_Model_700.JPG'],
  ['Holger 26',   'holger-26',   'LMG',           'High capacity LMG. Suppressive fire specialist.',            78, 60, 72, 45, 62, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/HK_21_LMG_Left_and_Right_noBG.png/500px-HK_21_LMG_Left_and_Right_noBG.png'],
];
weapons.forEach(w => {
  const r = insertWeapon.run(...w);
  const id = r.lastInsertRowid;
  const name = w[0];

  if (name === 'Kilo 141') {
    db.prepare('INSERT INTO loadouts (weapon_id,title,playstyle,description,attachments,perks) VALUES (?,?,?,?,?,?)').run(
      id, 'No Recoil Ranked Build', 'competitive',
      'Zero recoil laser. Dominates mid-range ranked matches.',
      JSON.stringify(['Monolithic Suppressor','Singuard Arms 19.8" Prowler','Commando Foregrip','60 Round Mags','Stippled Grip Tape']),
      JSON.stringify(['Lightweight','Tracker','Amped'])
    );
  }
  if (name === 'MP5') {
    db.prepare('INSERT INTO loadouts (weapon_id,title,playstyle,description,attachments,perks) VALUES (?,?,?,?,?,?)').run(
      id, 'Aggressive Rusher Build', 'aggressive',
      'Max mobility for fast-paced close-range domination.',
      JSON.stringify(['Monolithic Suppressor','FTAC Collapsible','Merc Foregrip','45 Round Mags','Stippled Grip Tape']),
      JSON.stringify(['Lightweight','Persistence','Hardline'])
    );
  }
  if (name === 'DL Q33') {
    db.prepare('INSERT INTO loadouts (weapon_id,title,playstyle,description,attachments,perks) VALUES (?,?,?,?,?,?)').run(
      id, 'BR One-Shot Build', 'sniper',
      'Maximum range and bullet velocity for BR dominance.',
      JSON.stringify(['MK3 Thermal','Singuard Arms Marksman','Singuard SW Suppressor','FTAC Stalker-Scout','Stippled Grip Tape']),
      JSON.stringify(['Persistence','Cold-Blooded','Hardline'])
    );
  }
});

// ── SENSITIVITY PRESETS ───────────────────────────────────────
db.prepare('DELETE FROM sensitivity_presets').run();
const insertSens = db.prepare(
  'INSERT INTO sensitivity_presets (title,playstyle,device_type,fps_sensitivity,ads_sensitivity,scope_3x,scope_4x,sniper_scope,gyroscope,description) VALUES (?,?,?,?,?,?,?,?,?,?)'
);
[
  ['Pro Aggressive (Phone)',  'aggressive', 'phone',  180, 120, 80, 65, 50, 0,   'High sens for fast flicks and close-range fights.'],
  ['Balanced Ranked (Phone)', 'balanced',   'phone',  130, 90,  65, 55, 45, 0,   'Best all-round for ranked MP and BR.'],
  ['Sniper Specialist',       'sniper',     'phone',  100, 70,  50, 45, 35, 0,   'Low sens for precise long-range shots.'],
  ['Gyro Pro (Phone)',        'aggressive', 'phone',  150, 100, 70, 60, 45, 120, 'Gyroscope enabled for maximum accuracy.'],
  ['Tablet Balanced',         'balanced',   'tablet', 110, 80,  60, 50, 40, 0,   'Optimised for larger tablet screens.'],
].forEach(s => insertSens.run(...s));

// ── GUIDES ────────────────────────────────────────────────────
db.prepare('DELETE FROM tips').run();
const insertTip = db.prepare(
  'INSERT INTO tips (title,slug,category,content,difficulty,tags) VALUES (?,?,?,?,?,?)'
);
[
  [
    'How to Rank Up Fast in Season 3',
    'rank-up-fast-s3',
    'ranked',
    `## Ranking Up Fast in CODM Season 3\n\n**1. Play Hardpoint & Domination** — Objective modes give more XP than TDM.\n\n**2. Use VIP Cards** — Activate before ranked sessions for bonus XP.\n\n**3. Win Streaks matter** — 3+ win streaks give bonus rank points.\n\n**4. Avoid early quits** — Leaving ranked matches gives a rank penalty.\n\n**5. Best weapons for ranked:** Kilo 141, MP5, DL Q33 for BR.`,
    'beginner',
    JSON.stringify(['ranked','xp','season3'])
  ],
  [
    'Best Sensitivity Settings for CODM 2025',
    'best-sensitivity-2025',
    'settings',
    `## Optimal Sensitivity Guide\n\n**FPS Sensitivity:** 130–180 for aggressive play, 100–130 for balanced.\n\n**ADS Sensitivity:** Keep at 60–70% of your FPS sens.\n\n**Scope 3x:** 65–80 | **Scope 4x:** 55–65 | **Sniper:** 40–55\n\n**Gyroscope:** Enable if you have a gyro-capable device — set to 100–130 for best results.\n\n**Tip:** Always test in Training Mode before ranked.`,
    'beginner',
    JSON.stringify(['sensitivity','settings','tips'])
  ],
  [
    'Kilo 141 No-Recoil Loadout Guide',
    'kilo-141-no-recoil',
    'loadouts',
    `## Kilo 141 — Zero Recoil Build\n\n**Attachments:**\n- Monolithic Suppressor (range + suppressed)\n- Singuard Arms 19.8" Prowler (damage range)\n- Commando Foregrip (recoil control)\n- 60 Round Mags (sustain)\n- Stippled Grip Tape (ADS speed)\n\n**Perks:** Lightweight / Tracker / Amped\n\n**Playstyle:** Hold mid-range angles. Tap-fire at long range. Dominant in Hardpoint.`,
    'intermediate',
    JSON.stringify(['kilo141','loadout','assault-rifle','ranked'])
  ],
  [
    'Battle Royale Drop Locations — Season 3',
    'br-drop-locations-s3',
    'battle-royale',
    `## Best Drop Spots in Isolated (S3)\n\n**High Loot / High Risk:**\n- Crash Site — Best loot density, always contested.\n- Port — Vehicles + supply drops nearby.\n\n**Safe Drops:**\n- Trainyard (east) — Consistent loot, less traffic early game.\n- Farmland — Quiet with good mid-game rotation.\n\n**Pro Tip:** Always land on rooftops to get height advantage immediately.`,
    'beginner',
    JSON.stringify(['battle-royale','drop','map','isolated'])
  ],
  [
    'Advanced Movement Tricks — Slide Cancel & Jump Peek',
    'advanced-movement-tricks',
    'advanced',
    `## Movement Mechanics\n\n**Slide Cancel:** Sprint → Slide → Jump immediately. Resets sprint and keeps momentum. Bind crouch to a thumb button.\n\n**Jump Peek:** Jump around a corner while ADS to expose only your head briefly — hard to hit.\n\n**Drop Shot:** Crouch mid-gunfight to throw off enemy aim. Works best with SMGs.\n\n**Bunny Hop:** Jump repeatedly while strafing to make yourself harder to track at close range.`,
    'advanced',
    JSON.stringify(['movement','advanced','mechanics','slide-cancel'])
  ],
].forEach(t => insertTip.run(...t));

console.log('✅ Seed complete');
console.log('  Codes: 0 (start empty — add real ones via admin or user submissions)');
console.log('  Weapons:', db.prepare('SELECT COUNT(*) as c FROM weapons').get().c);
console.log('  Loadouts:', db.prepare('SELECT COUNT(*) as c FROM loadouts').get().c);
console.log('  Sensitivity:', db.prepare('SELECT COUNT(*) as c FROM sensitivity_presets').get().c);
console.log('  Guides:', db.prepare('SELECT COUNT(*) as c FROM tips').get().c);
